// LLM client — Agnes-2.0-flash primary, DeepSeek fallback.
// Returns a tagged reply so the UI can show which model answered.
//
// Both providers speak the OpenAI Chat Completions protocol, so we reuse
// a single `openai` SDK instance and just swap the baseURL.

import OpenAI from 'openai';
import { knowledge } from '@data/knowledge';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ChatResult = {
  reply: string;
  source: 'agnes' | 'deepseek' | 'static' | 'fallback';
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

const agnesKey = process.env.AGNES_API_KEY;
const deepseekKey = process.env.DEEPSEEK_API_KEY;

// Lazy-init clients so cold-starts without keys don't crash.
function getAgnes() {
  if (!agnesKey) return null;
  return new OpenAI({
    apiKey: agnesKey,
    baseURL: 'https://apihub.agnes-ai.com/v1',
  });
}

function getDeepSeek() {
  if (!deepseekKey) return null;
  return new OpenAI({
    apiKey: deepseekKey,
    baseURL: 'https://api.deepseek.com/v1',
  });
}

export async function chat(messages: ChatMessage[]): Promise<ChatResult> {
  // Filter & normalize incoming messages.
  const history = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-10); // cap history to avoid token bloat

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

  // 2. Try DeepSeek.
  try {
    const ds = getDeepSeek();
    if (ds) {
      const completion = await ds.chat.completions.create({
        model: 'deepseek-chat',
        messages: fullMessages,
        max_tokens: 1024,
        temperature: 0.7,
      });
      const reply = completion.choices[0]?.message?.content;
      if (reply && reply.trim().length > 0) {
        return { reply: reply.trim(), source: 'deepseek' };
      }
    }
  } catch (err) {
    console.warn('[llm] deepseek failed:', err);
  }

  // 3. Static fallback.
  return {
    reply:
      '抱歉，两个 LLM 都暂时不可用。你可以试着问一些关键词（最近、滑雪、产品、开源、电影），我会用预置回答。',
    source: 'fallback',
    error: 'both LLMs unavailable',
  };
}

// Static matcher — used by the API route as the last fallback (after both
// LLMs fail) and by the UI when the API route itself fails.
export function staticReply(input: string): ChatResult {
  const lower = input.toLowerCase().trim();
  if (!lower) {
    return { reply: '问点什么吧 :)', source: 'static' };
  }
  for (const entry of knowledge) {
    if (entry.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return { reply: entry.reply, source: 'static' };
    }
  }
  return {
    reply:
      '这个问题我不知道。换个问法试试 —— 比如"最近在干嘛"、"作品"、"滑雪"这种关键词。',
    source: 'static',
  };
}
