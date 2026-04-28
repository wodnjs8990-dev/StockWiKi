'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

/* ── Types ── */
interface CmdItem {
  type: 'nav' | 'term' | 'calc';
  id: string;
  label: string;
  sub: string;
  icon: string;
  color?: string;
  num?: string;
  famId?: string;
}

interface Props {
  onClose: () => void;
  onNav: (tab: string, termId?: string, calcId?: string) => void;
  totalTerms?: number;
}

/* ── Family colors ── */
const FAM_COLORS: Record<string, string> = {
  fundamental: '#c8a96e',
  market:      '#6ea8c8',
  macro:       '#8bc87a',
  risk:        '#c87a8b',
  derivatives: '#9a7ac8',
  trading:     '#c8b47a',
  industry:    '#7ac8c0',
  digital:     '#c87ab4',
  tax:         '#a8c87a',
};

/* ── Static nav items ── */
const NAV_ITEMS: CmdItem[] = [
  { type: 'nav', id: 'home',       label: '홈 대시보드',   sub: '시장 현황 · KPI · 차트',     icon: 'H', color: '#C89650' },
  { type: 'nav', id: 'glossary',   label: '금융 사전',     sub: '16,323개 용어 검색',          icon: 'G', color: '#C89650' },
  { type: 'nav', id: 'calculator', label: '계산기',        sub: '69종 재무 계산기',            icon: 'C', color: '#C89650' },
  { type: 'nav', id: 'events',     label: '이벤트 캘린더', sub: 'FOMC · CPI · K200 만기',     icon: 'E', color: '#C89650' },
];

/* ── Quick calc items ── */
const CALC_ITEMS: CmdItem[] = [
  { type: 'calc', id: 'per',    num: 'M01', label: 'PER · EPS 계산기',  sub: '주가수익비율 실시간 계산', icon: 'C', color: '#c8a96e' },
  { type: 'calc', id: 'pbr',    num: 'M02', label: 'PBR · BPS 계산기',  sub: '주가순자산비율 분석',      icon: 'C', color: '#c8a96e' },
  { type: 'calc', id: 'dcf',    num: 'M05', label: 'DCF 간이 평가',      sub: '내재가치 추정',            icon: 'C', color: '#8bc87a' },
  { type: 'calc', id: 'roe',    num: 'M07', label: 'ROE · ROA 계산기',  sub: '수익성 지표 분석',          icon: 'C', color: '#c87a8b' },
  { type: 'calc', id: 'bs',     num: 'M24', label: '블랙-숄즈 옵션가',  sub: '옵션 이론가 계산',          icon: 'C', color: '#9a7ac8' },
  { type: 'calc', id: 'kelly',  num: 'M29', label: '켈리 공식',          sub: '최적 베팅 비율',            icon: 'C', color: '#c8b47a' },
  { type: 'calc', id: 'var',    num: 'M31', label: 'VaR 추정',           sub: '리스크 측정 지표',          icon: 'C', color: '#7ac8c0' },
  { type: 'calc', id: 'sharpe', num: 'M15', label: '샤프 비율',          sub: '위험조정 성과 지표',        icon: 'C', color: '#c87a8b' },
  { type: 'calc', id: 'futures',num: 'M27', label: '선물 이론가',        sub: '선물 이론가격',             icon: 'C', color: '#9a7ac8' },
];

/* ── Quick term items ── */
const TERM_ITEMS: CmdItem[] = [
  { type: 'term', id: 'per',    label: 'PER',       sub: '주가수익비율',     icon: 'T', famId: 'fundamental', color: '#c8a96e' },
  { type: 'term', id: 'pbr',    label: 'PBR',       sub: '주가순자산비율',   icon: 'T', famId: 'fundamental', color: '#c8a96e' },
  { type: 'term', id: 'roe',    label: 'ROE',       sub: '자기자본이익률',   icon: 'T', famId: 'fundamental', color: '#c8a96e' },
  { type: 'term', id: 'dcf',    label: 'DCF',       sub: '현금흐름할인법',   icon: 'T', famId: 'fundamental', color: '#c8a96e' },
  { type: 'term', id: 'bs',     label: '블랙-숄즈', sub: 'Black-Scholes',    icon: 'T', famId: 'derivatives', color: '#9a7ac8' },
  { type: 'term', id: 'var',    label: 'VaR',       sub: 'Value at Risk',    icon: 'T', famId: 'risk',        color: '#c87a8b' },
  { type: 'term', id: 'fomc',   label: 'FOMC',      sub: '연방공개시장위원회', icon: 'T', famId: 'macro',      color: '#8bc87a' },
  { type: 'term', id: 'cpi',    label: 'CPI',       sub: '소비자물가지수',   icon: 'T', famId: 'macro',       color: '#8bc87a' },
  { type: 'term', id: 'beta',   label: '베타(β)',   sub: '시장 민감도',      icon: 'T', famId: 'risk',        color: '#c87a8b' },
  { type: 'term', id: 'kelly',  label: '켈리 공식', sub: '최적 베팅 비율',   icon: 'T', famId: 'risk',        color: '#c87a8b' },
];

