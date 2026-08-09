// SEO helpers — used by every page.

export const SITE = {
  name: 'lazy',
  url: 'https://weichao.ren',
  description:
    'lazy 的个人站。做过 Swift 编译器、LLVM 后端、隐私检测相关工作。现在做独立开发者，用 AI 造自己想要的工具。',
  author: 'lazy',
  twitter: '@toolazytoname',
};

export type Seo = {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedAt?: Date;
  /** Article-specific: section (primary category) */
  section?: string;
  /** Article-specific: tags */
  tags?: string[];
};

export function fullTitle(title?: string): string {
  if (!title) return `${SITE.name} — ${SITE.description.split('。')[0]}`;
  return `${title} · ${SITE.name}`;
}

/** Build JSON-LD for WebSite + Person (homepage). */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        author: { '@id': `${SITE.url}/#person` },
      },
      {
        '@type': 'Person',
        '@id': `${SITE.url}/#person`,
        name: SITE.author,
        url: SITE.url,
      },
    ],
  };
}

/** Build JSON-LD for Article. */
export function articleJsonLd(opts: {
  title: string;
  description?: string;
  url: string;
  publishedAt: Date;
  section?: string;
  tags?: string[];
  image?: string;
}) {
  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    url: opts.url,
    datePublished: opts.publishedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: SITE.author,
      url: SITE.url,
    },
    publisher: {
      '@type': 'Person',
      name: SITE.author,
      url: SITE.url,
    },
  };

  if (opts.description) article.description = opts.description;
  if (opts.section) article.articleSection = opts.section;
  if (opts.tags?.length) article.keywords = opts.tags.join(', ');
  if (opts.image) article.image = opts.image;

  return article;
}
