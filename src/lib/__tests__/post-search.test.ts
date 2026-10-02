import { describe, expect, it } from 'vitest';
import { matchesPost, normalizeSearch, readPostFilters, writePostFilters } from '../post-search';

const post = { title: 'Swift 编译器笔记', summary: '从 LLVM 开始', tags: ['iOS'], categories: ['Craft', '工具'] };
describe('archive search', () => {
  it('matches summary, tags and secondary categories', () => {
    for (const query of ['LLVM', 'ios', '工具']) expect(matchesPost(post, { query, category: 'all' })).toBe(true);
    expect(matchesPost(post, { query: '', category: '工具' })).toBe(true);
  });
  it('normalizes full-width Latin and whitespace', () => {
    expect(normalizeSearch(' ＳＷＩＦＴ ')).toBe('swift');
    expect(matchesPost(post, { query: ' ＳＷＩＦＴ   llvm ', category: 'craft' })).toBe(true);
  });
  it('requires all query terms and intersects the category', () => {
    expect(matchesPost(post, { query: 'Swift missing', category: 'all' })).toBe(false);
    expect(matchesPost(post, { query: 'Swift', category: 'life' })).toBe(false);
  });
  it('defaults unknown categories and bounds query length', () => {
    expect(readPostFilters(new URLSearchParams('category=unknown'), ['all', 'craft'])).toEqual({ query: '', category: 'all' });
    expect(readPostFilters(new URLSearchParams({ q: 'x'.repeat(999) }), []).query).toHaveLength(200);
  });
  it('round-trips shareable filters and preserves unrelated URL state', () => {
    const original = new URL('https://example.test/posts/?ref=home#post-results');
    const next = writePostFilters(original, { query: '编译器 & Swift', category: 'craft' });
    expect(readPostFilters(next.searchParams, ['all', 'craft'])).toEqual({ query: '编译器 & Swift', category: 'craft' });
    expect(next.searchParams.get('ref')).toBe('home');
    expect(next.hash).toBe('#post-results');
    expect(original.searchParams.has('q')).toBe(false);
    const clear = writePostFilters(next, { query: ' ', category: 'all' });
    expect(clear.search).toBe('?ref=home');
  });
});
