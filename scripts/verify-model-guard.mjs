// Integration check against an isolated REAL Redis (no production credentials).
// Requires redis-server + redis-cli. No TCP port, persistence, or external calls.
import { spawn, execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';
const exec = promisify(execFile);
const dir = await mkdtemp(join(tmpdir(), 'chat-guard-'));
const socket = join(dir, 'redis.sock');
const server = spawn('redis-server', ['--port', '0', '--unixsocket', socket, '--unixsocketperm', '700', '--save', '', '--appendonly', 'no'], { stdio: 'ignore' });
let startupError;
server.on('error', e => { startupError = e; });
const cli = async (...args) => JSON.parse((await exec('redis-cli', ['-s', socket, '--json', ...args.map(String)])).stdout);
const source = await readFile(new URL('../src/lib/model-guard.ts', import.meta.url), 'utf8');
const lua = source.match(/export const RESERVE_MODEL = `([\s\S]*?)`;/)[1];
const release = source.match(/export const RELEASE_MODEL = "(.*?)";/)[1];
const reserve = (id, ip = 'ip', limits = [60, 40, 1000, 3]) => cli('EVAL', lua, 4, `{test}:${ip}`, '{test}:day', '{test}:month', '{test}:active', ...limits, id);
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (startupError) throw startupError;
    try { ready = await cli('PING') === 'PONG'; if (ready) break; } catch {}
    await new Promise(r => setTimeout(r, 50));
  }
  assert(ready, 'Redis startup failed');
  const parallel = await Promise.all(Array.from({ length: 40 }, (_, i) => reserve(`lease-${i}`, `ip-${i}`)));
  assert.equal(parallel.filter(r => r[0] === 0).length, 3, 'atomic global concurrency');
  assert.equal(await cli('GET', '{test}:day'), '3', 'rejected requests do not consume budget');
  const first = parallel.findIndex(r => r[0] === 0);
  await cli('EVAL', release, 1, '{test}:active', `lease-${first}`);
  assert.equal((await reserve('after-release'))[0], 0, 'released slot reusable');
  await cli('DEL', '{test}:active');
  await cli('ZADD', '{test}:active', 1, 'crashed-lease');
  assert.equal((await reserve('after-expiry'))[0], 0, 'expired crash lease swept');
  assert.equal(await cli('ZSCORE', '{test}:active', 'crashed-lease'), null);
  await cli('FLUSHDB');
  const daily = await Promise.all(Array.from({ length: 30 }, (_, i) => reserve(`d${i}`, `ip${i}`, [60, 7, 100, 100])));
  assert.equal(daily.filter(r => r[0] === 0).length, 7, 'cross-instance daily cap');
  assert.equal(daily.filter(r => r[0] === 2).length, 23);
  assert((await cli('TTL', '{test}:day')) > 86390);
  await cli('FLUSHDB');
  const monthly = await Promise.all(Array.from({ length: 20 }, (_, i) => reserve(`m${i}`, `ip${i}`, [60, 100, 4, 100])));
  assert.equal(monthly.filter(r => r[0] === 0).length, 4, 'monthly cap');
  await cli('FLUSHDB');
  assert.equal((await reserve('a', 'same', [1, 40, 1000, 100]))[0], 0);
  assert.equal((await reserve('b', 'same', [1, 40, 1000, 100]))[0], 1, 'IP shared limit');
  await cli('PEXPIRE', '{test}:same', 1);
  await new Promise(r => setTimeout(r, 10));
  assert.equal((await reserve('c', 'same', [1, 40, 1000, 100]))[0], 0, 'window expiry');
  console.log(JSON.stringify({ ok: true, backend: 'isolated real Redis over Unix socket', checks: ['40 concurrent admissions capped at 3', 'release', 'crash expiry', '30 concurrent daily reservations capped at 7', 'monthly budget', 'per-IP quota', 'window reset', 'rejections not billed'] }, null, 2));
} finally {
  if (server.exitCode === null && !startupError) { server.kill('SIGTERM'); await new Promise(r => server.once('exit', r)); }
  await rm(dir, { recursive: true, force: true });
}
