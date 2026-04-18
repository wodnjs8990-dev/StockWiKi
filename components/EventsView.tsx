'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { EarningItem, Sector } from '@/app/api/earnings/route';

// ── FOMC 2026 (KST 기준)
const FOMC_2026 = [
  { dateKST: '2026-01-30', label: 'FOMC', desc: '금리 결정', color: '#4F7E7C' },
  { dateKST: '2026-03-20', label: 'FOMC', desc: '금리+점도표', color: '#4F7E7C' },
  { dateKST: '2026-05-08', label: 'FOMC', desc: '금리 결정', color: '#4F7E7C' },
  { dateKST: '2026-06-19', label: 'FOMC', desc: '금리+점도표', color: '#4F7E7C' },
  { dateKST: '2026-07-31', label: 'FOMC', desc: '금리 결정', color: '#4F7E7C' },
  { dateKST: '2026-09-18', label: 'FOMC', desc: '금리+점도표', color: '#4F7E7C' },
  { dateKST: '2026-11-06', label: 'FOMC', desc: '금리 결정', color: '#4F7E7C' },
  { dateKST: '2026-12-18', label: 'FOMC', desc: '금리+점도표', color: '#4F7E7C' },
];

// ── 코스피200 선물 만기 (분기 둘째 목요일)
function getFuturesExpiry(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  let count = 0;
  while (true) {
    if (d.getMonth() !== month - 1) break;
    if (d.getDay() === 4) { count++; if (count === 2) break; }
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().slice(0, 10);
}

const FUTURES_EVENTS = [3, 6, 9, 12].map(m => ({
  dateKST: getFuturesExpiry(2026, m),
  label: 'K200만기',
  desc: `${m}월 선물 최종거래`,
  color: '#8A8A8A',
}));

function getKSTToday(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function dateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function getCalendarDays(year: number, month: number): { date: string; isCurrentMonth: boolean }[] {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const lastDay = new Date(year, month, 0).getDate();
  const days: { date: string; isCurrentMonth: boolean }[] = [];
  if (firstDow > 0) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevLast = new Date(prevYear, prevMonth, 0).getDate();
    for (let d = prevLast - firstDow + 1; d <= prevLast; d++)
      days.push({ date: dateStr(prevYear, prevMonth, d), isCurrentMonth: false });
  }
  for (let d = 1; d <= lastDay; d++)
    days.push({ date: dateStr(year, month, d), isCurrentMonth: true });
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  let nd = 1;
  while (days.length % 7 !== 0)
    days.push({ date: dateStr(nextYear, nextMonth, nd++), isCurrentMonth: false });
  return days;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

type CalEvent = {
  dateKST: string;
  label: string;
  desc: string;
  color: string;
  earning?: EarningItem;
};

function surpriseColor(s: number | null | undefined, accent: string, green: string): string {
  if (s == null) return accent;
  if (s > 3) return green;
  if (s < -3) return '#A63D33';
  return accent;
}

function fmtNum(v: number | null | undefined, dec = 2): string {
  if (v == null) return '-';
  return v.toFixed(dec);
}

function fmtRevenue(v: number | null | undefined, market: 'US' | 'KR'): string {
  if (v == null) return '-';
  if (market === 'US') return `$${(v / 1000).toFixed(1)}B`;
  return `${(v / 10000).toFixed(1)}조`;
}

export default function EventsView({ T }: { T?: any }) {
  const theme = T ?? {
    bgPage: '#1a1a1a', bgSurface: '#141414', bgCard: '#0f0f0f',
    bgTabActive: '#e8e4d6', bgHover: '#1f1f1f',
    textPrimary: '#e8e4d6', textSecondary: '#d4d0c4',
    textMuted: '#a8a49a', textFaint: '#7a7a7a', textDimmer: '#5a5a5a',
    border: '#2a2a2a', borderSoft: '#252525', borderMid: '#3a3a3a',
    accent: '#C89650', accentGreen: '#4A7045',
  };

  const today = getKSTToday();
  const [year, setYear] = useState(() => parseInt(today.slice(0, 4)));
  const [month, setMonth] = useState(() => parseInt(today.slice(5, 7)));
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [selectedEarning, setSelectedEarning] = useState<EarningItem | null>(null);
  const [earnings, setEarnings] = useState<EarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [indexFilter, setIndexFilter] = useState<'ALL' | 'SP500' | 'NDX100'>('ALL');
  const [sectorFilter, setSectorFilter] = useState<Sector | 'ALL'>('ALL');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchEarnings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/earnings');
      const data = await res.json();
      if (data.ok) {
        setEarnings(data.earnings ?? []);
        setLastUpdated(data.updatedAt);
      } else {
        setError('로드 실패');
      }
    } catch {
      setError('네트워크 오류');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEarnings(); }, []);

  // 섹터별 색상
  const SECTOR_COLOR: Record<string, string> = {
    Tech: '#7B9FDF', Finance: '#C89650', Healthcare: '#7BAF7A',
    Consumer: '#D4956A', Energy: '#C4A84F', Industrial: '#8A8A8A',
    Telecom: '#9B7FD4', Utility: '#5FA8A0', Material: '#B07A5A',
    RealEstate: '#7A9FA0', Other: '#6A6A6A',
  };
  const SECTOR_LABEL: Record<string, string> = {
    Tech: '기술', Finance: '금융', Healthcare: '헬스케어',
    Consumer: '소비재', Energy: '에너지', Industrial: '산업재',
    Telecom: '통신', Utility: '유틸리티', Material: '소재',
    RealEstate: '부동산', Other: '기타',
  };
  const ALL_SECTORS: (Sector | 'ALL')[] = [
    'ALL','Tech','Finance','Healthcare','Consumer','Energy',
    'Industrial','Telecom','Utility','Material','RealEstate','Other',
  ];

  // 어닝 → CalEvent 변환 (인덱스 + 섹터 동시 필터)
  const earningEvents: CalEvent[] = earnings
    .filter(e => {
      const passIndex = indexFilter === 'ALL' || (indexFilter === 'SP500' && e.isSP500) || (indexFilter === 'NDX100' && e.isNDX100);
      const passSector = sectorFilter === 'ALL' || e.sector === sectorFilter;
      return passIndex && passSector;
    })
    .map(e => ({
      dateKST: e.date,
      label: e.symbol,
      desc: e.nameKo + (e.timing && e.timing !== 'unknown' ? ` · ${e.timing}` : ''),
      color: SECTOR_COLOR[e.sector ?? 'Other'] ?? '#C89650',
      earning: e,
    }));

  const allEvents: CalEvent[] = [...FOMC_2026, ...FUTURES_EVENTS, ...earningEvents];
  const eventsByDate: Record<string, CalEvent[]> = {};
  for (const ev of allEvents) {
    if (!eventsByDate[ev.dateKST]) eventsByDate[ev.dateKST] = [];
    eventsByDate[ev.dateKST].push(ev);
  }

  const days = getCalendarDays(year, month);
  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };
  const goToday = () => {
    const t = getKSTToday();
    setYear(parseInt(t.slice(0, 4)));
    setMonth(parseInt(t.slice(5, 7)));
    setSelectedDate(t);
    setSelectedEarning(null);
  };

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];
  const usCount = earnings.length;
  const sp500Count = earnings.filter(e => e.isSP500).length;
  const ndx100Count = earnings.filter(e => e.isNDX100).length;

  return (
    <div>
      {/* 상단 메타 바 */}
      <div className="mb-6 border-y" style={{ borderColor: theme.border }}>
        <div className="flex items-center justify-between gap-3 py-2 border-b mono text-[10px] uppercase tracking-[0.2em]"
          style={{ borderColor: theme.border, color: theme.textFaint }}>
          <div className="flex items-center gap-3">
            <span>§ Events Calendar</span>
            <span className="w-4 h-px hidden md:inline-block" style={{ background: theme.borderMid }} />
            <span className="hidden md:inline">Index / 003</span>
          </div>
          <div className="flex items-center gap-2">
            {loading && <RefreshCw size={9} className="animate-spin" style={{ color: theme.textFaint }} />}
            {lastUpdated && !loading && (
              <span style={{ color: theme.textDimmer }}>
                {new Date(lastUpdated).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준
              </span>
            )}
            <button onClick={fetchEarnings} className="flex items-center gap-1 transition-opacity hover:opacity-60"
              style={{ color: theme.accent }} title="새로고침">
              <RefreshCw size={9} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 md:gap-6 py-2 mono text-[10px] uppercase tracking-[0.2em]">
          <div className="flex items-baseline gap-1 md:gap-2">
            <span style={{ color: theme.textDimmer }}>전체</span>
            <span style={{ color: loading ? theme.textDimmer : '#C89650' }}>
              {loading ? '···' : String(usCount).padStart(4, '0')}
            </span>
          </div>
          <div className="flex items-baseline gap-1 md:gap-2">
            <span style={{ color: theme.textDimmer }}>S&P</span>
            <span style={{ color: loading ? theme.textDimmer : '#7BAF7A' }}>
              {loading ? '···' : String(sp500Count).padStart(3, '0')}
            </span>
          </div>
          <div className="flex items-baseline gap-1 md:gap-2">
            <span style={{ color: theme.textDimmer }}>NDX</span>
            <span style={{ color: loading ? theme.textDimmer : '#7B9FDF' }}>
              {loading ? '···' : String(ndx100Count).padStart(3, '0')}
            </span>
          </div>
          {error && (
            <div className="flex items-baseline gap-1" style={{ color: '#A63D33' }}>
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5">

        {/* ── 달력 ── */}
        <div className="w-full min-w-0 border" style={{ borderColor: theme.border }}>

          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b"
            style={{ borderColor: theme.border, background: theme.bgCard }}>
            <button onClick={prevMonth} className="p-1.5 hover:opacity-70 transition-opacity" style={{ color: theme.textMuted }}>
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="text-base font-medium tracking-tight" style={{ color: theme.textPrimary }}>
                {year}년 {month}월
              </span>
              <button onClick={goToday}
                className="text-[10px] mono uppercase tracking-[0.2em] px-2 py-0.5 border hover:opacity-70 transition-opacity"
                style={{ borderColor: theme.border, color: theme.textFaint }}>
                오늘
              </button>
              {/* 인덱스 필터 */}
              <div className="flex border" style={{ borderColor: theme.border }}>
                {([
                  { key: 'ALL', label: 'ALL' },
                  { key: 'SP500', label: 'S&P' },
                  { key: 'NDX100', label: 'NDX' },
                ] as const).map(({ key, label }) => (
                  <button key={key} onClick={() => setIndexFilter(key)}
                    className="text-[9px] mono px-2 py-0.5 transition-colors"
                    style={{
                      background: indexFilter === key ? theme.bgTabActive : 'transparent',
                      color: indexFilter === key ? theme.bgPage : theme.textFaint,
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={nextMonth} className="p-1.5 hover:opacity-70 transition-opacity" style={{ color: theme.textMuted }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 섹터 필터 */}
          <div className="px-3 py-2 border-b flex flex-wrap gap-1"
            style={{ borderColor: theme.border, background: theme.bgCard }}>
            {ALL_SECTORS.map(s => {
              const isActive = sectorFilter === s;
              const color = s === 'ALL' ? theme.accent : SECTOR_COLOR[s];
              return (
                <button key={s} onClick={() => setSectorFilter(s)}
                  className="text-[9px] mono px-2 py-0.5 border transition-all"
                  style={{
                    borderColor: isActive ? color : theme.borderSoft,
                    background: isActive ? `${color}25` : 'transparent',
                    color: isActive ? color : theme.textDimmer,
                  }}>
                  {s === 'ALL' ? 'ALL' : SECTOR_LABEL[s]}
                </button>
              );
            })}
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: theme.border }}>
            {DAY_LABELS.map((d, i) => (
              <div key={d} className="text-center py-2 text-[10px] mono uppercase tracking-[0.15em]"
                style={{ color: i === 0 ? '#A63D33' : i === 6 ? '#3a5a7a' : theme.textDimmer }}>
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7" style={{ background: theme.bgPage }}>
            {days.map(({ date: day, isCurrentMonth }, idx) => {
              const dayNum = parseInt(day.slice(8));
              const dow = new Date(day + 'T00:00:00').getDay();
              const isToday = day === today;
              const isSelected = day === selectedDate;
              const isPast = day < today;
              const evs = eventsByDate[day] ?? [];
              const opacity = !isCurrentMonth ? 0.3 : isPast && !isToday ? 0.55 : 1;

              return (
                <div
                  key={`${day}-${idx}`}
                  onClick={() => { setSelectedDate(isSelected ? null : day); setSelectedEarning(null); }}
                  className="border-r border-b p-1.5 cursor-pointer overflow-hidden"
                  style={{
                    minHeight: '80px',
                    borderColor: theme.borderSoft,
                    background: isToday ? `${theme.accent}14` : isSelected ? theme.bgHover : 'transparent',
                    outline: isToday ? `1px solid ${theme.accent}50` : isSelected ? `1px solid ${theme.borderMid}` : 'none',
                    outlineOffset: '-1px',
                    opacity,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs mono w-5 h-5 flex items-center justify-center"
                      style={{
                        color: isToday ? theme.accent : dow === 0 ? '#A63D33' : dow === 6 ? '#3a5a7a' : theme.textFaint,
                        fontWeight: isToday ? 700 : 400,
                      }}>
                      {dayNum}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {evs.slice(0, 4).map((ev, i) => (
                      <div key={i}
                        className="flex items-center gap-1 px-1 py-0.5 text-[9px] md:text-[10px] truncate"
                        style={{ background: `${ev.color}22`, borderLeft: `2px solid ${ev.color}`, color: ev.color }}>
                        <span className="truncate font-medium">{ev.label}</span>
                      </div>
                    ))}
                    {evs.length > 3 && (
                      <div className="text-[9px] mono px-1" style={{ color: theme.textDimmer }}>+{evs.length - 3}개</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 범례 */}
          <div className="flex items-center gap-4 px-4 md:px-6 py-3 border-t flex-wrap"
            style={{ borderColor: theme.border, background: theme.bgCard }}>
            {[
              { color: '#4F7E7C', label: 'FOMC' },
              { color: '#7B9FDF', label: 'Tech' },
              { color: '#C89650', label: 'Finance' },
              { color: '#7BAF7A', label: 'Healthcare' },
              { color: '#D4956A', label: 'Consumer' },
              { color: '#C4A84F', label: 'Energy' },
              { color: '#8A8A8A', label: 'K200만기' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: `${color}33`, borderLeft: `2px solid ${color}` }} />
                <span className="text-[10px] mono" style={{ color: theme.textDimmer }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 하단: 선택 날짜 상세 + 다가오는 이벤트 ── */}
        <div className="grid md:grid-cols-2 gap-5 w-full">

          {/* 선택 날짜 이벤트 */}
          {selectedDate && (
            <div className="border" style={{ borderColor: theme.border }}>
              <div className="px-4 py-3 border-b flex items-center justify-between"
                style={{ borderColor: theme.border, background: theme.bgCard }}>
                <span className="text-[11px] mono uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>
                  {parseInt(selectedDate.slice(5, 7))}월 {parseInt(selectedDate.slice(8, 10))}일
                </span>
                {selectedDate === today && (
                  <span className="text-[9px] mono px-1.5 py-0.5 border"
                    style={{ background: `${theme.accent}20`, color: theme.accent, borderColor: `${theme.accent}40` }}>
                    TODAY
                  </span>
                )}
              </div>
              {selectedEvents.length === 0 ? (
                <div className="px-4 py-6 text-center text-[11px]" style={{ color: theme.textDimmer }}>이벤트 없음</div>
              ) : (
                <div>
                  {selectedEvents.map((ev, i) => {
                    const isExpanded = ev.earning != null && selectedEarning?.symbol === ev.earning?.symbol;
                    const e = ev.earning;
                    return (
                      <div key={i}>
                        {/* 이벤트 행 */}
                        <div
                          className="px-4 py-3 border-b transition-colors"
                          style={{
                            borderColor: theme.borderSoft,
                            borderLeft: `3px solid ${ev.color}`,
                            background: isExpanded ? `${ev.color}0f` : 'transparent',
                            cursor: e ? 'pointer' : 'default',
                          }}
                          onClick={() => e && setSelectedEarning(isExpanded ? null : e)}
                          onMouseEnter={el => { if (e && !isExpanded) (el.currentTarget as HTMLElement).style.background = theme.bgHover; }}
                          onMouseLeave={el => { if (e && !isExpanded) (el.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold" style={{ color: ev.color }}>{ev.label}</span>
                              {e && (
                                <div className="flex gap-1 flex-wrap">
                                  {e.sector && e.sector !== 'Other' && (
                                    <span className="text-[9px] mono px-1 border"
                                      style={{ color: SECTOR_COLOR[e.sector], borderColor: `${SECTOR_COLOR[e.sector]}50` }}>
                                      {SECTOR_LABEL[e.sector]}
                                    </span>
                                  )}
                                  {e.isSP500 && (
                                    <span className="text-[9px] mono px-1 border"
                                      style={{ color: '#7BAF7A', borderColor: '#7BAF7A50' }}>S&P</span>
                                  )}
                                  {e.isNDX100 && (
                                    <span className="text-[9px] mono px-1 border"
                                      style={{ color: '#7B9FDF', borderColor: '#7B9FDF50' }}>NDX</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {e && (
                              <span className="text-[9px] mono" style={{ color: theme.textDimmer }}>
                                {e.surprise != null
                                  ? (e.surprise > 0 ? '+' : '') + e.surprise.toFixed(1) + '%'
                                  : '상세 보기'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>{ev.desc}</div>
                        </div>

                        {/* 확장 디테일 */}
                        {isExpanded && e && (
                          <div className="px-4 py-3 border-b"
                            style={{ borderColor: theme.borderSoft, background: `${ev.color}08`, borderLeft: `3px solid ${ev.color}` }}>
                            <div className="grid grid-cols-2 gap-3">
                              {/* EPS */}
                              <div>
                                <div className="text-[9px] mono uppercase tracking-[0.15em] mb-1.5"
                                  style={{ color: theme.textDimmer }}>EPS</div>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className="text-sm font-semibold"
                                    style={{ color: e.epsActual != null ? surpriseColor(e.surprise, theme.accent, theme.accentGreen) : theme.textPrimary }}>
                                    {fmtNum(e.epsActual ?? e.epsEstimate)}
                                    {e.epsActual == null && e.epsEstimate != null && (
                                      <span className="text-[9px] ml-1" style={{ color: theme.textDimmer }}>(예상)</span>
                                    )}
                                  </span>
                                  {e.epsEstimate != null && e.epsActual != null && (
                                    <span className="text-[10px]" style={{ color: theme.textFaint }}>
                                      예상 {fmtNum(e.epsEstimate)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 서프라이즈 */}
                              <div>
                                <div className="text-[9px] mono uppercase tracking-[0.15em] mb-1.5"
                                  style={{ color: theme.textDimmer }}>서프라이즈</div>
                                {e.surprise != null ? (
                                  <div className="flex items-center gap-1">
                                    {e.surprise > 3
                                      ? <TrendingUp size={12} style={{ color: theme.accentGreen }} />
                                      : e.surprise < -3
                                      ? <TrendingDown size={12} style={{ color: '#A63D33' }} />
                                      : <Minus size={12} style={{ color: theme.textMuted }} />}
                                    <span className="text-sm font-semibold"
                                      style={{ color: surpriseColor(e.surprise, theme.accent, theme.accentGreen) }}>
                                      {e.surprise > 0 ? '+' : ''}{e.surprise.toFixed(1)}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[11px]" style={{ color: theme.textDimmer }}>-</span>
                                )}
                              </div>

                              {/* 매출 */}
                              {(e.revenueEstimate != null || e.revenueActual != null) && (
                                <div className="col-span-2">
                                  <div className="text-[9px] mono uppercase tracking-[0.15em] mb-1.5"
                                    style={{ color: theme.textDimmer }}>매출</div>
                                  <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                                      {fmtRevenue(e.revenueActual ?? e.revenueEstimate, e.market)}
                                      {e.revenueActual == null && e.revenueEstimate != null && (
                                        <span className="text-[9px] ml-1" style={{ color: theme.textDimmer }}>(예상)</span>
                                      )}
                                    </span>
                                    {e.revenueEstimate != null && e.revenueActual != null && (
                                      <span className="text-[10px]" style={{ color: theme.textFaint }}>
                                        예상 {fmtRevenue(e.revenueEstimate, e.market)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* BMO / AMC */}
                              {e.timing && e.timing !== 'unknown' && (
                                <div className="col-span-2">
                                  <span className="text-[9px] mono px-1.5 py-0.5 border"
                                    style={{ color: ev.color, borderColor: `${ev.color}50` }}>
                                    {e.timing === 'BMO' ? '장 전 발표 (BMO)' : '장 후 발표 (AMC)'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 다가오는 이벤트 — 필터 적용 */}
          <div className="border" style={{ borderColor: theme.border }}>
            <div className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: theme.border, background: theme.bgCard }}>
              <div className="flex items-center gap-2">
                <span className="text-[11px] mono uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>
                  다가오는 이벤트
                </span>
                {/* 활성 필터 표시 */}
                {(indexFilter !== 'ALL' || sectorFilter !== 'ALL') && (
                  <div className="flex gap-1">
                    {indexFilter !== 'ALL' && (
                      <span className="text-[9px] mono px-1 border"
                        style={{ color: theme.accent, borderColor: `${theme.accent}50` }}>
                        {indexFilter === 'SP500' ? 'S&P' : 'NDX'}
                      </span>
                    )}
                    {sectorFilter !== 'ALL' && (
                      <span className="text-[9px] mono px-1 border"
                        style={{ color: SECTOR_COLOR[sectorFilter], borderColor: `${SECTOR_COLOR[sectorFilter]}50` }}>
                        {SECTOR_LABEL[sectorFilter]}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] mono" style={{ color: theme.textDimmer }}>
                  {loading ? '로딩 중...' : `${[...FOMC_2026, ...FUTURES_EVENTS, ...earningEvents].filter(e => e.dateKST >= today).length}건`}
                </span>
                {(indexFilter !== 'ALL' || sectorFilter !== 'ALL') && (
                  <button onClick={() => { setIndexFilter('ALL'); setSectorFilter('ALL'); }}
                    className="text-[9px] mono px-1.5 border hover:opacity-70 transition-opacity"
                    style={{ color: theme.textDimmer, borderColor: theme.borderSoft }}>
                    초기화
                  </button>
                )}
              </div>
            </div>
            {([...FOMC_2026, ...FUTURES_EVENTS, ...earningEvents] as CalEvent[])
              .filter(ev => ev.dateKST >= today)
              .sort((a, b) => {
                const d = a.dateKST.localeCompare(b.dateKST);
                if (d !== 0) return d;
                // 같은 날 내: FOMC/만기 먼저, 그 다음 시총 순
                const aIsSpecial = !a.earning;
                const bIsSpecial = !b.earning;
                if (aIsSpecial && !bIsSpecial) return -1;
                if (!aIsSpecial && bIsSpecial) return 1;
                return (b.earning?.marketCap ?? 0) - (a.earning?.marketCap ?? 0);
              })
              .slice(0, 15)
              .map((ev, i) => {
                const diff = Math.round(
                  (new Date(ev.dateKST + 'T00:00:00+09:00').getTime() - new Date(today + 'T00:00:00+09:00').getTime()) / 86400000
                );
                const e = ev.earning;
                return (
                  <div
                    key={i}
                    className="px-4 py-2.5 border-b flex items-start gap-3 cursor-pointer"
                    style={{ borderColor: theme.borderSoft }}
                    onMouseEnter={el => (el.currentTarget as HTMLElement).style.background = theme.bgHover}
                    onMouseLeave={el => (el.currentTarget as HTMLElement).style.background = 'transparent'}
                    onClick={() => {
                      setYear(parseInt(ev.dateKST.slice(0, 4)));
                      setMonth(parseInt(ev.dateKST.slice(5, 7)));
                      setSelectedDate(ev.dateKST);
                      setSelectedEarning(null);
                    }}
                  >
                    {/* D-Day 배지 */}
                    <span className="text-[10px] mono w-10 shrink-0 text-center py-0.5 mt-0.5 border"
                      style={{
                        color: diff === 0 ? ev.color : theme.textDimmer,
                        borderColor: diff === 0 ? ev.color : theme.border,
                      }}>
                      {diff === 0 ? 'D-Day' : `D-${diff}`}
                    </span>

                    <div className="min-w-0 flex-1">
                      {/* 종목명 + 배지 행 */}
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ background: ev.color }} />
                        <span className="text-xs font-semibold" style={{ color: theme.textPrimary }}>{ev.label}</span>
                        {/* 섹터 배지 */}
                        {e?.sector && e.sector !== 'Other' && (
                          <span className="text-[8px] mono px-1 border"
                            style={{ color: SECTOR_COLOR[e.sector], borderColor: `${SECTOR_COLOR[e.sector]}40` }}>
                            {SECTOR_LABEL[e.sector]}
                          </span>
                        )}
                        {e?.isSP500 && (
                          <span className="text-[8px] mono px-1 border"
                            style={{ color: '#7BAF7A', borderColor: '#7BAF7A40' }}>S&P</span>
                        )}
                        {e?.isNDX100 && (
                          <span className="text-[8px] mono px-1 border"
                            style={{ color: '#7B9FDF', borderColor: '#7B9FDF40' }}>NDX</span>
                        )}
                        {/* EPS 예상 */}
                        {e?.epsEstimate != null && (
                          <span className="text-[9px] mono ml-auto shrink-0"
                            style={{ color: theme.textDimmer }}>
                            EPS {e.epsEstimate > 0 ? '+' : ''}{e.epsEstimate.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {/* 날짜 + 한글명 */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] mono" style={{ color: theme.textFaint }}>
                          {ev.dateKST.slice(5).replace('-', '/')}
                        </span>
                        {e && (
                          <span className="text-[10px] truncate" style={{ color: theme.textDimmer }}>
                            · {e.nameKo}
                          </span>
                        )}
                        {!e && (
                          <span className="text-[10px] truncate" style={{ color: theme.textDimmer }}>
                            · {ev.desc}
                          </span>
                        )}
                        {/* 시총 */}
                        {e?.marketCap != null && e.marketCap > 0 && (
                          <span className="text-[9px] mono ml-auto shrink-0" style={{ color: theme.textDimmer }}>
                            ${e.marketCap >= 1000 ? `${(e.marketCap/1000).toFixed(1)}T` : `${e.marketCap}B`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <p className="text-[9px] mono text-center mt-1 md:col-span-2" style={{ color: theme.textDimmer }}>
            모든 날짜·시간 KST 기준 · 어닝 데이터: Alpha Vantage · S&P500 / Nasdaq100 필터 지원
          </p>
        </div>
      </div>
    </div>
  );
}
