import { MAX_BODY_BYTES } from './chat-request';

export type ReadBodyResult =
  | { ok: true; text: string; bytes: number }
  | { ok: false; status: 413; error: 'payload_too_large'; reply: string };

/** Read a Request body while counting real UTF-8 bytes. Stop past maxBytes. */
export async function readLimitedText(
  request: Request,
  maxBytes = MAX_BODY_BYTES,
): Promise<ReadBodyResult> {
  const reader = request.body?.getReader();
  if (!reader) {
    return { ok: true, text: '', bytes: 0 };
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return {
          ok: false,
          status: 413,
          error: 'payload_too_large',
          reply: '请求太大了。',
        };
      }
      chunks.push(value);
    }
  } catch {
    await reader.cancel().catch(() => undefined);
    throw new Error('body_read_failed');
  }

  const buf = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, text: new TextDecoder().decode(buf), bytes: total };
}
