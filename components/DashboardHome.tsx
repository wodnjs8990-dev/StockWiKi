'use client';

import { useState, useEffect, useMemo } from 'react';

/* ── Types ── */
interface RecentTerm { id: string; name: string; category: string; }
interface CalcHistEntry { id: string; label: string; results?: { label: string; value: string; unit?: string }[]; ts?: number; }
interface EventItem { dateKST?: string; date?: string; label: string; desc: string; time?: string; color: string; importance?: number; }

interface Props {
  T?: any;
  isDark: boolean;
  totalTerms: number;
  recent: any[];
  favorites: Set<string>;
  setActiveTab: (tab: string) => void;
  setSelectedCalc: (id: string) => void;
  setSelectedTerm?: (term: any) => void;
  upcomingEvents?: EventItem[];
}

/* ── Constants ── */
const FAMILIES = [
  { id: 'fundamental', color: '#c8a96e', en: 'FUNDAMENTAL', ko: '기업가치',    cnt: 247 },
  { id: 'market',      color: '#6ea8c8', en: 'MARKET',      ko: '시장·상품',  cnt: 183 },
  { id: 'macro',       color: '#8bc87a', en: 'MACRO',       ko: '거시경제',    cnt: 312 },
  { id: 'risk',        color: '#c87a8b', en: 'RISK',        ko: '리스크·퀀트', cnt: 198 },
  { id: 'derivatives', color: '#9a7ac8', en: 'DERIVATIVES', ko: '파생·헤지',   cnt: 221 },
  { id: 'trading',     color: '#c8b47a', en: 'TRADING',     ko: '실전매매',    cnt: 289 },
  { id: 'industry',    color: '#7ac8c0', en: 'INDUSTRY',    ko: '산업군',      cnt: 176 },
  { id: 'digital',     color: '#c87ab4', en: 'DIGITAL',     ko: '디지털자산',  cnt: 134 },
  { id: 'tax',         color: '#a8c87a', en: 'TAX·LEGAL',   ko: '세금·법률',   cnt: 98  },
];

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n: number) => String(n).padStart(2, '0');

/* ── Helpers ── */
function getKST() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
}

function getMkt() {
  const k = getKST(), h = k.getHours(), m = k.getMinutes(), dow = k.getDay(), hm = h * 60 + m, wd = dow >= 1 && dow <= 5;
  return {
    kospiPre:  wd && hm >= 480 && hm < 540,
    kospi:     wd && hm >= 540 && hm < 930,
    nxt:       wd && ((hm >= 480 && hm < 510) || (hm >= 540 && hm < 930)),
    k200Day:   wd && hm >= 540 && hm < 945,
    k200Night: (dow === 6 && hm < 300) || (wd && hm >= 1050) || (wd && hm < 300),
    ndx:       (dow === 6 && hm < 360) || (wd && hm >= 1410) || (wd && hm < 360),
  };
}

function todayStr() {
  const k = getKST();
  return `${k.getFullYear()}-${pad(k.getMonth() + 1)}-${pad(k.getDate())}`;
}

function getLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

function useCountUp(target: number, dur = 1300) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!target) return;
    let c = 0;
    const s = target / (dur / 16);
    const id = setInterval(() => {
      c += s;
      if (c >= target) { setV(target); clearInterval(id); }
      else setV(Math.floor(c));
    }, 16);
    return () => clearInterval(id);
  }, [target, dur]);
  return v;
}

/* ── Mini Sparkline ── */
function MiniSpark({ color = '#C89650', seed = 1, h = 24 }: { color?: string; seed?: number; h?: number }) {
  const W = 80, H = h;
  const data = Array.from({ length: 20 }, (_, i) => {
    const x = Math.sin(i * seed * 0.7 + seed) * 0.5 + Math.cos(i * seed * 0.3) * 0.3;
    return 40 + x * 25 + (i / 20) * 15;
  });
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * W).toFixed(2)},${(H - ((v - min) / range) * (H - 3) - 2).toFixed(2)}`).join(' ');
  const id = `ms${seed}${color.replace('#', '')}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}f`}>
          <feGaussianBlur stdDeviation="1" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#${id}g)`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4"
        filter={`url(#${id}f)`} style={{ filter: `drop-shadow(0 0 3px ${color}99)` }} />
    </svg>
  );
}

