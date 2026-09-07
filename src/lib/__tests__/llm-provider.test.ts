import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chat } from '../llm';
import { getLlmConfig } from '../llm-config';

const transport = vi.hoisted(() => vi.fn());
// Exercise the real SDK's request serialization without calling a paid service.
vi.mock('openai', async importOriginal => {
  const { default: OpenAI } = await importOriginal<typeof import('openai')>();
  return { default: class extends OpenAI {
    constructor(options: ConstructorParameters<typeof OpenAI>[0]) {
      super({ ...options, fetch: transport });
    }
  } };
});

beforeEach(() => {
  transport.mockReset();
  for (const key of ['CHAT_PROVIDER', 'OPENROUTER_API_KEY', 'AGNES_API_KEY', 'LLM_API_KEY', 'LLM_BASE_URL', 'LLM_MODEL']) vi.stubEnv(key, '');
  vi.stubEnv('OPENROUTER_MODELS', undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.useRealTimers(); });

const question = [{ role: 'user' as const, content: '为什么这样设计？' }];
const answer = async () => new Response(JSON.stringify({ choices: [{ message: { content: '本站用 Astro 构建。' } }] }), {
  headers: { 'content-type': 'application/json' },
});

describe('free model routing', () => {
  it('serializes free-only fallback candidates and the full conversation through the real SDK', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-router-key');
    vi.stubEnv('AGNES_API_KEY', 'old-provider-key');
    transport.mockImplementation(answer);
    const history = [
      { role: 'user' as const, content: '你这个网站是用什么做的' },
      { role: 'assistant' as const, content: 'Swift / LLVM' },
      { role: 'user' as const, content: '你着牛头不对马嘴啊' },
    ];
    expect(await chat(history)).toMatchObject({ source: 'ai', reply: '本站用 Astro 构建。' });
    expect(transport).toHaveBeenCalledTimes(1);
    const [url, init] = transport.mock.calls[0]!;
    expect(String(url)).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer test-router-key');
    const body = JSON.parse(init.body);
    expect(body.models).toEqual(['google/gemma-4-31b-it:free', 'openrouter/free']);
    expect(body.provider).toEqual({ max_price: { prompt: 0, completion: 0, request: 0 }, allow_fallbacks: true });
    expect(body.reasoning).toEqual({ enabled: false });
    expect(body.messages.slice(1)).toEqual(history);
    expect(body.messages[0].content).toContain('不是站主 lazy 本人');
  });

  it.each(['openai/gpt-5', 'openrouter/auto', 'google/gemma:free:online', '', 'openrouter/free,', 'openrouter/free,openrouter/free,openrouter/free,openrouter/free'])('rejects unsafe or invalid model lists: %s', async models => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-router-key');
    vi.stubEnv('OPENROUTER_MODELS', models);
    vi.stubEnv('AGNES_API_KEY', 'old-provider-key');
    expect(await chat(question)).toMatchObject({ source: 'error', error: 'model_config_invalid' });
    expect(transport).not.toHaveBeenCalled();
  });

  it('accepts a single free router and deduplicates configured models', () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-router-key');
    vi.stubEnv('OPENROUTER_MODELS', ' openrouter/free,openrouter/free ');
    expect(getLlmConfig()?.routing?.models).toEqual(['openrouter/free']);
  });

  it.each([401, 429, 503])('does not retry or switch to Agnes when OpenRouter returns %s', async status => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-router-key');
    vi.stubEnv('AGNES_API_KEY', 'old-provider-key');
    transport.mockResolvedValue(new Response(JSON.stringify({ error: { message: 'private upstream details' } }), {
      status, headers: { 'content-type': 'application/json' },
    }));
    expect(await chat(question)).toMatchObject({ source: 'error', error: 'upstream_failed' });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('private upstream details');
  });

  it('keeps empty model responses as errors and provides a labeled exact FAQ fallback', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-router-key');
    transport.mockImplementation(async () => new Response(JSON.stringify({ choices: [{ message: { content: null } }] }), {
      headers: { 'content-type': 'application/json' },
    }));
    expect(await chat(question)).toMatchObject({ error: 'upstream_empty' });
    expect(await chat([{ role: 'user', content: '你这个网站是用什么做的' }])).toMatchObject({ source: 'fallback', reply: expect.stringContaining('实时回答暂时不可用') });
  });

  it('aborts the entire routed request within the existing deadline', async () => {
    vi.useFakeTimers();
    vi.stubEnv('OPENROUTER_API_KEY', 'test-router-key');
    transport.mockImplementation((_, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const pending = chat(question);
    await vi.advanceTimersByTimeAsync(12000);
    expect(await pending).toMatchObject({ error: 'upstream_timeout' });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('provider configuration', () => {
  it('preserves no-key FAQs and legacy Agnes configuration', () => {
    expect(getLlmConfig()).toBeNull();
    vi.stubEnv('AGNES_API_KEY', 'legacy-key');
    expect(getLlmConfig()).toMatchObject({ provider: 'agnes' });
    vi.stubEnv('OPENROUTER_API_KEY', 'test-router-key');
    vi.stubEnv('CHAT_PROVIDER', 'agnes');
    expect(getLlmConfig()).toMatchObject({ provider: 'agnes' });
  });

  it.each(['openrouter', 'compatible', 'typo'])('does not silently use Agnes with invalid explicit %s configuration', async provider => {
    vi.stubEnv('CHAT_PROVIDER', provider);
    vi.stubEnv('AGNES_API_KEY', 'legacy-key');
    expect(await chat(question)).toMatchObject({ error: 'model_config_invalid' });
    expect(transport).not.toHaveBeenCalled();
  });

  it('connects a compatible gateway with its own key and routing model', async () => {
    vi.stubEnv('CHAT_PROVIDER', 'compatible');
    vi.stubEnv('LLM_BASE_URL', 'https://gateway.example/v1/');
    vi.stubEnv('LLM_API_KEY', 'gateway-key');
    vi.stubEnv('LLM_MODEL', 'free-route');
    vi.stubEnv('OPENROUTER_API_KEY', 'other-key');
    transport.mockImplementation(answer);
    expect(await chat(question)).toMatchObject({ source: 'ai' });
    const [url, init] = transport.mock.calls[0]!;
    expect(String(url)).toBe('https://gateway.example/v1/chat/completions');
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer gateway-key');
    expect(JSON.parse(init.body)).toMatchObject({ model: 'free-route' });
    expect(JSON.parse(init.body)).not.toHaveProperty('provider');
  });

  it.each(['http://gateway.example/v1', 'https://user:secret@gateway.example/v1', 'https://gateway.example/v1?key=secret', 'not a URL'])('rejects invalid gateway URLs without leaking them: %s', async url => {
    vi.stubEnv('CHAT_PROVIDER', 'compatible');
    vi.stubEnv('LLM_BASE_URL', url);
    vi.stubEnv('LLM_API_KEY', 'private-key');
    vi.stubEnv('LLM_MODEL', 'free-route');
    expect(await chat(question)).toMatchObject({ error: 'model_config_invalid' });
    expect(transport).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(url);
  });
});
