// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://weichao.ren',
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: false },
    imageService: true,
  }),
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
    ssr: {
      noExternal: ['three'],
    },
  },
});