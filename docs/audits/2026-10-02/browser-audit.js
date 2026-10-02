window.auditPage = async function () {
  if (!window.axe) await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'http://localhost:8788/package/axe.min.js';
    script.onload = resolve; script.onerror = reject; document.head.append(script);
  });
  const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','wcag22aa'] } });
  return {
    path: location.pathname, viewport: innerWidth, theme: document.documentElement.dataset.theme,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    failedImages: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i=>i.getAttribute('src')),
    violations: result.violations.map(v => ({ id:v.id, impact:v.impact, targets:v.nodes.map(n=>n.target) })),
    manualReviewRules: result.incomplete.map(v=>v.id),
    axeVersion: axe.version,
  };
};
window.auditFrames = async function (paths, widths) {
  const results = [];
  for (const path of paths) for (const width of widths) {
    const frame = document.createElement('iframe');
    frame.title = 'Responsive audit';
    frame.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:900px;z-index:9999999;border:0;background:white`;
    frame.src = path;
    const loaded = new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=reject});
    document.body.append(frame); await loaded;
    const win = frame.contentWindow, doc = frame.contentDocument;
    await new Promise((resolve,reject)=>{
      const script=doc.createElement('script');script.src='http://localhost:8788/package/axe.min.js';script.onload=resolve;script.onerror=reject;doc.head.append(script);
    });
    await doc.fonts.ready;
    await new Promise(resolve=>win.requestAnimationFrame(()=>win.requestAnimationFrame(resolve)));
    await Promise.all(doc.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));
    const report = await win.axe.run(doc,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});
    results.push({path,width,actualWidth:win.innerWidth,theme:doc.documentElement.dataset.theme,overflow:doc.documentElement.scrollWidth>win.innerWidth,failedImages:[...doc.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.getAttribute('src')),violations:report.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),manualReview:report.incomplete.map(v=>v.id)});
    frame.remove();
  }
  return results;
};
