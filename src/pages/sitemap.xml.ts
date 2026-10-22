import type { APIRoute } from 'astro';
import { getProjects } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const projects = await getProjects();
  const paths = ['/', '/projects', '/about', '/contact', ...projects.map((p) => `/projects/${p.id}`)];
  const urls = paths.map((p) => `<url><loc>${new URL(p, site)}</loc></url>`).join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
