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
    id: '2026-05',
    date: '2026-05',
    title: 'PADI AOW + 长白山封板',
    body:
      'PADI 进阶开放水域潜水员拿到。长白山雪季最后一周滑了三天，5 月 15 封板。开始重新看书，主要是非技术书。',
    tag: 'life',
  },
  {
    id: '2026-06',
    date: '2026-06',
    title: '站点重建 + 职业方向',
    body:
      '把 weichao.ren 整体重建到 Astro 5 + Vercel，14 年的内容一次性搬过来。同时在想下一步：是回大厂做 AI infra，还是去做 AI 应用，还是跳出去做自己的东西。',
    tag: 'work',
  },
];