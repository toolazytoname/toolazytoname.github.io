import snapshot from '@data/external-link-health.json';
const records: Record<string, { status: number; checkedAt: string }> = snapshot;
// Snapshot of public HTTP availability only: a 404 may also mean a private repo.
// Do not infer project status/ownership or permanently remove the source URL.
export function unavailableLink(url: string | undefined) {
  if (!url) return undefined;
  return records[url] ?? records[url.replace(/\/$/, '')] ?? records[url + '/'];
}