const ALL_ITEMS: CmdItem[] = [...NAV_ITEMS, ...TERM_ITEMS, ...CALC_ITEMS];

export default function CommandK({ onClose, onNav, totalTerms = 16323 }: Props) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inpRef = useRef<HTMLInputElement>(null);

  /* Focus on mount */
  useEffect(() => { inpRef.current?.focus(); }, []);
  useEffect(() => { setIdx(0); }, [q]);

  /* Filter */
  const filtered = useMemo(() => {
    if (!q) return ALL_ITEMS.slice(0, 9);
    const lq = q.toLowerCase();
    return ALL_ITEMS.filter(x =>
      x.label.toLowerCase().includes(lq) ||
      x.sub.toLowerCase().includes(lq) ||
      (x.num && x.num.toLowerCase().includes(lq))
    ).slice(0, 10);
  }, [q]);

  /* Grouped results */
  const groups = useMemo(() => [
    { label: '이동',    items: filtered.filter(x => x.type === 'nav') },
    { label: '용어',    items: filtered.filter(x => x.type === 'term') },
    { label: '계산기',  items: filtered.filter(x => x.type === 'calc') },
  ].filter(g => g.items.length > 0), [filtered]);

  /* Keyboard */
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setIdx(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filtered[idx]) select(filtered[idx]);
    if (e.key === 'Escape')     onClose();
  };

  const select = (item: CmdItem) => {
    if (item.type === 'nav')  onNav(item.id);
    if (item.type === 'term') onNav('glossary', item.id);
    if (item.type === 'calc') onNav('calculator', undefined, item.id);
    onClose();
  };

  let gi = 0;

  return (
    <div className="cmd-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmd-panel">

        {/* ── Search input ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.07)',
        }}>
          <svg viewBox="0 0 18 18" width="16" height="16" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="7.5" cy="7.5" r="5.5" stroke="rgba(200,150,80,.6)" strokeWidth="1.3" />
            <line x1="11.5" y1="11.5" x2="15.5" y2="15.5" stroke="rgba(200,150,80,.6)" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            ref={inpRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={handleKey}
            placeholder="용어 검색, 계산기, 페이지 이동..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontFamily: 'var(--sans)', fontWeight: 300, fontSize: 15,
            }}
          />
          {q && (
            <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
          )}
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)',
            padding: '3px 8px', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 6, flexShrink: 0,
          }}>ESC</div>
        </div>

        {/* ── Results ── */}
        <div style={{ maxHeight: 'min(380px,60vh)', overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t3)' }}>
              검색 결과 없음
            </div>
          )}
          {groups.map(grp => (
            <div key={grp.label}>
              <div style={{
                padding: '8px 20px 4px', fontFamily: 'var(--mono)',
                fontSize: 8, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--t3)',
              }}>{grp.label}</div>
              {grp.items.map(item => {
                const isActive = idx === gi;
                const color = item.type === 'term'
                  ? (FAM_COLORS[item.famId || ''] || 'var(--gold)')
                  : item.type === 'calc'
                  ? (item.color || 'var(--gold)')
                  : 'var(--gold)';
                const current = gi++;
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`cmd-item${isActive ? ' active' : ''}`}
                    onClick={() => select(item)}
                    onMouseEnter={() => setIdx(current)}
                  >
                    {/* Icon badge */}
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: `${color}18`, border: `1px solid ${color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color, fontWeight: 600 }}>
                        {item.type === 'calc' ? item.num?.slice(0, 3) : item.icon}
                      </span>
                    </div>

                    {/* Label */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: isActive ? '#fff' : 'var(--t1)', letterSpacing: '-.01em' }}>
                        {item.label}
                      </div>
                      <div style={{
                        fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--t3)', marginTop: 1,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{item.sub}</div>
                    </div>

                    {isActive && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)' }}>↵</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,.06)',
          display: 'flex', gap: 16, background: 'rgba(0,0,0,.3)',
        }}>
          {[['↑↓', '이동'], ['↵', '선택'], ['ESC', '닫기']].map(([k, l]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 7px',
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 5, color: 'var(--t2)',
              }}>{k}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t3)' }}>{l}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t3)' }}>
            {totalTerms.toLocaleString()} terms · 69 calcs
          </div>
        </div>
      </div>
    </div>
  );
}
