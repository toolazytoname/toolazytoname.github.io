// Astro 5 Content Collections — replaces src/content/config.ts (legacy).
// Two collections: life (essays) and craft (technical posts).

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const life = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/life' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const craft = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/craft' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { life, craft };