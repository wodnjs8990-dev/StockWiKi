import { Suspense } from 'react';
import type { Metadata } from 'next';
import StockWiki from '@/components/StockWiki';
import { getSiteConfig, getBanner, getCustomEvents } from '@/lib/config';
import SiteBanner from '@/components/SiteBanner';
import { TERMS } from '@/data/terms';

// Edge Config 변경이 드물므로 60초 ISR 캐싱 — TTFB / LCP 대폭 개선
export const revalidate = 60;

// 동적 OG 메타태그 — ?term=per 딥링크 공유 시 카카오/트위터에 용어 정보 표시
export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ term?: string; calc?: string }> }
): Promise<Metadata> {
  const base = 'https://stockwiki.kr';
  const params = await searchParams;

  // 특정 용어 딥링크
  const termId = params?.term;
  if (termId) {
    const term = TERMS.find(t => t.id === termId);
    if (term) {
      const ogImageUrl = `${base}/og?term=${termId}`;
      return {
        title: `${term.name} · ${term.fullName}`,
        description: term.description,
        openGraph: {
          title: `${term.name} — ${term.fullName} | StockWiKi.kr`,
          description: term.description.slice(0, 160),
          url: `${base}/?term=${termId}`,
          siteName: 'StockWiKi.kr',
          locale: 'ko_KR',
          type: 'article',
          images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${term.name} - ${term.fullName}` }],
        },
        twitter: {
          card: 'summary_large_image',
          title: `${term.name} — ${term.fullName}`,
          description: term.description.slice(0, 160),
          images: [ogImageUrl],
        },
      };
    }
  }

  // 기본 홈 메타
  return {
    title: 'StockWiKi.kr · 금융 사전 & 계산기',
    description: '주식·선물·옵션·거시경제·회계·퀀트까지 — 전업투자자를 위한 금융 용어 사전과 실전 계산기. 531개 용어, 29개 계산기 수록.',
    openGraph: {
      title: 'StockWiKi.kr · 금융 사전 & 계산기',
      description: '전업투자자를 위한 금융 용어 사전과 실전 계산기',
      url: base,
      siteName: 'StockWiKi.kr',
      locale: 'ko_KR',
      type: 'website',
      images: [{ url: `${base}/og?type=home`, width: 1200, height: 630, alt: 'StockWiKi.kr' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'StockWiKi.kr · 금융 사전 & 계산기',
      description: '전업투자자를 위한 금융 용어 사전과 실전 계산기',
      images: [`${base}/og?type=home`],
    },
  };
}

async function StockWikiWithConfig() {
  const [config, banner, customEvents] = await Promise.all([
    getSiteConfig(),
    getBanner(),
    getCustomEvents(),
  ]);

  const features = config.features ?? {
    glossary: true,
    calculator: true,
    commandK: true,
    events: true,
  };

  return (
    <>
      {banner && <SiteBanner banner={banner} />}
      <StockWiki features={features} customEvents={customEvents} />
    </>
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
