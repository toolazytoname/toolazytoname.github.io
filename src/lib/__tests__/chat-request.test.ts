import { describe, it, expect } from 'vitest';
import {
  MAX_BODY_BYTES,
  MAX_CONTENT_LENGTH,
  MAX_MESSAGES,
  parseChatRequest,
} from '../chat-request';

describe('parseChatRequest', () => {
  it('accepts a normal user message', () => {
    const result = parseChatRequest({
      messages: [{ role: 'user', content: '有哪些项目' }],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.messages).toHaveLength(1);
      expect(result.data.messages[0]?.content).toBe('有哪些项目');
    }
  });

  it('rejects null bodies', () => {
    const result = parseChatRequest(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toBe('invalid_body');
    }
  });

  it('rejects a messages array containing null', () => {
    const result = parseChatRequest({ messages: [null] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toBe('invalid_message');
    }
  });

  it('rejects non-string content', () => {
    const result = parseChatRequest({
      messages: [{ role: 'user', content: 123 }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toBe('invalid_content');
    }
  });

  it('rejects empty messages', () => {
    const result = parseChatRequest({ messages: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toBe('empty_messages');
    }
  });

  it('rejects too many messages', () => {
    const result = parseChatRequest({
      messages: Array.from({ length: MAX_MESSAGES + 1 }, () => ({
        role: 'user',
        content: 'hi',
      })),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toBe('too_many_messages');
    }
  });

  it('rejects oversized single messages', () => {
    const result = parseChatRequest({
      messages: [{ role: 'user', content: 'a'.repeat(MAX_CONTENT_LENGTH + 1) }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toBe('content_too_long');
    }
  });

  it('rejects oversized payloads via content-length', () => {
    const result = parseChatRequest(
      { messages: [{ role: 'user', content: 'ok' }] },
      MAX_BODY_BYTES + 1,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(413);
      expect(result.error).toBe('payload_too_large');
    }
  });

  it('rejects invalid roles', () => {
    const result = parseChatRequest({
      messages: [{ role: 'root', content: 'hi' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('invalid_role');
  });
});
