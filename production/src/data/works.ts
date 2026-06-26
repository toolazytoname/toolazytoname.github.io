// 6 work cards · the public-facing portfolio.
// Each card has a front (summary) and a back (detail) for the 3D flip.

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
    title: 'Metronome',
    subtitle: '一个安静的练习节拍器',
    period: '2025',
    tag: 'iOS · Audio',
    status: 'shipped',
    front: {
      summary: '一个 Apple Watch first 的节拍器 — 不打扰练习。',
      highlights: ['手腕震动', '可听不可视', '100% 本地'],
    },
    back: {
      problem:
        '传统节拍器 app 在排练时屏幕太亮、声音太机械。乐手真正需要的是手腕上轻轻一拍。',
      approach:
        '用 CoreHaptics 实现有节律的震动反馈。Sound 设计来自真实机械节拍器录音，48kHz / 24bit。',
      outcome: 'App Store 上架，第一个月 2k 下载。',
      stack: ['Swift', 'SwiftUI', 'CoreHaptics', 'AVFoundation'],
      // TODO: 站主提供真实链接（App Store / GitHub / 微信小程序 / PR 链接）
      links: [{ label: 'App Store', url: 'TODO://replace-with-real-link' }],
    },
  },
  {
    id: 'token',
    title: 'Token',
    subtitle: '一次性的私密分享',
    period: '2025',
    tag: 'Web · Crypto',
    status: 'shipped',
    front: {
      summary: '阅后即焚的链接分享 — 服务器不留痕。',
      highlights: ['端到端加密', '一次访问即焚', '零日志'],
    },
    back: {
      problem:
        '发敏感信息给朋友时，邮件和网盘都不合适。需要一个"我发完你看完就没了"的工具。',
      approach:
        '密码学在前端：内容用一次性 AES-256-GCM 密钥加密，密钥只放在 URL fragment（不会发到服务器）。',
      outcome: '自用一年半，分给几十个朋友用过。',
      stack: ['Next.js', 'Web Crypto API', 'Cloudflare Workers'],
      // TODO: 站主提供真实链接（App Store / GitHub / 微信小程序 / PR 链接）
      links: [{ label: 'Source', url: 'TODO://replace-with-real-link' }],
    },
  },
  {
    id: 'weichao-studio',
    title: 'weichao.studio',
    subtitle: '个人工作室主页',
    period: '2024',
    tag: 'Web · Brand',
    status: 'shipped',
    front: {
      summary: '一个比简历更丰富的自我介绍。',
      highlights: ['独立设计', '自托管', '中英双语'],
    },
    back: {
      problem: 'LinkedIn / 简历 / 个人站三种媒介讲三种故事，不一致。',
      approach: '一个站点三套样式：通过 URL 参数切换 tone，但身份信息统一。',
      outcome: '成为和雇主、朋友、合作方分别使用的入口。',
      stack: ['Astro', 'TypeScript', 'Cloudflare Pages'],
    },
  },
  {
    id: 'swift-cache',
    title: 'Swift 编译缓存',
    subtitle: 'SwiftPM 静态资源 cache 集成',
    period: '2022',
    tag: 'Compiler · Swift',
    status: 'shipped',
    front: {
      summary: '让 SwiftPM build 复用预编译的二进制产物。',
      highlights: ['~40% build 加速', 'PR 已合并', 'Swift 5.7+'],
    },
    back: {
      problem:
        'SwiftPM 在 CI 上每个 PR 都从 0 开始 build 一个有几 MB 二进制的依赖。冷启动 6+ 分钟。',
      approach:
        '把编译产物的 hash 作为 key 缓存到 S3 兼容存储，CI 拉取命中后跳过 build。',
      outcome: '被 Swift 社区采纳，PR 合并进 swift-package-manager。',
      stack: ['Swift', 'SwiftPM', 'AWS S3'],
      // TODO: 站主提供真实链接（App Store / GitHub / 微信小程序 / PR 链接）
      links: [{ label: 'PR', url: 'TODO://replace-with-real-link' }],
    },
  },
  {
    id: 'llvm-privacy',
    title: 'LLVM 隐私检测',
    subtitle: '基于 LLVM Pass 的敏感 API 调用追踪',
    period: '2020-2022',
    tag: 'LLVM · Privacy',
    status: 'shipped',
    front: {
      summary: '在编译期标记每一个敏感 API 调用，覆盖 iOS / Android / 桌面。',
      highlights: ['跨平台', '低误报', '生产环境'],
    },
    back: {
      problem:
        'App 内调用了几百次位置、相册、麦克风、摄像头相关 API。人工 review 不可能穷举。',
      approach:
        '在 LLVM IR 层注入 Pass，标记每一个敏感 API call site，产出可读报告。',
      outcome: '在字节跳动内部全量覆盖，日均扫描数千个 app。',
      stack: ['C++', 'LLVM', 'Swift', 'Kotlin'],
    },
  },
  {
    id: 'wechat-export',
    title: 'WeChatExport',
    subtitle: 'iOS 微信聊天记录导出工具',
    period: '2018-2020',
    tag: 'iOS · Tool',
    status: 'archived',
    front: {
      summary: '把微信聊天记录从 iOS 备份里抠出来变成可读文件。',
      highlights: ['~10k GitHub stars', 'OC + Swift', '社区维护'],
    },
    back: {
      problem:
        'iOS 微信聊天记录是 SQLite + 加密 + 散落在 backup 里，没官方导出接口。',
      approach:
        '逆向 iTunes backup 格式 + 解密 MM.sqlite + 解析多媒体相对路径。',
      outcome: 'GitHub 上 ~10k stars，被国外媒体推荐过。',
      stack: ['Objective-C', 'Swift', 'SQLite'],
      // TODO: 站主提供真实链接（App Store / GitHub / 微信小程序 / PR 链接）
      links: [{ label: 'GitHub', url: 'TODO://replace-with-real-link' }],
    },
  },
];