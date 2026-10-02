import { isIP } from 'node:net';

// Best-effort, per-process protection, NOT a distributed quota. Configure an
// edge/WAF or shared-store limit before relying on this to cap paid model use.
type Bucket = { count: number; resetAt: number };
type LimitResult = { allowed: boolean; remaining: number; resetAt: number };

export function createRateLimiter({
  limit = 60,
  windowMs = 60 * 60 * 1000,
  maxBuckets = 10_000,
  now = Date.now,
} = {}) {
  const buckets = new Map<string, Bucket>();
  let nextSweep = 0;
  return (key: string): LimitResult => {
    const time = now();
    if (time >= nextSweep) {
      for (const [key, value] of buckets) {
        if (value.resetAt <= time) buckets.delete(key);
      }
      nextSweep = time + Math.min(windowMs, 60_000);
    }
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= time) {
      // Fail closed at capacity rather than evict active limits (bypass) or
      // retain unlimited attacker-controlled keys (memory exhaustion).
      if (!bucket && buckets.size >= maxBuckets) {
        return { allowed: false, remaining: 0, resetAt: nextSweep };
      }
      const resetAt = time + windowMs;
      buckets.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: limit - 1, resetAt };
    }
    if (bucket.count >= limit) return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
    bucket.count++;
    return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
  };
}

export const rateLimit = createRateLimiter();

// Canonicalize equivalent addresses; group IPv6 privacy addresses by /64 so
// rotating the host portion cannot mint new visitor quotas. IPv4-mapped IPv6
// shares its IPv4 bucket. This identifier is never logged or stored in plaintext
// by the shared model guard.
export function quotaIp(value: string): string {
  if (isIP(value) === 4) return value;
  if (isIP(value) !== 6 || value.includes('%')) return 'anonymous';
  const canonical = new URL(`http://[${value}]/`).hostname.slice(1, -1);
  const [left, right] = canonical.split('::');
  const head = left ? left.split(':') : [];
  const tail = right ? right.split(':') : [];
  const words = canonical.includes('::') ? [...head, ...Array(8 - head.length - tail.length).fill('0'), ...tail] : head;
  const numbers = words.map(word => parseInt(word, 16));
  if (numbers.slice(0, 5).every(n => n === 0) && numbers[5] === 0xffff) {
    return [numbers[6]! >> 8, numbers[6]! & 255, numbers[7]! >> 8, numbers[7]! & 255].join('.');
  }
  return numbers.slice(0, 4).map(n => n.toString(16)).join(':') + '::/64';
}

// Only deploy behind a proxy that overwrites forwarded headers (Vercel does).
// A self-hosted server must strip untrusted values at its ingress.
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const real = headers.get('x-real-ip')?.trim();
  if (forwarded && isIP(forwarded)) return quotaIp(forwarded);
  if (real && isIP(real)) return quotaIp(real);
  return 'anonymous';
}
