import { budgetChatMessages, type WireMessage } from './chat-budget';

type ReplySource = 'ai' | 'agnes' | 'static' | 'fallback';
export type ChatOutcome =
  | { ok: true; reply: string; source: ReplySource }
  | { ok: false; reply: string; retryable: boolean };

function parsePayload(value: unknown): { reply: string; source: ReplySource | 'error' } | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (typeof data.reply !== 'string' || !data.reply.trim()) return null;
  if (!['ai', 'agnes', 'static', 'fallback', 'error'].includes(String(data.source))) return null;
  return { reply: data.reply.trim(), source: data.source as ReplySource | 'error' };
}

export async function requestChatReply(
  messages: Array<WireMessage & { source?: string }>,
  signal: AbortSignal,
): Promise<ChatOutcome> {
  let wire = budgetChatMessages(messages);
  // One recovery attempt shares the caller's deadline, including body reads.
  for (let attempt = 0; attempt < 2; attempt++) {
    signal.throwIfAborted();
    let res: Response;
    try {
      res = await fetch('/api/chat/', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ messages: wire }),
        cache: 'no-store',
        redirect: 'error',
        signal,
      });
    } catch (error) {
      signal.throwIfAborted();
      if (attempt === 0) continue;
      throw error;
    }

    let payload: unknown = null;
    try { payload = await res.json(); } catch { signal.throwIfAborted(); }
    const parsed = parsePayload(payload);
    if (res.ok && parsed && parsed.source !== 'error') return { ok: true, reply: parsed.reply, source: parsed.source };

    if (res.status === 413 && attempt === 0) {
      const latest = wire.at(-1);
      if (latest?.role === 'user' && wire.length > 1) { wire = [latest]; continue; }
    }

    if (!parsed) {
      console.warn('[chat] invalid_response', {
        status: res.status,
        contentType: res.headers.get('content-type'),
        requestId: res.headers.get('x-chat-request-id'),
      });
      if (attempt === 0 && (res.ok || [502, 503, 504].includes(res.status))) continue;
    }

    return {
      ok: false,
      reply: parsed?.reply ?? (res.status === 429
        ? '请求太快了，过会儿再问。'
        : '这次没能连上问答服务。可以稍后重试，或直接查看 /projects/、/now/ 和 /about/。'),
      retryable: res.status === 429 || res.status >= 500 || res.ok,
    };
  }
  throw new Error('Chat recovery exhausted');
}
