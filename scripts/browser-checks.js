// Import in T3 preview_evaluate from a temporary same-origin audit server path.
// Supplementary solid-color text check, NOT a screen-reader/WCAG certification.
export function contrast(doc = document) {
  const win = doc.defaultView;
  const rgb = value => (value.match(/[\d.]+/g) || []).map(Number);
  const blend = (fg, bg) => { const a = fg[3] ?? 1; return fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a)); };
  const luminance = c => c.slice(0, 3).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const parents = new Set();
  const walker = doc.createTreeWalker(doc.body, win.NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) if (node.textContent.trim()) parents.add(node.parentElement);
  const failed = [], manual = []; let checked = 0;
  for (const el of parents) {
    if (el.closest('script,style,noscript,svg') || !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    const style = win.getComputedStyle(el);
    let bg = [255, 255, 255], chain = [], ancestor = el, uncertain = false;
    while (ancestor) { chain.unshift(ancestor); ancestor = ancestor.parentElement; }
    for (const a of chain) {
      const s = win.getComputedStyle(a);
      if (s.backgroundImage !== 'none' || Number(s.opacity) !== 1 || s.filter !== 'none' || s.mixBlendMode !== 'normal') uncertain = true;
      bg = blend(rgb(s.backgroundColor), bg);
    }
    if (uncertain) { manual.push(el.textContent.trim().slice(0, 50)); continue; }
    const fg = blend(rgb(style.color), bg);
    const l = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
    const ratio = (l[0] + .05) / (l[1] + .05);
    const minimum = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700) ? 3 : 4.5;
    checked++;
    if (ratio + .01 < minimum) failed.push({ text: el.textContent.trim().slice(0, 70), ratio: +ratio.toFixed(2), minimum, color: style.color, bg, className: el.className });
  }
  return { checked, failed, manual };
}
export async function matrix(paths, widths) {
  const results = [];
  for (const path of paths) for (const width of widths) {
    const f = document.createElement('iframe');
    f.title = 'Audit viewport'; f.style.cssText = `position:fixed;inset:0;width:${width}px;height:900px;z-index:999999;border:0`;
    f.src = path;
    const loaded = new Promise((resolve, reject) => { const timer = setTimeout(resolve, 3000); f.onload = () => { clearTimeout(timer); resolve(); }; f.onerror = () => { clearTimeout(timer); reject(new Error('frame failed')); }; });
    document.body.append(f); await loaded;
    const d = f.contentDocument, w = f.contentWindow;
    if (!d?.querySelector('main') || w.location.pathname !== new URL(path, location.href).pathname) { f.remove(); throw new Error('frame content not ready'); }
    await Promise.race([d.fonts.ready, new Promise(r => setTimeout(r, 1000))]);
    await Promise.race([Promise.all(d.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))), new Promise(r => setTimeout(r, 1000))]);
    for (const theme of ['light', 'dark']) {
      d.documentElement.dataset.theme = theme;
      // Don't measure intermediate transition colors.
      await new Promise(r => setTimeout(r, 350));
      results.push({ path, width, theme, overflow: d.documentElement.scrollWidth > w.innerWidth, pendingImages: [...d.images].filter(i => !i.complete).length, contrast: contrast(d) });
    }
    f.remove();
  }
  return results;
}
export function printStyles() {
  const rules = [];
  function walk(sheet) {
    for (const rule of sheet.cssRules || []) {
      if (rule instanceof CSSMediaRule && rule.conditionText === 'print') rules.push(...[...rule.cssRules].map(r => r.cssText));
      else if (rule.cssRules) walk(rule);
    }
  }
  for (const sheet of document.styleSheets) walk(sheet);
  const sheet = new CSSStyleSheet(); sheet.replaceSync(rules.join('\n'));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  return { note: 'Print CSS simulation, not paginated/native print preview', ruleCount: rules.length, contrast: contrast(), titleColor: getComputedStyle(document.querySelector('h1')).color, codeColor: document.querySelector('pre') && getComputedStyle(document.querySelector('pre')).color, headerDisplay: getComputedStyle(document.querySelector('body > header')).display, bodyBackground: getComputedStyle(document.body).backgroundColor };
}
