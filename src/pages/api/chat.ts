// POST /api/chat
// Body: { messages: [{role, content}], context?: string }
// Response: { reply: string, source: 'agnes'|'deepseek'|'static', remaining?: number }

import type { APIRoute } from 'astro';
import { chat, staticReply, type ChatMessage, type ChatResult } from '@lib/llm';
import { rateLimit, clientIp } from '@lib/rate-limit';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const ip = clientIp(request.headers);
  const limit = rateLimit(ip);
  if (!limit.allowed) {
    return new Response(
      JSON.stringify({
        reply: '请求太快了，过会儿再问 :)',
        source: 'fallback' as const,
        error: 'rate_limited',
      }),
      {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'retry-after': String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  let body: { messages?: ChatMessage[]; context?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ reply: '请求格式不对。', source: 'static' as const, error: 'bad_json' }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return new Response(
      JSON.stringify({ reply: '说点什么吧 :)', source: 'static' as const }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  try {
    const result: ChatResult = await chat(messages);
    // If LLM layer gave us the generic "both unavailable" message, try the
    // static matcher one more time — keyword matches feel much more useful
    // than the blanket fallback.
    let final: ChatResult = result;
    if (result.source === 'fallback') {
      const last = [...messages].reverse().find((m) => m.role === 'user');
      if (last) {
        const sr = staticReply(last.content);
        if (sr.source === 'static') final = sr;
      }
    }
    return new Response(
      JSON.stringify({ ...final, remaining: limit.remaining }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('[api/chat] unexpected error', err);
    // Even on total failure, return a usable static reply — never break the UI.
    const last = [...messages].reverse().find((m) => m.role === 'user');
    const fallback = last ? staticReply(last.content) : { reply: '出错了。', source: 'static' as const };
    return new Response(
      JSON.stringify({ ...fallback, error: 'internal', remaining: limit.remaining }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
};

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      ok: true,
      hint: 'POST { messages: [{role, content}] } to this endpoint.',
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );