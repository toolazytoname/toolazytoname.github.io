/** Shared, deterministic archive filtering. No network or full-text index needed. */
export type PostSearchEntry = {
  title: string;
  summary: string;
  tags: string[];
  categories: string[];
};
export type PostFilters = { query: string; category: string };

export function normalizeSearch(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('zh-CN').trim();
}

export function matchesPost(entry: PostSearchEntry, filters: PostFilters): boolean {
  const categories = entry.categories.map(normalizeSearch);
  if (filters.category !== 'all' && !categories.includes(normalizeSearch(filters.category))) return false;
  const text = normalizeSearch([entry.title, entry.summary, ...entry.tags, ...categories].join(' '));
  return normalizeSearch(filters.query).split(/\s+/u).filter(Boolean).every((term) => text.includes(term));
}

export function readPostFilters(params: URLSearchParams, categories: string[]): PostFilters {
  const category = normalizeSearch(params.get('category') ?? 'all');
  return {
    query: (params.get('q') ?? '').slice(0, 200),
    category: categories.includes(category) ? category : 'all',
  };
}

export function writePostFilters(url: URL, filters: PostFilters): URL {
  const next = new URL(url);
  const query = filters.query.trim();
  if (query) next.searchParams.set('q', query);
  else next.searchParams.delete('q');
  if (filters.category !== 'all') next.searchParams.set('category', filters.category);
  else next.searchParams.delete('category');
  return next;
}
