type LlmConfig = {
  provider: 'agnes' | 'openrouter' | 'compatible';
  apiKey: string;
  baseURL: string;
  model: string;
  routing?: {
    models: string[];
    provider: { max_price: { prompt: number; completion: number; request: number }; allow_fallbacks: boolean };
    reasoning: { enabled: boolean };
  };
};

// Read at request time: deployment secrets never enter the browser bundle.
export function getLlmConfig(): LlmConfig | null {
  const env = process.env;
  const provider = env.CHAT_PROVIDER?.trim() || (env.OPENROUTER_API_KEY?.trim() ? 'openrouter' : 'agnes');
  if (provider === 'openrouter') {
    const apiKey = env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) throw new Error('missing_openrouter_key');
    const models = (env.OPENROUTER_MODELS ?? 'google/gemma-4-31b-it:free,openrouter/free').split(',').map(m => m.trim());
    if (models.length > 3 || models.some(m => m !== 'openrouter/free' && !/^[a-z0-9._-]+\/[a-z0-9._-]+:free$/i.test(m))) {
      throw new Error('invalid_free_models');
    }
    return {
      provider, apiKey, baseURL: 'https://openrouter.ai/api/v1', model: models[0]!,
      routing: {
        models: [...new Set(models)],
        provider: { max_price: { prompt: 0, completion: 0, request: 0 }, allow_fallbacks: true },
        reasoning: { enabled: false },
      },
    };
  }
  if (provider === 'compatible') {
    const apiKey = env.LLM_API_KEY?.trim();
    const model = env.LLM_MODEL?.trim();
    if (!apiKey || !model || !env.LLM_BASE_URL?.trim()) throw new Error('missing_gateway_config');
    const url = new URL(env.LLM_BASE_URL.trim());
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) {
      throw new Error('invalid_gateway_url');
    }
    return { provider, apiKey, model, baseURL: url.href.replace(/\/$/, '') };
  }
  if (provider !== 'agnes') throw new Error('invalid_chat_provider');
  const apiKey = env.AGNES_API_KEY?.trim();
  if (!apiKey) {
    if (env.CHAT_PROVIDER?.trim()) throw new Error('missing_agnes_key');
    return null;
  }
  return { provider, apiKey, baseURL: 'https://apihub.agnes-ai.com/v1', model: 'agnes-2.0-flash' };
}
