// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { loadEnv } from 'vite';
import { unified } from '@astrojs/markdown-remark';
import rehypeRaw from 'rehype-raw';
import { readFileSync } from 'node:fs';
const linkHealth = JSON.parse(readFileSync(new URL('./src/data/external-link-health.json', import.meta.url), 'utf8'));
const normalizeExternal = (/** @type {string} */ value) => { try { const u = new URL(value); u.hash = ''; return u.href; } catch { return value; } };
const unavailableLinks = new Map(Object.entries(linkHealth).map(([url, value]) => [normalizeExternal(url), value]));

/** @param {any} node @param {(n: any) => void} visit */
function walk(node, visit) {
  visit(node);
  if (Array.isArray(node?.children)) {
    for (const child of node.children) walk(child, visit);
  }
}

function remarkNormalizeHeadings() {
  /** @param {any} tree */
  return (tree) => {
    let hasH1 = false;
    walk(tree, (node) => {
      if (node?.type === 'heading' && node.depth === 1) hasH1 = true;
    });
    if (!hasH1) return;
    // Shift the whole tree down one level so body h1 becomes h2 and
    // existing h2/h3 keep their relative nesting.
    walk(tree, (node) => {
      if (node?.type === 'heading' && node.depth >= 1 && node.depth <= 5) {
        node.depth = Math.min(6, node.depth + 1);
      }
    });
  };
}

function rehypeLazyContentImages() {
  /** @param {any} tree */
  return (tree) => {
    walk(tree, (node) => {
      if (node?.type === 'element' && node.tagName === 'img') {
        node.properties ??= {};
        if (!node.properties.loading) node.properties.loading = 'lazy';
        if (!node.properties.decoding) node.properties.decoding = 'async';
        if (!node.properties.alt) node.properties.alt = '';
      }
    });
  };
}

// Keep historical Markdown immutable, but do not ship mixed-content embeds.
function rehypeSafeEmbeds() {
  /** @param {any} tree */
  return (tree) => {
    walk(tree, (node) => {
      if (node?.type !== 'element' || node.tagName !== 'iframe') return;
      const src = node.properties?.src;
      if (typeof src === 'string' && src.startsWith('http://')) {
        node.tagName = 'a';
        node.properties = { href: src, target: '_blank', rel: ['noopener', 'noreferrer'] };
        node.children = [{ type: 'text', value: '打开历史外部工具（新窗口；外部站点可能已失效）' }];
      } else {
        node.properties ??= {};
        node.properties.title ||= '嵌入内容';
        node.properties.loading ||= 'lazy';
      }
    });
  };
}

// Availability annotations are compiled from a dated audit snapshot, never
// written back into immutable historical Markdown or silently replaced URLs.
function rehypeExternalLinkHealth() {
  /** @param {any} tree */
  return (tree) => walk(tree, (node) => {
    if (node?.type !== 'element' || node.tagName !== 'a' || typeof node.properties?.href !== 'string') return;
    const health = unavailableLinks.get(normalizeExternal(node.properties.href));
    if (!health) return;
    node.children ??= [];
    node.children.push({ type: 'element', tagName: 'small', properties: { className: ['external-link-note'] }, children: [
      { type: 'text', value: `（历史链接：${health.checkedAt} 检测返回 ${health.status}）` },
    ] });
  });
}

function rehypeNameToId() {
  /** @param {any} tree */
  return (tree) => {
    walk(tree, (node) => {
      const name = node?.properties?.name;
      if (node?.type === 'element' && typeof name === 'string' && name && !node.properties.id) {
        node.properties.id = name;
      }
    });
  };
}

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const fileEnv = loadEnv(mode, process.cwd(), 'PUBLIC_');
const site = (
  process.env.PUBLIC_SITE_URL ||
  fileEnv.PUBLIC_SITE_URL ||
  'https://www.weichao.ren'
).replace(/\/$/, '');

// https://astro.build/config
export default defineConfig({
  site,
  // Trailing slash always: legacy Jekyll/Hux served `/foo/bar/` URLs and
  // 百度/GSC both have those indexed. Switching to 'never' would cause a
  // 301-storm on every old link after cutover.
  trailingSlash: 'always',
  security: {
    csp: {
      directives: [
        "default-src 'self'", "base-uri 'self'", "object-src 'none'",
        "connect-src 'self'", "img-src 'self' https: data:",
        "font-src 'self'", "frame-src 'self'", "form-action 'self'",
      ],
      scriptDirective: { resources: ["'self'", { kind: 'attribute', resource: "'none'" }] },
      // React and progress animations set style attributes; executable inline
      // handlers stay forbidden. Astro hashes the generated script/style tags.
      styleDirective: { resources: ["'self'", { kind: 'attribute', resource: "'unsafe-inline'" }] },
    },
  },
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: false },
    // Prerender responsive screenshots with Astro/Sharp, not a runtime image proxy.
    imageService: false,
  }),
  markdown: {
    shikiConfig: {
      // github-dark comments are ~3:1 on the block background; high-contrast
      // keeps syntax colors and meets 4.5:1 for comment text.
      theme: 'github-dark-high-contrast',
    },
    processor: unified({
      remarkPlugins: [remarkNormalizeHeadings],
      rehypePlugins: [rehypeRaw, rehypeLazyContentImages, rehypeNameToId, rehypeSafeEmbeds, rehypeExternalLinkHealth],
    }),
  },
  redirects: {
    '/life/2024/04/02/024-okr': '/life/2024/04/02/2024-okr',
  },
  integrations: [
    // Astro passes an explicit exclusion list to plugin-react; retain the
    // plugin's node_modules exclusion so Fast Refresh never rewrites React.
    react({ exclude: [/\/node_modules\//] }),
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
  vite: {
    resolve: {
      alias: {
        '@components': '/src/components',
        '@data': '/src/data',
        '@lib': '/src/lib',
        '@layouts': '/src/layouts',
        '@styles': '/src/styles',
      },
    },

  },
});