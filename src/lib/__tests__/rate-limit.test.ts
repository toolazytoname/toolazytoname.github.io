// Unit tests for the in-memory rate limiter.
// We can't easily test Vercel-bound middleware, but the bucket logic is pure.

import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, clientIp } from '../rate-limit';

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