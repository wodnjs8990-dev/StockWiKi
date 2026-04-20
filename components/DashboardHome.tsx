'use client';

import { useState, useEffect } from 'react';

// ── 타입
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

// ── 카테고리 색상
const CAT_COLORS: Record<string, string> = {
  '밸류에이션': '#C89650', '기업재무': '#E8B170', '회계심화': '#9A7A4A',
  '수익성': '#A63D33', '배당': '#C75A4E', '한국시장': '#7E2F28',
  '포트폴리오': '#4F7E7C', '퀀트통계': '#3A605E', '재무안정성': '#6FA09E',
  '거시경제': '#7C6A9B', '미시경제': '#5E4F7A', '해외주식ETF': '#9C8BBD',
  '선물옵션': '#6B6B6B', '파생헤지': '#4f4f4f', '기술적지표': '#8a8a8a',
  '시장거래': '#8A8A8A', '차트심리': '#4f4f4f',
};

// ── 5 Hue Families
const FAMILIES = [
  { id: 'value',  color: '#C89650', en: 'VALUE',  ko: '가치',  cats: ['밸류에이션', '기업재무', '회계심화'] },
  { id: 'profit', color: '#A63D33', en: 'PROFIT', ko: '수익',  cats: ['수익성', '배당', '한국시장'] },
  { id: 'risk',   color: '#4F7E7C', en: 'RISK',   ko: '리스크', cats: ['포트폴리오', '퀀트통계', '재무안정성'] },
  { id: 'macro',  color: '#7C6A9B', en: 'MACRO',  ko: '거시',  cats: ['거시경제', '미시경제', '해외주식ETF'] },
  { id: 'trade',  color: '#6B6B6B', en: 'TRADE',  ko: '실전',  cats: ['선물옵션', '파생헤지', '기술적지표'] },
];

// ── 빠른 계산기
const QUICK_CALCS = [
  { id: 'per',   num: 'M01', name: 'PER · EPS 계산기' },
  { id: 'pbr',   num: 'M02', name: 'PBR · BPS 계산기' },
  { id: 'dcf',   num: 'M05', name: 'DCF 간이 평가' },
  { id: 'roe',   num: 'M07', name: 'ROE · ROA 계산기' },
  { id: 'bs',    num: 'M24', name: '블랙-숄즈 옵션가' },
  { id: 'kelly', num: 'M29', name: '켈리 공식' },
  { id: 'var',   num: 'M31', name: 'VaR 추정' },
];

// ── 거래시간 로직 (KST 기준)
function getMarketStatus(h: number, m: number, dow: number) {
  const hm = h * 60 + m;
  const isWeekday = dow >= 1 && dow <= 5;
  return {
    kospi:      isWeekday && hm >= 9*60 && hm < 15*60+30,
    kospiPre:   isWeekday && hm >= 8*60 && hm < 9*60,
    nxt:        isWeekday && ((hm >= 8*60 && hm < 8*60+30) || (hm >= 16*60 && hm < 20*60)),
    k200Day:    isWeekday && hm >= 9*60 && hm < 15*60+45,
    k200Night:  dow !== 6 && (hm >= 18*60 || hm < 6*60) && !(dow === 0 && hm < 18*60),
    ndx:        (isWeekday || dow === 0) && (hm >= 23*60+30 || hm < 6*60),
  };
}

const DAY_KO = ['일요일 · Sun', '월요일 · Mon', '화요일 · Tue', '수요일 · Wed', '목요일 · Thu', '금요일 · Fri', '토요일 · Sat'];
const pad = (n: number) => String(n).padStart(2, '0');

function getLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

