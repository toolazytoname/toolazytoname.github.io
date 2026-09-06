/** Pull the failed module URL out of a browser import() error. */
export function moduleUrlFromError(err: unknown): string | null {
  const text = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err);
  const match = text.match(/https?:\/\/[^\s)'"<>]+?\.(?:m?js)/i);
  if (!match?.[0]) return null;
  return match[0].replace(/[.,;]+$/, '');
}

export function cacheBustedUrl(url: string, now = Date.now()): string {
  const parsed = new URL(url);
  parsed.searchParams.set('retry', String(now));
  return parsed.href;
}
