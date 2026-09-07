// Static knowledge base for the AI chatbot.
// Server-side grounding and exact FAQ fallback when the model is unavailable.
// Free-form conversation must not be intercepted by substring matches.
//
// This file MUST stay human-readable — it's also the system prompt seed
// (the whole array gets stringified into the LLM system prompt in llm.ts).

export type KnowledgeEntry = {
  id: string;
  keywords: string[]; // complete question/topic aliases, case-insensitive
  reply: string;
  source?: string;
};

export const knowledge: KnowledgeEntry[] = [
  {
    id: 'about',
    keywords: ['你是谁', 'who are you', 'about', '介绍下你自己', '介绍一下你自己', '介绍 lazy', 'lazy 是谁'],
    reply:
      '我是本站的 AI 助手，帮助你了解 lazy 的公开资料。lazy 是独立开发者，做过 iOS 基础架构、Swift 编译缓存和 LLVM 隐私检测，现在用 AI 做自己的工具。详细介绍在 /about/。',
    source: 'about',
  },
  {
    id: 'projects',
    keywords: ['产品', '作品', '项目', 'project', 'projects', '作品集', 'works', 'product', '你的项目', '有哪些项目', '介绍项目', '介绍你的项目'],
    reply:
      '完整列表在 /projects/ 页。\n\n上线：Home NAS、鸭先知 AquaSight、LLM Quota Watchdog、Web3 Learning OS、小兔头节拍器\n敬请期待：MediaForge、xiaohei-phone-agent、拾光造像、芽伴星球、Lodge\n其余开源按分类列在下面。',
    source: 'projects',
  },
  {
    id: 'contact',
    keywords: ['联系', 'contact', '邮箱', 'email', '怎么找你', 'twitter', 'x', 'github'],
    reply:
      '最稳的方式是邮件：lazywc@gmail.com\n\nGitHub: https://github.com/toolazytoname\nX / Twitter: https://x.com/toolazytoname\n（不活跃，主互动在 GitHub）',
    source: 'contact',
  },
  {
    id: 'now',
    keywords: ['now', '最近', '最近在干嘛', '你在做什么', '当下', '近况'],
    reply:
      '按月更新在 /now/。最近大概是：\n\n1. 把 OnePlus 8T 做成 AI 可控的手机实验室\n2. 维护节拍器、Lodge、GridGo\n3. 把个人站身份对齐到现在在做的事（旧文先放着，新文章慢慢写）',
    source: 'now',
  },
  {
    id: 'sport',
    keywords: ['运动', '户外', '户外运动', 'sport', '滑雪', 'ski', '潜水', 'dive', '攀岩', 'climb', '游泳', '旅行'],
    reply:
      '户外 + 水上：\n\n滑雪（双板 + 单板）— 阿勒泰 / 长白山 / 崇礼，持社会体育指导员证\n攀岩 — 阳朔朝圣，持指导员证\n游泳 — 持社会体育指导员证\n潜水 — PADI AOW\n公路旅行 — 独库 / 318 / G7',
    source: 'sport',
  },
  {
    id: 'openSource',
    keywords: ['开源', 'open source', 'github', 'github 项目', 'repo', '仓库'],
    reply:
      'GitHub: https://github.com/toolazytoname\n\n最活跃的方向是 Android AI 手机实验室。有星的老项目：WeChatExport、FDTops、BPFlutter。\n\n完整列表在 /projects/。',
    source: 'openSource',
  },
  {
    id: 'film',
    keywords: ['电影', 'film', 'movie', '看什么'],
    reply:
      '最近在重看小津安二郎和是枝裕和。\n\n也看纪录片多一些 —— 蓝色星球、人类星球、Our Planet。\n\n剧情片偏爱慢节奏：侯孝贤、阿巴斯、贾樟柯、王家卫早期。',
    source: 'film',
  },
  {
    id: 'book',
    keywords: ['书', 'book', '看书', '读什么', '推荐书', '读书'],
    reply:
      '最近在读：\n\n• 《人月神话》 — 重读\n• 《代码大全》第 2 版 — 当工具书翻\n• 《活出生命的意义》 — Frankl\n\n技术书看不动了，现在更多读历史 / 哲学 / 散文。',
    source: 'book',
  },
  {
    id: 'site',
    keywords: ['这个网站', '网站技术栈', '本站技术栈', '网站是怎么做的', '这个网站怎么做的', '你这个网站是用什么做的', '这个网站用什么做的', '这个网站用什么技术', 'what is this website built with'],
    reply:
      '这个网站用 Astro 7 + TypeScript 构建，部署在 Vercel。文章等内容页预渲染成 HTML，聊天交互用 React 19 按需加载。问答接口在服务端调用模型，密钥不进入浏览器。源码：https://github.com/toolazytoname/toolazytoname.github.io',
    source: 'README',
  },
  {
    id: 'tech',
    keywords: ['tech', '技术栈', '你的技术栈是什么', '你用什么技术栈', '语言', 'language', 'swift', 'llvm'],
    reply:
      '历史主力：Swift / Objective-C / LLVM（15 年 iOS / 编译）\n现在用：TypeScript / Python / Go / Astro / Vercel / Claude Code\n\n编辑器：Neovim + LazyVim\nAI：Claude Code 是主菜，agent harness 自己写来用',
    source: 'tech',
  },
  {
    id: 'greeting',
    keywords: ['你好', 'hi', 'hello', 'hey', '在吗', '在么'],
    reply: '你好。可以聊 lazy 的项目、近况，或者这个网站。',
    source: 'greeting',
  },
  {
    id: 'thanks',
    keywords: ['谢谢', 'thanks', 'thank you', 'thx'],
    reply: '不客气 :)',
    source: 'thanks',
  },
];

function normalizeQuestion(input: string): string {
  return input.toLowerCase().trim().replace(/[?？!！。]+$/u, '').replace(/\s+/g, ' ');
}

export function findStaticReply(input: string): KnowledgeEntry | null {
  const question = normalizeQuestion(input);
  if (!question) return null;
  return knowledge.find(entry => entry.keywords.some(alias => normalizeQuestion(alias) === question)) ?? null;
}
