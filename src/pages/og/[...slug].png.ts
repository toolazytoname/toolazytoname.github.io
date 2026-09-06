/**
 * Per-post OG image generator using Satori + Resvg.
 *
 * Generates a 1200×630 black & white card with the post title, date,
 * and site branding. Fonts are fetched from Google Fonts CDN on demand and
 * cached in-memory for the lifetime of the serverless instance.
 *
 * NOTE: CJK title support requires downloading a CJK font (~2MB TTF).
 * If the download fails, Chinese characters may render as tofu (□).
 * TODO: bundle a CJK font locally for reliable offline builds.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import type { SatoriOptions } from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getCollection } from 'astro:content';
import { postSlug } from '@lib/permalink';

// Do not make the site build depend on a third-party font CDN.
export const prerender = false;

// ---------------------------------------------------------------------------
// Font loading (cached once per build)
// ---------------------------------------------------------------------------

let _fonts: SatoriOptions['fonts'] | null = null;

async function loadFonts(): Promise<SatoriOptions['fonts']> {
  if (_fonts) return _fonts;

  const fonts: SatoriOptions['fonts'] = [];

  // --- Inter (Latin) ---
  try {
    const cssUrl =
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap';
    const cssRes = await fetch(cssUrl, { signal: AbortSignal.timeout(5000) });
    if (!cssRes.ok) throw new Error(`Font CSS ${cssRes.status}`);
    const css = await cssRes.text();

    // Extract all unique woff2 URLs
    const urlSet = new Set<string>();
    const re = /url\((?:'|")?([^'")]+\.woff2)(?:'|")?\)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(css)) !== null) {
      const raw = m[1];
      if (!raw) continue;
      const u = raw.startsWith('//') ? `https:${raw}` : raw;
      urlSet.add(u);
    }

    for (const u of urlSet) {
      const r = await fetch(u, { signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const buf = await r.arrayBuffer();
        fonts.push({
          name: 'Inter',
          data: Buffer.from(buf),
          weight: 400,
          style: 'normal',
        });
        // Reuse the first woff2 as a stand-in for weight 700
        if (!fonts.find((f) => f.weight === 700)) {
          fonts.push({
            name: 'Inter',
            data: Buffer.from(buf),
            weight: 700,
            style: 'normal',
          });
        }
        break; // one file covers the Latin subset
      }
    }
  } catch (e) {
    console.warn('[og] Failed to load Inter font:', e);
  }

  // --- Noto Sans SC (CJK) ---
  try {
    const cjkUrl =
      'https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.ttf';
    const cjkRes = await fetch(cjkUrl, { signal: AbortSignal.timeout(8000) });
    if (cjkRes.ok) {
      fonts.push({
        name: 'Noto Sans SC',
        data: Buffer.from(await cjkRes.arrayBuffer()),
        weight: 400,
        style: 'normal',
      });
    }
  } catch (e) {
    console.warn('[og] Failed to load Noto Sans SC, CJK may not render:', e);
  }

  _fonts = fonts;
  return fonts;
}

function defaultOgPng(): Buffer {
  const candidates = [
    fileURLToPath(new URL('../../../public/og-default.png', import.meta.url)),
    join(process.cwd(), 'public/og-default.png'),
    join(process.cwd(), 'dist/client/og-default.png'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p);
  }
  throw new Error('[og] default PNG missing');
}

function ogPngResponse(buf: Buffer): Response {
  return new Response(buf.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

const FONT_FAMILY = '"Inter", "Noto Sans SC", sans-serif';

export async function GET({ params }: { params: { slug?: string } }) {
  const slug = params.slug;
  const posts = await getCollection('posts');
  const entry = posts.find(
    (post) => slug === postSlug(post.id, post.data),
  );

  if (!entry) {
    return new Response('Not found', { status: 404 });
  }

  const title = entry.data.title;
  const dateStr =
    entry.data.date instanceof Date
      ? entry.data.date.toISOString().slice(0, 10)
      : new Date(entry.data.date).toISOString().slice(0, 10);

  const fonts = await loadFonts();
  if (fonts.length === 0) {
    console.warn('[og] no fonts loaded, serving default PNG');
    return ogPngResponse(defaultOgPng());
  }

  // Adaptive font size based on title length
  const len = title.length;
  const fontSize = len > 50 ? 28 : len > 35 ? 34 : len > 20 ? 42 : 52;

  // Satori element tree (typed as any to avoid object-literal vs ReactNode mismatch)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element: any = {
    type: 'div',
    props: {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0a0a',
      },
      children: [
        // Top: accent bar
        {
          type: 'div',
          props: {
            style: {
              width: 1200,
              height: 4,
              backgroundColor: '#0369a1',
            },
          },
        },
        // Branding
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              padding: '48px 60px 0',
              fontSize: 16,
              color: '#38bdf8',
              fontFamily: FONT_FAMILY,
            },
            children: 'lazy \u00B7 weichao.ren',
          },
        },
        // Center: title
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0 80px',
            },
            children: {
              type: 'div',
              props: {
                style: {
                  fontSize,
                  fontWeight: 700,
                  color: '#ffffff',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  fontFamily: FONT_FAMILY,
                },
                children: title,
              },
            },
          },
        },
        // Bottom: date
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'center',
              padding: '0 0 48px',
              fontSize: 20,
              color: '#a3a3a3',
              fontFamily: FONT_FAMILY,
            },
            children: dateStr,
          },
        },
      ],
    },
  };

  try {
    const svg = await satori(element, {
      width: 1200,
      height: 630,
      fonts: fonts as SatoriOptions['fonts'],
    });
    const resvg = new Resvg(svg);
    return ogPngResponse(Buffer.from(resvg.render().asPng()));
  } catch (err) {
    console.warn('[og] render failed, serving default PNG', err);
    return ogPngResponse(defaultOgPng());
  }
}
