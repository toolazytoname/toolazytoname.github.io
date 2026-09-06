export type RetryMessage = {
  role: 'user' | 'assistant';
  retryable?: boolean;
  retryText?: string;
  content: string;
};

/** Only the last message may be retried. Later successful turns hide old retry. */
export function lastRetryIndex(messages: Array<{ retryable?: boolean }>): number {
  if (messages.length === 0) return -1;
  const last = messages.length - 1;
  return messages[last]?.retryable ? last : -1;
}

export function historyBeforeRetry<T extends RetryMessage>(
  messages: T[],
  index: number,
): { history: T[]; text: string } | null {
  if (index !== messages.length - 1) return null;
  const err = messages[index];
  if (!err?.retryable) return null;
  const user = messages[index - 1];
  const text = err.retryText ?? (user?.role === 'user' ? user.content : '');
  if (!text) return null;
  const cut = user?.role === 'user' ? index - 1 : index;
  return { history: messages.slice(0, cut), text };
}
