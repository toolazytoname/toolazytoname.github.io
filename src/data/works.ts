// 6 work cards · the public-facing portfolio. Each card has a front (summary)
// and a back (detail) for the 3D flip.
//
// 2026-07-12 review notes:
// - Replaces 6 placeholder entries (Metronome / Token / weichao.studio /
//   Swift 编译缓存 / LLVM 隐私检测 / WeChatExport). The old entries had:
//   • fabricated platform claims ("Apple Watch first 节拍器", which was actually
//     a Web + 小程序 product, not watchOS)
//   • placeholder URLs ("TODO://replace-with-real-link")
//   • products that aren't in the public profile README anymore
//     (Token, WeChatExport)
// - New 6 cards reflect the actual product line per current assets list
//   (节拍器 / Lodge / GridGo / Sentinel / autodev-harness / atelier).

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
  {
    id: 'sentinel',
    title: 'Sentinel',
    subtitle: '稳健型个人加密货币量化系统',
    period: '2024-2026',
    tag: 'Freqtrade · Crypto',
    status: 'shipped',
    front: {
      summary: 'freqtrade 地基 + 自建薄壳：纪律写进状态机，LLM 只做研究 / 复盘 / 否决，不直接下决策。',
      highlights: ['稳态策略为主', 'LLM 仅研究/复盘', '自托管 + 风控'],
    },
    back: {
      problem: '自己手动盯盘既不纪律也无法回测；直接拿 LLM 接交易 API 又太冒险。',
      approach: 'Freqtrade 做执行底座；自建薄壳做 daily/weekly review；LLM 通过严格 prompt 只能产出「赞成 / 反对 / 静观」，不写订单。',
      outcome: '已公开源码 + 论文级回测笔记；当前实盘小仓位持续。',
      stack: ['Python', 'Freqtrade', '状态机', 'Claude API'],
      links: [
        { label: 'GitHub', url: 'https://github.com/toolazytoname/Sentinel' },
      ],
    },
  },
  {
    id: 'autodev-harness',
    title: 'autodev-harness',
    subtitle: '全自动 AI 开发系统',
    period: '2025-2026',
    tag: 'AI · Dev',
    status: 'shipped',
    front: {
      summary: '把 Claude / Codex 等 agent 编进一个 harness：拉代码 → 跑测试 → 出 PR，全程自动。',
      highlights: ['自我修复', '多 agent 编排', '最低人类干预'],
    },
    back: {
      problem: '一次 vibe-coding 改两个文件是可以的，让 agent 改 100 个文件跑 CI 全绿，没现成 harness。',
      approach: 'agent loop 套 git 提交流程；测试失败时自动把 stack trace 喂回；agent 提 PR 时强制 review checklist。',
      outcome: '已开源；用于节拍器/Lodge 等项目的自动化维护。',
      stack: ['Python', 'Anthropic API', 'GitHub API', 'pytest'],
      links: [
        { label: 'GitHub', url: 'https://github.com/toolazytoname/autodev-harness' },
      ],
    },
  },
  {
    id: 'atelier',
    title: 'atelier',
    subtitle: 'macOS + Claude Code 隔离沙盒',
    period: '2026',
    tag: 'Dev · Tool',
    status: 'shipped',
    front: {
      summary: '让 Claude Code 跑在可销毁的 Linux VM 里，本机保持干净；跑完即扔。',
      highlights: ['Disposable VM', 'Host 干净', '快照恢复'],
    },
    back: {
      problem: 'Claude Code 跑久了会装一堆 Python / Node / 临时文件污染本机；重置一次要装半小时。',
      approach: 'Linux VM 启动 → 共享工作目录 → agent 跑 → VM 销毁；本机不进任何 apt 痕迹。',
      outcome: '日常开发默认接入；换工作台成本降到一次开关机。',
      stack: ['Shell', 'QEMU / KVM', 'Linux VM'],
      links: [
        { label: 'GitHub', url: 'https://github.com/toolazytoname/atelier' },
      ],
    },
  },
];
