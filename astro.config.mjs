// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { loadEnv } from 'vite';

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
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: false },
    imageService: true,
  }),
  markdown: {
    shikiConfig: {
      // github-dark comments are ~3:1 on the block background; high-contrast
      // keeps syntax colors and meets 4.5:1 for comment text.
      theme: 'github-dark-high-contrast',
    },
    remarkPlugins: [remarkNormalizeHeadings],
    rehypePlugins: [rehypeLazyContentImages, rehypeNameToId],
  },
  redirects: {
    '/life/2024/04/02/024-okr': '/life/2024/04/02/2024-okr',
  },
  integrations: [
    react(),
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
    // Rolldown prebundle was resolving jsx-dev-runtime to the production
    // build where jsxDEV is void 0, which emptied every React island.
    optimizeDeps: {
      exclude: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
    },
  },
});