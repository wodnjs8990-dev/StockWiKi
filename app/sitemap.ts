import type { MetadataRoute } from 'next';
import { TERMS } from '@/data/terms';
import { CALC_CATEGORIES } from '@/data/calcs';

const BASE = 'https://stockwiki.kr';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const allCalcs = CALC_CATEGORIES.flatMap(cat => cat.calcs);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'weekly', priority: 1 },
  ];

  const termPages: MetadataRoute.Sitemap = TERMS.map((t) => ({
    url: `${BASE}/terms/${t.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const calcPages: MetadataRoute.Sitemap = allCalcs.map((c) => ({
    url: `${BASE}/calc/${c.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...termPages, ...calcPages];
}
