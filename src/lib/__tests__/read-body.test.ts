import { describe, it, expect } from 'vitest';
import { MAX_BODY_BYTES } from '../chat-request';
import { readLimitedText } from '../read-body';
import { llmUnavailableResult } from '../llm';

function requestFrom(text: string, extra?: RequestInit): Request {
  return new Request('http://example.test/api/chat/', {
    method: 'POST',
    body: text,
    ...extra,
  });
}

describe('readLimitedText', () => {
  it('reads a normal JSON body', async () => {
    const body = JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] });
    const result = await readLimitedText(requestFrom(body));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bytes).toBe(new TextEncoder().encode(body).byteLength);
      expect(JSON.parse(result.text).messages[0].content).toBe('hi');
    }
  });

  it('counts UTF-8 bytes for multibyte content', async () => {
    const body = JSON.stringify({ messages: [{ role: 'user', content: '汉'.repeat(100) }] });
    const result = await readLimitedText(requestFrom(body));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bytes).toBe(new TextEncoder().encode(body).byteLength);
    }
  });

  it('rejects a stream larger than the cap', async () => {
    const huge = 'a'.repeat(MAX_BODY_BYTES + 20);
    const result = await readLimitedText(requestFrom(huge));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(413);
  });
});

describe('llmUnavailableResult', () => {
  it('keeps an error source when the model is configured', () => {
    const timeout = llmUnavailableResult(true, 'timeout');
    expect(timeout.source).toBe('error');
    expect(timeout.error).toBe('upstream_timeout');
    const failed = llmUnavailableResult(true, 'failed');
    expect(failed.source).toBe('error');
    expect(failed.error).toBe('upstream_failed');
  });

  it('falls back without pretending to be a static hit when no key', () => {
    const result = llmUnavailableResult(false);
    expect(result.source).toBe('fallback');
  });
});
