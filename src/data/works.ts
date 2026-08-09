// 3 work cards · the public-facing portfolio. Each card has a front (summary)
// and a back (detail) for the flip.
//
// Trimmed from 6 to 3 in 2026-08 blog redesign: only the actively maintained
// products remain. Removed: sentinel, autodev-harness, atelier (not on the
// public GitHub profile anymore).

export type Work = {
  id: string;
  title: string;
  subtitle: string;
  period: string;
  tag: string;
  status: 'shipped' | 'wip' | 'archived';
  front: {
    summary: string;
    highlights: string[];
  };
  back: {
    problem: string;
    approach: string;
    outcome: string;
    stack: string[];
    links?: { label: string; url: string }[];
  };
};

export const works: Work[] = [
  {
    id: 'metronome',
    title: '节拍器',
    subtitle: '钢琴吉他练习节拍器 (Web + 小程序)',
    period: '2024-2026',
    tag: 'Web · 小程序',
    status: 'shipped',
    front: {
      summary: '一个针对钢琴 / 吉他 / 民乐练习场景的网页 + 小程序节拍器，本地优先、零账号、可长尾 SEO。',
      highlights: ['BPM 30–300', 'Web Audio + 视觉静音', '20 个长尾落地页 (中/英)'],
    },
    back: {
      problem: '主流节拍器 app 屏幕太亮、声音太机械，加练习辅助功能要收费；面向初学者的差异化搜索需求 (Hanon、6/8 jig 等) 没覆盖。',
      approach: '纯前端 Web Audio + CacheStorage，零后端、零账号；用 per-field URL preset + 长尾 slug 列表做 SEO。',
      outcome: '上线 jp + cn + en 三个 locale 的长尾落地页，零付费推广到达第一批稳定用户。',
      stack: ['TypeScript', 'Web Audio API', 'Vercel', '小程序'],
      links: [
        { label: '主站', url: 'https://jpq.weichao.studio/' },
        { label: 'GitHub', url: 'https://github.com/toolazytoname/metronome' },
      ],
    },
  },
  {
    id: 'lodge',
    title: 'Lodge',
    subtitle: '家庭服务器面板 · Self-hosted',
    period: '2025-2026',
    tag: 'Self-hosted',
    status: 'shipped',
    front: {
      summary: 'Lodge 是一个自部署的家庭服务器面板：服务管理 + 配置中心 + 仪表盘，单 HTML 文件，零后端。',
      highlights: ['单 HTML 文件', '零后端依赖', 'JSON 配置 + 状态 API'],
    },
    back: {
      problem: '跑家庭服务器 (HomeLab / SOHO / 小工作室) 时 SSH 记命令繁琐，外部 SaaS 要联网、要账号、贵。',
      approach: '单 HTML + 静态 JSON 配置；客户端 JS 直接连服务器管理端口；服务端最小化处理。',
      outcome: '已开源，含真实 dashboard 截图 + 中英 README 双版；v1.0.0 release 已发。',
      stack: ['HTML', 'TypeScript', 'Zero-backend'],
      links: [
        { label: '主站', url: 'https://lodge.weichao.studio/about.html' },
        { label: 'GitHub', url: 'https://github.com/toolazytoname/lodge' },
      ],
    },
  },
  {
    id: 'gridgo',
    title: 'GridGo',
    subtitle: '日历优先待办 · Calendar-first Todo',
    period: '2024-2026',
    tag: 'Web · Product',
    status: 'wip',
    front: {
      summary: '把日历视图当主入口的轻量 todo；不抢用户的输入主界面，只替代月历。',
      highlights: ['日历优先', '多视图 (日/周/月)', '无社交、无云账号'],
    },
    back: {
      problem: '主流 todo app 把 inbox 摆主入口，日历是被压扁的展示；用户真正在做的是「每天/每周有时间窗的事」。',
      approach: '日 / 周 / 月三视图可切；事件存 localStorage + 可选 WebDAV 同步；不上 lock-in 云。',
      outcome: 'beta 上线 (beta.gridgo.weichao.studio)；gridgo.cn 域名注册待正式启用。',
      stack: ['TypeScript', 'React', 'Vite', 'Vercel'],
      links: [
        { label: 'Beta', url: 'https://beta.gridgo.weichao.studio/' },
        { label: 'GitHub', url: 'https://github.com/toolazytoname/GridGo' },
      ],
    },
  },
];
