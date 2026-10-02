import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL, GET, POST } from '../../pages/api/chat';

const chat = vi.hoisted(() => vi.fn());
vi.mock('../llm', () => ({ chat }));
beforeEach(() => { chat.mockReset(); vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => vi.restoreAllMocks());

async function post(body: unknown) {
  const request = new Request('https://example.test/api/chat/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return POST({ request } as Parameters<typeof POST>[0]);
}

describe('chat API contract', () => {
  it('returns a noncached model answer and a diagnostic request ID', async () => {
    chat.mockResolvedValue({ reply: 'Astro + React on Vercel', source: 'ai' });
    const response = await post({ messages: [{ role: 'user', content: '网站用什么做的' }] });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-chat-request-id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(await response.json()).toMatchObject({ reply: 'Astro + React on Vercel', source: 'ai' });
  });

  it.each([['upstream_empty', 502], ['upstream_timeout', 504], ['model_budget', 429], ['model_rate_limited', 429], ['model_capacity', 503], ['model_protection_unavailable', 503]])('preserves %s as a JSON error', async (error, status) => {
    chat.mockResolvedValue({ reply: '稍后再试', source: 'error', error, retryAfter: 30 });
    const response = await post({ messages: [{ role: 'user', content: '追问' }] });
    expect(response.status).toBe(status);
    expect(response.headers.get('retry-after')).toBe('30');
    expect(await response.json()).toMatchObject({ reply: '稍后再试', source: 'error', error, retryAfter: 30 });
  });

  it('rejects malformed input before invoking the model', async () => {
    const response = await post({ messages: [null] });
    expect(response.status).toBe(400);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(chat).not.toHaveBeenCalled();
  });

  it('does not report GET as a successful chat response', async () => {
    const response = await GET({} as Parameters<typeof GET>[0]);
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
    expect(await response.json()).toMatchObject({ source: 'error', error: 'method_not_allowed' });
  });
});

describe('chat API request boundaries', () => {
  const body = JSON.stringify({ messages: [{ role: 'user', content: '你好' }] });
  it.each([
    [{ 'content-type': 'text/plain' }, 415],
    [{ 'content-type': 'application/json', origin: 'https://other.test' }, 403],
    [{ 'content-type': 'application/json', origin: 'null' }, 403],
    [{ 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' }, 403],
  ])('rejects unsafe headers %j before model invocation', async (headers, status) => {
    const request = new Request('https://example.test/api/chat/', { method: 'POST', headers, body });
    const response = await POST({ request } as Parameters<typeof POST>[0]);
    expect(response.status).toBe(status);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(chat).not.toHaveBeenCalled();
  });
  it('accepts same-origin JSON with charset', async () => {
    chat.mockResolvedValue({ reply: '你好', source: 'static' });
    const request = new Request('https://example.test/api/chat/', { method: 'POST', body,
      headers: { origin: 'https://example.test', 'content-type': 'application/json; charset=utf-8' } });
    expect((await POST({ request } as Parameters<typeof POST>[0])).status).toBe(200);
  });
  it('rejects malformed JSON', async () => {
    const request = new Request('https://example.test/api/chat/', { method: 'POST', body: '{', headers: { 'content-type': 'application/json' } });
    const response = await POST({ request } as Parameters<typeof POST>[0]);
    expect(response.status).toBe(400);
    expect(chat).not.toHaveBeenCalled();
  });
  it('rejects oversized bodies before invoking the model', async () => {
    const response = await post({ messages: [{ role: 'user', content: 'a'.repeat(70000) }] });
    expect(response.status).toBe(413);
    expect(chat).not.toHaveBeenCalled();
  });
  it('uses the same method contract for unsupported methods', async () => {
    expect((await ALL({} as Parameters<typeof ALL>[0])).status).toBe(405);
  });
});
