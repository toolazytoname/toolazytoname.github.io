// Explicit local-only entry point. Node's --env-file normally lets inherited
// shell values win, which can accidentally pair a project key with another URL.
// Never use this wrapper for Vercel builds: deployment secrets come from Vercel.
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const tasks = {
  dev: { package: 'astro', args: ['dev', '--host', '127.0.0.1', '--port', '4321'] },
  'eval:model': { package: 'vitest', args: ['run', '--config', 'scripts/model-eval.config.ts'] },
};
const name = process.argv[2];
const task = tasks[name];
if (!task) throw new Error('Use dev or eval:model.');
if (process.env.VERCEL) throw new Error('Project .env wrapper is local-only.');
let local;
try { local = parseEnv(readFileSync('.env', 'utf8')); }
catch { throw new Error('Cannot read project .env. Create it from .env.example; never commit keys.'); }
const manifestPath = require.resolve(`${task.package}/package.json`);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin[task.package];
const child = spawn(process.execPath, [resolve(dirname(manifestPath), bin), ...task.args], {
  env: { ...process.env, ...local }, stdio: 'inherit',
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', () => { console.error('Unable to start project command.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
