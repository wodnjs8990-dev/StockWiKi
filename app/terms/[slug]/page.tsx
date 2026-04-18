// app/terms/[slug]/page.tsx
// ISR — 용어별 정적 페이지 (빌드 시 531개 생성, 24시간마다 재검증)
// URL: stockwiki.kr/terms/per, stockwiki.kr/terms/pbr ...
//
// 역할:
//   1. SEO — 각 용어가 독립 URL을 가져 검색 노출
//   2. OG — 용어별 소셜 미리보기 자동 생성
//   3. 접속 시 메인 앱(/?term=id)으로 리다이렉트 (SPA 경험 유지)

import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { TERMS } from '@/data/terms';

// ISR: 24시간마다 재검증
export const revalidate = 86400;

// 빌드 시 531개 경로 정적 생성
export async function generateStaticParams() {
  return TERMS.map(t => ({ slug: t.id }));
}

// 용어별 동적 메타데이터
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const term = TERMS.find(t => t.id === params.slug);
  if (!term) return { title: 'Not Found | StockWiKi.kr' };

  const base = 'https://stockwiki.kr';
  const ogImage = `${base}/og?term=${term.id}`;
  const url = `${base}/terms/${term.id}`;

  return {
    title: `${term.name} · ${term.fullName}`,
    description: term.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${term.name} — ${term.fullName} | StockWiKi.kr`,
      description: term.description.slice(0, 160),
      url,
      siteName: 'StockWiKi.kr',
      locale: 'ko_KR',
      type: 'article',
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${term.name} - ${term.fullName}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${term.name} — ${term.fullName}`,
      description: term.description.slice(0, 160),
      images: [ogImage],
    },
  };
}

// 페이지 컴포넌트 — 메인 앱으로 리다이렉트 (/?term=id)
// 검색엔진은 메타데이터를 읽고, 실제 사용자는 SPA로 이동
export default function TermPage({ params }: { params: { slug: string } }) {
  const term = TERMS.find(t => t.id === params.slug);
  if (!term) redirect('/');
  redirect(`/?term=${params.slug}`);
}
