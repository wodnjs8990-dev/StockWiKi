import { Suspense } from 'react';
import StockWiki from '@/components/StockWiki';
import { getSiteConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const config = await getSiteConfig();
  const features = config.features ?? { glossary: true, calculator: true, commandK: true };

  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#1a1a1a' }} />}>
      <StockWiki features={features} />
    </Suspense>
  );
}
