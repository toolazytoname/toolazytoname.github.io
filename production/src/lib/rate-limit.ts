// In-memory IP rate limiter for /api/chat.
// 60 requests / hour / IP. Good enough for a personal site;
// swap for Redis/Upstash when traffic warrants.

type Bucket = {
  count: number;
  resetAt: number; // ms epoch
};

const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 60;

const buckets = new Map<string, Bucket>();

export function rateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: LIMIT - 1, resetAt: now + WINDOW_MS };
  }

  if (bucket.count >= LIMIT) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: LIMIT - bucket.count,
    resetAt: bucket.resetAt,
  };
}

// Best-effort client IP extraction. Vercel sets `x-forwarded-for` on every req.
export function clientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'anonymous'
  );
}

// Periodic cleanup so the Map doesn't grow unbounded in serverless warm starts.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) {
      if (v.resetAt < now) buckets.delete(k);
    }
  }, 5 * 60 * 1000).unref?.();
}