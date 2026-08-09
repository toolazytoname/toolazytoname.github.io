// Static knowledge base for the AI chatbot.
// The chatbot tries the LLM first, falls back to static keyword match.
// This file is the SINGLE SOURCE OF TRUTH — both the server (llm.ts)
// and the client (Chatbot.tsx) import from here. Edit this file only.
//
// This file MUST stay human-readable — it's also the system prompt seed
// (the whole array gets stringified into the LLM system prompt in llm.ts).

export type KnowledgeEntry = {
  id: string;
  keywords: string[]; // lowercase, any match
  reply: string;
  source?: string;
};

export const knowledge: KnowledgeEntry[] = [
  {
    id: 'about',
    keywords: ['你是谁', 'who are you', 'about', '介绍', 'lazy', '你是'],
    reply:
      '我是 lazy，weichao.ren 的主人。\n\n前某宇宙大厂 iOS 基础架构工程师，做过 Swift 编译缓存和 LLVM 隐私检测。15 年 iOS。\n\n现在是持滑雪 / 攀岩 / 游泳教练证的独立开发者，用 AI 造自己想要的工具。\n\n喜欢滑雪、潜水、攀岩、公路旅行。喜欢写代码，更喜欢写代码之外的东西。',
    source: 'about',
  },
  {
    id: 'projects',
    keywords: ['产品', '作品', '项目', 'project', 'projects', '作品集', 'works', 'product'],
    reply:
      '18 个开源项目，分 5 组 —— 完整列表在 /projects 页：\n\n📱 手机实验室：oneplus-8t-mobile-lab / android-ai-stack / xiaohei-phone-agent / pocket-pentest\n🤖 Agent & 自动化：GridGo / llm-quota-watchdog / happy-relay-deploy\n🔧 基础设施：Lodge / home-nas-skill / reality-handshake / wechat-mp-devops\n🏭 独立产品：节拍器 / MediaForge / Sentinel\n📜 老 iOS：WeChatExport（★14）/ FDTops / BPFlutter',
    source: 'projects',
  },
  {
    id: 'contact',
    keywords: ['联系', 'contact', '邮箱', 'email', '怎么找你', 'twitter', 'x', 'github'],
    reply:
      '最稳的方式是邮件：lazywc@gmail.com\n\nGitHub: @toolazytoname\nX / Twitter: @toolazytoname（不活跃，主互动在 GitHub）',
    source: 'contact',
  },
  {
    id: 'now',
    keywords: ['now', '最近', '最近在干嘛', '你在做什么', '当下', '近况'],
    reply:
      '最近在做的事：\n\n1. 把一台 OnePlus 8T 变成 AI 可控的手机 —— 通话、短信、App 操作全自动化（xiaohei-phone-agent + android-ai-stack）\n2. 持续维护几个独立产品：节拍器、Lodge、GridGo\n3. 重建个人站，从 Jekyll 迁到 Astro 5 + Vercel\n\n滑雪季再开就去新疆。',
    source: 'now',
  },
  {
    id: 'sport',
    keywords: ['运动', '户外', 'sport', '滑雪', 'ski', '潜水', 'dive', '攀岩', 'climb', '游泳', '旅行'],
    reply:
      '户外 + 水上：\n\n🏔️ 滑雪 (双板 + 单板) — 阿勒泰 / 长白山 / 崇礼，持社会体育指导员证\n🧗 攀岩 — 阳朔朝圣，持指导员证\n🏊 游泳 — 持社会体育指导员证\n🤿 潜水 — PADI AOW 已拿\n🚗 公路旅行 — 独库 / 318 / G7',
    source: 'sport',
  },
  {
    id: 'openSource',
    keywords: ['开源', 'open source', 'github', 'github 项目', 'repo', '仓库'],
    reply:
      'GitHub: @toolazytoname，29 个原创仓库。\n\n最活跃的方向是 Android AI 手机实验室（5 个相关 repo）。\n\n有星的几个老项目：WeChatExport（★14，导出微信聊天记录）、FDTops（★7，Xcode 类名前缀工具）、BPFlutter（★3，Flutter iOS 集成）。\n\n完整列表在 /projects 页。',
    source: 'openSource',
  },
  {
    id: 'film',
    keywords: ['电影', 'film', 'movie', '看什么'],
    reply:
      '最近在重看一遍小津安二郎和是枝裕和。\n\n也看纪录片多一些 —— 蓝色星球、人类星球、Our Planet。\n\n剧情片偏爱慢节奏：侯孝贤、阿巴斯、贾樟柯、王家卫早期。',
    source: 'film',
  },
  {
    id: 'book',
    keywords: ['书', 'book', '看书', '读什么', '推荐书', '读书'],
    reply:
      '最近在读：\n\n• 《人月神话》 — 重读，每次都有新东西\n• 《代码大全》第 2 版 — 当工具书翻\n• 《活出生命的意义》 — Frankl\n\n技术书看不动了，现在更多读历史 / 哲学 / 散文。',
    source: 'book',
  },
  {
    id: 'tech',
    keywords: ['tech', '技术栈', '用什么', '语言', 'language', 'swift', 'llvm'],
    reply:
      '历史主力：Swift / Objective-C / LLVM（15 年 iOS / 编译）\n现在用：TypeScript / Python / Go / Astro / Vercel / Claude Code\n\n编辑器：Neovim + LazyVim\nAI：Claude Code 是主菜，agent harness 自己写来用',
    source: 'tech',
  },
  {
    id: 'greeting',
    keywords: ['你好', 'hi', 'hello', 'hey', '在吗', '在么'],
    reply: '在的。问什么都行 —— 关于我、我的项目、最近在干什么、户外运动。',
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
// Shared by the server (llm.ts) and the client (Chatbot.tsx) so there's
// exactly ONE copy of the data and ONE matching function.
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
