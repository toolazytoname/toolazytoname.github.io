import { describe, it, expect } from 'vitest';
import { MAX_BODY_BYTES } from '../chat-request';
import { budgetChatMessages, payloadBytes } from '../chat-budget';

describe('budgetChatMessages', () => {
  it('keeps a short exchange under the cap', () => {
    const out = budgetChatMessages([
      { role: 'user', content: '有哪些项目' },
      { role: 'assistant', content: '完整列表在 /projects/', source: 'static' },
    ]);
    expect(out.at(-1)?.content).toBe('有哪些项目');
    expect(payloadBytes(out)).toBeLessThanOrEqual(MAX_BODY_BYTES);
  });

  it('drops oldest turns so three 4000-han messages still send', () => {
    const han = '汉'.repeat(4000);
    const out = budgetChatMessages([
      { role: 'user', content: han },
      { role: 'assistant', content: '收到 1' },
      { role: 'user', content: han },
      { role: 'assistant', content: '收到 2' },
      { role: 'user', content: han },
    ]);
    expect(out.at(-1)?.content).toBe(han);
    expect(payloadBytes(out)).toBeLessThanOrEqual(MAX_BODY_BYTES);
    expect(out.filter((m) => m.role === 'user').length).toBeLessThan(3);
  });

  it('omits error bubbles from the wire payload', () => {
    const out = budgetChatMessages([
      { role: 'user', content: '苹果' },
      { role: 'assistant', content: '出错了', source: 'error' },
      { role: 'user', content: '有哪些项目' },
    ]);
    expect(out.some((m) => m.content === '出错了')).toBe(false);
    expect(out.at(-1)?.content).toBe('有哪些项目');
  });
});
