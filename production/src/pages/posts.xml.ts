import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE } from '@lib/seo';

export const GET: APIRoute = async (context) => {
  const life = await getCollection('life');
  const craft = await getCollection('craft');
  const all = [...life, ...craft].sort(
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
      link: `/posts/${entry.id}`,
      categories: [...entry.data.tags, entry.collection],
    })),
    customData: `<language>zh-cn</language>`,
  });
};