/* ── Glow Chart ── */
function GlowChart({ data, color, h = 70 }: { data: number[]; color: string; h?: number }) {
  const W = 300, H = h, min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => [i / (data.length - 1) * W, H - ((v - min) / range) * (H * 0.85) - H * 0.08] as [number, number]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${W},${H} L0,${H} Z`;
  const gid = `gc${color.replace('#', '')}`;
  const [lx, ly] = pts[pts.length - 1];
  const endX = Number(lx.toFixed(2));
  const endY = Number(ly.toFixed(2));
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <filter id={`${gid}g`} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="0.8" opacity="0.2" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.6"
        style={{ filter: `drop-shadow(0 0 5px ${color}99) drop-shadow(0 0 12px ${color}44)` }} />
      <circle cx={endX} cy={endY} r="3.5" fill={color}
        style={{ filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 14px ${color}66)` }} />
    </svg>
  );
}

function SurfaceFlowRail({ onGlossary, onCalculator, onEvents }: { onGlossary: () => void; onCalculator: () => void; onEvents: () => void }) {
  const nodes = [
    { label: '용어 흐름', onClick: onGlossary },
    { label: '공식 흐름', onClick: onGlossary },
    { label: '계산기 흐름', onClick: onCalculator },
    { label: '이벤트 흐름', onClick: onEvents },
  ];
  const nodeLeft = (index: number) => `${10 + (index / (nodes.length - 1)) * 80}%`;

  return (
    <div
      className="liquid-data-rail"
      aria-label="StockWiKi surface flow"
      style={{
        position: 'relative',
        height: 34,
        margin: '8px 0 13px',
        borderRadius: 14,
        background: 'linear-gradient(180deg, rgba(255,255,255,.016), rgba(0,0,0,.11)), radial-gradient(ellipse at 14% 55%, rgba(200,169,110,.065), transparent 38%), radial-gradient(ellipse at 88% 48%, rgba(110,168,200,.05), transparent 42%)',
        border: '1px solid rgba(255,255,255,.035)',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.055), inset 0 -14px 24px rgba(0,0,0,.18)',
      }}
    >
      <div
        className="liquid-data-rail-track"
        style={{
          position: 'absolute',
          left: 28,
          right: 28,
          top: 16,
          height: 1,
          borderRadius: 999,
          background: 'linear-gradient(90deg, rgba(200,169,110,.22), rgba(110,168,200,.14), rgba(139,200,122,.16))',
          boxShadow: '0 0 10px rgba(200,169,110,.08)',
        }}
      />
      <div
        className="liquid-data-rail-flow"
        style={{
          position: 'absolute',
          left: 28,
          top: 16,
          height: 1,
          width: '35%',
          borderRadius: 999,
          background: 'linear-gradient(90deg, transparent, rgba(200,169,110,.55), rgba(110,168,200,.38), transparent)',
          filter: 'drop-shadow(0 0 6px rgba(200,169,110,.28))',
          animation: 'liquidRail 7.2s cubic-bezier(.45,0,.2,1) infinite',
        }}
      />
      {nodes.map((node, i) => (
        <button
          key={node.label}
          type="button"
          className="liquid-data-node"
          aria-label={node.label}
          title={node.label}
          style={{
            position: 'absolute',
            top: 0,
            left: nodeLeft(i),
            width: 38,
            height: '100%',
            transform: 'translateX(-50%)',
            border: 0,
            background: 'transparent',
            color: 'var(--t3)',
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            padding: 0,
          }}
          onClick={node.onClick}
        >
          <span
            className="liquid-node-dot"
            style={{
              position: 'absolute',
              top: 13,
              left: '50%',
              width: 6,
              height: 6,
              transform: 'translateX(-50%)',
              borderRadius: '50%',
              background: i === 2 ? 'rgba(110,168,200,.86)' : i === 3 ? 'rgba(139,200,122,.76)' : 'rgba(200,169,110,.82)',
              boxShadow: '0 0 8px rgba(200,169,110,.36), 0 0 18px rgba(110,168,200,.1)',
            }}
          />
        </button>
      ))}
    </div>
  );
}

