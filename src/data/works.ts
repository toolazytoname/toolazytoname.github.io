// 3 work cards · the public-facing portfolio.
//
// Trimmed from 6 to 3 in 2026-08 blog redesign: only the actively maintained
// products remain. Removed: sentinel, autodev-harness, atelier (not on the
// public GitHub profile anymore).

export type Work = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  status: 'shipped' | 'wip' | 'archived';
  summary: string;
  highlights: string[];
  links: { label: string; url: string }[];
};

export const works: Work[] = [
  {
    id: 'metronome',
    title: '节拍器',
    subtitle: '钢琴吉他练习节拍器 (Web + 小程序)',
    tag: 'Web · 小程序',
    status: 'shipped',
    summary: '一个针对钢琴 / 吉他 / 民乐练习场景的网页 + 小程序节拍器，本地优先、零账号、可长尾 SEO。',
    highlights: ['BPM 30–300', 'Web Audio + 视觉静音', '20 个长尾落地页 (中/英)'],
    links: [
      { label: '主站', url: 'https://jpq.weichao.studio/' },
      { label: 'GitHub', url: 'https://github.com/toolazytoname/metronome' },
    ],
  },
  {
    id: 'lodge',
    title: 'Lodge',
    subtitle: '家庭服务器面板 · Self-hosted',
    tag: 'Self-hosted',
    status: 'shipped',
    summary: 'Lodge 是一个自部署的家庭服务器面板：服务管理 + 配置中心 + 仪表盘，单 HTML 文件，零后端。',
    highlights: ['单 HTML 文件', '零后端依赖', 'JSON 配置 + 状态 API'],
    links: [
      { label: '主站', url: 'https://lodge.weichao.studio/about.html' },
      { label: 'GitHub', url: 'https://github.com/toolazytoname/lodge' },
    ],
  },
  {
    id: 'gridgo',
    title: 'GridGo',
    subtitle: '日历优先待办 · Calendar-first Todo',
    tag: 'Web · Product',
    status: 'wip',
    summary: '把日历视图当主入口的轻量 todo；不抢用户的输入主界面，只替代月历。',
    highlights: ['日历优先', '多视图 (日/周/月)', '无社交、无云账号'],
    links: [
      { label: 'Beta', url: 'https://beta.gridgo.weichao.studio/' },
      { label: 'GitHub', url: 'https://github.com/toolazytoname/GridGo' },
    ],
  },
];
