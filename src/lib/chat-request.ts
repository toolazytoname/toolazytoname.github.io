// Runtime validation for POST /api/chat.
// Keep this free of Astro/request types so unit tests can import it.

import type { ChatMessage } from './llm';

export const MAX_MESSAGES = 20;
export const MAX_CONTENT_LENGTH = 4000;
export const MAX_BODY_BYTES = 32_768;

export type ChatRequest = {
  messages: ChatMessage[];
  context?: string;
};

export type ChatParseFailure = {
  ok: false;
  status: 400 | 413;
  error: string;
  reply: string;
};

export type ChatParseSuccess = {
  ok: true;
  data: ChatRequest;
};

export type ChatParseResult = ChatParseSuccess | ChatParseFailure;

const ROLES = new Set<ChatMessage['role']>(['user', 'assistant', 'system']);

function fail(status: 400 | 413, error: string, reply: string): ChatParseFailure {
  return { ok: false, status, error, reply };
}

export function parseChatRequest(body: unknown, bodyBytes?: number): ChatParseResult {
  if (typeof bodyBytes === 'number' && bodyBytes > MAX_BODY_BYTES) {
    return fail(413, 'payload_too_large', '请求太大了。');
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return fail(400, 'invalid_body', '请求格式不对。');
  }

  const rec = body as Record<string, unknown>;

  if (rec.context !== undefined && typeof rec.context !== 'string') {
    return fail(400, 'invalid_context', '请求格式不对。');
  }
  if (typeof rec.context === 'string' && rec.context.length > 2000) {
    return fail(400, 'context_too_long', '请求太大了。');
  }

  if (!Array.isArray(rec.messages)) {
    return fail(400, 'invalid_messages', '请求格式不对。');
  }
  if (rec.messages.length === 0) {
    return fail(400, 'empty_messages', '说点什么吧 :)');
  }
  if (rec.messages.length > MAX_MESSAGES) {
    return fail(400, 'too_many_messages', '消息条数超限。');
  }

  const messages: ChatMessage[] = [];
  for (const item of rec.messages) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      return fail(400, 'invalid_message', '请求格式不对。');
    }
    const msg = item as Record<string, unknown>;
    if (typeof msg.role !== 'string' || !ROLES.has(msg.role as ChatMessage['role'])) {
      return fail(400, 'invalid_role', '请求格式不对。');
    }
    if (typeof msg.content !== 'string') {
      return fail(400, 'invalid_content', '请求格式不对。');
    }
    if (msg.content.length > MAX_CONTENT_LENGTH) {
      return fail(400, 'content_too_long', '单条消息太长了。');
    }
    messages.push({
      role: msg.role as ChatMessage['role'],
      content: msg.content,
    });
  }

  return {
    ok: true,
    data: {
      messages,
      ...(typeof rec.context === 'string' ? { context: rec.context } : {}),
    },
  };
}
