import { getCollection, type CollectionEntry } from 'astro:content';
export { CATEGORIES } from '../content.config';

export const SITE = {
  name: 'gilbs.arevalo',
  fullName: 'Gilbert Arevalo',
  initials: 'GA',
  tagline: 'Portrait, street & travel photographer based in the Philippines',
  email: 'gilbert.arevalo2021@gmail.com',
  instagram: 'https://www.instagram.com/gilbs.arevalo',
};

export type Project = CollectionEntry<'projects'>;

/** Projects sorted newest first. */
export async function getProjects(): Promise<Project[]> {
  const all = await getCollection('projects');
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/**
 * On Netlify, route images through the Netlify Image CDN for resized WebP/AVIF.
 * Locally (or anywhere else) the original file is used as-is.
 */
const USE_CDN = process.env.NETLIFY === 'true';
export function img(src: string, width: number): string {
  if (!USE_CDN || /^https?:/.test(src)) return src;
  return `/.netlify/images?url=${encodeURIComponent(src)}&w=${width}&q=78`;
}

export const year = (d: Date) => d.getFullYear();
