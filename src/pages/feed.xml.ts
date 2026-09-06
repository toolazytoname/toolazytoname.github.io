import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE } from '@lib/seo';
import { postSlug } from '@lib/permalink';

// Legacy Jekyll/Hux URL. Same document as /posts.xml so old subscribers
// keep receiving updates without depending on a redirect hop.
export const prerender = true;

export const GET: APIRoute = async () => {
  const all = (await getCollection('posts')).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: SITE.url,
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
