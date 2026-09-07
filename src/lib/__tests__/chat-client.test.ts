import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestChatReply } from '../chat-client';

const history = [
  { role: 'user' as const, content: '你这个网站是用什么做的' },
  { role: 'assistant' as const, content: '历史主力：Swift / Objective-C / LLVM' },
  { role: 'user' as const, content: '你着牛头不对马嘴啊' },
];
const success = () => Response.json({ reply: '本站用 Astro + React，部署在 Vercel。', source: 'agnes' });
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('chat transport recovery', () => {
  it.each([
    ['gateway HTML', () => new Response('<html>Bad gateway</html>', { status: 502 })],
    ['HTML with 200', () => new Response('<html>Proxy page</html>')],
    ['empty JSON', () => Response.json({})],
    ['wrong route JSON', () => Response.json({ ok: true, hint: 'POST here' })],
    ['blank reply', () => Response.json({ reply: '  ', source: 'agnes' })],
  ])('recovers once from %s without dropping conversation', async (_, response) => {
    fetchMock.mockResolvedValueOnce(response()).mockResolvedValueOnce(success());
    const result = await requestChatReply(history, new AbortController().signal);
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [, init] of fetchMock.mock.calls) {
      expect(JSON.parse(String(init?.body)).messages).toEqual(history);
      expect(init?.method).toBe('POST');
      expect(init?.cache).toBe('no-store');
    }
  });

  it('caps repeated gateway failures and never calls them empty model replies', async () => {
    fetchMock.mockImplementation(async () => new Response('<html>502</html>', { status: 502 }));
    const result = await requestChatReply(history, new AbortController().signal);
    expect(result).toMatchObject({ ok: false, retryable: true });
    expect(result.reply).toContain('问答服务');
    expect(result.reply).not.toContain('空回复');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(history[0]!.content);
  });

  it('does not multiply model requests for an explicit upstream error', async () => {
    fetchMock.mockResolvedValue(Response.json({ reply: '模型暂时不可用', source: 'error' }, { status: 502 }));
    expect(await requestChatReply(history, new AbortController().signal)).toMatchObject({ ok: false, reply: '模型暂时不可用' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([400, 413, 429])('does not repeat a single-message %s error unchanged', async status => {
    fetchMock.mockResolvedValue(Response.json({ reply: '请求被拒绝', source: 'error' }, { status }));
    await requestChatReply([history[2]!], new AbortController().signal);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reduces a 413 retry to the latest question', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ reply: '太大', source: 'error' }, { status: 413 })).mockResolvedValueOnce(success());
    expect((await requestChatReply(history, new AbortController().signal)).ok).toBe(true);
    expect(JSON.parse(String(fetchMock.mock.calls[1]![1]?.body)).messages).toEqual([history[2]]);
  });

  it('does not retry after the caller deadline expires', async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(async () => { controller.abort(); throw new DOMException('Aborted', 'AbortError'); });
    await expect(requestChatReply(history, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
