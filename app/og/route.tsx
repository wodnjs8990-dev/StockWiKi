// app/og/route.tsx
// 동적 OG 이미지 생성 — @vercel/og
// 사용: https://stockwiki.kr/og?term=per  또는  /og?type=home
//
// 설치 필요: npm install @vercel/og
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { TERMS } from '@/data/terms';

export const runtime = 'edge';

const ACCENT  = '#C89650';
const BG      = '#141414';
const BG_CARD = '#1e1e1e';
const TEXT_PRIMARY   = '#e8e4d6';
const TEXT_SECONDARY = '#a8a49a';
const BORDER  = '#2a2a2a';

const CATEGORY_COLOR: Record<string, string> = {
  '밸류에이션': '#8B6B3D',
  '수익성':    '#4A7045',
  '배당':      '#C89650',
  '재무안정성': '#5B7A99',
  '선물옵션':  '#7B5EA7',
  '파생헤지':  '#A63D33',
  '기술적지표': '#4A7A7A',
  '시장거래':  '#7A6B4A',
  '거시경제':  '#5A7A5A',
  '미시경제':  '#8B7355',
  '기업재무':  '#4A6B8B',
  '회계심화':  '#7A5B8B',
  '포트폴리오': '#5B8B7A',
  '퀀트통계':  '#8B5B5B',
  '한국시장':  '#A67B45',
  '해외주식ETF':'#5B6B8B',
  '차트심리':  '#7A7A4A',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const termId = searchParams.get('term');
  const type   = searchParams.get('type') || 'home';

  // 홈 OG
  if (!termId || type === 'home') {
    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            background: BG,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '80px 100px',
            fontFamily: 'sans-serif',
            border: `1px solid ${BORDER}`,
          }}
        >
          {/* 로고 */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '40px' }}>
            <span style={{ fontSize: '52px', fontWeight: 300, color: TEXT_PRIMARY, letterSpacing: '-2px' }}>
              Stock<span style={{ color: ACCENT, fontWeight: 600 }}>WiKi</span>
            </span>
            <span style={{ fontSize: '20px', color: TEXT_SECONDARY }}>.kr</span>
          </div>

          {/* 설명 */}
          <div style={{ fontSize: '28px', color: TEXT_PRIMARY, fontWeight: 300, lineHeight: 1.5, marginBottom: '48px', maxWidth: '800px' }}>
            전업투자자를 위한 금융 용어 사전 & 실전 계산기
          </div>

          {/* 배지들 */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {[
              { label: '용어', value: '531+' },
              { label: '계산기', value: '29개' },
              { label: '카테고리', value: '17개' },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px 28px',
                  background: BG_CARD,
                  border: `1px solid ${BORDER}`,
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '12px', color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '2px' }}>{label}</span>
                <span style={{ fontSize: '28px', fontWeight: 600, color: ACCENT }}>{value}</span>
              </div>
            ))}
          </div>

          {/* 우하단 URL */}
          <div style={{
            position: 'absolute',
            bottom: '40px',
            right: '60px',
            fontSize: '14px',
            color: TEXT_SECONDARY,
            letterSpacing: '1px',
          }}>
            stockwiki.kr
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // 용어 OG
  const term = TERMS.find(t => t.id === termId);
  if (!term) {
    return new Response('Not found', { status: 404 });
  }

  const catColor = CATEGORY_COLOR[term.category] || ACCENT;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: BG,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 상단: 카테고리 + 로고 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 16px',
            background: catColor + '22',
            border: `1px solid ${catColor}55`,
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: catColor }} />
            <span style={{ fontSize: '13px', color: catColor, textTransform: 'uppercase', letterSpacing: '2px' }}>
              {term.category}
            </span>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 300, color: TEXT_SECONDARY }}>
            Stock<span style={{ color: ACCENT }}>WiKi</span>.kr
          </span>
        </div>

        {/* 중앙: 용어명 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '80px', fontWeight: 300, color: TEXT_PRIMARY, letterSpacing: '-3px', lineHeight: 1 }}>
            {term.name}
          </div>
          <div style={{ fontSize: '22px', color: TEXT_SECONDARY, fontWeight: 400 }}>
            {term.fullName}
          </div>
          <div style={{ fontSize: '14px', color: TEXT_SECONDARY, fontStyle: 'italic', opacity: 0.6 }}>
            {term.en}
          </div>
        </div>

        {/* 하단: 설명 + 공식 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            fontSize: '18px',
            color: TEXT_PRIMARY,
            lineHeight: 1.6,
            maxWidth: '900px',
            opacity: 0.85,
          }}>
            {term.description.length > 120 ? term.description.slice(0, 120) + '…' : term.description}
          </div>
          {term.formula && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              background: BG_CARD,
              borderLeft: `3px solid ${catColor}`,
              maxWidth: '700px',
            }}>
              <span style={{ fontSize: '12px', color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '2px', whiteSpace: 'nowrap' }}>
                Formula
              </span>
              <span style={{ fontSize: '15px', color: ACCENT, fontFamily: 'monospace' }}>
                {term.formula.length > 80 ? term.formula.slice(0, 80) + '…' : term.formula}
              </span>
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
