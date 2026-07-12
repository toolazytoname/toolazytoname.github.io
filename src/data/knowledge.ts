// Static knowledge base for the AI chatbot.
// The chatbot tries the LLM first, falls back to static keyword match.
// This file MUST stay human-readable — it's also the system prompt seed.

export type KnowledgeEntry = {
  id: string;
  keywords: string[]; // lowercase, any match
  reply: string;
  source?: string;
};

export const knowledge: KnowledgeEntry[] = [
  {
    id: 'about',
    keywords: ['你是谁', 'who are you', 'about', '介绍', '韦超', '小兔头', '你是'],
    reply:
      '我是韦超（网名"小兔头"），weichao.ren 的主人。\n\n做过 Swift 编译器、Apple LLVM 后端、字节跳动隐私检测。现在中年被裁，正在想清楚下一步要做什么。\n\n喜欢滑雪、潜水、攀岩、公路旅行。喜欢写代码，更喜欢写代码之外的东西。',
    source: 'about',
  },
  {
    id: 'products',
    keywords: ['产品', '作品', 'project', '作品集', 'works', 'product'],
    reply:
      '做过的几个：\n\n• weichao.studio — 个人工作室主页\n• WeChatExport — iOS 微信聊天记录导出工具\n• Swift 编译缓存优化 — SwiftPM 静态资源 cache 集成\n• LLVM 隐私检测 — 基于 LLVM Pass 的敏感 API 调用追踪\n• Metronome / Token / 几个 Side Project\n\n完整列表在主页 Works 区。',
    source: 'products',
  },
  {
    id: 'contact',
    keywords: ['联系', 'contact', '邮箱', 'email', '怎么找你', 'twitter', 'github'],
    reply:
      '最稳的方式是邮件：hi [at] weichao.ren\n\nGitHub: toolazytoname\nX / Twitter: @toolazytoname\n\n不常用的：知乎 / 即刻 / V2EX 也搜"小兔头"能找到。',
    source: 'contact',
  },
  {
    id: 'now',
    keywords: ['now', '最近', '最近在干嘛', '你在做什么', '当下', '近况'],
    reply:
      '最近两件事：\n\n1. 重建个人站（这个站），把 14 年的博客 / 作品 / 记忆全搬过来\n2. 想清楚下一步职业方向 —— 在 AI / 编译 / 隐私这三个领域之间选\n\n滑雪季再开就去新疆。PADI AOW 拿到之后安排海南潜水。',
    source: 'now',
  },
  {
    id: 'sport',
    keywords: ['运动', '户外', 'sport', '滑雪', 'ski', '潜水', 'dive', '攀岩', 'climb', '旅行'],
    reply:
      '户外三件套：\n\n🏔️ 滑雪 — 阿勒泰 / 长白山 / 崇礼，目标新疆干粉雪\n🤿 潜水 — PADI AOW 已拿，下一站海南考深潜专长\n🧗 攀岩 — 阳朔朝圣，目标从 5.10a 推到 5.10c\n🚗 公路旅行 — 独库 / 318 / G7，看时间安排\n\n详细计划在主页 Memories 地球上的 4 个点。',
    source: 'sport',
  },
  {
    id: 'byte',
    keywords: ['字节', '字节跳动', 'byte', '字节工作', 'bytedance'],
    reply:
      '在字节做过隐私检测方向 —— 基于 LLVM Pass 追踪敏感 API 调用（位置、相册、剪贴板、麦克风、摄像头），覆盖 iOS / Android / 桌面三端。\n\n技术栈：LLVM / Swift / Kotlin / C++。也做过一段时间 iOS 基础架构。',
    source: 'byte',
  },
  {
    id: 'openSource',
    keywords: ['开源', 'open source', 'github', 'github 项目'],
    reply:
      'GitHub: toolazytoname\n\n主要项目：\n• WeChatExport — iOS 微信聊天记录导出（OC + Swift）\n• 一些 Swift / LLVM 的实验代码\n\n早期博客和 side project 散落在各个 repo 里，慢慢整理中。',
    source: 'openSource',
  },
  {
    id: 'film',
    keywords: ['电影', 'film', 'movie', '看什么', '推荐'],
    reply:
      '最近在重看一遍小津安二郎和是枝裕和。\n\n也看纪录片多一些 —— 蓝色星球、人类星球、Our Planet。\n\n剧情片偏爱慢节奏：侯孝贤、阿巴斯、贾樟柯、王家卫早期。\n\n不怎么看爆米花片，但偶尔也吃垃圾食品。',
    source: 'film',
  },
  {
    id: 'book',
    keywords: ['书', 'book', '看书', '读什么', '推荐书', '读书'],
    reply:
      '最近在读：\n\n• 《人月神话》 — 重读，每次都有新东西\n• 《代码大全》第 2 版 — 当工具书翻\n• 《活出生命的意义》 — Frankl\n• 一些关于中年危机的散文和博客\n\n技术书看不动了，现在更多读历史 / 哲学 / 散文。',
    source: 'book',
  },
  {
    id: 'tech',
    keywords: ['tech', '技术栈', '用什么', '语言', 'language', 'swift', 'llvm'],
    reply:
      '主力：Swift / Objective-C / LLVM\n会用：TypeScript / Python / Rust（学习中）\n曾经靠它吃饭：C++ / Kotlin / Java\n\n编辑器：Neovim（最近切到 LazyVim 配方） + 偶尔 Xcode\nShell：fish + starship\n笔记：Obsidian + Logseq',
    source: 'tech',
  },
  {
    id: 'greeting',
    keywords: ['你好', 'hi', 'hello', 'hey', '在吗', '在么'],
    reply: '在的。问什么都行 —— 关于我、我的作品、最近在干什么、想去哪里玩。',
    source: 'greeting',
  },
  {
    id: 'thanks',
    keywords: ['谢谢', 'thanks', 'thank you', 'thx'],
    reply: '不客气 :)',
    source: 'thanks',
  },
];

// Naive keyword matcher — used as fallback when LLM is unavailable.
export function findStaticReply(input: string): KnowledgeEntry | null {
  const lower = input.toLowerCase().trim();
  if (!lower) return null;
  for (const entry of knowledge) {
    if (entry.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return entry;
    }
  }
  return null;
}