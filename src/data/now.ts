// /now — what I'm focused on right now.
// Two-line timeline; oldest at top, newest at bottom.
// Entries MUST be in ascending date order — consumers assume that.

export type NowEntry = {
  id: string;
  date: string; // YYYY-MM
  title: string;
  body: string;
  tag?: 'work' | 'life' | 'travel' | 'open-source';
};

export const nowEntries: NowEntry[] = [
  {
    id: '2026-06',
    date: '2026-06',
    title: '站点重建 + 职业方向',
    body:
      '把 weichao.ren 整体重建到 Astro 5 + Vercel，14 年的内容一次性搬过来。同时在想下一步：在 AI infra / AI 应用 / 继续做自己的产品 三个方向里选。',
    tag: 'work',
  },
  {
    id: '2026-07',
    date: '2026-07',
    title: '手机实验室 + 产品维护',
    body:
      '主线是把 OnePlus 8T 做成 AI 可控的手机实验室（xiaohei-phone-agent、android-ai-stack）。同时维护节拍器、Lodge、GridGo。',
    tag: 'open-source',
  },
  {
    id: '2026-08',
    date: '2026-08',
    title: '站点身份对齐',
    body:
      '博客旧文先放着，慢慢写新的。先把首页、项目页和 /now 对齐到现在在做的事：独立开发、用 AI 造工具。',
    tag: 'work',
  },
];
