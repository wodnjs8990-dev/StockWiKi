import { Suspense } from 'react';
import StockWiki from '@/components/StockWiki';
import { getSiteConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

async function StockWikiWithConfig() {
  const config = await getSiteConfig();
  const features = config.features ?? {
    glossary: true,
    calculator: true,
    commandK: true,
  };
  // 어닝 데이터는 EventsView에서 클라이언트 사이드로 /api/events 호출
  // (서버사이드 fetch 시 Finnhub 타임아웃이 페이지 전체를 블로킹하는 문제 방지)
  return <StockWiki features={features} />;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={<div style={{ minHeight: '100vh', background: '#1a1a1a' }} />}
    >
      <StockWikiWithConfig />
    </Suspense>
  );
}
