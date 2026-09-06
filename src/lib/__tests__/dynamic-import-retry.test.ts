import { describe, it, expect } from 'vitest';
import { cacheBustedUrl, moduleUrlFromError } from '../dynamic-import-retry';

describe('moduleUrlFromError', () => {
  it('reads Chrome’s failed dynamic import message', () => {
    const err = new TypeError(
      'Failed to fetch dynamically imported module: http://127.0.0.1:4173/_astro/mount-chat.B1BQZ8R2.js',
    );
    expect(moduleUrlFromError(err)).toBe(
      'http://127.0.0.1:4173/_astro/mount-chat.B1BQZ8R2.js',
    );
  });

  it('returns null when the engine omits the URL', () => {
    expect(moduleUrlFromError(new TypeError('Importing a module script failed.'))).toBeNull();
  });
});

describe('cacheBustedUrl', () => {
  it('adds a retry query so the browser will fetch again', () => {
    expect(cacheBustedUrl('http://127.0.0.1:4173/_astro/mount-chat.B1BQZ8R2.js', 123)).toBe(
      'http://127.0.0.1:4173/_astro/mount-chat.B1BQZ8R2.js?retry=123',
    );
  });
});
