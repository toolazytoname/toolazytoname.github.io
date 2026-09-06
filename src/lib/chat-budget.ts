import { MAX_BODY_BYTES, MAX_CONTENT_LENGTH, MAX_MESSAGES } from './chat-request';

export type WireMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function payloadBytes(messages: WireMessage[]): number {
  return utf8Bytes(JSON.stringify({ messages }));
}

/** Drop error bubbles and oldest turns until the JSON fits the server byte cap. */
export function budgetChatMessages(
  messages: Array<{ role: 'user' | 'assistant'; content: string; source?: string }>,
  maxBytes = MAX_BODY_BYTES,
): WireMessage[] {
  const lastUserIndex = [...messages]
    .map((m, i) => (m.role === 'user' ? i : -1))
    .filter((i) => i >= 0)
    .at(-1);

  const latest =
    lastUserIndex != null
      ? {
          role: 'user' as const,
          content: messages[lastUserIndex]!.content.slice(0, MAX_CONTENT_LENGTH),
        }
      : null;

  const history: WireMessage[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]!;
    if (i === lastUserIndex) continue;
    if (m.role === 'assistant' && m.source === 'error') continue;
    if (m.role !== 'user' && m.role !== 'assistant') continue;
    history.push({
      role: m.role,
      content: m.content.slice(0, MAX_CONTENT_LENGTH),
    });
  }

  let list = latest ? [...history, latest] : history;
  if (list.length > MAX_MESSAGES) {
    const keepLatest = latest ? 1 : 0;
    list = list.slice(list.length - MAX_MESSAGES);
    if (latest && list.at(-1)?.role !== 'user') {
      list = [...list.slice(keepLatest ? 1 : 0), latest];
    }
  }

  while (list.length > 1 && payloadBytes(list) > maxBytes) {
    if (list[0]?.role === 'assistant') {
      list = list.slice(1);
      continue;
    }
    const drop = list[1]?.role === 'assistant' ? 2 : 1;
    const next = list.slice(drop);
    list = latest && next.at(-1)?.role !== 'user' ? [...next, latest] : next;
  }

  if (latest && payloadBytes(list) > maxBytes) {
    return [latest];
  }
  return list;
}
