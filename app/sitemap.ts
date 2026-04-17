import type { MetadataRoute } from 'next';

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
