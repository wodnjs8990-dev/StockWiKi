import { Suspense } from 'react';
import StockWiki from '@/components/StockWiki';
import { getSiteConfig } from '@/lib/config';
import { getEarnings } from '@/lib/earnings';

// Edge Config가 revalidate:0 을 사용하므로 페이지는 dynamic 유지
// 어닝 데이터는 lib/earnings.ts 내부 fetch에서 개별 캐시 처리
export const dynamic = 'force-dynamic';

async function StockWikiWithConfig() {
  // config + 어닝 데이터 서버에서 병렬 fetch
  const [config, { earnings, updatedAt }] = await Promise.all([
    getSiteConfig(),
    getEarnings(),
  ]);

  const features = config.features ?? {
    glossary: true,
    calculator: true,
    commandK: true,
  };

  return (
    <StockWiki
      features={features}
      initialEarnings={earnings}
      earningsUpdatedAt={updatedAt}
    />
  );
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
