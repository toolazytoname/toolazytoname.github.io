import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE } from '@lib/seo';
import { postSlug } from '@lib/permalink';

// Pre-render at build time so /posts.xml ships as a static asset
// and gets served from Vercel's CDN cache instead of cold-starting
// a serverless function on every RSS reader poll.
export const prerender = true;

export const GET: APIRoute = async (context) => {
  const all = (await getCollection('posts')).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: all.map((entry) => ({
      title: entry.data.title,
      description: entry.data.summary ?? '',
      pubDate: entry.data.date,
      link: '/' + postSlug(entry.id, entry.data) + '/',
      categories: [
        ...entry.data.tags,
        ...(Array.isArray(entry.data.categories) ? entry.data.categories : [entry.data.categories]),
      ],
    })),
    customData: `<language>zh-cn</language>`,
  });
};