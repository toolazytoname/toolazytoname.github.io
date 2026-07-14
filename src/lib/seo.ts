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
};

export function fullTitle(title?: string): string {
  if (!title) return `${SITE.name} — ${SITE.description.split('。')[0]}`;
  return `${title} · ${SITE.name}`;
}