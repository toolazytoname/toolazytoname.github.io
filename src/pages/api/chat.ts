// POST /api/chat
// Body: { messages: [{role, content}], context?: string }
// Response: { reply: string, source: 'agnes'|'static', remaining?: number }

import type { APIRoute } from 'astro';
import { chat, type ChatResult } from '@lib/llm';
import { findStaticReply } from '@data/knowledge';
import { parseChatRequest } from '@lib/chat-request';
import { readLimitedText } from '@lib/read-body';
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

  let raw: unknown;
  try {
    const limited = await readLimitedText(request);
    if (!limited.ok) {
      return new Response(
        JSON.stringify({
          reply: limited.reply,
          source: 'static' as const,
          error: limited.error,
        }),
        { status: limited.status, headers: { 'content-type': 'application/json' } },
      );
    }
    raw = JSON.parse(limited.text) as unknown;
  } catch {
    return new Response(
      JSON.stringify({ reply: '请求格式不对。', source: 'static' as const, error: 'bad_json' }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  const parsed = parseChatRequest(raw);
  if (!parsed.ok) {
    return new Response(
      JSON.stringify({
        reply: parsed.reply,
        source: 'static' as const,
        error: parsed.error,
      }),
      { status: parsed.status, headers: { 'content-type': 'application/json' } },
    );
  }

  const messages = parsed.data.messages;

  try {
    const result: ChatResult = await chat(messages);
    let final: ChatResult = result;
    if (result.source === 'fallback') {
      const last = [...messages].reverse().find((m) => m.role === 'user');
      const hit = last ? findStaticReply(last.content) : null;
      if (hit) final = { reply: hit.reply, source: 'static' };
    }
    if (final.source === 'error') {
      const status = final.error === 'upstream_timeout' ? 504 : 502;
      return new Response(
        JSON.stringify({ ...final, remaining: limit.remaining }),
        { status, headers: { 'content-type': 'application/json' } },
      );
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
    return new Response(
      JSON.stringify({
        reply: '服务出错了，请再试一次。',
        source: 'error' as const,
        error: 'internal',
        remaining: limit.remaining,
      }),
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