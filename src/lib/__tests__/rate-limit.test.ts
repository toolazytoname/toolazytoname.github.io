// Unit tests for the in-memory rate limiter.
// We can't easily test Vercel-bound middleware, but the bucket logic is pure.

import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, clientIp, createRateLimiter, quotaIp } from '../rate-limit';

describe('rate-limit', () => {
  beforeEach(() => {
    // Module-level buckets persist across tests — no reset hook in the module,
    // so we just use unique IPs per test to avoid cross-contamination.
  });

  it('allows the first request', () => {
    const ip = `test-${Date.now()}-1`;
    const result = rateLimit(ip);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(59);
  });

  it('counts down remaining', () => {
    const ip = `test-${Date.now()}-2`;
    const r1 = rateLimit(ip);
    const r2 = rateLimit(ip);
    expect(r2.remaining).toBe(r1.remaining - 1);
  });

  it('rejects after 60 requests in the window', () => {
    const ip = `test-${Date.now()}-3`;
    for (let i = 0; i < 60; i++) {
      rateLimit(ip);
    }
    const result = rateLimit(ip);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('different IPs do not share buckets', () => {
    const a = `test-${Date.now()}-4a`;
    const b = `test-${Date.now()}-4b`;
    for (let i = 0; i < 60; i++) rateLimit(a);
    const blocked = rateLimit(a);
    const fresh = rateLimit(b);
    expect(blocked.allowed).toBe(false);
    expect(fresh.allowed).toBe(true);
  });
});

describe('clientIp', () => {
  it('extracts first IP from x-forwarded-for', () => {
    const h = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(clientIp(h)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip', () => {
    const h = new Headers({ 'x-real-ip': '10.0.0.1' });
    expect(clientIp(h)).toBe('10.0.0.1');
  });

  it('falls back to anonymous when no headers', () => {
    const h = new Headers();
    expect(clientIp(h)).toBe('anonymous');
  });
});
describe('bounded rate limiter', () => {
  it('resets exactly at the window boundary', () => {
    let time = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 100, now: () => time });
    expect(limiter('a').allowed).toBe(true);
    expect(limiter('a').allowed).toBe(false);
    time = 100;
    expect(limiter('a').allowed).toBe(true);
  });
  it('fails closed at capacity without evicting active clients', () => {
    let time = 0;
    const limiter = createRateLimiter({ limit: 1, maxBuckets: 2, windowMs: 100, now: () => time });
    limiter('a'); limiter('b');
    expect(limiter('c').allowed).toBe(false);
    expect(limiter('a').allowed).toBe(false);
    time = 100;
    expect(limiter('c').allowed).toBe(true);
  });
  it('accepts IPv6 but does not store arbitrary header text', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '2001:db8::1' }))).toBe('2001:db8:0:0::/64');
    expect(clientIp(new Headers({ 'x-forwarded-for': 'invalid'.repeat(100) }))).toBe('anonymous');
  });
});


describe('visitor quota identity', () => {
  it('groups IPv6 privacy addresses and equivalent encodings by /64', () => {
    expect(quotaIp('2001:db8::1')).toBe(quotaIp('2001:0DB8:0000:0000:ffff:abcd:1234:5678'));
    expect(quotaIp('2001:db8:1::1')).not.toBe(quotaIp('2001:db8:2::1'));
  });
  it('does not grant another quota for IPv4-mapped IPv6', () => {
    expect(quotaIp('::ffff:192.0.2.1')).toBe(quotaIp('192.0.2.1'));
    expect(quotaIp('::ffff:c000:201')).toBe('192.0.2.1');
  });
  it('rejects zone identifiers and arbitrary input', () => {
    expect(quotaIp('fe80::1%eth0')).toBe('anonymous');
    expect(quotaIp('not-an-ip')).toBe('anonymous');
  });
});
