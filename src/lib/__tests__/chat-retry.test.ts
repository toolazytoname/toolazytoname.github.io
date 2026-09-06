import { describe, it, expect } from 'vitest';
import { historyBeforeRetry, lastRetryIndex, type RetryMessage } from '../chat-retry';

describe('lastRetryIndex', () => {
  it('only retries when the last message is the error', () => {
    expect(lastRetryIndex([{ retryable: true }, { retryable: false }])).toBe(-1);
    expect(lastRetryIndex([{ retryable: false }, { retryable: true }])).toBe(1);
  });
});

describe('historyBeforeRetry', () => {
  const greeting = { role: 'assistant' as const, content: 'hi' };
  const userA = { role: 'user' as const, content: '苹果甲' };
  const errA = {
    role: 'assistant' as const,
    content: '服务暂时不可用',
    retryable: true,
    retryText: '苹果甲',
  };
  const userB = { role: 'user' as const, content: '有哪些项目' };
  const okB = { role: 'assistant' as const, content: '完整列表在 /projects/' };

  it('refuses to retry an old error after a later success', () => {
    const messages: RetryMessage[] = [greeting, userA, errA, userB, okB];
    expect(historyBeforeRetry(messages, 2)).toBeNull();
    expect(lastRetryIndex(messages)).toBe(-1);
  });

  it('retries only the trailing failure and keeps earlier turns', () => {
    const messages: RetryMessage[] = [greeting, userB, okB, userA, errA];
    const prepared = historyBeforeRetry(messages, 4);
    expect(prepared).not.toBeNull();
    expect(prepared?.text).toBe('苹果甲');
    expect(prepared?.history).toEqual([greeting, userB, okB]);
  });
});
