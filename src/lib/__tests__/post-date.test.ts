import { expect, it } from 'vitest';
import { postDateLabel } from '../post-date';

it('keeps the published UTC day independent of the local build timezone', () => {
  expect(postDateLabel(new Date('2024-04-30T00:00:00Z'))).toBe('2024-04-30');
  expect(postDateLabel(new Date('2024-12-31T19:00:00-08:00'))).toBe('2025-01-01');
});
