import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../../pages/api/chat';

const chat = vi.hoisted(() => vi.fn());
vi.mock('../llm', () => ({ chat }));
beforeEach(() => { chat.mockReset(); vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => vi.restoreAllMocks());

async function post(body: unknown) {
  const request = new Request('https://example.test/api/chat/', { method: 'POST', body: JSON.stringify(body) });
  return POST({ request } as Parameters<typeof POST>[0]);
}

describe('chat API contract', () => {
  it('returns a noncached model answer and a diagnostic request ID', async () => {
    chat.mockResolvedValue({ reply: 'Astro + React on Vercel', source: 'agnes' });
    const response = await post({ messages: [{ role: 'user', content: '网站用什么做的' }] });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-chat-request-id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(await response.json()).toMatchObject({ reply: 'Astro + React on Vercel', source: 'agnes' });
  });

  it.each([['upstream_empty', 502], ['upstream_timeout', 504]])('preserves %s as a JSON error', async (error, status) => {
    chat.mockResolvedValue({ reply: '稍后再试', source: 'error', error });
    const response = await post({ messages: [{ role: 'user', content: '追问' }] });
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ reply: '稍后再试', source: 'error', error });
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
