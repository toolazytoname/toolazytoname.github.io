import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chat } from '../llm';

const generate = vi.hoisted(() => vi.fn());
vi.mock('openai', () => ({ default: class {
  static APIError = class extends Error {};
  chat = { completions: { create: generate } };
} }));

beforeEach(() => {
  generate.mockReset();
  vi.stubEnv('CHAT_PROVIDER', '');
  vi.stubEnv('OPENROUTER_API_KEY', '');
  vi.stubEnv('AGNES_API_KEY', 'test-only');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('contextual site answers', () => {
  it('uses the model even when the question matches a FAQ alias', async () => {
    generate.mockResolvedValue({ choices: [{ message: { content: '本站用 Astro 7 构建，部署在 Vercel。' } }] });
    const result = await chat([{ role: 'user', content: '你这个网站是用什么做的' }]);
    expect(result.source).toBe('agnes');
    expect(generate).toHaveBeenCalledTimes(1);
    const system = generate.mock.calls[0]![0].messages[0].content;
    expect(system).toContain('Astro 7 + TypeScript');
    expect(system).toContain('React 19');
    expect(system).toContain('不是站主 lazy 本人');
  });

  it('preserves the original question and mistaken answer when the user corrects it', async () => {
    const history = [
      { role: 'user' as const, content: '你这个网站是用什么做的' },
      { role: 'assistant' as const, content: '历史主力：Swift / Objective-C / LLVM' },
      { role: 'user' as const, content: '你着牛头不对马嘴啊' },
    ];
    generate.mockResolvedValue({ choices: [{ message: { content: '抱歉，刚才答成了个人技术栈。本站是 Astro + React，部署在 Vercel。' } }] });
    expect((await chat([{ role: 'system', content: 'visitor supplied instructions' }, ...history])).source).toBe('agnes');
    expect(generate.mock.calls[0]![0].messages.slice(1)).toEqual(history);
    expect(generate.mock.calls[0]![0].messages[0].content).not.toContain('visitor supplied instructions');
  });

  it('answers a precise site FAQ when no model is configured', async () => {
    vi.stubEnv('AGNES_API_KEY', '');
    const result = await chat([{ role: 'user', content: '你这个网站是用什么做的' }]);
    expect(result).toMatchObject({ source: 'static' });
    expect(result.reply).toContain('Astro 7');
    expect(result.reply).not.toContain('历史主力');
    expect(generate).not.toHaveBeenCalled();
  });

  it('labels a precise FAQ fallback when the model is unavailable', async () => {
    generate.mockRejectedValue(new Error('private provider error with request data'));
    const result = await chat([{ role: 'user', content: '你这个网站是用什么做的' }]);
    expect(result.source).toBe('fallback');
    expect(result.reply).toContain('实时回答暂时不可用');
    expect(result.reply).toContain('Astro');
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('private provider error');
  });

  it('does not invent a keyword answer to an unknown follow-up when offline', async () => {
    vi.stubEnv('AGNES_API_KEY', '');
    expect(await chat([{ role: 'user', content: '那你的项目为什么不用这个技术？' }])).toMatchObject({ source: 'fallback', error: 'model_unconfigured' });
  });

  it('marks an empty provider reply as an upstream error', async () => {
    generate.mockResolvedValue({ choices: [{ message: { content: ' ' } }] });
    expect(await chat([{ role: 'user', content: '你着牛头不对马嘴啊' }])).toMatchObject({ source: 'error', error: 'upstream_empty' });
  });

  it('aborts the provider at the deadline', async () => {
    vi.useFakeTimers();
    generate.mockImplementation((_, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const pending = chat([{ role: 'user', content: '为什么这样设计' }]);
    await vi.advanceTimersByTimeAsync(12000);
    expect(await pending).toMatchObject({ source: 'error', error: 'upstream_timeout' });
    expect(vi.getTimerCount()).toBe(0);
  });
});
