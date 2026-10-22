import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const CATEGORIES = {
  portraits: 'Portraits',
  streets: 'Streets',
  travel: 'Travel',
  events: 'Events',
} as const;

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['portraits', 'streets', 'travel', 'events']),
    location: z.string().optional().default(''),
    date: z.coerce.date(),
    client: z.string().optional(),
    featured: z.boolean().optional().default(true),
    cover: z.string(),
    photos: z
      .array(z.object({ image: z.string(), alt: z.string().optional().default('') }))
      .default([]),
  }),
});

export const collections = { projects };
