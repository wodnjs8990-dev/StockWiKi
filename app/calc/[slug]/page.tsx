import { CALC_CATEGORIES } from '@/data/calcs';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

type Props = { params: { slug: string } };

const allCalcs = CALC_CATEGORIES.flatMap(cat => cat.calcs.map(c => ({ ...c, category: cat.name })));

export async function generateStaticParams() {
  return allCalcs.map((c) => ({ slug: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const calc = allCalcs.find((c) => c.id === params.slug);
  if (!calc) return { title: 'Not Found' };

  const title = `${calc.name} 계산기`;
  const description = `${calc.name}을(를) 쉽게 계산하는 온라인 계산기. ${calc.category} 카테고리.`;

  return {
    title,
    description,
    keywords: [calc.name, `${calc.name} 계산기`, `${calc.name} 계산`, calc.category],
    openGraph: {
      title,
      description,
      url: `https://stockwiki.kr/calc/${calc.id}`,
      type: 'website',
    },
    alternates: {
      canonical: `https://stockwiki.kr/calc/${calc.id}`,
    },
  };
}

// 계산기는 메인 페이지로 리다이렉트하면서 쿼리로 전달
export default function CalcPage({ params }: Props) {
  const calc = allCalcs.find((c) => c.id === params.slug);
  if (!calc) {
    redirect('/?tab=calculator');
  }
  redirect(`/?tab=calculator&calc=${calc.id}`);
}
