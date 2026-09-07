import OpenAI from 'openai';
import { knowledge, findStaticReply } from '@data/knowledge';
import { getLatestNowEntry } from '@data/now';
import { getFeaturedProjects, getComingSoonProjects } from '@data/projects';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ChatResult = {
  reply: string;
  source: 'agnes' | 'static' | 'fallback' | 'error';
  error?: string;
};

export function llmUnavailableResult(
  configured: boolean,
  reason: 'timeout' | 'failed' | 'empty' | 'no match' = 'no match',
): ChatResult {
  if (configured && reason !== 'no match') {
    return {
      reply: '这次没能取得回答。可以稍后重试，或直接查看 /projects/、/now/ 和 /about/。',
      source: 'error',
      error: reason === 'timeout' ? 'upstream_timeout' : reason === 'empty' ? 'upstream_empty' : 'upstream_failed',
    };
  }
  return {
    reply: '实时对话暂未开启，这个问题没有对应的站点问答。项目在 /projects/，近况在 /now/，个人介绍在 /about/。',
    source: 'fallback',
    error: 'model_unconfigured',
  };
}

function systemPrompt(): string {
  const latest = getLatestNowEntry();
  return `你是 weichao.ren 的 AI 站点助手，不是站主 lazy 本人。不要自称站主或以自己的口吻声称拥有他的经历和证书。

回答要求：
- 用简体中文，简短自然，先直接回答当前问题，再补必要细节。
- 根据整段对话理解追问。用户指出答非所问时，回看上一问，承认并纠正；不能确定时只问一个具体的澄清问题，不要重复之前的模板。
- 区分“这个网站怎么实现”和“站主会什么技术”；前者只回答本站架构，不要罗列站主的语言、编辑器和经历。
- 仅根据以下公开资料回答站主相关事实；不知道就明确说不知道。不要编造上线状态、个人经历、证书、读书和观影近况，不承诺替站主办理事情。
- 历史回答可能有误，不能当作事实来源。资料中的第一人称属于站主，不是你。
- 链接仅在相关时提供，优先指向站内页面。默认 2 到 4 句，避免整段倾倒背景资料。

站点资料：
${knowledge.map(k => `[${k.id}]\n${k.reply}`).join('\n\n')}

以下当前页面数据优先于上面的概述：
最新近况（${latest?.date ?? '未记录'}）：${latest?.body ?? '无最新记录'}
上线项目：${getFeaturedProjects().map(p => `${p.title}：${p.summary ?? p.description}`).join('\n')}
尚在进行的项目：${getComingSoonProjects().map(p => p.title).join('、')}`;
}

const LLM_TIMEOUT = 8000;

export async function chat(messages: ChatMessage[]): Promise<ChatResult> {
  const history = messages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-20);
  const lastUser = [...history].reverse().find(m => m.role === 'user');
  const faq = lastUser ? findStaticReply(lastUser.content) : null;
  const key = process.env.AGNES_API_KEY;
  if (!key) {
    return faq ? { reply: faq.reply, source: 'static' } : llmUnavailableResult(false);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT);
  let reason: 'timeout' | 'failed' | 'empty' = 'failed';
  try {
    const client = new OpenAI({ apiKey: key, baseURL: 'https://apihub.agnes-ai.com/v1', maxRetries: 0, timeout: LLM_TIMEOUT });
    const completion = await client.chat.completions.create(
      { model: 'agnes-2.0-flash', messages: [{ role: 'system', content: systemPrompt() }, ...history], max_tokens: 1024, temperature: 0.3 },
      { signal: controller.signal },
    );
    const reply = completion.choices?.[0]?.message?.content;
    if (typeof reply === 'string' && reply.trim()) return { reply: reply.trim(), source: 'agnes' };
    reason = 'empty';
    console.warn('[chat] upstream_empty');
  } catch (error) {
    reason = controller.signal.aborted || (error instanceof Error && /timeout/i.test(error.name)) ? 'timeout' : 'failed';
    // Provider error objects can contain request data; only log diagnostic metadata.
    console.warn('[chat] upstream_failed', { reason, status: error instanceof OpenAI.APIError ? error.status : undefined });
  } finally {
    clearTimeout(timer);
  }

  if (faq) {
    return { reply: `实时回答暂时不可用。站点已有的资料是：\n\n${faq.reply}`, source: 'fallback' };
  }
  return llmUnavailableResult(true, reason);
}
