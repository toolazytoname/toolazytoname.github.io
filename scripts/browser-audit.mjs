// Fallback only when T3 preview explicitly reports no connected automation host.
// Install audit tools OUTSIDE the repo; never reads an existing browser profile.
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
if (!process.env.AUDIT_TOOLS_ROOT) throw new Error('Set AUDIT_TOOLS_ROOT to an isolated npm prefix with playwright-core and axe-core.');
const require = createRequire(join(resolve(process.env.AUDIT_TOOLS_ROOT), 'package.json'));
const { chromium } = require('playwright-core');
const axe = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
const helpers = (await readFile(new URL('./browser-checks.js', import.meta.url), 'utf8')).replace(/export /g, '');
const output = process.env.AUDIT_OUTPUT || '.audit/browser';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const results = [];
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.auditCsp = [];
    document.addEventListener('securitypolicyviolation', e => window.auditCsp.push({ directive: e.effectiveDirective, blocked: e.blockedURI }));
  });
  for (const path of ['/', '/projects/', '/posts/', '/tool/2024/04/30/2024-ssh-tunnel/']) for (const width of [320, 768, 1440]) for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(`http://localhost:4322${path}`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { localStorage.removeItem('site-theme'); });
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    await page.evaluate(helpers + ';window.quality={contrast,printStyles};');
    const check = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, contrast: quality.contrast(), csp: window.auditCsp, pendingImages: [...document.images].filter(i => !i.complete).length }));
    await page.evaluate(axe);
    const a11y = await page.evaluate(async () => {
      const r = await axe.run(document, { rules: { 'label-content-name-mismatch': { enabled: true } }, runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
      return { version: axe.version, violations: r.violations.map(x => ({ id: x.id, nodes: x.nodes.map(n => n.target) })), incomplete: r.incomplete.map(x => x.id) };
    });
    results.push({ path, width, theme, ...check, a11y });
    if (width === 320 && path === '/projects/' && theme === 'dark') await page.screenshot({ path: join(output, 'projects-320-dark.png'), fullPage: true });
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('http://localhost:4322/', { waitUntil: 'domcontentloaded' });
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), '跳到主要内容');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'main');
  let apiCalls = 0;
  await page.route('**/api/chat/', async route => { apiCalls++; await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ reply: '实时问答暂时繁忙或未就绪，请稍后再试。', source: 'error', error: 'model_protection_unavailable' }) }); });
  await page.getByRole('button', { name: '打开聊天助手', exact: true }).click();
  await page.waitForSelector('[role="dialog"]');
  assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'INPUT');
  await page.locator('[role="dialog"] input').fill('合成的故障恢复检查');
  await page.locator('[role="dialog"] input').press('Enter');
  await page.getByText('实时问答暂时繁忙或未就绪，请稍后再试。').waitFor();
  assert.equal(apiCalls, 1, 'no automatic replay');
  await page.screenshot({ path: join(output, 'chat-320-error.png') });
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), '打开聊天助手');
  await page.unroute('**/api/chat/');
  let offlineCalls = 0;
  page.on('request', request => { if (request.url().endsWith('/api/chat/')) offlineCalls++; });
  await context.setOffline(true);
  await page.getByRole('button', { name: '打开聊天助手', exact: true }).click();
  await page.locator('[role="dialog"] input').fill('离线连接检查');
  await page.locator('[role="dialog"] input').press('Enter');
  await page.getByText('暂时连不上服务。检查网络后再试。').waitFor();
  assert.equal(offlineCalls, 1, 'offline POST is not automatically replayed');
  await context.setOffline(false);
  await page.keyboard.press('Escape');
  const cspProbe = await page.evaluate(() => {
    window.probeExecuted = false;
    const s = document.createElement('script'); s.textContent = 'window.probeExecuted=true'; document.head.append(s); s.remove();
    return window.probeExecuted;
  });
  assert.equal(cspProbe, false, 'CSP rejects unauthorized inline code');
  // Actual Chromium print media and paginated PDF, rather than a style simulation.
  await page.goto('http://localhost:4322/tool/2024/04/30/2024-ssh-tunnel/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await page.emulateMedia({ media: 'print' });
  await page.waitForFunction(() => matchMedia('print').matches && getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)' && getComputedStyle(document.querySelector('h1')).color === 'rgb(0, 0, 0)' && getComputedStyle(document.querySelector('.post__meta')).color === 'rgb(51, 51, 51)');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.evaluate(helpers + ';window.quality={contrast,printStyles};');
  const print = await page.evaluate(() => ({ contrast: quality.contrast(), copyButtons: [...document.querySelectorAll('.copy-btn')].some(b => getComputedStyle(b).display !== 'none'), titleColor: getComputedStyle(document.querySelector('h1')).color, background: getComputedStyle(document.body).backgroundColor, nav: getComputedStyle(document.querySelector('body > header')).display }));
  await page.pdf({ path: join(output, 'article-print.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  results.push({ offline: { requests: offlineCalls, actionableError: true }, print, keyboard: { skipLink: true, chatInitialFocus: true, escapeRestoresTrigger: true }, simulatedApi: { status: 503, calls: apiCalls, autoReplay: false }, unauthorizedInlineScriptBlocked: !cspProbe });
  await writeFile(join(output, 'results.json'), JSON.stringify({ tool: 'isolated headless Chrome; T3 host disconnected', browser: browser.version(), reducedMotion: true, results }, null, 2));
  const failures = results.filter(r => r.overflow || r.contrast?.failed.length || r.csp?.length || r.a11y?.violations.length);
  assert.equal(print.copyButtons, false);
  assert.equal(print.titleColor, 'rgb(0, 0, 0)');
  assert.equal(print.background, 'rgb(255, 255, 255)');
  assert.equal(print.contrast.failed.length, 0);
  assert.equal(failures.length, 0, JSON.stringify(failures));
  console.log(JSON.stringify({ combinations: 24, failed: failures.length, print, interactions: 'passed' }, null, 2));
} finally { await browser.close(); }
