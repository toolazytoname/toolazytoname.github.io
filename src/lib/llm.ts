// LLM client — keyword match first (instant), then Agnes with timeout.
// Returns a tagged reply so the UI can show which source answered.

import OpenAI from 'openai';
import { knowledge, findStaticReply } from '@data/knowledge';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ChatResult = {
  reply: string;
  source: 'agnes' | 'static' | 'fallback';
  error?: string;
};

const SYSTEM_PROMPT = `你是 lazy 个人站 weichao.ren 上的 AI 助手。站主授权你以他的第一人称回答访客的问题。

风格要求：
- 简短、直接、有温度，不要客套
- 简体中文为主，可以夹英文术语
- 不知道就说不知道，不要编
- 涉及个人隐私可以礼貌拒绝

你的背景知识库如下，优先基于这些回答：

${knowledge.map((k) => `[${k.id}]\n${k.reply}`).join('\n\n')}

记住：你不是真的站主，你只是被授权代表他回答访客。`;

// 8s — if it hasn't answered by then, move on.
const LLM_TIMEOUT = 8000;

const agnesKey = process.env.AGNES_API_KEY;

// Lazy-init client so cold-starts without keys don't crash.
function getAgnes() {
  if (!agnesKey) return null;
  return new OpenAI({
    apiKey: agnesKey,
    baseURL: 'https://apihub.agnes-ai.com/v1',
    timeout: LLM_TIMEOUT,
    maxRetries: 0,
  });
}

export async function chat(messages: ChatMessage[]): Promise<ChatResult> {
  const history = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-10);

  // 0. Keyword match FIRST — instant, no network, always available.
  // Handles 90% of questions without an LLM round-trip.
  const lastUser = [...history].reverse().find((m) => m.role === 'user');
  if (lastUser) {
    const staticHit = findStaticReply(lastUser.content);
    if (staticHit) {
      return { reply: staticHit.reply, source: 'static' };
    }
  }

  const fullMessages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
  ];

  // 1. Try Agnes-2.0-flash.
  try {
    const agnes = getAgnes();
    if (agnes) {
      const completion = await agnes.chat.completions.create({
        model: 'agnes-2.0-flash',
        messages: fullMessages,
        max_tokens: 1024,
        temperature: 0.7,
      });
      const reply = completion.choices[0]?.message?.content;
      if (reply && reply.trim().length > 0) {
        return { reply: reply.trim(), source: 'agnes' };
      }
    }
  } catch (err) {
    console.warn('[llm] agnes failed:', err);
  }

  // 2. No keyword hit + no LLM → generic fallback.
  return {
    reply:
      '这个问题我暂时答不上来。试试问"有哪些项目"、"最近在干嘛"、"户外运动"这些我能答的。',
    source: 'fallback',
    error: 'no match',
  };
}

// Static matcher — exported for the client-side fallback (Chatbot.tsx).
export function staticReply(input: string): ChatResult {
  const lower = input.toLowerCase().trim();
  if (!lower) {
    return { reply: '问点什么吧 :)', source: 'static' };
  }
  const hit = findStaticReply(lower);
  if (hit) return { reply: hit.reply, source: 'static' };
  return {
    reply:
      '这个问题我暂时答不上来。试试问"有哪些项目"、"最近在干嘛"、"户外运动"这些我能答的。',
    source: 'static',
  };
}
