import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap { const base = process.env.NEXT_PUBLIC_SITE_URL; return base ? [{ url: base, changeFrequency: 'monthly', priority: 1 }, { url: `${base}/privacidade`, priority: 0.2 }] : []; }
