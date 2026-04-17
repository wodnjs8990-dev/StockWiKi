import { TERMS, CATEGORY_COLORS, type Term } from '@/data/terms';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type Props = { params: { slug: string } };

// 모든 용어 페이지를 빌드 시점에 정적 생성 (SSG)
export async function generateStaticParams() {
  return TERMS.map((t) => ({ slug: t.id }));
}

// 각 페이지 개별 메타태그 (SEO 핵심)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const term = TERMS.find((t) => t.id === params.slug);
  if (!term) return { title: 'Not Found' };

  const title = `${term.name} 뜻 · ${term.fullName} (${term.en})`;
  const description = term.description.length > 155
    ? term.description.slice(0, 152) + '...'
    : term.description;

  return {
    title,
    description,
    keywords: [term.name, term.fullName, term.en, term.category, `${term.name} 뜻`, `${term.name} 계산`],
    openGraph: {
      title,
      description,
      url: `https://stockwiki.kr/terms/${term.id}`,
      type: 'article',
    },
    alternates: {
      canonical: `https://stockwiki.kr/terms/${term.id}`,
    },
  };
}

export default function TermPage({ params }: Props) {
  const term = TERMS.find((t) => t.id === params.slug);
  if (!term) notFound();

  const color = CATEGORY_COLORS[term.category];
  const relatedTerms = (term.related || [])
    .map((id) => TERMS.find((t) => t.id === id))
    .filter(Boolean) as Term[];

  // JSON-LD 구조화 데이터 (구글이 용어집으로 인식)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.name,
    alternateName: [term.fullName, term.en],
    description: term.description,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'StockWiKi 금융 사전',
      url: 'https://stockwiki.kr',
    },
    url: `https://stockwiki.kr/terms/${term.id}`,
  };

  return (
    <div className="min-h-screen" style={{ background: '#1a1a1a', color: '#d4d0c4' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b sticky top-0 z-30" style={{ borderColor: '#2a2a2a', background: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-light tracking-tight" style={{ color: '#e8e4d6' }}>
              Stock<span style={{ color: '#C89650', fontWeight: 500 }}>WiKi</span>
            </span>
            <span className="text-xs mono" style={{ color: '#7a7a7a' }}>.kr</span>
          </Link>
          <Link
            href="/"
            className="text-xs mono uppercase tracking-[0.2em] px-3 py-1.5 border transition-all hover:bg-white/5"
            style={{ borderColor: '#2a2a2a', color: '#a8a49a' }}
          >
            ← 전체 사전
          </Link>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <nav className="text-[11px] mono uppercase tracking-[0.2em] mb-6" style={{ color: '#7a7a7a' }}>
          <Link href="/" className="hover:text-white">StockWiKi</Link>
          <span className="mx-2">/</span>
          <span>{term.category}</span>
          <span className="mx-2">/</span>
          <span style={{ color: '#e8e4d6' }}>{term.name}</span>
        </nav>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-[10px] mono uppercase tracking-wider px-2 py-1" style={{ background: color?.bg, color: color?.text }}>
            {term.category}
          </span>
          {term.detailed && (
            <span className="text-[9px] mono uppercase tracking-wider px-1.5 py-0.5 border" style={{ borderColor: '#3a3a3a', color: '#7a7a7a' }}>
              심화
            </span>
          )}
        </div>

        <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-3" style={{ color: '#e8e4d6' }}>
          {term.name}
        </h1>
        <div className="text-lg md:text-xl mb-1" style={{ color: '#a8a49a' }}>{term.fullName}</div>
        <div className="text-sm mono italic mb-10" style={{ color: '#7a7a7a' }}>{term.en}</div>

        <Section label="개요 · Summary" color={color?.bg}>
          <p className="text-base md:text-lg leading-relaxed" style={{ color: '#e8e4d6' }}>{term.description}</p>
        </Section>

        {term.detailed && (
          <Section label="심화 · In-Depth" color={color?.bg}>
            <p className="text-sm md:text-base leading-[1.8]" style={{ color: '#d4d0c4' }}>{term.detailed}</p>
          </Section>
        )}

        <Section label="공식 · Formula" color={color?.bg}>
          <div className="mono text-sm md:text-base px-4 md:px-5 py-3 md:py-4 border-l-4" style={{ background: '#0f0f0f', borderColor: color?.bg, color: '#e8e4d6' }}>
            {term.formula}
          </div>
        </Section>

        <Section label="예시 · Example" color={color?.bg}>
          <div className="text-sm md:text-base italic" style={{ color: '#a8a49a' }}>{term.example}</div>
        </Section>

        {term.relations && Object.keys(term.relations).length > 0 && (
          <Section label="연결 관계 · Relations" color={color?.bg}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(term.relations).map(([key, value]) => {
                const matchTerm = TERMS.find(t =>
                  t.name === key || t.fullName === key || key.includes(t.name) ||
                  (t.en && key.toLowerCase().includes(t.en.toLowerCase()))
                );
                const matchColor = matchTerm ? CATEGORY_COLORS[matchTerm.category] : null;
                const Wrapper: any = matchTerm ? Link : 'div';
                const wrapperProps: any = matchTerm ? { href: `/terms/${matchTerm.id}` } : {};
                return (
                  <Wrapper
                    key={key}
                    {...wrapperProps}
                    className={`block border p-4 transition-all ${matchTerm ? 'hover:bg-white/5 cursor-pointer' : ''}`}
                    style={{ borderColor: '#2a2a2a', background: '#0f0f0f' }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {matchColor && <span className="w-1.5 h-1.5 rounded-full" style={{ background: matchColor.bg }}></span>}
                        <span className="text-sm font-medium" style={{ color: '#e8e4d6' }}>{key}</span>
                      </div>
                      {matchTerm && <span style={{ color: '#7a7a7a' }}>↗</span>}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: '#a8a49a' }}>{value}</p>
                  </Wrapper>
                );
              })}
            </div>
          </Section>
        )}

        {term.marketImpact && (
          <Section label="시장 영향 · Market Impact" color={color?.bg}>
            <div className="text-sm md:text-base leading-relaxed px-4 py-3 border-l-2" style={{ background: '#0f0f0f', borderColor: '#C89650', color: '#e8e4d6' }}>
              {term.marketImpact}
            </div>
          </Section>
        )}

        {relatedTerms.length > 0 && (
          <div className="mt-8 pt-6 border-t" style={{ borderColor: '#2a2a2a' }}>
            <div className="text-[10px] mono uppercase tracking-[0.2em] mb-3" style={{ color: '#7a7a7a' }}>관련 용어 · Related Terms</div>
            <div className="flex flex-wrap gap-2">
              {relatedTerms.map(rt => {
                const rc = CATEGORY_COLORS[rt.category];
                return (
                  <Link
                    key={rt.id}
                    href={`/terms/${rt.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs border transition-all hover:bg-white/5"
                    style={{ borderColor: '#2a2a2a', color: '#d4d0c4' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: rc?.bg }}></span>
                    <span className="font-medium">{rt.name}</span>
                    <span className="text-[10px]">›</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t mt-16" style={{ borderColor: '#2a2a2a', background: '#141414' }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 flex justify-between text-[11px] mono uppercase tracking-wider" style={{ color: '#6a6a6a' }}>
          <span>Stock<span style={{ color: '#C89650' }}>WiKi</span>.kr</span>
          <span>Designed by Ones</span>
        </div>
      </footer>
    </div>
  );
}

function Section({ label, color, children }: { label: string; color?: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1 h-3" style={{ background: color || '#C89650' }}></span>
        <div className="text-[10px] mono uppercase tracking-[0.25em]" style={{ color: '#7a7a7a' }}>{label}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}
