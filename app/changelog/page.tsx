import type { Metadata } from 'next';
import { CHANGELOG, CURRENT_VERSION } from '@/data/changelog';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Changelog · StockWiKi.kr',
  description: 'StockWiKi 업데이트 내역 및 패치노트',
};

const TYPE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  major:   { label: 'MAJOR',   color: '#C89650', bg: 'rgba(200,150,80,0.12)' },
  feature: { label: 'FEATURE', color: '#6ea8c8', bg: 'rgba(110,168,200,0.12)' },
  fix:     { label: 'FIX',     color: '#8bc87a', bg: 'rgba(139,200,122,0.12)' },
  perf:    { label: 'PERF',    color: '#c87a8b', bg: 'rgba(200,122,139,0.12)' },
};

export default function ChangelogPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      color: '#e8e4d6',
      fontFamily: 'var(--font-sans), sans-serif',
    }}>
      {/* 헤더 */}
      <div style={{
        borderBottom: '1px solid #1e1e1e',
        padding: '0 24px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: 'rgba(15,15,15,0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 10,
      }}>
        <Link href="/" style={{
          fontSize: 15, fontWeight: 700, color: '#e8e4d6',
          letterSpacing: '-0.02em', textDecoration: 'none',
        }}>
          Stock<span style={{ color: '#C89650' }}>Wi</span>Ki
          <span style={{ color: '#5a5a5a', fontWeight: 300, fontSize: 12, marginLeft: 3 }}>.kr</span>
        </Link>
        <div style={{ fontSize: 10, color: '#5a5a5a', letterSpacing: '0.2em', fontFamily: 'var(--font-mono), monospace' }}>
          v{CURRENT_VERSION}
        </div>
      </div>

      {/* 본문 */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 120px' }}>

        {/* 타이틀 */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.26em', color: '#C89650', marginBottom: 16, fontFamily: 'var(--font-mono), monospace' }}>
            CHANGELOG
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 200, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.2 }}>
            업데이트 내역
          </h1>
          <p style={{ color: '#76726e', fontSize: 14, marginTop: 12, lineHeight: 1.7 }}>
            StockWiKi의 모든 업데이트와 개선사항을 기록합니다.
          </p>
        </div>

        {/* 타임라인 */}
        <div style={{ position: 'relative' }}>
          {/* 세로 라인 */}
          <div style={{
            position: 'absolute', left: 0, top: 8, bottom: 0,
            width: 1, background: 'linear-gradient(to bottom, #C89650, #1e1e1e)',
          }} />

          {CHANGELOG.map((entry, idx) => {
            const type = TYPE_LABEL[entry.type];
            const isCurrent = idx === 0;
            return (
              <div key={entry.version} style={{
                paddingLeft: 28,
                paddingBottom: 56,
                position: 'relative',
              }}>
                {/* 타임라인 닷 */}
                <div style={{
                  position: 'absolute', left: -4, top: 6,
                  width: 9, height: 9, borderRadius: '50%',
                  background: isCurrent ? '#C89650' : '#2a2a2a',
                  border: `1px solid ${isCurrent ? '#C89650' : '#3a3a3a'}`,
                  boxShadow: isCurrent ? '0 0 12px rgba(200,150,80,0.5)' : 'none',
                }} />

                {/* 버전 헤더 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono), monospace',
                    fontSize: 18, fontWeight: 600,
                    color: isCurrent ? '#C89650' : '#e8e4d6',
                    letterSpacing: '-0.02em',
                  }}>v{entry.version}</span>

                  {isCurrent && (
                    <span style={{
                      fontSize: 9, fontFamily: 'var(--font-mono), monospace',
                      letterSpacing: '0.15em', color: '#0a0a0a',
                      background: '#C89650', padding: '2px 8px', fontWeight: 700,
                    }}>LATEST</span>
                  )}

                  <span style={{
                    fontSize: 9, fontFamily: 'var(--font-mono), monospace',
                    letterSpacing: '0.15em',
                    color: type.color, background: type.bg,
                    padding: '2px 8px', border: `1px solid ${type.color}44`,
                  }}>{type.label}</span>

                  <span style={{ fontSize: 11, color: '#5a5a5a', fontFamily: 'var(--font-mono), monospace', marginLeft: 'auto' }}>
                    {entry.date}
                  </span>
                </div>

                {/* 패치 타이틀 — 사용자용 */}
                <div style={{ fontSize: 16, fontWeight: 600, color: '#d4d0c4', marginBottom: 14 }}>
                  {entry.titlePublic}
                </div>

                {/* 항목 리스트 — 사용자용 */}
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {entry.itemsPublic.map((item, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: type.color, fontSize: 10, marginTop: 4, flexShrink: 0 }}>▸</span>
                      <span style={{ fontSize: 13, color: '#a8a49a', lineHeight: 1.7 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* 푸터 링크 */}
        <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: 32, display: 'flex', justifyContent: 'center' }}>
          <Link href="/" style={{
            fontSize: 12, color: '#5a5a5a', textDecoration: 'none',
            letterSpacing: '0.12em', fontFamily: 'var(--font-mono), monospace',
            border: '1px solid #2a2a2a', padding: '8px 20px',
          }}
          onMouseEnter={undefined}
          >← 사이트로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
