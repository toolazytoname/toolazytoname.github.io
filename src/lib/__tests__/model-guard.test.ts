import { afterEach, describe, expect, it, vi } from 'vitest';
import { reserveModel, RESERVE_MODEL, RELEASE_MODEL } from '../model-guard';
const env = { NODE_ENV: 'production', CHAT_REDIS_REST_URL: 'https://redis.example.test', CHAT_REDIS_REST_TOKEN: 'secret-test-token' };
afterEach(() => vi.restoreAllMocks());
function transport(result: unknown = [0, 0]) { return vi.fn<typeof fetch>().mockResolvedValue(Response.json({ result })); }
describe('shared model protection', () => {
  it('reserves atomically without transmitting raw IP or dialogue and releases once done', async () => {
    const send = transport();
    const lease = await reserveModel('198.51.100.1', env, send);
    expect(lease.allowed).toBe(true);
    const options = send.mock.calls[0]![1]!;
    const args = JSON.parse(options.body as string);
    expect(args.slice(0, 3)).toEqual(['EVAL', RESERVE_MODEL, 4]);
    expect(args.slice(7, 11)).toEqual([60, 40, 1000, 3]);
    expect(options.body).not.toContain('198.51.100.1');
    expect(options.body).not.toContain(env.CHAT_REDIS_REST_TOKEN);
    expect(options.redirect).toBe('error');
    expect(options.signal).toBeInstanceOf(AbortSignal);
    send.mockResolvedValueOnce(Response.json({ result: 1 }));
    if (lease.allowed) await lease.release();
    expect(JSON.parse(send.mock.calls[1]![1]!.body as string)).toEqual(['EVAL', RELEASE_MODEL, 1, args[6], args[11]]);
  });
  it.each([[1, 'model_rate_limited'], [2, 'model_budget'], [3, 'model_capacity']])('maps rejection %s without a retry or release', async (code, error) => {
    const send = transport([code, 60]);
    expect(await reserveModel('anon', env, send)).toEqual({ allowed: false, error, retryAfter: 60 });
    expect(send).toHaveBeenCalledTimes(1);
  });
  it.each([{}, { CHAT_PROTECTION_MODE: 'local' }, { CHAT_MODEL_DAILY: 'NaN' }, { CHAT_MODEL_DAILY: '0' }, { CHAT_REDIS_REST_URL: 'http://unsafe.test' }, { CHAT_GUARD_NAMESPACE: 'bad{slot}' }])('fails closed on missing/unsafe production configuration %j', async (override) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const send = transport();
    const settings = Object.keys(override).length ? { ...env, ...override } : { NODE_ENV: 'production' };
    expect(await reserveModel('anon', settings, send)).toMatchObject({ allowed: false, error: 'model_protection_unavailable' });
    expect(send).not.toHaveBeenCalled();
  });
  it.each([null, [4, 3], [0, -1], [0, 0, 1], ['0', 0], [1, 9999999]])('rejects malformed store result %j', async result => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await reserveModel('anon', env, transport(result))).toMatchObject({ allowed: false });
  });
  it('fails closed on timeout/error without exposing credentials or retrying an uncertain reservation', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const send = vi.fn<typeof fetch>().mockRejectedValue(new Error('secret-test-token raw user data'));
    expect(await reserveModel('anon', env, send)).toMatchObject({ allowed: false });
    expect(send).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(warn.mock.calls)).not.toContain('secret-test-token');
  });
  it('allows local development only, including prevention of local mode on Vercel preview', async () => {
    const send = transport();
    expect((await reserveModel('anon', { NODE_ENV: 'development' }, send)).allowed).toBe(true);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect((await reserveModel('anon', { NODE_ENV: 'development', VERCEL: '1', CHAT_PROTECTION_MODE: 'local' }, send)).allowed).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
});


describe('explicit direct API mode', () => {
  it.each([
    { NODE_ENV: 'production' },
    { NODE_ENV: 'production', VERCEL: '1', VERCEL_ENV: 'preview' },
    { NODE_ENV: 'development' },
  ])('does not call Redis or gateway management endpoints: %j', async settings => {
    const send = transport();
    const lease = await reserveModel('anon', { ...settings, CHAT_PROTECTION_MODE: 'direct' }, send);
    expect(lease.allowed).toBe(true);
    if (lease.allowed) await lease.release();
    expect(send).not.toHaveBeenCalled();
  });
  it('does not silently interpret the removed gateway mode as direct', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const send = transport();
    expect(await reserveModel('anon', { ...env, CHAT_PROTECTION_MODE: 'gateway' }, send)).toMatchObject({ allowed: false });
    expect(send).not.toHaveBeenCalled();
  });
});
