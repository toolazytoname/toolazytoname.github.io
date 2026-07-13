// Permalink generator for the posts collection.
// Replicates the old Jekyll/Hux pretty URL pattern:
//
//     /:categories/:year/:month/:day/:title:output_ext/
//
// Where:
//   :categories   = first category, lowercased, whitespace → "/"
//     "hack your life" → "hack/your/life"
//     "iOS"           → "ios"
//     "FDSDK"         → "fdsdk"
//   :year/:month/:day = UTC components of frontmatter date, zero-padded
//   :title         = filename stem minus "YYYY-MM-DD-" prefix
//     "2019-09-19-iOS-App-thin" → "iOS-App-thin"  (case preserved verbatim —
//     that's what Jekyll emitted, and what the live site has been serving
//     for a decade. We deliberately do NOT re-slugify the title here.)
//
// Trailing slash comes from Astro's `trailingSlash: 'always'`, not from this function.

export interface PostPermalinkData {
  date: Date;
  categories: string | string[];
}

export function postSlug(id: string, data: PostPermalinkData): string {
  const d = data.date;
  const year = String(d.getUTCFullYear());
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');

  const cats = Array.isArray(data.categories) ? data.categories : [data.categories];
  const primaryCat = (cats[0] ?? '').toString().trim() || 'uncategorized';
  const catPath = primaryCat
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((seg) => seg.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean)
    .join('/');

  // Strip leading "YYYY-MM-DD-" from the glob id (filename stem) so the URL
  // slug matches the original Jekyll `slug` field verbatim.
  const fnameSlug = id.length > 11 ? id.substring(11) : id;

  return `${catPath}/${year}/${month}/${day}/${fnameSlug}`;
}