import { createHmac, randomUUID } from 'node:crypto';

export type ModelLease =
  | { allowed: true; release: () => Promise<void> }
  | { allowed: false; error: 'model_capacity' | 'model_budget' | 'model_rate_limited' | 'model_protection_unavailable'; retryAfter: number };

// One atomic reservation across instances. Redis time avoids app-clock skew.
// All keys share a cluster hash tag. Budgets count attempts, including failures;
// they are deliberately NOT refunded when a response/cancellation is ambiguous.
export const RESERVE_MODEL = `
local t = redis.call('TIME')
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
redis.call('ZREMRANGEBYSCORE', KEYS[4], '-inf', now)
local function retry(key)
  return math.max(1, math.ceil(redis.call('PTTL', key) / 1000))
end
if tonumber(redis.call('GET', KEYS[1]) or '0') >= tonumber(ARGV[1]) then return {1, retry(KEYS[1])} end
if tonumber(redis.call('GET', KEYS[2]) or '0') >= tonumber(ARGV[2]) then return {2, retry(KEYS[2])} end
if tonumber(redis.call('GET', KEYS[3]) or '0') >= tonumber(ARGV[3]) then return {2, retry(KEYS[3])} end
if redis.call('ZCARD', KEYS[4]) >= tonumber(ARGV[4]) then return {3, 30} end
local windows = {3600, 86400, 2592000}
for i = 1, 3 do
  if redis.call('INCR', KEYS[i]) == 1 then redis.call('EXPIRE', KEYS[i], windows[i]) end
end
redis.call('ZADD', KEYS[4], now + 30000, ARGV[5])
redis.call('EXPIRE', KEYS[4], 30)
return {0, 0}
`;
export const RELEASE_MODEL = "return redis.call('ZREM', KEYS[1], ARGV[1])";

type Env = Record<string, string | undefined>;
type GuardConfig = { url: string; token: string; namespace: string; limits: number[] };
function positive(env: Env, name: string, fallback: number, max: number) {
  const raw = env[name]?.trim();
  if (!raw) return fallback;
  if (!/^\d+$/.test(raw)) throw new Error('invalid_guard_limit');
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new Error('invalid_guard_limit');
  return value;
}
function config(env: Env): GuardConfig | null {
  const production = env.NODE_ENV === 'production' || !!env.VERCEL;
  const mode = env.CHAT_PROTECTION_MODE?.trim() || (production ? 'shared' : 'local');
  // Explicit operator opt-in: only the chat API is called; no gateway admin access.
  // The route's in-process rate limit still applies, but is not a shared budget.
  if (mode === 'direct') return null;
  if (mode === 'local' && !production) return null;
  if (mode !== 'shared') throw new Error('unsafe_guard_mode');
  const url = new URL(env.CHAT_REDIS_REST_URL || '');
  const token = env.CHAT_REDIS_REST_TOKEN?.trim();
  const namespace = env.CHAT_GUARD_NAMESPACE?.trim() || `weichao-${env.VERCEL_ENV || 'production'}`;
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !token || !/^[a-zA-Z0-9_-]{1,64}$/.test(namespace)) {
    throw new Error('invalid_guard_config');
  }
  return { url: url.href, token, namespace, limits: [
    positive(env, 'CHAT_MODEL_IP_HOURLY', 60, 1000),
    positive(env, 'CHAT_MODEL_DAILY', 40, 100000),
    positive(env, 'CHAT_MODEL_MONTHLY', 1000, 1000000),
    positive(env, 'CHAT_MODEL_CONCURRENCY', 3, 100),
  ] };
}
async function command(c: GuardConfig, args: (string | number)[], fetcher: typeof fetch) {
  const response = await fetcher(c.url, {
    method: 'POST', redirect: 'error', cache: 'no-store',
    headers: { authorization: `Bearer ${c.token}`, 'content-type': 'application/json' },
    body: JSON.stringify(args), signal: AbortSignal.timeout(2000),
  });
  if (!response.ok) throw new Error('guard_transport');
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object' || 'error' in body || !('result' in body)) throw new Error('guard_response');
  return (body as { result: unknown }).result;
}

export async function reserveModel(ip: string, env: Env = process.env, fetcher: typeof fetch = fetch): Promise<ModelLease> {
  try {
    const c = config(env);
    if (!c) return { allowed: true, release: async () => {} };
    // HMAC prevents offline enumeration of raw visitor IPs from stored keys.
    const visitor = createHmac('sha256', c.token).update(ip).digest('hex');
    const prefix = `chat:{${c.namespace}}`;
    const active = `${prefix}:active`;
    const id = randomUUID();
    const result = await command(c, ['EVAL', RESERVE_MODEL, 4, `${prefix}:ip:${visitor}`, `${prefix}:day`, `${prefix}:month`, active, ...c.limits, id], fetcher);
    if (!Array.isArray(result) || result.length !== 2 || !result.every(Number.isInteger) || result[0] < 0 || result[0] > 3 || result[1] < 0 || result[1] > 2592000) throw new Error('guard_result');
    if (result[0] !== 0) return {
      allowed: false, error: result[0] === 1 ? 'model_rate_limited' : result[0] === 2 ? 'model_budget' : 'model_capacity',
      retryAfter: Math.max(1, result[1]),
    };
    return { allowed: true, release: async () => {
      try { await command(c, ['EVAL', RELEASE_MODEL, 1, active, id], fetcher); }
      catch { console.warn('[chat] lease_release_failed'); } // Crash/disconnect lease expires in 30s.
    } };
  } catch {
    console.warn('[chat] protection_unavailable');
    return { allowed: false, error: 'model_protection_unavailable', retryAfter: 30 };
  }
}
