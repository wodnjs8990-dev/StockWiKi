import { Suspense } from 'react';
import StockWiki from '@/components/StockWiki';
import { getSiteConfig } from '@/lib/config';
import { getEarnings } from '@/lib/earnings';

// ISR: 1시간마다 백그라운드 재검증
// 사용자는 항상 캐시된 데이터를 로딩 없이 즉시 봄
export const revalidate = 3600;

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
