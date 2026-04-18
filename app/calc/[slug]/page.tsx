// app/calc/[slug]/page.tsx
// ISR — 계산기별 정적 페이지
// URL: stockwiki.kr/calc/per, stockwiki.kr/calc/wacc ...

import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { CALC_CATEGORIES } from '@/data/calcs';

export const revalidate = 86400;

const ALL_CALCS = CALC_CATEGORIES.flatMap(cat =>
  cat.calcs.map(c => ({ ...c, category: cat.name, color: cat.color }))
);

export async function generateStaticParams() {
  return ALL_CALCS.map(c => ({ slug: c.id }));
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const calc = ALL_CALCS.find(c => c.id === params.slug);
  if (!calc) return { title: 'Not Found | StockWiKi.kr' };

  const base  = 'https://stockwiki.kr';
  const url   = `${base}/calc/${calc.id}`;
  const title = `${calc.name} 계산기`;
  const desc  = `StockWiKi.kr — ${calc.category} · ${calc.name} 실전 계산기`;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | StockWiKi.kr`,
      description: desc,
      url,
      siteName: 'StockWiKi.kr',
      locale: 'ko_KR',
      type: 'website',
      images: [{ url: `${base}/og?type=home`, width: 1200, height: 630 }],
    },
  };
}

export default function CalcPage({ params }: { params: { slug: string } }) {
  const calc = ALL_CALCS.find(c => c.id === params.slug);
  if (!calc) redirect('/');
  redirect(`/?tab=calculator&calc=${params.slug}`);
}
