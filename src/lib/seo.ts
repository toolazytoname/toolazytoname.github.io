// SEO helpers — used by every page.

export const SITE = {
  name: '韦超 · 小兔头',
  url: 'https://weichao.ren',
  description:
    '韦超（小兔头）的个人站。做过 Swift 编译器、Apple LLVM 后端、字节跳动隐私检测。现在想清楚下一步。',
  author: '韦超',
  twitter: '@toolazytoname',
};

export type Seo = {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedAt?: Date;
};

export function fullTitle(title?: string): string {
  if (!title) return `${SITE.name} — ${SITE.description.split('。')[0]}`;
  return `${title} · ${SITE.name}`;
}