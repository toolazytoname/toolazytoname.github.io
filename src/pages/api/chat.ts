// POST /api/chat
// Body: { messages: [{role, content}] }
// Response: { reply: string, source: ChatResult['source'], remaining?: number }

import type { APIRoute } from 'astro';
import { chat, type ChatResult } from '@lib/llm';
import { parseChatRequest } from '@lib/chat-request';
import { readLimitedText } from '@lib/read-body';
import { rateLimit, clientIp } from '@lib/rate-limit';

export const prerender = false;

const handlePost: APIRoute = async ({ request }) => {
  // Reject browser cross-origin and form submissions before spending model quota.
  // Origin is not authentication: non-browser callers still need rate limiting.
  const origin = request.headers.get('origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
    return Response.json({ reply: '请从本站发送问题。', source: 'error', error: 'origin_not_allowed' }, { status: 403 });
  }
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    return Response.json({ reply: '请使用 JSON 格式发送问题。', source: 'error', error: 'unsupported_media_type' }, { status: 415 });
  }
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
    const result: ChatResult = await chat(messages, ip);
    const final: ChatResult = result;
    if (final.source === 'error') {
      const status = final.error === 'upstream_timeout' ? 504
        : ['model_rate_limited', 'model_budget'].includes(final.error ?? '') ? 429
        : ['model_capacity', 'model_protection_unavailable'].includes(final.error ?? '') ? 503 : 502;
      return new Response(
        JSON.stringify({ ...final, remaining: limit.remaining }),
        { status, headers: { 'content-type': 'application/json', ...(final.retryAfter ? { 'retry-after': String(final.retryAfter) } : {}) } },
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
    console.error('[api/chat] unexpected error', { name: err instanceof Error ? err.name : 'unknown' });
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

export const POST: APIRoute = async (context) => {
  const requestId = crypto.randomUUID();
  const response = await handlePost(context);
  response.headers.set('cache-control', 'no-store');
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('x-chat-request-id', requestId);
  if (response.status >= 500) console.warn('[chat] request_failed', { requestId, status: response.status });
  return response;
};

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      reply: '请通过聊天输入框发送问题。',
      source: 'error',
      error: 'method_not_allowed',
    }),
    { status: 405, headers: { 'content-type': 'application/json', allow: 'POST', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } },
  );

// Astro uses ALL for any method without an explicit handler.
export const ALL = GET;
