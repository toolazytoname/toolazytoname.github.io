#!/usr/bin/env npx tsx
/**
 * scan-missing-summaries.ts
 *
 * Scans all posts in src/content/posts/ and outputs a Markdown checklist of
 * articles that are missing a `summary` frontmatter field. For each entry,
 * includes the filename, title, and the first 150 characters of body text
 * as a starting point for writing the summary.
 *
 * Usage: npx tsx scripts/scan-missing-summaries.ts
 */

import fs from 'node:fs';
import path from 'node:path';

const POSTS_DIR = path.resolve('src/content/posts');

function extractFrontmatter(content: string): { raw: string; rest: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { raw: '', rest: content };
  return { raw: match[1], rest: match[2] };
}

function hasSummary(frontmatter: string): boolean {
  return /^\s*summary\s*:/m.test(frontmatter);
}

function extractTitle(frontmatter: string): string {
  const m = frontmatter.match(/^\s*title\s*:\s*(.+)$/m);
  return m ? m[1].replace(/^["']|["']$/g, '').trim() : '(no title)';
}

function stripMd(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/\*{1,2}/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/^\s*[-*+>]\s/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

const files = fs
  .readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith('.md'))
  .sort();

const missing: Array<{ file: string; title: string; preview: string }> = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
  const { raw: fm, rest } = extractFrontmatter(content);
  if (!hasSummary(fm)) {
    const title = extractTitle(fm);
    const preview = stripMd(rest).slice(0, 150);
    missing.push({ file, title, preview });
  }
}

const total = files.length;
const withSummary = total - missing.length;

let output = `# Missing Summary Checklist\n\n`;
output += `**Total posts**: ${total} | **With summary**: ${withSummary} | **Missing**: ${missing.length}\n\n`;

if (missing.length === 0) {
  output += `✅ All posts have summaries!\n`;
} else {
  output += `Below are posts missing a \`summary\` field. Add it to the frontmatter:\n\n`;
  output += `\`\`\`yaml\nsummary: Your 1-2 sentence summary here\n\`\`\`\n\n`;

  for (const { file, title, preview } of missing) {
    output += `- [ ] **${file}** — *${title}*\n`;
    output += `  > ${preview}…\n\n`;
  }
}

const outPath = path.resolve('missing-summaries.md');
fs.writeFileSync(outPath, output, 'utf-8');
console.log(`Written to ${outPath}`);
console.log(`${missing.length} / ${total} posts missing summary`);
