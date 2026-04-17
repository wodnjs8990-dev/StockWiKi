import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const BASE = 'https://stockwiki.kr';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
  ];
}