/* ── deterministic sparkline data ── */
function genData(base: number, len = 50, vol = 0.008): number[] {
  const d = [base];
  for (let i = 1; i < len; i++) {
    const wave = Math.sin(i * 0.71 + base * 0.001) * 0.42 + Math.cos(i * 0.29) * 0.25;
    d.push(Math.max(d[i - 1] * (1 + wave * vol), base * 0.85));
  }
  return d;
}

/* ════════════════════════════════
   MAIN COMPONENT
════════════════════════════════ */
export default function DashboardHome({
  isDark, totalTerms, recent, favorites,
  setActiveTab, setSelectedCalc, upcomingEvents = [],
}: Props) {
  const [kstTime, setKstTime]   = useState('--:--:--');
  const [kstDate, setKstDate]   = useState('');
  const [kstDay,  setKstDay]    = useState('');
  const [mkt,     setMkt]       = useState(getMkt());
  const [recentTerms, setRecentTerms] = useState<RecentTerm[]>([]);
  const [calcHist,    setCalcHist]    = useState<CalcHistEntry[]>([]);

  const c1 = useCountUp(totalTerms || 16323);
  const c2 = useCountUp(69);
  const c3 = useCountUp(200);
  const activeFocus = calcHist.length > 0 ? 'calculator' : recentTerms.length > 0 ? 'glossary' : 'surface';

  /* deterministic chart data */
  const kospiData = useMemo(() => genData(2748, 60, 0.007), []);
  const ndxData   = useMemo(() => genData(19240, 60, 0.009), []);

  /* Clock + market tick */
  useEffect(() => {
    const tick = () => {
      const k = getKST();
      setKstTime(`${pad(k.getHours())}:${pad(k.getMinutes())}:${pad(k.getSeconds())}`);
      setKstDate(`${k.getFullYear()}.${pad(k.getMonth() + 1)}.${pad(k.getDate())}`);
      setKstDay(DAY_KO[k.getDay()]);
      setMkt(getMkt());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* Recent + calc history */
  useEffect(() => {
    if (recent?.length > 0) {
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

  const active = [mkt.kospi, mkt.nxt, mkt.k200Day, mkt.k200Night, mkt.ndx].filter(Boolean).length;

  const mktItems = [
    { l: 'KOSPI',      on: mkt.kospi,     pre: mkt.kospiPre, t: '09:00–15:30' },
    { l: 'NXT',        on: mkt.nxt,       pre: false,        t: '08:00–08:30' },
    { l: 'K200F 주간', on: mkt.k200Day,   pre: false,        t: '09:00–15:45' },
    { l: 'K200F 야간', on: mkt.k200Night, pre: false,        t: '18:00–05:00' },
    { l: 'NDX',        on: mkt.ndx,       pre: false,        t: '23:30–06:00' },
  ];

  /* Upcoming events — next 4 */
  const today = todayStr();
  const upcoming = useMemo(() => {
    const getDate = (e: EventItem) => e.dateKST ?? e.date ?? '';
    if (upcomingEvents.length > 0) {
      return upcomingEvents
        .filter(e => getDate(e) >= today)
        .sort((a, b) => getDate(a).localeCompare(getDate(b)))
        .slice(0, 4);
    }
    /* fallback static */
    return [
      { dateKST: '2026-05-08', label: 'FOMC',     desc: '금리 결정 · 연준 성명', time: '04:00', color: '#4F7E7C', importance: 3 },
      { dateKST: '2026-05-12', label: 'CPI',       desc: '4월 소비자물가 (美)',    time: '22:30', color: '#9C8BBD', importance: 3 },
      { dateKST: '2026-05-14', label: 'K200만기',  desc: '5월 선물 최종거래',     time: '장후',  color: '#8A8A8A', importance: 2 },
      { dateKST: '2026-05-15', label: 'NVDA',      desc: 'Nvidia Q1 실적 · 장후', time: '장후',  color: '#7B9FDF', importance: 3 },
    ].filter(e => e.dateKST >= today).slice(0, 4);
  }, [upcomingEvents, today]);

  return (
    <div className="dash-split dash-depth-shell" style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#080808' }}>
      <div className="page-grid-bg" />
      <div className="page-scan-line" />
      {/* ════════════ LEFT PANEL ════════════ */}
      <div className="sc dash-left" style={{
        width: 'clamp(300px,36%,440px)', minWidth: 300, flexShrink: 0,
        background: 'linear-gradient(100deg, rgba(0,0,0,.30), rgba(0,0,0,.08))',
        borderRight: '1px solid rgba(255,255,255,.05)',
      }}>
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 9 }}>

          {/* ── Clock ── */}
          <div className="card depth-card home-clock-card" style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '.26em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>
              KOREA STANDARD TIME
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 40, fontWeight: 300, color: '#ffffff',
                letterSpacing: '-.04em', lineHeight: 1,
                textShadow: '0 0 30px rgba(200,150,80,.25), 0 0 60px rgba(200,150,80,.1)',
              }}>{kstTime}</div>
              <div style={{ textAlign: 'right', paddingBottom: 2 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)', marginBottom: 2 }}>{kstDate}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--t3)', textTransform: 'uppercase' }}>{kstDay}요일</div>
              </div>
            </div>
          </div>

          {/* ── Pills ── */}
          <div className="scx" style={{ display: 'flex', gap: 5, paddingBottom: 2 }}>
            {[
              { l: 'KOSPI',      on: mkt.kospi || mkt.kospiPre, pre: mkt.kospiPre && !mkt.kospi },
              { l: 'K200F 주간', on: mkt.k200Day },
              { l: 'K200F 야간', on: mkt.k200Night },
              { l: 'NDX',        on: mkt.ndx },
              { l: 'NXT',        on: mkt.nxt },
            ].map(p => (
              <div key={p.l} className={`pill${p.on ? ' on' : (p as any).pre ? ' sel' : ''}`}>
                {p.on && <span className="gdot gd-green" style={{ width: 5, height: 5 }} />}
                {(p as any).pre && !p.on && <span className="gdot gd-gold" style={{ width: 5, height: 5 }} />}
                {p.l}
              </div>
            ))}
          </div>

          {/* ── Status Grid ── */}
          <div className="status-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {/* 장중 count */}
            <div className="card depth-card edge-green" style={{ padding: '16px 18px', background: 'rgba(14,22,14,.42)', borderColor: 'rgba(74,112,69,.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(74,112,69,.18)', border: '1.5px solid rgba(74,112,69,.6)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(74,112,69,.3)',
                }}>
                  <svg viewBox="0 0 10 10" width="9" height="9">
                    <polyline points="2,5 4,7 8,3" stroke="#4A7045" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
                <span style={{ fontSize: 11, color: '#4a6a45' }}>장중</span>
              </div>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 46, fontWeight: 300, color: '#ffffff',
                letterSpacing: '-.05em', lineHeight: 1, textShadow: '0 0 30px rgba(74,112,69,.4)',
              }}>{active}</div>
            </div>
            {/* 장외 count */}
            <div className="card depth-card edge-red" style={{ padding: '16px 18px', background: 'rgba(18,12,12,.42)', borderColor: 'rgba(184,64,64,.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                  <path d="M8 2.5 L13.5 12.5 L2.5 12.5 Z" fill="rgba(184,64,64,.12)" stroke="#b84040" strokeWidth="1.4" strokeLinejoin="round" />
                  <line x1="8" y1="7" x2="8" y2="10" stroke="#b84040" strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="8" cy="11.5" r=".8" fill="#b84040" />
                </svg>
                <span style={{ fontSize: 11, color: '#6a3a3a' }}>장외</span>
              </div>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 46, fontWeight: 300, color: '#3a3030',
                letterSpacing: '-.05em', lineHeight: 1,
              }}>{5 - active}</div>
            </div>
          </div>

          {/* ── Liquid Hero Surface ── */}
          <div className={`card sw-home-surface depth-card ${activeFocus === 'surface' || activeFocus === 'glossary' ? 'active-surface' : ''}`} style={{ padding: '20px 22px 18px' }}>
            <div className="sw-home-liquid-core" aria-hidden="true">
              <span className="liquid-core-band liquid-core-band-a" />
              <span className="liquid-core-band liquid-core-band-b" />
              <span className="liquid-core-line liquid-core-line-a" />
              <span className="liquid-core-line liquid-core-line-b" />
            </div>
            <div className="sw-home-edge-light" aria-hidden="true" />
            <div className="sw-home-inner-pocket" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 7 }}>
                  FINANCIAL CONTROL SURFACE
                </div>
                <div style={{ fontSize: 24, fontWeight: 300, color: '#fff', letterSpacing: '-.04em', lineHeight: 1 }}>
                  Stock<span style={{ color: 'var(--gold)', fontWeight: 500 }}>Wi</span>Ki
                </div>
              </div>
              <button onClick={() => setActiveTab('glossary')} style={{
                fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t3)',
                cursor: 'pointer', background: 'none', border: 'none',
              }}>↗</button>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.72, margin: '14px 0 14px', maxWidth: 360 }}>
              용어, 공식, 계산기, 이벤트를 하나의 흐름으로 연결하는 투자 언어 인터페이스.
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 2 }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 38, fontWeight: 300, color: '#ffffff',
                letterSpacing: '-.04em', lineHeight: 1,
                textShadow: '0 0 30px rgba(200,150,80,.45), 0 0 60px rgba(200,150,80,.15)',
              }}>{c1.toLocaleString()}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)' }}>terms</span>
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t3)', marginBottom: 12 }}>
              9 families · 108 categories
            </div>
            <SurfaceFlowRail
              onGlossary={() => setActiveTab('glossary')}
              onCalculator={() => setActiveTab('calculator')}
              onEvents={() => setActiveTab('events')}
            />
            <div className="sw-home-line">
              <GlowChart data={kospiData} color="#C89650" h={68} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              {['FUN', 'MKT', 'MAC', 'RSK', 'DRV', 'TRD', 'IND', 'DIG', 'TAX'].map(l => (
                <div key={l} style={{ fontFamily: 'var(--mono)', fontSize: 6, color: 'var(--t4)' }}>{l}</div>
              ))}
            </div>
          </div>

          {/* ── KPI Mini ── */}
          <div className="kpi-mini-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { l: '계산기', v: c2, c: '#4a9e9a', sub: '69종 전체', tab: 'calculator' },
              { l: '이벤트', v: c3, c: '#7C6A9B', sub: '200+ 예정', tab: 'events' },
            ].map(k => (
              <div key={k.l} className={`card depth-card ${activeFocus === k.tab ? 'active-surface' : ''}`} onClick={() => setActiveTab(k.tab)}
                style={{ padding: '14px 16px', cursor: 'pointer' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--t2)', marginBottom: 5 }}>{k.l}</div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 300, color: k.c,
                  letterSpacing: '-.04em', lineHeight: 1,
                  textShadow: `0 0 20px ${k.c}88, 0 0 40px ${k.c}33`,
                }}>{k.v}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t3)', marginTop: 4 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* ── CTA ── */}
          <div className="cta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button className="btn-gold" onClick={() => setActiveTab('glossary')}>사전 열기 →</button>
            <button className="btn-ghost" onClick={() => setActiveTab('calculator')}>계산기 →</button>
          </div>

          {/* ── CTA Support Surface ── */}
          <div className="sw-home-meta-surface active-surface">
            <div className="sw-home-meta-line" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t3)', letterSpacing: '.22em', marginBottom: 6 }}>SURFACE READY</div>
                <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.55 }}>사전과 계산기로 이어지는 단일 진입면</div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t3)', textAlign: 'right' }}>v2<br />2026</div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════ RIGHT — BENTO GRID ════════════ */}
      <div className="sc dash-bento" style={{
        flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr',
        gridAutoRows: 'min-content', gap: 10, padding: '12px',
        background: 'linear-gradient(160deg,rgba(255,255,255,.026) 0%,rgba(0,0,0,.18) 100%)',
        alignContent: 'start',
      }}>

        {/* ── Index Charts ── */}
        {[
          { n: 'KOSPI INDEX', status: 'UNIMPLEMENTED', c: '#C89650', d: kospiData, tone: 'gold' as const },
          { n: 'NASDAQ 100', status: 'UNIMPLEMENTED', c: '#6ea8c8', d: ndxData, tone: 'blue' as const },
        ].map(idx => (
          <div key={idx.n} className="card depth-card index-card" style={{ padding: '18px 20px', cursor: 'pointer' }}
            onClick={() => setActiveTab('glossary')}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--t2)', marginBottom: 5 }}>
                  {idx.n}
                </div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: idx.c,
                  letterSpacing: '.08em', lineHeight: 1.15,
                  textShadow: `0 0 25px ${idx.c}66, 0 0 50px ${idx.c}22`,
                }}>{idx.status}</div>
              </div>
              <div style={{ textAlign: 'right', paddingTop: 2 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)', letterSpacing: '.16em' }}>
                  PENDING
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t3)', marginTop: 3 }}>DATA API</div>
              </div>
            </div>
            <GlowChart data={idx.d} color={idx.c} h={58} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: 'var(--t3)' }}>MARKET DATA</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 7.5, color: 'var(--t3)' }}>NOT LIVE</span>
            </div>
          </div>
        ))}

        {/* ── Featured Term — wide ── */}
        <div className="card depth-card bento-wide featured-term-card" style={{
          gridColumn: '1/3', padding: '22px 24px', cursor: 'pointer',
          background: 'rgba(20,18,30,.44)',
        }} onClick={() => setActiveTab('glossary')}>
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(ellipse,rgba(154,122,200,.15) 0%,transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{
                  width: 3, height: 26, background: '#9a7ac8', borderRadius: 2,
                  display: 'inline-block', boxShadow: '0 0 8px rgba(154,122,200,.8)',
                }} />
                <div>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '.22em',
                    textTransform: 'uppercase', color: '#9a7ac8', marginBottom: 2,
                    textShadow: '0 0 8px rgba(154,122,200,.6)',
                  }}>DERIVATIVES · 오늘의 용어</div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--t1)', letterSpacing: '-.02em' }}>블랙-숄즈 모형</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic', marginBottom: 8 }}>Black-Scholes Model</div>
              <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.75, maxWidth: 440 }}>
                옵션의 이론적 가격을 계산하기 위한 수학적 모델. 주가, 행사가, 변동성(σ), 무위험이자율, 만기까지의 시간을 입력으로 받아 콜·풋 옵션의 공정가치를 도출합니다.
              </div>
            </div>
            <div style={{
              flexShrink: 0, textAlign: 'center', padding: '14px 20px',
              background: 'rgba(0,0,0,.3)', borderRadius: 12, border: '1px solid rgba(255,255,255,.05)',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '.14em', color: 'var(--t3)', marginBottom: 8 }}>핵심 공식</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: '#9a7ac8', textShadow: '0 0 12px rgba(154,122,200,.6)' }}>
                C = S·N(d₁) − K·e⁻ʳᵀ·N(d₂)
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--t3)' }}>자세히 보기</span>
            <span style={{ fontSize: 10, color: 'var(--t3)' }}>→</span>
          </div>
        </div>

        {/* ── Upcoming Events ── */}
        <div className="card depth-card" style={{ padding: '18px 20px', cursor: 'pointer' }} onClick={() => setActiveTab('events')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--t2)' }}>
              다음 이벤트
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t3)' }}>↗</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {upcoming.map((ev, i) => {
              const evDate = ev.dateKST ?? ev.date ?? '';
              const diff = Math.round(
                (new Date(evDate + 'T00:00:00+09:00').getTime() - new Date(today + 'T00:00:00+09:00').getTime()) / 86400000
              );
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                  borderRadius: 8, background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.04)',
                }}>
                  <div style={{ width: 3, height: 32, borderRadius: 2, background: ev.color, flexShrink: 0, boxShadow: `0 0 6px ${ev.color}66` }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--t1)', marginBottom: 1 }}>{ev.label}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t3)' }}>
                      {evDate.slice(5)} · {ev.desc.slice(0, 18)}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: ev.color, textShadow: `0 0 10px ${ev.color}88` }}>
                    {diff === 0 ? 'D-Day' : `D-${diff}`}
                  </div>
                </div>
              );
            })}
            {upcoming.length === 0 && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)', textAlign: 'center', padding: '20px 0' }}>
                예정된 이벤트 없음
              </div>
            )}
          </div>
        </div>

        {/* ── Market Schedule ── */}
        <div className="card depth-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--t2)', marginBottom: 14 }}>
            시장 스케줄
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mktItems.map((m, i) => {
              const c = m.on ? '#4A7045' : m.pre ? 'var(--gold)' : '#252522';
              const tc = m.on ? '#6aaa64' : m.pre ? 'var(--gold)' : 'var(--t3)';
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
                  borderBottom: i < mktItems.length - 1 ? '1px solid rgba(255,255,255,.04)' : undefined,
                }}>
                  <span className="gdot" style={{
                    background: c,
                    boxShadow: m.on ? `0 0 5px ${c}, 0 0 10px ${c}44` : undefined,
                    animation: m.on ? 'mktpulse 2.2s ease-in-out infinite' : undefined,
                  }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--t2)', flex: 1 }}>{m.l}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t3)' }}>{m.t}</span>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9.5, color: tc,
                    textShadow: m.on ? `0 0 8px ${c}88` : undefined,
                  }}>{m.on ? '장중' : m.pre ? '프리' : '장외'}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.04)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t3)', marginBottom: 4 }}>SCHEDULE OFFSET</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 300, color: 'var(--t1)', letterSpacing: '-.04em' }}>± 2.5</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)' }}>min</span>
            </div>
          </div>
        </div>

        {/* ── 9 Families Bento ── */}
        <div className="card depth-card bento-wide" style={{ gridColumn: '1/3', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 300, color: 'var(--t1)' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 500 }}>9</span>개 패밀리 — 투자의 언어
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t3)' }}>
              {(totalTerms || 16323).toLocaleString()} TERMS
            </div>
          </div>
          <div className="fam-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(9,1fr)', gap: 6 }}>
            {FAMILIES.map(f => (
              <div key={f.id} className="card-sm depth-card-mini" onClick={() => setActiveTab('glossary')}
                style={{ padding: '12px 10px', cursor: 'pointer' }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: f.color, borderRadius: '12px 12px 0 0', opacity: 0.35,
                  boxShadow: `0 0 6px ${f.color}44`,
                }} />
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 7, letterSpacing: '.14em',
                  textTransform: 'uppercase', color: f.color, marginBottom: 5,
                  textShadow: `0 0 8px ${f.color}55`,
                }}>{f.en.slice(0, 5)}</div>
                <div style={{ fontSize: 11, fontWeight: 400, color: '#8a8680', marginBottom: 3 }}>{f.ko}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t3)' }}>{f.cnt}</div>
                <div style={{ marginTop: 8 }}>
                  <MiniSpark color={f.color} seed={f.id.charCodeAt(0) % 7 + 1} h={20} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent / Favorites / Calc History ── */}
        {[
          {
            label: '최근 본 용어', color: '#4F7E7C', tab: 'glossary',
            rows: recentTerms.map(t => ({ name: t.name, meta: t.category })),
            empty: '아직 본 용어가 없습니다',
          },
          {
            label: '즐겨찾기', color: '#C89650', tab: 'glossary',
            rows: [] as { name: string; meta: string }[],
            count: favorites.size,
            empty: '★ 용어 카드에서 추가',
          },
          {
            label: '최근 계산 기록', color: '#7C6A9B', tab: 'calculator',
            rows: calcHist.map(h => ({ name: h.label, meta: h.results?.[0] ? `${h.results[0].value}${h.results[0].unit || ''}` : '' })),
            empty: '계산 기록이 없습니다',
          },
        ].map((w, wi) => (
          <div key={w.label} className="card depth-card" style={{ padding: '18px 20px', cursor: 'pointer' }} onClick={() => setActiveTab(w.tab)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <span className="gdot" style={{ background: w.color, boxShadow: `0 0 5px ${w.color}` }} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '.18em', textTransform: 'uppercase', color: w.color }}>
                {w.label}
              </div>
            </div>
            {w.rows.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {w.rows.slice(0, 4).map((row, ri) => (
                  <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: ri < 3 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: w.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t1)', flex: 1 }}>{row.name}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--t3)' }}>{row.meta}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)', padding: '12px 0', lineHeight: 1.7 }}>
                {w.empty}
              </div>
            )}
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--t3)',
              marginTop: 12, letterSpacing: '.1em', textTransform: 'uppercase',
            }}>열기 →</div>
          </div>
        ))}
      </div>
    </div>
  );
}
