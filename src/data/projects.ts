// GitHub projects portfolio · mirrors the profile README grouping.
// Stars are a manual snapshot — update periodically. Hide 0 in UI.

export type ProjectCategory =
  | 'mobile-lab'
  | 'agents'
  | 'infra'
  | 'standalone'
  | 'legacy-ios';

export type Project = {
  name: string;
  title: string;
  description: string;
  category: ProjectCategory;
  language: string | null;
  repo: string;
  demo?: string;
  stars: number;
  image?: string;
  featured?: boolean;
  summary?: string;
  status: 'shipped' | 'wip';
  wechat?: {
    qr: string;
    name: string;
  };
};

/** 代表项目：只放已上线的产品。新上线的排前面。 */
const FEATURED_ORDER = [
  'home-nas-skill',
  'AquaSight',
  'llm-quota-watchdog',
  'web3_learning',
  'metronome',
];

/** 敬请期待：点名正在做、单独成区的产品。 */
const COMING_SOON_ORDER = [
  'MediaForge',
  'xiaohei-phone-agent',
  'gridgo-art-studio',
  'gridgo-pet-school',
  'lodge',
];

function sortByOrder(list: Project[], order: string[]): Project[] {
  return [...list].sort((a, b) => {
    const ia = order.indexOf(a.name);
    const ib = order.indexOf(b.name);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

export function getFeaturedProjects(): Project[] {
  return sortByOrder(
    projects.filter((project) => project.featured && project.status === 'shipped'),
    FEATURED_ORDER,
  );
}

export function getComingSoonProjects(): Project[] {
  return sortByOrder(
    projects.filter((project) => COMING_SOON_ORDER.includes(project.name)),
    COMING_SOON_ORDER,
  );
}

export function isComingSoon(name: string): boolean {
  return COMING_SOON_ORDER.includes(name);
}

export const categoryMeta: Record<
  ProjectCategory,
  { label: string; sublabel: string }
> = {
  'mobile-lab': {
    label: '手机实验室 & 端侧 AI',
    sublabel: '把一台 OnePlus 8T 变成 AI 可控的开放手机实验室。',
  },
  agents: {
    label: 'Agent & 自动化',
    sublabel: '个人 agent、额度看板和中继部署。',
  },
  infra: {
    label: '基础设施 & 运维',
    sublabel: '家庭服务器、代理诊断、微信小程序 CI/CD。',
  },
  standalone: {
    label: '独立产品',
    sublabel: '能单独用的东西：新闻雷达、节拍器、Web3 课、量化系统。',
  },
  'legacy-ios': {
    label: 'Legacy iOS',
    sublabel: '老本行时期的开源：微信导出、Xcode 辅助、Flutter。',
  },
};

export const projects: Project[] = [
  // ===== Mobile Lab & On-Device AI =====
  {
    name: 'oneplus-8t-mobile-lab',
    title: 'OnePlus 8T Mobile Lab',
    description:
      'An open phone lab grown out of one OnePlus 8T: Android flashing & recovery, real-device automation, authorized mobile security, wireless observation, and on-device AI agents.',
    category: 'mobile-lab',
    language: 'Shell',
    repo: 'https://github.com/toolazytoname/oneplus-8t-mobile-lab',
    demo: 'https://toolazytoname.github.io/oneplus-8t-mobile-lab/',
    stars: 0,
    image:
      'https://raw.githubusercontent.com/toolazytoname/oneplus-8t-mobile-lab/main/docs/assets/oneplus8t-field-guide/mobile-lab-ecosystem-v2.png',
    summary: '一台 OnePlus 8T 上的刷机、真机自动化、安全实验与端侧 AI 工作台。',
    status: 'wip',
  },
  {
    name: 'android-ai-stack',
    title: 'Android AI Stack',
    description:
      'A local-first AI toolchain for an Android phone running Termux + Kali PRoot: OpenCode, Claude Code, Happy\u2019s agent and server all run on the phone.',
    category: 'mobile-lab',
    language: 'Shell',
    repo: 'https://github.com/toolazytoname/android-ai-stack',
    stars: 0,
    image:
      'https://raw.githubusercontent.com/toolazytoname/android-ai-stack/main/docs/assets/android-ai-stack-overview.png',
    summary: 'Termux + Kali PRoot 上的本机 AI 工具链：在手机上跑 coding agent。',
    status: 'wip',
  },
  {
    name: 'xiaohei-phone-agent',
    title: 'Xiaohei Phone Agent',
    description:
      '\u201CWake it. Say it. Let your phone act.\u201D An open, local-first AI phone assistant for Android \u2014 voice command \u2192 intent routing \u2192 observable actions, with confirmation when it matters.',
    category: 'mobile-lab',
    language: 'Java',
    repo: 'https://github.com/toolazytoname/xiaohei-phone-agent',
    stars: 0,
    image:
      'https://raw.githubusercontent.com/toolazytoname/xiaohei-phone-agent/main/docs/assets/xiaohei-phone-agent-overview.png',
    summary: '本地优先的 Android 手机助手：语音 → 意图 → 可观察的操作。',
    status: 'wip',
  },
  {
    name: 'pocket-pentest',
    title: 'Pocket Pentest',
    description:
      'Turn an Android phone into an authorized pentest / CTF carry-on toolkit. No custom kernel, no system downgrade \u2014 Magisk root + Termux/PRoot Kali userspace.',
    category: 'mobile-lab',
    language: 'Shell',
    repo: 'https://github.com/toolazytoname/pocket-pentest',
    stars: 0,
    summary: '授权场景下的随身渗透 / CTF 工具包：Magisk + Termux/PRoot Kali。',
    status: 'wip',
  },
  {
    name: 'android-device-test',
    title: 'Android Device Test',
    description:
      'Real-device Android testing skill: ADB triage, state pinning, uiautomator2, PerfDog, monkey \u2014 and telling real failures from false ones.',
    category: 'mobile-lab',
    language: null,
    repo: 'https://github.com/toolazytoname/android-device-test',
    stars: 0,
    summary: '真机 Android 测试技能：ADB、uiautomator2、PerfDog，分清真假失败。',
    status: 'wip',
  },

  // ===== Agents & Automation =====
  {
    name: 'GridGo',
    title: 'GridGo · 格行',
    description:
      'A personal Agent butler \u2014 one grid, one task. Calendar-first todo that doesn\u2019t fight your inbox.',
    category: 'agents',
    language: 'HTML',
    repo: 'https://github.com/toolazytoname/GridGo',
    demo: 'https://beta.gridgo.weichao.studio/',
    summary: '以日历为中心的个人 Agent 管家：一个格子，一件事情。',
    stars: 0,
    status: 'wip',
  },
  {
    name: 'llm-quota-watchdog',
    title: 'LLM Quota Watchdog',
    description:
      'One dashboard + smart push alerts for LLM coding-plan quotas \u2014 Claude Pro/Max, Codex Plus/Pro, Kimi for Coding, GLM Coding Plan. Python stdlib only, static HTML, no DB.',
    category: 'agents',
    language: 'Python',
    repo: 'https://github.com/toolazytoname/llm-quota-watchdog',
    demo: 'https://quota.weichao.studio',
    featured: true,
    stars: 0,
    image:
      'https://raw.githubusercontent.com/toolazytoname/llm-quota-watchdog/main/docs/screenshot.png',
    summary: '多个 LLM coding plan 额度的看板与推送提醒，纯标准库、无数据库。',
    status: 'shipped',
  },
  {
    name: 'happy-relay-deploy',
    title: 'Happy Relay Deploy',
    description:
      'A skill for self-hosting a Happy relay when you genuinely need to drive Claude Code on a remote machine from your phone. Tailnet-only by default.',
    category: 'agents',
    language: 'TypeScript',
    repo: 'https://github.com/toolazytoname/happy-relay-deploy',
    stars: 0,
    summary: '自托管 Happy relay：用手机远程驱动 Claude Code，默认仅 Tailnet。',
    status: 'shipped',
  },

  // ===== Infra & Ops Skills =====
  {
    name: 'lodge',
    title: 'Lodge',
    description:
      'See every service running on each of your servers, what\u2019s exposed where \u2014 hub + agent architecture, a single Go binary, E2E-encrypted vault. No more spreadsheets that go stale in a week.',
    category: 'infra',
    language: 'Go',
    repo: 'https://github.com/toolazytoname/lodge',
    demo: 'https://lodge.weichao.studio',
    summary: '用一个 Go 二进制看清服务器上运行的服务、暴露入口与加密凭据。',
    stars: 0,
    status: 'wip',
  },
  {
    name: 'home-nas-skill',
    title: 'Home NAS',
    description:
      'Turn a leftover x86 box into a family media center: *arr \u2192 Jellyfin, Immich, music and books. A Claude Skill with the China-network and weak-CPU 1080p-direct-play gotchas already written down.',
    category: 'infra',
    language: null,
    repo: 'https://github.com/toolazytoname/home-nas-skill',
    featured: true,
    stars: 0,
    image: '/projects/home-nas.png',
    summary:
      '把闲置小主机搭成全自动家庭媒体中心：Jellyfin、Immich、大陆镜像和弱 CPU 1080p 直放的实战手册。',
    status: 'shipped',
  },
  {
    name: 'reality-handshake',
    title: 'Reality Handshake',
    description:
      'Diagnosing VLESS+Reality / XTLS proxy handshake failures, and connecting new clients to an existing server.',
    category: 'infra',
    language: 'Shell',
    repo: 'https://github.com/toolazytoname/reality-handshake',
    stars: 0,
    summary: '诊断 VLESS+Reality / XTLS 握手失败，并把新客户端接到现有服务器。',
    status: 'shipped',
  },
  {
    name: 'wechat-mp-devops',
    title: 'WeChat MP DevOps',
    description:
      'WeChat MiniProgram CI/CD & DevOps playbooks (build / upload / scan-test on Linux & macOS), packaged as a drop-in skill.',
    category: 'infra',
    language: 'Shell',
    repo: 'https://github.com/toolazytoname/wechat-mp-devops',
    stars: 0,
    summary: '微信小程序 CI/CD 与运维手册，封装成可直接用的 skill。',
    status: 'shipped',
  },

  // ===== Standalone Projects =====
  {
    name: 'AquaSight',
    title: '鸭先知 · AquaSight',
    description:
      'A personal news radar: pull tech, hot search, and world sources, cluster them, pin breaking stories to the top, and push Bark alerts. Daily digest on a static GitHub Pages board.',
    category: 'standalone',
    language: 'JavaScript',
    repo: 'https://github.com/toolazytoname/AquaSight',
    demo: 'https://toolazytoname.github.io/AquaSight/',
    featured: true,
    stars: 0,
    image: '/projects/aquasight.png',
    summary: '春江水暖，破圈置顶。聚合科技、热搜与世界新闻，破圈事件推送到 Bark。',
    status: 'shipped',
  },
  {
    name: 'metronome',
    title: '小兔头节拍器',
    description:
      'A metronome that opens right in your browser \u2014 kid-voice beat counting, traditional strong/weak beats, multiple time signatures. For piano, drums, or dance practice.',
    category: 'standalone',
    language: 'HTML',
    repo: 'https://github.com/toolazytoname/metronome',
    demo: 'https://jpq.weichao.studio',
    stars: 0,
    image: '/projects/metronome-wechat-miniapp.png',
    featured: true,
    summary: '打开浏览器就能用的节拍器，也有微信小程序。支持童声数拍、强弱拍与多种拍号。',
    wechat: {
      qr: '/projects/metronome-wechat-miniapp.png',
      name: '小兔头节拍器',
    },
    status: 'shipped',
  },
  {
    name: 'web3_learning',
    title: 'Web3 Learning OS',
    description:
      'Four interactive Web3 courses in the browser: encode calldata, walk EVM calls, practice wallet safety, and replay common contract bugs. Progress stays local.',
    category: 'standalone',
    language: 'TypeScript',
    repo: 'https://github.com/toolazytoname/web3_learning',
    demo: 'https://web3.weichao.studio',
    featured: true,
    stars: 0,
    summary: '浏览器里就能学的 Web3 课：图、实验、测验，从拆 EVM 交易开始。',
    status: 'shipped',
  },
  {
    name: 'plutus-rustus',
    title: 'Plutus Rustus',
    description:
      'A Rust Bitcoin wallet collider: sequential EC walk, batched inversion, SIMD hash160. Packaged as goldpan with a one-line install.',
    category: 'standalone',
    language: 'Rust',
    repo: 'https://github.com/toolazytoname/plutus-rustus',
    stars: 0,
    summary: 'Rust 写的 Bitcoin 地址碰撞器，一键安装，本机跑。',
    status: 'shipped',
  },
  {
    name: 'gridgo-art-studio',
    title: '拾光造像 · Luma Atelier',
    description:
      'An online multimedia studio for stills and video: generate, edit, compose, and bill per job with immutable quotes. Staging MVP, mock providers only.',
    category: 'standalone',
    language: 'TypeScript',
    repo: 'https://github.com/toolazytoname/gridgo-art-studio',
    stars: 0,
    summary: '面向摄影与内容团队的线上多媒体工作室。还在搭，敬请期待。',
    status: 'wip',
  },
  {
    name: 'gridgo-pet-school',
    title: '芽伴星球 · Sproutly',
    description:
      'A classroom pet that grows when kids show up and finish practice. Teachers set rewards and watch class progress. Staging MVP, no real student PII.',
    category: 'standalone',
    language: null,
    repo: 'https://github.com/toolazytoname/gridgo-pet-school',
    stars: 0,
    summary: '学校和教培用的电子宠物激励。孩子完成任务，宠物一起长大。',
    status: 'wip',
  },
  {
    name: 'MediaForge',
    title: 'MediaForge',
    description:
      'An AI self-media pipeline: topic selection \u2192 creation (article/video) \u2192 quality gate \u2192 human review \u2192 scheduled multi-platform publishing \u2192 analytics feedback. Quality comes from the veto \u2014 it dares to drop 70% of output.',
    category: 'standalone',
    language: 'Python',
    repo: 'https://github.com/toolazytoname/MediaForge',
    stars: 0,
    image:
      'https://raw.githubusercontent.com/toolazytoname/MediaForge/main/docs/samples/xhs_card_sample-001.png',
    summary: 'AI 自媒体管线：选题 → 创作 → 质量门禁 → 人工复核 → 多平台发布。',
    status: 'wip',
  },
  {
    name: 'Sentinel',
    title: 'Sentinel',
    description:
      'A disciplined cryptocurrency quantitative system for the long-term investor. Its value isn\u2019t \u201Cearning more\u201D \u2014 it\u2019s using machine-level discipline to stop you from repeating your own mistakes. LLM only does research / review / veto; it never places orders.',
    category: 'standalone',
    language: 'Python',
    repo: 'https://github.com/toolazytoname/Sentinel',
    stars: 2,
    summary: '长期投资者的加密货币量化系统：纪律优先，LLM 只研究 / 复核 / 否决，不下单。',
    status: 'wip',
  },

  // ===== Legacy iOS =====
  {
    name: 'WeChatExport',
    title: 'WeChatExport',
    description: 'Export WeChat chat logs (iOS).',
    category: 'legacy-ios',
    language: 'Objective-C',
    repo: 'https://github.com/toolazytoname/WeChatExport',
    stars: 14,
    summary: '导出 iOS 微信聊天记录。',
    status: 'shipped',
  },
  {
    name: 'FDTops',
    title: 'FDTops',
    description: 'Batch add/replace class-name prefixes \u2014 an Xcode helper.',
    category: 'legacy-ios',
    language: 'Python',
    repo: 'https://github.com/toolazytoname/FDTops',
    stars: 7,
    summary: '批量增加 / 替换 Objective-C 类名前缀的 Xcode 辅助工具。',
    status: 'shipped',
  },
  {
    name: 'BPFlutter',
    title: 'BPFlutter',
    description: 'Flutter integration guide & sample for iOS projects.',
    category: 'legacy-ios',
    language: 'Objective-C',
    repo: 'https://github.com/toolazytoname/BPFlutter',
    stars: 3,
    summary: 'iOS 工程集成 Flutter 的指南与示例。',
    status: 'shipped',
  },
];
