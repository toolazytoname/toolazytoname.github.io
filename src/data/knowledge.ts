// Static knowledge base for the AI chatbot.
// The chatbot tries the LLM first, falls back to static keyword match.
// This file MUST stay human-readable — it's also the system prompt seed.
//
// 2026-07-12 review notes:
// - 旧版条目里有 WeChatExport / Swift 编译缓存 / LLVM 隐私检测 / "中年被裁"。
//   这些要么不在公开 profile，要么与新定位不符，要么 CLAUDE.md 不允许，
//   全部按下面规则改写或删除：
//   • about — 去掉"中年被裁"，只留人设与兴趣
//   • products — 列节拍器 / Lodge / GridGo / Sentinel / autodev-harness / atelier
//   • contact — 邮箱改 lazywc@gmail.com；Twitter 保留但标"不活跃"
//   • byte — 删 (原条目谈字节跳动 + LLVM 隐私，违反 CLAUDE.md 第 3 条)
//   • openSource — 列 6 个真实公开 repo
//   • tech — iOS 历史/AI 当前栈表述，校准为 CLAUDE.md 的"用 AI 造工具"叙事
// - sport / film / book / greeting / thanks 保留，仅做小幅校准。

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
      '我是韦超（网名"小兔头"，英文 ID toolazytoname），weichao.ren 的主人。\n\n前某宇宙大厂 iOS 基础架构工程师，2019 到 2023 期间做过 Swift 编译缓存和 LLVM 隐私检测。15 年 iOS。\n\n现在是持滑雪 / 攀岩 / 游泳教练证的独立开发者，用 AI 造自己想要的工具。\n\n喜欢滑雪、潜水、攀岩、公路旅行。喜欢写代码，更喜欢写代码之外的东西。',
    source: 'about',
  },
  {
    id: 'products',
    keywords: ['产品', '作品', 'project', '作品集', 'works', 'product'],
    reply:
      '现在在维护的几个：\n\n• 节拍器 (Metronome) — 网页 + 小程序，专业场景节拍器\n• Lodge — 自部署的家庭服务器仪表盘\n• GridGo — 日历优先的轻量 todo (开发中)\n• Sentinel — freqtrade 之上的稳健型加密策略\n\n开源的几个：\n\n• autodev-harness — 多 agent 自动开发 harness\n• atelier — Claude Code 用的 disposable VM 沙盒\n• MediaForge — 本地媒体处理工具集\n• wechat-mp-devops — 微信公众号开发与运维工具\n\n完整列表在主页 Works 区。',
    source: 'products',
  },
  {
    id: 'contact',
    keywords: ['联系', 'contact', '邮箱', 'email', '怎么找你', 'twitter', 'github'],
    reply:
      '最稳的方式是邮件：lazywc@gmail.com\n\nGitHub: @toolazytoname\nX / Twitter: @toolazytoname（不活跃，挂了占位用，主互动在 GitHub）\n\n不常用的：知乎 / 即刻 / V2EX 也搜"小兔头"能找到。',
    source: 'contact',
  },
  {
    id: 'now',
    keywords: ['now', '最近', '最近在干嘛', '你在做什么', '当下', '近况'],
    reply:
      '最近两件事：\n\n1. 重建个人站（这个站），把 14 年的博客 / 作品 / 记忆全搬过来，从 Jekyll 迁到 Astro 5 + Vercel\n2. 在想下一步职业方向 —— AI infra / AI 应用 / 继续做自己的产品 三个方向还在权衡\n\n滑雪季再开就去新疆。PADI AOW 拿到之后安排海南潜水。',
    source: 'now',
  },
  {
    id: 'sport',
    keywords: ['运动', '户外', 'sport', '滑雪', 'ski', '潜水', 'dive', '攀岩', 'climb', '游泳', '旅行'],
    reply:
      '户外 + 水上：\n\n🏔️ 滑雪 (双板 + 单板) — 阿勒泰 / 长白山 / 崇礼，持社会体育指导员证\n🧗 攀岩 — 阳朔朝圣，目标 5.10a → 5.10b → 5.10c，持指导员证\n🏊 游泳 — 持社会体育指导员证\n🤿 潜水 — PADI AOW 已拿，下一站海南考深潜专长\n🚗 公路旅行 — 独库 / 318 / G7，看时间安排\n\n详细计划在主页 Memories 地球上的 4 个点。',
    source: 'sport',
  },
  {
    id: 'openSource',
    keywords: ['开源', 'open source', 'github', 'github 项目'],
    reply:
      'GitHub: @toolazytoname\n\n主要公开项目：\n\n• autodev-harness — 多 agent 自动开发 harness\n• atelier — Claude Code disposable VM 沙盒\n• Sentinel — freqtrade 之上的稳健加密策略\n• MediaForge — 本地媒体处理工具集\n• wechat-mp-devops — 微信公众号开发与运维工具\n• 早期 iOS 时代的 Swift / LLVM side code 也都还留着\n\n新东西在 Pipeline 上走：一个工具 → 试用 → 拆段可复用的开源部分 → 公开。',
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
      '最近在读：\n\n• 《人月神话》 — 重读，每次都有新东西\n• 《代码大全》第 2 版 — 当工具书翻\n• 《活出生命的意义》 — Frankl\n• 一些关于独立开发的散文和博客\n\n技术书看不动了，现在更多读历史 / 哲学 / 散文。',
    source: 'book',
  },
  {
    id: 'tech',
    keywords: ['tech', '技术栈', '用什么', '语言', 'language', 'swift', 'llvm'],
    reply:
      '历史主力：Swift / Objective-C / LLVM（前后 15 年 iOS / 编译）\n现在用：TypeScript / Python / Astro / Vercel / Claude Code / Claude API\n学习中：Rust\n\n编辑器：Neovim（最近切到 LazyVim 配方） + 偶尔 Xcode\nShell：fish + starship\n笔记：Obsidian + Logseq\nAI：Claude Code 是主菜 + agent harness 自己写来用',
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
