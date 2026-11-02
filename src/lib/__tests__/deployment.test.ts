import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const config = JSON.parse(readFileSync(new URL('../../../vercel.json', import.meta.url), 'utf8'));
describe('production release guardrails', () => {
  it('runs the whole validation pipeline before Vercel publishes', () => {
    expect(config.buildCommand).toBe('npm run release:check');
    expect(config.installCommand).toBe('npm ci');
  });
  it('hardens documents without blocking the same-origin Git mind-map embed', () => {
    const headers = Object.fromEntries(config.headers.find((h: { source: string }) => h.source === '/(.*)').headers.map((h: { key: string; value: string }) => [h.key, h.value]));
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'self'");
    expect(headers['Content-Security-Policy']).toContain("object-src 'none'");
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });
});

it('resolves one compatible Vite for Astro, plugin-react and project config', async () => {
  const { createRequire } = await import('node:module');
  const project = createRequire(new URL('../../../package.json', import.meta.url));
  const astro = createRequire(project.resolve('astro'));
  const plugin = createRequire(project.resolve('@vitejs/plugin-react'));
  expect(plugin.resolve('vite')).toBe(project.resolve('vite'));
  expect(astro.resolve('vite')).toBe(project.resolve('vite'));
  expect(JSON.parse(readFileSync(project.resolve('vite/package.json'), 'utf8')).version).toMatch(/^8\./);
});

it('keeps dynamic modules and globbed assets in the server deployment trace', async () => {
  const { mkdtemp, mkdir, writeFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { nodeFileTrace } = await import('@vercel/nft');
  const root = await mkdtemp(join(tmpdir(), 'site-deployment-trace-'));
  try {
    await mkdir(join(root, 'assets'));
    await mkdir(join(root, 'handlers'));
    await writeFile(join(root, 'package.json'), '{"type":"commonjs"}');
    await writeFile(join(root, 'entry.cjs'), `
      const fs = require('node:fs');
      fs.readFileSync(__dirname + '/assets/' + process.env.TRACE_ASSET + '.json');
      require('./handlers/' + process.env.TRACE_HANDLER + '.js');
    `);
    for (const name of ['en', 'zh', '.hidden']) {
      await writeFile(join(root, 'assets', `${name}.json`), '{}');
    }
    for (const name of ['en', 'zh']) {
      await writeFile(join(root, 'handlers', `${name}.js`), 'module.exports = {};');
    }
    await writeFile(join(root, 'assets', 'unused.txt'), 'not a runtime asset');
    const { fileList, warnings } = await nodeFileTrace([join(root, 'entry.cjs')], { base: root, processCwd: root });
    expect([...warnings]).toEqual([]);
    expect([...fileList].sort()).toEqual([
      'assets/.hidden.json', 'assets/en.json', 'assets/zh.json',
      'entry.cjs', 'handlers/en.js', 'handlers/zh.js', 'package.json',
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
