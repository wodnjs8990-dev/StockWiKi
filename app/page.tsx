import { Suspense } from 'react';
import StockWiki from '@/components/StockWiki';

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#1a1a1a' }} />}>
      <StockWiki />
    </Suspense>
  );
}
