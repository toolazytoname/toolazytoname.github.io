/**
 * Per-post OG image generator using Satori + Resvg.
 *
 * Generates a 1200×630 black & white card with the post title, date,
 * and site branding. Fonts are fetched from Google Fonts CDN at build time
 * and cached in-memory across all 61 prerendered images.
 *
 * NOTE: CJK title support requires downloading a CJK font (~2MB TTF).
 * If the download fails, Chinese characters may render as tofu (□).
 * TODO: bundle a CJK font locally for reliable offline builds.
 */

import satori from 'satori';
import type { SatoriOptions } from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getCollection } from 'astro:content';
import { postSlug } from '@lib/permalink';

export const prerender = true;

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
    const cssRes = await fetch(cssUrl);
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
      const r = await fetch(u);
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
    const cjkRes = await fetch(cjkUrl);
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

  if (fonts.length === 0) {
    throw new Error(
      '[og] No fonts loaded — OG image generation impossible',
    );
  }

  _fonts = fonts;
  return fonts;
}

// ---------------------------------------------------------------------------
// Static paths (one per post)
// ---------------------------------------------------------------------------

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  return posts.map((entry) => ({
    params: { slug: postSlug(entry.id, entry.data) },
    props: { entry },
  }));
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

const FONT_FAMILY = '"Inter", "Noto Sans SC", sans-serif';

export async function GET({
  props,
}: {
  props: { entry: { data: { title: string; date: Date } } };
}) {
  const { entry } = props;
  const title = entry.data.title;
  const dateStr =
    entry.data.date instanceof Date
      ? entry.data.date.toISOString().slice(0, 10)
      : new Date(entry.data.date).toISOString().slice(0, 10);

  const fonts = await loadFonts();

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
              backgroundColor: '#0ea5e9',
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
              color: '#0ea5e9',
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

  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts: fonts as SatoriOptions['fonts'],
  });

  const resvg = new Resvg(svg);
  const pngBuf = resvg.render().asPng();

  return new Response(pngBuf.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
