'use client';

import { useState, useEffect } from 'react';

interface RecentTerm { id: string; name: string; category: string; }
interface CalcHistEntry { id: string; label: string; results?: { label: string; value: string; unit?: string }[]; ts?: number; }

interface Props {
  T: any;
  isDark: boolean;
  totalTerms: number;
  recent: any[];
  favorites: Set<string>;
  setActiveTab: (tab: string) => void;
  setSelectedCalc: (id: string) => void;
  setSelectedTerm?: (term: any) => void;
}

const FAMILIES = [
  { id: 'fundamental', color: '#c8a96e', en: 'FUNDAMENTAL', ko: '기업가치',    cats: ['밸류에이션', '기업재무', '수익성', '회계심화', '+13'] },
  { id: 'market',      color: '#6ea8c8', en: 'MARKET',      ko: '시장·상품',  cats: ['시장거래', '한국시장', 'ETF·상장', '+8'] },
  { id: 'macro',       color: '#8bc87a', en: 'MACRO',       ko: '거시경제',    cats: ['통화정책', '물가·인플레', '거시지표', '+13'] },
  { id: 'risk',        color: '#c87a8b', en: 'RISK',        ko: '리스크·퀀트', cats: ['포트폴리오', '퀀트통계', '성과평가', '+4'] },
  { id: 'derivatives', color: '#9a7ac8', en: 'DERIVATIVES', ko: '파생·헤지',   cats: ['선물옵션', '파생헤지', '옵션전략', '+5'] },
  { id: 'trading',     color: '#c8b47a', en: 'TRADING',     ko: '실전매매',    cats: ['기술적지표', '투자심리', '차트패턴', '+6'] },
  { id: 'industry',    color: '#7ac8c0', en: 'INDUSTRY',    ko: '산업군',      cats: ['AI·반도체', '에너지', '소비재', '+8'] },
  { id: 'digital',     color: '#c87ab4', en: 'DIGITAL',     ko: '디지털자산',  cats: ['DeFi', '블록체인', '토큰화', '+2'] },
  { id: 'tax',         color: '#a8c87a', en: 'TAX·LEGAL',   ko: '세금·법률',   cats: ['세금·계좌', '공시·법률', '규제', '+2'] },
];

const QUICK_CALCS = [
  { id: 'per',   num: 'M01', name: 'PER · EPS 계산기', hint: '주가수익비율 실시간 계산' },
  { id: 'pbr',   num: 'M02', name: 'PBR · BPS 계산기', hint: '주가순자산비율 분석' },
  { id: 'dcf',   num: 'M05', name: 'DCF 간이 평가',     hint: '내재가치 추정' },
  { id: 'roe',   num: 'M07', name: 'ROE · ROA 계산기',  hint: '수익성 지표 분석' },
  { id: 'bs',    num: 'M24', name: '블랙-숄즈 옵션가',  hint: '옵션 이론가 계산' },
  { id: 'kelly', num: 'M29', name: '켈리 공식',          hint: '최적 베팅 비율' },
  { id: 'var',   num: 'M31', name: 'VaR 추정',           hint: '리스크 측정 지표' },
];

const DAY_KO = ['일요일 · Sun', '월요일 · Mon', '화요일 · Tue', '수요일 · Wed', '목요일 · Thu', '금요일 · Fri', '토요일 · Sat'];
const pad = (n: number) => String(n).padStart(2, '0');

function getKST() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
}

function getMktState() {
  const kst = getKST();
  const h = kst.getHours(), m = kst.getMinutes(), dow = kst.getDay();
  const hm = h * 60 + m;
  const isWeekday = dow >= 1 && dow <= 5;
  return {
    kospiPre:   isWeekday && hm >= 480 && hm < 540,
    kospi:      isWeekday && hm >= 540 && hm < 930,
    nxt:        isWeekday && ((hm >= 480 && hm < 510) || (hm >= 540 && hm < 930)),
    k200Day:    isWeekday && hm >= 540 && hm < 945,
    k200Night:  isWeekday && (hm >= 1050 || hm < 360),
    ndx:        isWeekday && (hm >= 1410 || hm < 360),
  };
}

function getLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let current = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      current += step;
      if (current >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.floor(current));
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return val;
}

export default function DashboardHome({ T, isDark, totalTerms, recent, favorites, setActiveTab, setSelectedCalc }: Props) {
  const [kstTime, setKstTime] = useState('--:--:--');
  const [kstDate, setKstDate] = useState('');
  const [kstDay, setKstDay] = useState('');
  const [mkt, setMkt] = useState(getMktState());
  const [recentTerms, setRecentTerms] = useState<RecentTerm[]>([]);
  const [calcHist, setCalcHist] = useState<CalcHistEntry[]>([]);
  const [hovFam, setHovFam] = useState<string | null>(null);
  const [hovCalc, setHovCalc] = useState<string | null>(null);

  const favArr = Array.from(favorites);
  const favCount = favArr.length;
  const recentCount = recentTerms.length;
  const calcCount = calcHist.length;

  const c1 = useCountUp(totalTerms || 16323);
  const c2 = useCountUp(69);
  const c3 = useCountUp(200);
  const c4 = useCountUp(9);

  useEffect(() => {
    const tick = () => {
      const kst = getKST();
      setKstTime(`${pad(kst.getHours())}:${pad(kst.getMinutes())}:${pad(kst.getSeconds())}`);
      const y = kst.getFullYear(), mo = pad(kst.getMonth() + 1), d = pad(kst.getDate());
      setKstDate(`${y}.${mo}.${d}`);
      setKstDay(DAY_KO[kst.getDay()]);
      setMkt(getMktState());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (recent && recent.length > 0) {
      setRecentTerms(recent.slice(0, 4).map((t: any) => ({ id: t.id, name: t.name, category: t.category })));
    } else {
      const ids: string[] = getLS('stockwiki_recent', []);
      setRecentTerms(ids.slice(0, 4).map(id => {
        const cached = getLS<any>(`stockwiki_term_cache_${id}`, null);
        return { id, name: cached?.name || id.toUpperCase(), category: cached?.category || '' };
      }));
    }
    setCalcHist(getLS<CalcHistEntry[]>('stockwiki_calc_history', []).slice(0, 5));
  }, [recent]);

  // 색상 토큰
  const ON  = '#4A7045';
  const PRE = '#C89650';
  const B   = isDark ? '#1e1e1e' : '#e0ddd4';
  const BG  = isDark ? '#111111' : '#f5f2eb';
  const BG2 = isDark ? '#141414' : '#edeae0';
  const INK = isDark ? '#e8e4d6' : '#1a1a1a';
  const INK2= isDark ? '#c8c4b6' : '#3a3a3a';
  const M   = isDark ? '#7a7670' : '#5a5550';
  const F   = isDark ? '#484440' : '#aaa8a4';
  const F2  = isDark ? '#2e2c28' : '#ccc8c0';
  const OFF = isDark ? '#2e2c28' : '#aaa8a4';

  const mktItems = [
    { label: 'KOSPI',      on: mkt.kospi,     pre: mkt.kospiPre, status: mkt.kospi ? '장중' : mkt.kospiPre ? '프리' : '장외', time: '09:00–15:30' },
    { label: 'NXT',        on: mkt.nxt,       pre: false,        status: mkt.nxt       ? '장중' : '장외', time: '08:00–08:30' },
    { label: 'K200F 주간', on: mkt.k200Day,   pre: false,        status: mkt.k200Day   ? '장중' : '장외', time: '09:00–15:45' },
    { label: 'K200F 야간', on: mkt.k200Night, pre: false,        status: mkt.k200Night ? '장중' : '장외', time: '18:00–05:00' },
    { label: 'NDX',        on: mkt.ndx,       pre: false,        status: mkt.ndx       ? '장중' : '장외', time: '23:30–06:00' },
  ];

  return (
    <div style={{ background: BG, color: INK, fontFamily: 'var(--font-sans), Inter, sans-serif' }}>
      <style>{`
        @keyframes gridDrift  { from{background-position:0 0} to{background-position:64px 64px} }
        @keyframes glowPulse  { 0%,100%{opacity:.7;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.12)} }
        @keyframes scanLine   { from{top:-2px} to{top:100%} }
        @keyframes ghostPulse { 0%,100%{opacity:.5} 50%{opacity:.9} }
        @keyframes mktpulse   { 0%,100%{opacity:1} 50%{opacity:.12} }
        .dh-fam-col  { transition: background .2s; }
        .dh-fam-col:hover { background: rgba(255,255,255,.025) !important; }
        .dh-fam-col:hover .dh-fam-arr { opacity:1 !important; transform:translateX(0) !important; }
        .dh-fam-col:hover .dh-fam-bar { opacity:1 !important; }
        .dh-calc-col { transition: background .15s; }
        .dh-calc-col:hover { background: rgba(255,255,255,.025) !important; }
        .dh-calc-col:hover .dh-calc-line { transform: scaleX(1) !important; }
        .dh-stat-cell { transition: background .14s; }
        .dh-stat-cell:hover { background: rgba(255,255,255,.03) !important; }
        .dh-stat-cell:hover .dh-stat-arrow { opacity:1 !important; transform:translate(2px,-2px) !important; }
        .dh-stat-cell:hover .dh-stat-topbar { transform: scaleX(1) !important; }
        .dh-hw { transition: background .2s; }
        .dh-hw:hover { background: rgba(255,255,255,.015) !important; }
        .dh-hw-link:hover { color: #C89650 !important; }
        .dh-mkt-row { transition: background .14s; }
        .dh-mkt-row:hover { background: rgba(255,255,255,.025) !important; }
        @media (max-width: 900px) {
          .dh-clock-panel { display:none !important; }
          .dh-families { display:none !important; }
          .dh-calcs { display:none !important; }
          .dh-hero-inner { padding:0 24px !important; }
          .dh-stat-ticker { grid-template-columns:repeat(2,1fr) !important; }
          .dh-widgets { grid-template-columns:1fr 1fr !important; }
        }
        @media (max-width: 520px) {
          .dh-widgets { grid-template-columns:1fr !important; }
          .dh-stat-ticker { grid-template-columns:repeat(2,1fr) !important; }
        }
      `}</style>

      {/* ══ HERO ══ */}
      <div style={{ minHeight: 'calc(100vh - 70px)', display: 'grid', gridTemplateRows: '1fr auto', position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${B}` }}>

        {/* 배경 그리드 */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px)`,
          backgroundSize: '64px 64px',
          animation: 'gridDrift 20s linear infinite',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%)',
        }} />

        {/* Glow orb */}
        <div style={{
          position: 'absolute', top: '35%', left: '50%',
          width: 700, height: 500, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center,rgba(200,150,80,.07) 0%,transparent 65%)',
          animation: 'glowPulse 7s ease-in-out infinite',
        }} />

        {/* Scan line */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 1, pointerEvents: 'none',
          background: 'linear-gradient(90deg,transparent 0%,rgba(200,150,80,.18) 50%,transparent 100%)',
          animation: 'scanLine 12s linear infinite',
        }} />

        {/* Ghost number */}
        <div style={{
          position: 'absolute', right: -40, top: '50%', transform: 'translateY(-50%)',
          fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace',
          fontSize: 'clamp(180px,22vw,340px)', fontWeight: 400,
          color: 'transparent', letterSpacing: '-.06em', lineHeight: 1,
          WebkitTextStroke: '1px rgba(255,255,255,.04)',
          pointerEvents: 'none', userSelect: 'none',
          animation: 'ghostPulse 6s ease-in-out infinite',
        }}>
          {(totalTerms || 16323).toLocaleString()}
        </div>

        {/* Hero content */}
        <div className="dh-hero-inner" style={{
          position: 'relative', zIndex: 1,
          maxWidth: 1400, margin: '0 auto', width: '100%', padding: '0 64px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          minHeight: 'calc(100vh - 70px - 120px)',
        }}>
          {/* Eyebrow */}
          <div style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 10, letterSpacing: '.36em', textTransform: 'uppercase', color: '#C89650', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <span style={{ display: 'inline-block', width: 36, height: 1, background: '#C89650' }} />
            전업투자자를 위한 금융 책상
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' as const }}>
            <div>
              {/* Title */}
              <h1 style={{ fontSize: 'clamp(42px,6.5vw,96px)', fontWeight: 200, color: INK, letterSpacing: '-.05em', lineHeight: 1.0, marginBottom: 28 }}>
                가장 강력한<br />
                투자 무기는<br />
                <strong style={{ fontWeight: 600, color: '#C89650', position: 'relative' }}>
                  &apos;제대로 된 정보&apos;
                  <span style={{ position: 'absolute', bottom: -4, left: 0, right: 0, height: 2, background: '#C89650', opacity: .4 }} />
                </strong>
              </h1>
              <p style={{ fontSize: 15, color: M, lineHeight: 1.85, maxWidth: 480 }}>
                {(totalTerms || 16323).toLocaleString()}개 금융 용어 · 69종 계산기 · 이벤트 캘린더<br />
                실전에 필요한 모든 정보가 한 곳에.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' as const }}>
                <button onClick={() => setActiveTab('glossary')} style={{ padding: '13px 36px', background: '#C89650', color: '#080808', border: 'none', fontSize: 12.5, fontWeight: 600, letterSpacing: '.08em', cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity .15s' }}>
                  금융 사전 열기
                </button>
                <button onClick={() => setActiveTab('calculator')} style={{ padding: '13px 32px', background: 'transparent', color: M, border: `1px solid ${isDark ? '#333' : '#bbb'}`, fontSize: 12.5, letterSpacing: '.06em', cursor: 'pointer', fontFamily: 'inherit', transition: 'color .15s,border-color .15s' }}>
                  계산기 보기
                </button>
              </div>
            </div>

            {/* Clock + Market panel */}
            <div className="dh-clock-panel" style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, border: `1px solid ${B}`, background: BG2, minWidth: 260 }}>
              <div style={{ padding: '24px 28px', borderBottom: `1px solid ${B}` }}>
                <div style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 44, fontWeight: 300, color: INK, letterSpacing: '-.04em', lineHeight: 1, marginBottom: 6 }}>
                  {kstTime}<span style={{ fontSize: 11, color: F, letterSpacing: '.14em', marginLeft: 5 }}>KST</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 12, color: F, letterSpacing: '.08em' }}>{kstDate}</div>
                <div style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 9.5, color: F2, letterSpacing: '.18em', textTransform: 'uppercase', marginTop: 2 }}>{kstDay}</div>
              </div>
              {mktItems.map((item, i) => {
                const dotColor = item.on ? ON : item.pre ? PRE : OFF;
                const statusColor = item.on ? ON : item.pre ? PRE : F;
                return (
                  <div key={item.label} className="dh-mkt-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 28px', borderBottom: i < mktItems.length - 1 ? `1px solid ${B}` : 'none' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0, display: 'inline-block', animation: item.on ? 'mktpulse 2.4s ease-in-out infinite' : 'none' }} />
                    <span style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 9.5, letterSpacing: '.16em', color: F, textTransform: 'uppercase', flex: 1 }}>{item.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 9.5, letterSpacing: '.08em', color: statusColor }}>{item.status}</span>
                    <span style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 8.5, color: F2 }}>{item.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stat ticker */}
        <div className="dh-stat-ticker" style={{ position: 'relative', zIndex: 1, borderTop: `1px solid ${B}`, background: BG2, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {[
            { label: '금융 용어',      n: c1, color: '#C89650', sub1: '9개 패밀리',     sub2: '108개 카테고리', tab: 'glossary',    arrow: true },
            { label: '계산기',          n: c2, color: '#4F7E7C', sub1: 'A/B 시나리오', sub2: '게이지 판정',    tab: 'calculator',  arrow: true },
            { label: '이벤트 캘린더',   n: c3, color: '#7C6A9B', sub1: 'FOMC · CPI',   sub2: 'K200 만기',      tab: 'events',      arrow: true },
            { label: '카테고리 패밀리', n: c4, color: '#4A7045', sub1: 'fundamental',  sub2: '→ tax·legal',    tab: null,          arrow: false },
          ].map((s, i) => (
            <div key={s.label} className="dh-stat-cell" onClick={() => s.tab && setActiveTab(s.tab)} style={{ padding: '20px 32px', borderRight: i < 3 ? `1px solid ${B}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: s.tab ? 'pointer' : 'default', position: 'relative', overflow: 'hidden' }}>
              <div className="dh-stat-topbar" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: s.color, transform: 'scaleX(0)', transformOrigin: 'left', transition: 'transform .3s cubic-bezier(.16,1,.3,1)' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 8.5, letterSpacing: '.22em', textTransform: 'uppercase', color: F, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 'clamp(28px,3vw,42px)', fontWeight: 300, letterSpacing: '-.04em', lineHeight: 1, color: s.color }}>{s.n.toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{ fontSize: 11, color: F, textAlign: 'right', lineHeight: 1.5 }}>{s.sub1}<br />{s.sub2}</div>
                {s.arrow && <span className="dh-stat-arrow" style={{ fontSize: 14, color: s.color, opacity: 0, transform: 'translate(0,0)', transition: 'opacity .14s,transform .14s' }}>↗</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ DASHBOARD WIDGETS ══ */}
      <div className="dh-widgets" style={{ borderBottom: `1px solid ${B}`, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[
          { label: '최근 본 용어',   color: '#4F7E7C', count: recentCount, sub: '이번 세션',   tab: 'glossary',    linkLabel: '사전 열기',    empty: '아직 본 용어가 없습니다.\n금융 사전에서 용어를 검색해보세요.', rows: recentTerms.map(t => ({ name: t.name, meta: t.category })) },
          { label: '즐겨찾기',       color: '#C89650', count: favCount,    sub: '저장된 용어', tab: 'glossary',    linkLabel: '사전에서 추가', empty: '★ 용어 카드에서 즐겨찾기를 추가하세요.\n로컬에 저장돼 계속 유지됩니다.', rows: [] as { name: string; meta: string }[] },
          { label: '최근 계산 기록', color: '#7C6A9B', count: calcCount,   sub: '이번 세션',   tab: 'calculator',  linkLabel: '계산기 열기',  empty: '계산 기록이 없습니다.\n계산기에서 계산을 시작해보세요.', rows: calcHist.map(h => ({ name: h.label, meta: h.results?.[0] ? `${h.results[0].value}${h.results[0].unit || ''}` : '' })) },
        ].map((w, i) => (
          <div key={w.label} className="dh-hw" style={{ borderRight: i < 2 ? `1px solid ${B}` : 'none', padding: '36px 40px', position: 'relative', overflow: 'hidden', cursor: 'default' }}>
            <div style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 9, letterSpacing: '.28em', textTransform: 'uppercase', color: w.color, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: w.color, display: 'inline-block' }} />
              {w.label}
            </div>
            <div style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 'clamp(52px,6vw,80px)', fontWeight: 300, letterSpacing: '-.05em', lineHeight: 1, marginBottom: 6, color: w.count > 0 ? w.color : F2 }}>
              {String(w.count).padStart(3, '0')}
            </div>
            <div style={{ fontSize: 12, color: F, marginBottom: 20 }}>{w.sub}</div>
            {w.count === 0 && (
              <div style={{ fontSize: 13, color: F2, fontStyle: 'italic', lineHeight: 1.8, borderLeft: `1px solid ${B}`, paddingLeft: 14 }}>
                {w.empty.split('\n').map((line, li) => <span key={li}>{line}{li === 0 && <br />}</span>)}
              </div>
            )}
            {w.rows.length > 0 && (
              <div>
                {w.rows.slice(0, 4).map((row, ri) => (
                  <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: ri < Math.min(w.rows.length, 4) - 1 ? `1px solid ${B}` : 'none' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: w.color, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: INK2, flex: 1 }}>{row.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 8.5, color: F2 }}>{row.meta}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="dh-hw-link" onClick={() => setActiveTab(w.tab)} style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: F, cursor: 'pointer', transition: 'color .14s', display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
              {w.linkLabel} →
            </div>
          </div>
        ))}
      </div>

      {/* ══ 9 FAMILIES ══ */}
      <div className="dh-families" style={{ borderBottom: `1px solid ${B}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '28px 40px 20px', borderBottom: `1px solid ${B}` }}>
          <div style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 200, color: INK, letterSpacing: '-.03em' }}>
            <span style={{ color: '#C89650', fontWeight: 500 }}>9</span>개 패밀리 — 투자의 언어
          </div>
          <div style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 9.5, color: F, letterSpacing: '.18em' }}>
            {(totalTerms || 16323).toLocaleString()} terms · 108 categories
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9,1fr)' }}>
          {FAMILIES.map((fam, i) => (
            <div key={fam.id} className="dh-fam-col" onClick={() => setActiveTab('glossary')} onMouseEnter={() => setHovFam(fam.id)} onMouseLeave={() => setHovFam(null)} style={{ borderRight: i < 8 ? `1px solid ${B}` : 'none', padding: '24px 20px 28px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div className="dh-fam-bar" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: fam.color, opacity: hovFam === fam.id ? 1 : .4, transition: 'opacity .2s' }} />
              <div style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 8, letterSpacing: '.18em', textTransform: 'uppercase', color: fam.color, marginBottom: 10 }}>{fam.en}</div>
              <div style={{ fontSize: 16, fontWeight: 300, color: INK, letterSpacing: '-.02em', marginBottom: 12, lineHeight: 1.2 }}>{fam.ko}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {fam.cats.map((c, ci) => (
                  <span key={ci} style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 8.5, color: c.startsWith('+') ? F : F2, lineHeight: 1.4, letterSpacing: '.02em' }}>{c}</span>
                ))}
              </div>
              <div className="dh-fam-arr" style={{ fontSize: 11, color: F, marginTop: 14, opacity: 0, transform: 'translateX(-4px)', transition: 'opacity .18s,transform .18s' }}>→</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ QUICK CALCS ══ */}
      <div className="dh-calcs" style={{ borderBottom: `1px solid ${B}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '28px 40px 20px', borderBottom: `1px solid ${B}` }}>
          <div style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 200, color: INK, letterSpacing: '-.03em' }}>
            실전 계산기 <span style={{ color: '#4F7E7C', fontWeight: 500 }}>69</span>종
          </div>
          <div style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 9.5, color: F, letterSpacing: '.18em' }}>A/B 시나리오 · 게이지 판정</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
          {QUICK_CALCS.map((c, i) => (
            <div key={c.id} className="dh-calc-col" onClick={() => { setSelectedCalc(c.id); setActiveTab('calculator'); }} onMouseEnter={() => setHovCalc(c.id)} onMouseLeave={() => setHovCalc(null)} style={{ borderRight: i < 6 ? `1px solid ${B}` : 'none', padding: '22px 24px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div className="dh-calc-line" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, background: '#4F7E7C', transform: hovCalc === c.id ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left', transition: 'transform .3s cubic-bezier(.16,1,.3,1)' }} />
              <div style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 9, color: F, letterSpacing: '.14em', marginBottom: 10 }}>{c.num}</div>
              <div style={{ fontSize: 13, color: INK2, lineHeight: 1.4, marginBottom: 8, fontWeight: 400 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: F2, lineHeight: 1.5 }}>{c.hint}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <div style={{ borderTop: `1px solid ${B}`, padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 300, color: INK2 }}>
          Stock<span style={{ color: '#C89650', fontWeight: 500 }}>Wi</span>Ki
          <span style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 9.5, color: F, marginLeft: 6 }}>.kr · 정보 제공 목적 · 투자 권유 아님</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono),"IBM Plex Mono",monospace', fontSize: 9, color: F }}>Designed by Ones</div>
      </div>
    </div>
  );
}
