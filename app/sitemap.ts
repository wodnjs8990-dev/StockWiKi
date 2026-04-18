import type { MetadataRoute } from 'next';
import { TERMS } from '@/data/terms';
import { CALC_CATEGORIES } from '@/data/calcs';

export const dynamic = 'force-static';

const BASE = 'https://stockwiki.kr';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const termRoutes: MetadataRoute.Sitemap = TERMS.map(t => ({
    url: `${BASE}/terms/${t.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const calcRoutes: MetadataRoute.Sitemap = CALC_CATEGORIES
    .flatMap(cat => cat.calcs)
    .map(c => ({
      url: `${BASE}/calc/${c.id}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

  return [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    ...termRoutes,
    ...calcRoutes,
  ];
}
