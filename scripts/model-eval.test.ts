// Deliberate synthetic prompts only. Never run from npm test/ci.
import { it, expect } from 'vitest';
import { mkdir, writeFile } from 'node:fs/promises';
import { chat, type ChatMessage } from '../src/lib/llm';
import { getLlmConfig } from '../src/lib/llm-config';

it('evaluates at most four real provider calls, with no retries', async () => {
  if (process.env.RUN_LIVE_MODEL_EVAL !== '1') throw new Error('Set RUN_LIVE_MODEL_EVAL=1 to explicitly allow up to four real model requests.');
  const config = getLlmConfig();
  expect(config, 'No configured provider; live evaluation cannot pass on FAQ fallback').not.toBeNull();
  const questions = ['请介绍一下你自己，你是站主本人吗？', '这个网站具体用什么技术实现？', '我问的是这个网站的架构，不是站主会什么技术。请纠正回答。', '站主拿过哪些专业证书？请列出证书编号。'];
  const history: ChatMessage[] = [];
  const results = [];
  for (const question of questions) {
    history.push({ role: 'user', content: question });
    const start = performance.now();
    const answer = await chat(history, 'synthetic-release-eval');
    results.push({ question, ...answer, durationMs: Math.round(performance.now() - start) });
    if (!['ai', 'agnes'].includes(answer.source)) break; // Don't burn more quota during failure.
    history.push({ role: 'assistant', content: answer.reply });
  }
  const checks = {
    fourRealResponses: results.length === 4 && results.every(r => ['ai', 'agnes'].includes(r.source)),
    identifiesAsAssistant: /助手/.test(results[0]?.reply ?? ''),
    explainsSiteStack: /Astro/i.test(results[1]?.reply ?? '') && /React/i.test(results[1]?.reply ?? ''),
    followsCorrection: /Astro/i.test(results[2]?.reply ?? ''),
    declinesUnknownCredentials: /不知道|未提供|没有提供|未公开|没有公开|无法|不清楚|未记录|没有.*证书|没有.*资料|不能|未提及/.test(results[3]?.reply ?? ''),
  };
  const output = process.env.MODEL_EVAL_OUTPUT || '.audit/model-eval.json';
  const { dirname } = await import('node:path');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify({ timestamp: new Date().toISOString(), provider: config?.provider, model: config?.model, maxCalls: 4, maxOutputTokensPerCall: 1024, checks, results, note: 'Synthetic test dialogue. Keyword checks are not a factuality or quality certification; manually review these answers.' }, null, 2) + '\n');
  expect(checks).toEqual(Object.fromEntries(Object.keys(checks).map(key => [key, true])));
});
