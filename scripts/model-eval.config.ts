import { defineConfig } from 'vitest/config';
import base from '../vitest.config.ts';
// Do not merge test.include arrays: this must never accidentally run live tests
// as part of the regular suite, or regular suite mocks in live evaluation.
export default defineConfig({ ...base, test: { include: ['scripts/model-eval.test.ts'], environment: 'node', testTimeout: 70000 } });
