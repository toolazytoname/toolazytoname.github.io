import { MAX_BODY_BYTES } from './chat-request';

export type ReadBodyResult =
  | { ok: true; text: string; bytes: number }
  | { ok: false; status: 413 | 408; error: 'payload_too_large' | 'request_timeout'; reply: string };

/** Bound both real UTF-8 bytes and total read time, including stalled streams. */
export async function readLimitedText(
  request: Request,
  maxBytes = MAX_BODY_BYTES,
  timeoutMs = 5000,
): Promise<ReadBodyResult> {
  const tooLarge = { ok: false, status: 413, error: 'payload_too_large', reply: '请求太大了。' } as const;
  const declared = request.headers.get('content-length');
  if (declared && /^\d+$/.test(declared) && Number(declared) > maxBytes) {
    void request.body?.cancel().catch(() => undefined);
    return tooLarge;
  }
  const reader = request.body?.getReader();
  if (!reader) return { ok: true, text: '', bytes: 0 };

  const chunks: Uint8Array[] = [];
  let total = 0;
  const timeout = Symbol('body-timeout');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<typeof timeout>((resolve) => {
    timer = setTimeout(() => resolve(timeout), timeoutMs);
  });
  try {
    while (true) {
      const result = await Promise.race([reader.read(), deadline]);
      if (result === timeout) {
        // Do not await cancellation: an untrusted stream can stall that too.
        void reader.cancel().catch(() => undefined);
        return { ok: false, status: 408, error: 'request_timeout', reply: '请求接收超时，请重试。' };
      }
      if (result.done) break;
      total += result.value.byteLength;
      if (total > maxBytes) {
        void reader.cancel().catch(() => undefined);
        return tooLarge;
      }
      chunks.push(result.value);
    }
  } catch {
    void reader.cancel().catch(() => undefined);
    throw new Error('body_read_failed');
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }

  const buf = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, text: new TextDecoder('utf-8', { fatal: true }).decode(buf), bytes: total };
}
