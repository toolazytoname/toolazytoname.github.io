// Read-only deployment smoke. Never sends a valid model-generating request.
import { writeFile, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
const baseArg = process.argv.find(a => a.startsWith('--base='))?.slice(7);
if (!baseArg) throw new Error('Usage: npm run verify:release -- --base=https://deployment.example [--output=.audit/release.json]');
const base = new URL(baseArg);
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error('Invalid deployment origin');
// Optional authenticated CLI transport for protected previews. Credentials stay
// in Vercel CLI, never in command arguments, JSON reports, or browser URLs.
async function request(path, init, headers) {
  if (!process.argv.includes('--vercel')) return fetch(new URL(path, base), { ...init, headers, redirect: 'manual', signal: AbortSignal.timeout(15000) });
  const dir = await mkdtemp(join(tmpdir(), 'release-smoke-'));
  try {
    const args = ['curl', path, '--deployment', base.origin, '--', '--silent', '--show-error', '--max-time', '15', '--dump-header', join(dir, 'headers'), '--output', join(dir, 'body'), '--request', init.method || 'GET'];
    for (const [name, value] of Object.entries(headers)) args.push('--header', `${name}: ${value}`);
    if (init.body) args.push('--data-binary', '@-');
    await new Promise((resolve, reject) => {
      const child = execFile('vercel', args, { timeout: 30000, maxBuffer: 1024 * 1024 }, error => error ? reject(new Error('CLI request failed')) : resolve());
      child.stdin.end(init.body || '');
    });
    const blocks = (await readFile(join(dir, 'headers'), 'utf8')).trim().split(/\r?\n\r?\n/);
    const lines = blocks.at(-1).split(/\r?\n/);
    const status = Number(lines.shift().match(/HTTP\/[\d.]+ (\d+)/)?.[1]);
    const responseHeaders = new Headers();
    for (const line of lines) { const i = line.indexOf(':'); if (i > 0) responseHeaders.append(line.slice(0, i), line.slice(i + 1).trim()); }
    return new Response(await readFile(join(dir, 'body')), { status, headers: responseHeaders });
  } finally { await rm(dir, { recursive: true, force: true }); }
}
const results = [];
async function check(path, expected, init = {}, inspect = () => []) {
  const start = performance.now();
  try {
    const headers = { ...init.headers };
    if (!process.argv.includes('--vercel') && process.env.RELEASE_BYPASS_TOKEN) headers['x-vercel-protection-bypass'] = process.env.RELEASE_BYPASS_TOKEN;
    const response = await request(path, init, headers);
    const body = await response.text();
    const errors = [];
    if (!expected.includes(response.status)) errors.push(`expected ${expected.join('/')} got ${response.status}`);
    const h = response.headers;
    // Vercel emits redirect responses before configured document headers.
    // Verify the destination separately rather than treating a safe 308 as HTML.
    if (![301, 302, 307, 308].includes(response.status)) {
    if (h.get('x-content-type-options') !== 'nosniff') errors.push('missing nosniff');
    if (h.get('x-frame-options') !== 'SAMEORIGIN') errors.push('missing SAMEORIGIN');
    if (!h.get('content-security-policy')?.includes("frame-ancestors 'self'")) errors.push('missing frame-ancestors');
    }
    errors.push(...inspect(response, body));
    results.push({ path, method: init.method || 'GET', status: response.status, durationMs: Math.round(performance.now() - start), errors });
  } catch (e) { results.push({ path, method: init.method || 'GET', errors: [e.name === 'TimeoutError' ? 'timeout' : 'network failure'] }); }
}
const page = (response, body) => {
  const errors = [];
  if (!response.headers.get('content-type')?.includes('text/html')) errors.push('not HTML');
  const policy = body.match(/<meta[^>]+http-equiv="content-security-policy"[^>]+content="([^"]+)"/i)?.[1] ?? '';
  if (!policy.includes('script-src') || !policy.includes('sha256-') || policy.includes('unsafe-eval')) errors.push('missing hashed script CSP');
  return errors;
};
for (const path of ['/', '/projects/', '/posts/', '/about/', '/now/', '/tool/2024/04/30/2024-ssh-tunnel/', '/life/2024/04/02/2024-okr/']) await check(path, [200], {}, page);
await check('/__release-smoke-missing-page__/', [404], {}, (r, body) => [...page(r, body), ...(/name="robots"[^>]*content="[^"]*noindex/.test(body) ? [] : ['404 lacks noindex'])]);
await check('/life/2024/04/02/024-okr/', [301, 308], {}, r => r.headers.get('location')?.includes('/life/2024/04/02/2024-okr') ? [] : ['historical redirect target wrong']);
for (const path of ['/feed.xml', '/posts.xml', '/sitemap-index.xml']) await check(path, [200]);
function api(r, body) {
  const errors = [];
  if (!r.headers.get('cache-control')?.includes('no-store')) errors.push('API may be cached');
  if (!r.headers.get('content-type')?.includes('application/json')) errors.push('API not JSON');
  try { if (!JSON.parse(body).error) errors.push('missing error code'); } catch { errors.push('unparseable JSON'); }
  return errors;
}
await check('/api/chat/', [405], {}, (r, b) => [...api(r, b), ...(r.headers.get('allow') === 'POST' ? [] : ['missing Allow POST'])]);
await check('/api/chat/', [400], { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' }, api);
await check('/api/chat/', [413], { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'a'.repeat(70000) }] }) }, api);
if (process.argv.includes('--check-guard')) {
  // Explicit option: use only when provider is configured but shared store is
  // intentionally absent. If this guard regresses this COULD invoke a provider.
  await check('/api/chat/', [503], { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: '发布保护探针：请不要生成回答。' }] }) }, (r, b) => {
    const errors = api(r, b);
    try { if (JSON.parse(b).error !== 'model_protection_unavailable') errors.push('shared protection did not fail closed'); } catch {}
    if (r.headers.get('retry-after') !== '30') errors.push('missing guard Retry-After');
    return errors;
  });
}
const report = { checkedAt: new Date().toISOString(), origin: base.origin, ok: results.every(r => !r.errors.length), noValidModelRequests: !process.argv.includes('--check-guard'), results };
const output = process.argv.find(a => a.startsWith('--output='))?.slice(9) || '.audit/release.json';
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.ok ? 0 : 1;