export default function DashboardHome({ T, isDark, totalTerms, recent, favorites, setActiveTab, setSelectedCalc, setSelectedTerm }: Props) {
  const [kstTime, setKstTime] = useState('--:--:--');
  const [kstDate, setKstDate] = useState('');
  const [kstDay, setKstDay] = useState('');
  const [mkt, setMkt] = useState({ kospi: false, kospiPre: false, nxt: false, k200Day: false, k200Night: false, ndx: false });
  const [recentTerms, setRecentTerms] = useState<RecentTerm[]>([]);
  const [calcHist, setCalcHist] = useState<CalcHistEntry[]>([]);
  const [hoveredFam, setHoveredFam] = useState<string | null>(null);
  const [hoveredQC, setHoveredQC] = useState<string | null>(null);
  const [hoveredFeat, setHoveredFeat] = useState<string | null>(null);

  // 시계 + 장상태
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const kst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      const h = kst.getHours(), m = kst.getMinutes(), s = kst.getSeconds(), dow = kst.getDay();
      setKstTime(`${pad(h)}:${pad(m)}:${pad(s)}`);
      setMkt(getMarketStatus(h, m, dow));
      if (!kstDate) {
        const y = kst.getFullYear(), mo = pad(kst.getMonth() + 1), d = pad(kst.getDate());
        setKstDate(`${y}.${mo}.${d}`);
        setKstDay(DAY_KO[dow]);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // 날짜는 하루에 한 번만 업데이트
  useEffect(() => {
    const now = new Date();
    const kst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const y = kst.getFullYear(), mo = pad(kst.getMonth() + 1), d = pad(kst.getDate());
    setKstDate(`${y}.${mo}.${d}`);
    setKstDay(DAY_KO[kst.getDay()]);
  }, []);

  // localStorage 데이터
  useEffect(() => {
    // 최근 본 용어: prop으로 받은 recent 우선, 없으면 LS fallback
    if (recent && recent.length > 0) {
      setRecentTerms(recent.slice(0, 4).map(t => ({ id: t.id, name: t.name, category: t.category })));
    } else {
      const ids: string[] = getLS('stockwiki_recent', []);
      setRecentTerms(ids.slice(0, 4).map(id => {
        const cached = getLS<any>(`stockwiki_term_cache_${id}`, null);
        return { id, name: cached?.name || id.toUpperCase(), category: cached?.category || '' };
      }));
    }
    // 계산 기록
    setCalcHist(getLS<CalcHistEntry[]>('stockwiki_calc_history', []).slice(0, 5));
  }, [recent]);

  const ON  = T.green  || '#4A7045';
  const PRE = T.accent || '#C89650';
  const OFF = isDark ? '#5a5a5a' : '#aaa8a4';

  const kospiColor = mkt.kospi ? ON : mkt.kospiPre ? PRE : OFF;
  const kospiText  = mkt.kospi ? '장중 · OPEN' : mkt.kospiPre ? '프리마켓' : '장외 · CLOSED';

  const dot = (on: boolean, pre = false) => on ? ON : pre ? PRE : OFF;
  const lbl = (on: boolean, pre: boolean, onT: string, preT: string, offT: string) => on ? onT : pre ? preT : offT;

  const favArr = Array.from(favorites);
  const favCount = favArr.length;

  const FEAT_CARDS = [
    { id: 'glossary',  num: '01', icon: '📖', title: '금융 사전',     desc: '주식·선물·옵션·거시경제·회계·퀀트·산업군 특화까지 91개 카테고리, 12,136개 용어. 공식·예시·관련 용어가 한 카드에.', count: `${totalTerms.toLocaleString()} terms`, color: '#C89650' },
    { id: 'calculator',num: '02', icon: '🧮', title: '실전 계산기',    desc: 'PER·DCF·Black-Scholes·Kelly·VaR·양도세까지 69개 계산기. A/B 시나리오 비교, 게이지 판정.', count: '69 calcs', color: '#4F7E7C' },
    { id: 'events',    num: '03', icon: '📅', title: '이벤트 캘린더',  desc: 'FOMC·CPI·어닝시즌·K200 만기·국채 입찰까지. 연간 일정을 5 family 색상으로 분류.', count: '연간 200+ 이벤트', color: '#7C6A9B' },
    { id: 'favorites', num: '04', icon: '⭐', title: '즐겨찾기',       desc: '자주 보는 용어를 즐겨찾기로 모아두고, 개인 메모와 함께 관리. 로컬에 저장되어 계속 유지.', count: `${favCount} saved`, color: '#C89650' },
  ];

  const secLabel = (text: string) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: 'var(--font-mono), monospace', fontSize: 10,
      letterSpacing: '0.28em', textTransform: 'uppercase', color: isDark ? '#5a5a5a' : '#aaa8a4',
      marginBottom: 14,
    }}>
      <span style={{ color: T.accent }}>§</span>
      {text}
      <span style={{ flex: 1, height: 1, background: isDark ? '#252525' : '#e0ddd4' }} />
    </div>
  );

  const wLabel = (text: string, dotColor: string) => (
    <div style={{
      fontFamily: 'var(--font-mono), monospace', fontSize: 9.5,
      letterSpacing: '0.28em', textTransform: 'uppercase', color: isDark ? '#5a5a5a' : '#aaa8a4',
      marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      {text}
    </div>
  );

  const BGSURFACE = isDark ? '#141414' : '#fffef9';
  const BGCARD    = isDark ? '#0f0f0f' : '#f0ede4';
  const BGHOVER   = isDark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.035)';
  const BORDER    = T.border || '#2a2a2a';
  const BORDERSOFT = isDark ? '#252525' : '#e0ddd4';

  return (
    <div style={{ background: T.bgPage || T.bg, minHeight: '100vh', color: T.text, overflowX: 'hidden' }}>

      {/* ── Market Strip ── */}
      <div style={{
        background: BGSURFACE,
        borderBottom: `1px solid ${BORDER}`,
        height: 34,
        display: 'flex',
        alignItems: 'stretch',
        position: 'sticky',
        top: 52,
        zIndex: 29,
        overflow: 'hidden',
      }}>
        <div style={{
          maxWidth: 1360, margin: '0 auto', padding: '0 24px',
          display: 'flex', alignItems: 'stretch', width: '100%',
          overflow: 'hidden',
        }}>
          {/* KOSPI */}
          <MktCell name="KOSPI" borderColor={BORDERSOFT}>
            <MktSession dotColor={dot(mkt.kospi, mkt.kospiPre)} label={lbl(mkt.kospi, mkt.kospiPre, '장중', '프리', '장외')} live={mkt.kospi} />
          </MktCell>
          {/* NXT */}
          <MktCell name="NXT" borderColor={BORDERSOFT}>
            <MktSession dotColor={dot(mkt.nxt)} label={lbl(mkt.nxt, false, '장중', '', '장외')} live={mkt.nxt} />
          </MktCell>
          {/* K200F */}
          <MktCell name="K200F" borderColor={BORDERSOFT}>
            <MktSession dotColor={dot(mkt.k200Day)} label={mkt.k200Day ? '주간 ●' : '주간 ○'} live={mkt.k200Day} />
            <span style={{ width: 1, height: 12, background: isDark ? '#3a3a3a' : '#c8c4b8', margin: '0 4px' }} />
            <MktSession dotColor={dot(mkt.k200Night)} label={mkt.k200Night ? '야간 ●' : '야간 ○'} live={mkt.k200Night} />
          </MktCell>
          {/* NDX */}
          <MktCell name="NDX" borderColor={BORDERSOFT}>
            <MktSession dotColor={dot(mkt.ndx)} label={lbl(mkt.ndx, false, '장중', '', '장외')} live={mkt.ndx} />
          </MktCell>
          {/* 시계 — Market Strip 우측 (삭제됨, 날짜 위젯으로 이동) */}
        </div>
      </div>

      {/* ── Page Body ── */}
      <div className="dashboard-page-body" style={{ maxWidth: 1360, margin: '0 auto', padding: '28px 24px 60px' }}>

        {/* ── 위젯 Row ── */}
        {secLabel('오늘의 현황 · Dashboard')}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1, background: BORDERSOFT,
          border: `1px solid ${BORDERSOFT}`,
          marginBottom: 28,
        }}
          className="dashboard-widgets"
        >
          {/* W1: 날짜·시계 */}
          <div style={{ background: BGSURFACE, padding: '18px 20px' }}>
            {wLabel('날짜 · 장상태', T.accent)}
            <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 28, fontWeight: 500, letterSpacing: '-0.01em', color: T.textPrimary, lineHeight: 1.1, marginBottom: 4 }}>
              {kstDate}
            </div>
            <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: isDark ? '#7a7a7a' : '#888380', letterSpacing: '0.08em', marginBottom: 10 }}>
              {kstDay}
            </div>
            {/* KST 시계 */}
            <div style={{
              fontFamily: 'var(--font-mono), monospace', fontSize: 18, fontWeight: 400,
              letterSpacing: '0.08em', color: isDark ? '#5a5a5a' : '#aaa8a4',
              marginBottom: 2,
            }}>
              {kstTime}
              <span style={{ fontSize: 10, marginLeft: 6, letterSpacing: '0.18em' }}>KST</span>
            </div>
          </div>

          {/* W2: 최근 본 용어 */}
          <div
            style={{ background: BGSURFACE, padding: '18px 20px', cursor: 'default' }}
            onMouseEnter={e => (e.currentTarget.style.background = BGHOVER)}
            onMouseLeave={e => (e.currentTarget.style.background = BGSURFACE)}
          >
            {wLabel('최근 본 용어', '#4F7E7C')}
            {recentTerms.length === 0 ? (
              <div style={{ fontSize: 12, color: isDark ? '#5a5a5a' : '#aaa8a4', fontStyle: 'italic' }}>아직 본 용어가 없습니다</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentTerms.map((t, i) => {
                  const col = CAT_COLORS[t.category] || T.accent;
                  return (
                    <div key={t.id}
                      onClick={() => setActiveTab('glossary')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 0',
                        borderBottom: i < recentTerms.length - 1 ? `1px dashed ${BORDERSOFT}` : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: col, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                      <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9.5, color: isDark ? '#5a5a5a' : '#aaa8a4', letterSpacing: '0.05em', flexShrink: 0 }}>{t.category}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* W3: 즐겨찾기 */}
          <div
            style={{ background: BGSURFACE, padding: '18px 20px', cursor: 'default' }}
            onMouseEnter={e => (e.currentTarget.style.background = BGHOVER)}
            onMouseLeave={e => (e.currentTarget.style.background = BGSURFACE)}
          >
            {wLabel('즐겨찾기', T.accent)}
            <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 42, fontWeight: 400, letterSpacing: '-0.02em', color: T.accent, lineHeight: 1, marginBottom: 6 }}>
              {String(favCount).padStart(3, '0')}
            </div>
            <div style={{ fontSize: 12, color: isDark ? '#7a7a7a' : '#888380' }}>즐겨찾기한 용어</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginTop: 12 }}>
              {favCount === 0 ? (
                <div style={{ fontSize: 12, color: isDark ? '#5a5a5a' : '#aaa8a4', fontStyle: 'italic' }}>★ 용어에서 즐겨찾기 추가</div>
              ) : (
                favArr.slice(0, 6).map(id => (
                  <span key={id}
                    onClick={() => setActiveTab('glossary')}
                    style={{
                      fontFamily: 'var(--font-mono), monospace', fontSize: 9.5,
                      padding: '3px 8px', border: `1px solid ${BORDER}`,
                      color: T.textMuted, letterSpacing: '0.04em', cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = T.textMuted; }}
                  >
                    {id.toUpperCase()}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* W4: 계산 기록 */}
          <div
            style={{ background: BGSURFACE, padding: '18px 20px', cursor: 'default' }}
            onMouseEnter={e => (e.currentTarget.style.background = BGHOVER)}
            onMouseLeave={e => (e.currentTarget.style.background = BGSURFACE)}
          >
            {wLabel('최근 계산 기록', '#7C6A9B')}
            {calcHist.length === 0 ? (
              <div style={{ fontSize: 12, color: isDark ? '#5a5a5a' : '#aaa8a4', fontStyle: 'italic' }}>계산 기록이 없습니다</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {calcHist.map((entry, i) => {
                  const res = entry.results?.[entry.results.length - 1];
                  const val = res ? `${res.value}${res.unit ? ' ' + res.unit : ''}` : '—';
                  return (
                    <div key={i}
                      onClick={() => { setSelectedCalc(entry.id); setActiveTab('calculator'); }}
                      style={{
                        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8,
                        padding: '7px 0',
                        borderBottom: i < calcHist.length - 1 ? `1px dashed ${BORDERSOFT}` : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 12.5, color: T.textMuted, flex: 1 }}>{entry.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: T.text, letterSpacing: '-0.01em' }}>{val}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Feature Cards ── */}
        {secLabel('기능 바로가기 · Features')}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1, background: BORDERSOFT,
          border: `1px solid ${BORDERSOFT}`,
        }}
          className="dashboard-feats"
        >
          {FEAT_CARDS.map(fc => {
            const hovered = hoveredFeat === fc.id;
            return (
              <div key={fc.id}
                onClick={() => setActiveTab(fc.id)}
                onMouseEnter={() => setHoveredFeat(fc.id)}
                onMouseLeave={() => setHoveredFeat(null)}
                style={{
                  background: hovered ? BGHOVER : BGCARD,
                  padding: '28px 24px 24px',
                  display: 'flex', flexDirection: 'column',
                  cursor: 'pointer',
                  position: 'relative', overflow: 'hidden',
                  transition: 'background 0.18s',
                }}
              >
                {/* 상단 accent line */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: fc.color,
                  transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left',
                  transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
                }} />
                <div style={{
                  fontFamily: 'var(--font-mono), monospace', fontSize: 9.5,
                  letterSpacing: '0.28em', textTransform: 'uppercase' as const,
                  color: isDark ? '#5a5a5a' : '#aaa8a4', marginBottom: 8,
                }}>{fc.num}</div>
                <div style={{
                  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${hovered ? fc.color : BORDER}`,
                  marginBottom: 16, fontSize: 16,
                  transition: 'border-color 0.2s',
                }}>{fc.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em', color: T.textPrimary, marginBottom: 8, lineHeight: 1.2 }}>{fc.title}</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.6, color: T.textMuted, flex: 1, marginBottom: 20 }}>{fc.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: isDark ? '#5a5a5a' : '#aaa8a4', letterSpacing: '0.05em' }}>{fc.count}</span>
                  <span style={{
                    fontSize: 14, color: fc.color,
                    opacity: hovered ? 1 : 0,
                    transform: hovered ? 'translate(2px,-2px)' : 'translate(0,0)',
                    transition: 'opacity 0.18s, transform 0.18s',
                  }}>↗</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bottom: Family Map + Quick Calc ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 360px',
          gap: 1, background: BORDERSOFT,
          border: `1px solid ${BORDERSOFT}`,
          marginTop: 28,
        }}
          className="dashboard-bottom"
        >
          {/* 5 Hue Family 지도 */}
          <div style={{ background: BGSURFACE, padding: 20 }}>
            <div style={{
              fontFamily: 'var(--font-mono), monospace', fontSize: 9.5,
              letterSpacing: '0.28em', textTransform: 'uppercase' as const,
              color: isDark ? '#5a5a5a' : '#aaa8a4', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ color: T.accent }}>§</span>
              5 Hue Families · 카테고리 지도
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 1, background: BORDERSOFT,
            }}
              className="dashboard-fam"
            >
              {FAMILIES.map(fam => {
                const hov = hoveredFam === fam.id;
                return (
                  <div key={fam.id}
                    onClick={() => setActiveTab('glossary')}
                    onMouseEnter={() => setHoveredFam(fam.id)}
                    onMouseLeave={() => setHoveredFam(null)}
                    style={{
                      background: hov ? BGHOVER : BGCARD,
                      padding: '14px 16px',
                      cursor: 'pointer',
                      position: 'relative', overflow: 'hidden',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: fam.color }} />
                    <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: fam.color, marginBottom: 5 }}>{fam.en}</div>
                    <div style={{ fontSize: 14, fontWeight: 400, color: T.textPrimary, marginBottom: 6, letterSpacing: '-0.01em' }}>{fam.ko}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {fam.cats.map(c => (
                        <span key={c} style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 9, color: isDark ? '#5a5a5a' : '#aaa8a4', letterSpacing: '0.04em' }}>{c}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Calc */}
          <div style={{ background: BGSURFACE, padding: 20, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              fontFamily: 'var(--font-mono), monospace', fontSize: 9.5,
              letterSpacing: '0.28em', textTransform: 'uppercase' as const,
              color: isDark ? '#5a5a5a' : '#aaa8a4', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ color: T.accent }}>§</span>
              빠른 계산기 · Quick Access
            </div>
            <div>
              {QUICK_CALCS.map((qc, i) => {
                const hov = hoveredQC === qc.id;
                return (
                  <div key={qc.id}
                    onClick={() => { setSelectedCalc(qc.id); setActiveTab('calculator'); }}
                    onMouseEnter={() => setHoveredQC(qc.id)}
                    onMouseLeave={() => setHoveredQC(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 10px',
                      border: `1px solid ${hov ? BORDER : 'transparent'}`,
                      borderBottom: `1px solid ${BORDERSOFT}`,
                      ...(i === QUICK_CALCS.length - 1 ? { borderBottom: 'none' } : {}),
                      cursor: 'pointer',
                      background: hov ? BGHOVER : 'transparent',
                      transition: 'background 0.12s, border-color 0.12s',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, letterSpacing: '0.1em', color: isDark ? '#5a5a5a' : '#aaa8a4', width: 24, flexShrink: 0 }}>{qc.num}</span>
                    <span style={{ fontSize: 13, color: hov ? T.textPrimary : T.text, flex: 1, transition: 'color 0.12s' }}>{qc.name}</span>
                    <span style={{
                      fontSize: 12, color: hov ? T.accent : (isDark ? '#5a5a5a' : '#aaa8a4'),
                      transform: hov ? 'translateX(2px)' : 'translateX(0)',
                      transition: 'color 0.12s, transform 0.12s',
                    }}>→</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* pulse 애니메이션 */}
      <style>{`
        @keyframes mktpulse { 0%,100%{opacity:1} 50%{opacity:.25} }
        @media(max-width:900px){
          .dashboard-widgets { grid-template-columns: repeat(2,1fr) !important; }
          .dashboard-feats   { grid-template-columns: repeat(2,1fr) !important; }
          .dashboard-bottom  { grid-template-columns: 1fr !important; }
        }
        @media(max-width:600px){
          .dashboard-widgets { grid-template-columns: 1fr !important; }
          .dashboard-feats   { grid-template-columns: 1fr !important; }
          .dashboard-fam     { grid-template-columns: repeat(2,1fr) !important; }
          .dashboard-page-body { padding: 16px 12px 60px !important; }
        }
        @media(max-width:400px){
          .dashboard-fam     { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ── 서브 컴포넌트
function MktCell({ name, borderColor, children }: { name: string; borderColor: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '0 20px',
      borderRight: `1px solid ${borderColor}`,
    }}>
      <span style={{
        fontFamily: 'var(--font-mono), monospace', fontSize: 10,
        letterSpacing: '0.18em', textTransform: 'uppercase' as const,
        color: '#5a5a5a', whiteSpace: 'nowrap', flexShrink: 0,
      }}>{name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{children}</div>
    </div>
  );
}

function MktSession({ dotColor, label, live }: { dotColor: string; label: string; live: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: dotColor,
        ...(live ? { animation: 'mktpulse 2.4s ease-in-out infinite' } : {}),
      }} />
      <span style={{
        fontFamily: 'var(--font-mono), monospace', fontSize: 9.5,
        letterSpacing: '0.08em', textTransform: 'uppercase' as const,
        color: dotColor, whiteSpace: 'nowrap',
      }}>{label}</span>
    </div>
  );
}
