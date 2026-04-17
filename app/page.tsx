import { Suspense } from 'react';
import StockWiki from '@/components/StockWiki';
import { getSiteConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

// StockWiki 자체를 Suspense로 직접 감싸고
// 서버 컴포넌트로 config를 먼저 읽은 뒤 Client 컴포넌트에 전달
async function StockWikiWithConfig() {
  const config = await getSiteConfig();
  const features = config.features ?? {
    glossary: true,
    calculator: true,
    commandK: true,
  };
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
