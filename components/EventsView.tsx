'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { EarningItem, Sector } from '@/app/api/earnings/route';

// ── FOMC 2026 (KST 기준)
const FOMC_2026 = [
  { dateKST: '2026-01-30', label: 'FOMC', desc: '금리 결정', time: '04:00', color: '#4F7E7C', importance: 3 as const },
  { dateKST: '2026-03-20', label: 'FOMC', desc: '금리+점도표', time: '04:00', color: '#4F7E7C', importance: 3 as const },
  { dateKST: '2026-05-08', label: 'FOMC', desc: '금리 결정', time: '04:00', color: '#4F7E7C', importance: 3 as const },
  { dateKST: '2026-06-19', label: 'FOMC', desc: '금리+점도표', time: '04:00', color: '#4F7E7C', importance: 3 as const },
  { dateKST: '2026-07-31', label: 'FOMC', desc: '금리 결정', time: '04:00', color: '#4F7E7C', importance: 3 as const },
  { dateKST: '2026-09-18', label: 'FOMC', desc: '금리+점도표', time: '04:00', color: '#4F7E7C', importance: 3 as const },
  { dateKST: '2026-11-06', label: 'FOMC', desc: '금리 결정', time: '04:00', color: '#4F7E7C', importance: 3 as const },
  { dateKST: '2026-12-18', label: 'FOMC', desc: '금리+점도표', time: '04:00', color: '#4F7E7C', importance: 3 as const },
];

// ── 미국 주요 경제지표 2026
const MACRO_2026 = [
  // ── CPI (소비자물가)
  { dateKST: '2026-01-14', label: 'CPI',  desc: '12월 소비자물가 (美)', time: '22:30',  color: '#9C8BBD', importance: 3 as const },
  { dateKST: '2026-02-13', label: 'CPI',  desc: '1월 소비자물가 (美)',  time: '22:30',  color: '#9C8BBD', importance: 3 as const },
  { dateKST: '2026-03-11', label: 'CPI',  desc: '2월 소비자물가 (美)',  time: '22:30',  color: '#9C8BBD', importance: 3 as const },
  { dateKST: '2026-04-10', label: 'CPI',  desc: '3월 소비자물가 (美)',  time: '22:30',  color: '#9C8BBD', importance: 3 as const },
  { dateKST: '2026-05-12', label: 'CPI',  desc: '4월 소비자물가 (美)',  time: '22:30',  color: '#9C8BBD', importance: 3 as const },
  { dateKST: '2026-06-10', label: 'CPI',  desc: '5월 소비자물가 (美)',  time: '22:30',  color: '#9C8BBD', importance: 3 as const },
  { dateKST: '2026-07-14', label: 'CPI',  desc: '6월 소비자물가 (美)',  time: '22:30',  color: '#9C8BBD', importance: 3 as const },
  { dateKST: '2026-08-12', label: 'CPI',  desc: '7월 소비자물가 (美)',  time: '22:30',  color: '#9C8BBD', importance: 3 as const },
  { dateKST: '2026-09-11', label: 'CPI',  desc: '8월 소비자물가 (美)',  time: '22:30',  color: '#9C8BBD', importance: 3 as const },
  { dateKST: '2026-10-13', label: 'CPI',  desc: '9월 소비자물가 (美)',  time: '22:30',  color: '#9C8BBD', importance: 3 as const },
  { dateKST: '2026-11-12', label: 'CPI',  desc: '10월 소비자물가 (美)', time: '22:30',  color: '#9C8BBD', importance: 3 as const },
  { dateKST: '2026-12-11', label: 'CPI',  desc: '11월 소비자물가 (美)', time: '22:30',  color: '#9C8BBD', importance: 3 as const },
  // ── NFP (비농업 고용)
  { dateKST: '2026-01-09', label: 'NFP',  desc: '12월 비농업 고용 (美)', time: '22:30', color: '#7C6A9B', importance: 3 as const },
  { dateKST: '2026-02-06', label: 'NFP',  desc: '1월 비농업 고용 (美)',  time: '22:30', color: '#7C6A9B', importance: 3 as const },
  { dateKST: '2026-03-06', label: 'NFP',  desc: '2월 비농업 고용 (美)',  time: '22:30', color: '#7C6A9B', importance: 3 as const },
  { dateKST: '2026-04-03', label: 'NFP',  desc: '3월 비농업 고용 (美)',  time: '22:30', color: '#7C6A9B', importance: 3 as const },
  { dateKST: '2026-05-08', label: 'NFP',  desc: '4월 비농업 고용 (美)',  time: '22:30', color: '#7C6A9B', importance: 3 as const },
  { dateKST: '2026-06-05', label: 'NFP',  desc: '5월 비농업 고용 (美)',  time: '22:30', color: '#7C6A9B', importance: 3 as const },
  { dateKST: '2026-07-02', label: 'NFP',  desc: '6월 비농업 고용 (美)',  time: '22:30', color: '#7C6A9B', importance: 3 as const },
  { dateKST: '2026-08-07', label: 'NFP',  desc: '7월 비농업 고용 (美)',  time: '22:30', color: '#7C6A9B', importance: 3 as const },
  { dateKST: '2026-09-04', label: 'NFP',  desc: '8월 비농업 고용 (美)',  time: '22:30', color: '#7C6A9B', importance: 3 as const },
  { dateKST: '2026-10-02', label: 'NFP',  desc: '9월 비농업 고용 (美)',  time: '22:30', color: '#7C6A9B', importance: 3 as const },
  { dateKST: '2026-11-06', label: 'NFP',  desc: '10월 비농업 고용 (美)', time: '22:30', color: '#7C6A9B', importance: 3 as const },
  { dateKST: '2026-12-04', label: 'NFP',  desc: '11월 비농업 고용 (美)', time: '22:30', color: '#7C6A9B', importance: 3 as const },
  // ── PCE (개인소비지출 물가)
  { dateKST: '2026-01-30', label: 'PCE',  desc: '12월 PCE 물가 (美)',    time: '22:30', color: '#5E4F7A', importance: 2 as const },
  { dateKST: '2026-02-27', label: 'PCE',  desc: '1월 PCE 물가 (美)',     time: '22:30', color: '#5E4F7A', importance: 2 as const },
  { dateKST: '2026-03-27', label: 'PCE',  desc: '2월 PCE 물가 (美)',     time: '22:30', color: '#5E4F7A', importance: 2 as const },
  { dateKST: '2026-04-30', label: 'PCE',  desc: '3월 PCE 물가 (美)',     time: '22:30', color: '#5E4F7A', importance: 2 as const },
  { dateKST: '2026-05-29', label: 'PCE',  desc: '4월 PCE 물가 (美)',     time: '22:30', color: '#5E4F7A', importance: 2 as const },
  { dateKST: '2026-06-26', label: 'PCE',  desc: '5월 PCE 물가 (美)',     time: '22:30', color: '#5E4F7A', importance: 2 as const },
  { dateKST: '2026-07-31', label: 'PCE',  desc: '6월 PCE 물가 (美)',     time: '22:30', color: '#5E4F7A', importance: 2 as const },
  { dateKST: '2026-08-28', label: 'PCE',  desc: '7월 PCE 물가 (美)',     time: '22:30', color: '#5E4F7A', importance: 2 as const },
  { dateKST: '2026-09-25', label: 'PCE',  desc: '8월 PCE 물가 (美)',     time: '22:30', color: '#5E4F7A', importance: 2 as const },
  { dateKST: '2026-10-30', label: 'PCE',  desc: '9월 PCE 물가 (美)',     time: '22:30', color: '#5E4F7A', importance: 2 as const },
  { dateKST: '2026-11-25', label: 'PCE',  desc: '10월 PCE 물가 (美)',    time: '22:30', color: '#5E4F7A', importance: 2 as const },
  { dateKST: '2026-12-23', label: 'PCE',  desc: '11월 PCE 물가 (美)',    time: '22:30', color: '#5E4F7A', importance: 2 as const },
  // ── GDP (분기 속보치)
  { dateKST: '2026-01-29', label: 'GDP',  desc: 'Q4 2025 GDP 속보 (美)', time: '22:30', color: '#6FA09E', importance: 2 as const },
  { dateKST: '2026-04-29', label: 'GDP',  desc: 'Q1 2026 GDP 속보 (美)', time: '22:30', color: '#6FA09E', importance: 2 as const },
  { dateKST: '2026-07-30', label: 'GDP',  desc: 'Q2 2026 GDP 속보 (美)', time: '22:30', color: '#6FA09E', importance: 2 as const },
  { dateKST: '2026-10-29', label: 'GDP',  desc: 'Q3 2026 GDP 속보 (美)', time: '22:30', color: '#6FA09E', importance: 2 as const },
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
  desc: `코스피200 ${m}월 선물 최종거래`,
  time: '장후',
  color: '#8A8A8A',
  importance: 2 as const,
}));

function getKSTToday(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function dateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// 월요일 시작 달력
function getCalendarDays(year: number, month: number): { date: string; isCurrentMonth: boolean }[] {
  const firstDate = new Date(year, month - 1, 1);
  // 0=일 1=월 ... 6=토 → 월요일 기준으로 변환: 월=0, 화=1, ..., 일=6
  const firstDowSun = firstDate.getDay(); // 0=일
  const firstDowMon = firstDowSun === 0 ? 6 : firstDowSun - 1; // 월=0, ..., 일=6

  const lastDay = new Date(year, month, 0).getDate();
  const days: { date: string; isCurrentMonth: boolean }[] = [];

  if (firstDowMon > 0) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevLast = new Date(prevYear, prevMonth, 0).getDate();
    for (let d = prevLast - firstDowMon + 1; d <= prevLast; d++)
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

// 월요일 시작 요일 라벨
const DAY_LABELS_EN = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// 월 영문명
const MONTH_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

type CalEvent = {
  dateKST: string;
  label: string;
  desc: string;
  time?: string;
  color: string;
  importance?: 1 | 2 | 3;
  earning?: EarningItem;
  macro?: { actual?: number | null; estimate?: number | null; prev?: number | null; unit?: string };
  type?: 'macro' | 'earnings' | 'options';
};

function importanceDots(n: 1 | 2 | 3 | undefined): React.ReactNode {
  if (!n) return null;
  return (
    <span style={{ letterSpacing: '-1px', fontSize: '9px' }}>
      {'●'.repeat(n)}
      <span style={{ opacity: 0.3 }}>{'●'.repeat(3 - n)}</span>
    </span>
  );
}

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

type CustomEventItem = { id: string; date: string; label: string; desc: string; color: string; createdAt: string };

// 요일 판별 (월요일 기준 index: 0=월 ... 6=일)
function dowMon(dateStr: string): number {
  const dow = new Date(dateStr + 'T00:00:00').getDay(); // 0=일 6=토
  return dow === 0 ? 6 : dow - 1;
}

export default function EventsView({ T, customEvents = [] }: { T?: any; customEvents?: CustomEventItem[] }) {
  const theme = T ?? {
    bgPage: '#1a1a1a', bgSurface: '#141414', bgCard: '#0f0f0f',
    bgTabActive: '#e8e4d6', bgHover: '#1f1f1f',
    textPrimary: '#e8e4d6', textSecondary: '#d4d0c4',
    textMuted: '#a8a49a', textFaint: '#7a7a7a', textDimmer: '#5a5a5a',
    border: '#2a2a2a', borderSoft: '#252525', borderMid: '#3a3a3a',
    accent: '#C89650', accentGreen: '#4A7045',
  };

  const isLight = theme.bgPage?.startsWith('#f') || theme.bgPage?.startsWith('#e') || theme.bgPage?.startsWith('#fff');

  const today = getKSTToday();
  const [year, setYear] = useState(() => parseInt(today.slice(0, 4)));
  const [month, setMonth] = useState(() => parseInt(today.slice(5, 7)));
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [selectedEarning, setSelectedEarning] = useState<EarningItem | null>(null);
  const [earnings, setEarnings] = useState<EarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [macroEvents, setMacroEvents] = useState<CalEvent[]>([]);
  const [selectedMacroDesc, setSelectedMacroDesc] = useState<string | null>(null);

  // 새 필터: MACRO / EARNINGS / OPTIONS
  type FilterType = 'MACRO' | 'EARNINGS' | 'OPTIONS';
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(new Set(['MACRO', 'EARNINGS', 'OPTIONS']));

  // 어닝 서브필터
  const [indexFilter, setIndexFilter] = useState<'ALL' | 'SP500' | 'NDX100'>('ALL');

  const toggleFilter = (f: FilterType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(f)) {
        if (next.size > 1) next.delete(f);
      } else {
        next.add(f);
      }
      return next;
    });
  };

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

  const fetchMacro = async () => {
    try {
      const res = await fetch('/api/macro-calendar');
      const data = await res.json();
      if (data.ok) {
        const evs: CalEvent[] = (data.events ?? []).map((e: any) => ({
          dateKST: e.date,
          label: e.label,
          desc: e.desc,
          time: e.time ?? '22:30',
          color: e.color,
          importance: e.importance ?? 2,
          type: 'macro' as const,
          macro: { actual: e.actual, estimate: e.estimate, prev: e.prev, unit: e.unit },
        }));
        setMacroEvents(evs);
      }
    } catch { /* 조용히 */ }
  };

  useEffect(() => { fetchEarnings(); fetchMacro(); }, []);

  // 섹터별 색상
  const SECTOR_COLOR: Record<string, string> = {
    Tech: '#7B9FDF', Finance: '#C89650', Healthcare: '#7BAF7A',
    Consumer: '#D4956A', Energy: '#C4A84F', Industrial: '#8A8A8A',
    Telecom: '#9B7FD4', Utility: '#6FA09E', Material: '#B07A5A',
    RealEstate: '#7A9FA0', Other: '#6A6A6A',
  };
  const SECTOR_LABEL: Record<string, string> = {
    Tech: '기술', Finance: '금융', Healthcare: '헬스케어',
    Consumer: '소비재', Energy: '에너지', Industrial: '산업재',
    Telecom: '통신', Utility: '유틸리티', Material: '소재',
    RealEstate: '부동산', Other: '기타',
  };

  // macroEvents(API) 있으면 우선 사용, 없으면 fallback
  const macroToUse = macroEvents.length > 0 ? macroEvents : (MACRO_2026 as CalEvent[]);

  // 어닝 → CalEvent
  const earningEvents: CalEvent[] = earnings
    .filter(e => {
      const passIndex = indexFilter === 'ALL' || (indexFilter === 'SP500' && e.isSP500) || (indexFilter === 'NDX100' && e.isNDX100);
      return passIndex;
    })
    .map(e => ({
      dateKST: e.date,
      label: e.symbol,
      desc: e.nameKo + (e.timing && e.timing !== 'unknown' ? ` · ${e.timing === 'BMO' ? '장전' : '장후'}` : ''),
      time: e.timing === 'BMO' ? '장전' : e.timing === 'AMC' ? '장후' : undefined,
      color: SECTOR_COLOR[e.sector ?? 'Other'] ?? '#C89650',
      importance: (e.marketCap != null && e.marketCap >= 500 ? 3 : e.marketCap != null && e.marketCap >= 50 ? 2 : 1) as 1 | 2 | 3,
      earning: e,
      type: 'earnings' as const,
    }));

  // 커스텀 이벤트
  const customCalEvents: CalEvent[] = customEvents.map(e => ({
    dateKST: e.date,
    label: e.label,
    desc: e.desc,
    color: e.color,
    importance: 3 as const,
    type: 'macro' as const,
  }));

  // MACRO events: FOMC + macroToUse
  const macroCalEvents: CalEvent[] = [
    ...(FOMC_2026 as CalEvent[]),
    ...(macroToUse as CalEvent[]),
    ...customCalEvents,
  ];

  // OPTIONS events: 선물 만기
  const optionsCalEvents: CalEvent[] = FUTURES_EVENTS as CalEvent[];

  // 필터 적용
  const allEvents: CalEvent[] = [
    ...(activeFilters.has('MACRO') ? macroCalEvents : []),
    ...(activeFilters.has('EARNINGS') ? earningEvents : []),
    ...(activeFilters.has('OPTIONS') ? optionsCalEvents : []),
  ];

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

  // 오렌지 (today dot)
  const todayDot = '#E07A30';

  // 필터 정의
  const FILTER_DEFS: { key: FilterType; label: string; color: string }[] = [
    { key: 'MACRO',    label: 'MACRO',           color: '#6FA09E' },
    { key: 'EARNINGS', label: 'EARNINGS',         color: theme.accent },
    { key: 'OPTIONS',  label: 'OPTIONS EXPIRY',   color: '#8A8A8A' },
  ];

  return (
    <div>
      {/* ── 상단 헤더 바 ── */}
      <div className="flex items-center justify-between mb-0 border-b"
        style={{ borderColor: theme.border, paddingBottom: '10px', marginBottom: '0' }}>
        {/* 왼쪽: 월 네비게이션 */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth}
            className="p-1 hover:opacity-60 transition-opacity"
            style={{ color: theme.textMuted }}>
            <ChevronLeft size={15} />
          </button>
          <button onClick={nextMonth}
            className="p-1 hover:opacity-60 transition-opacity"
            style={{ color: theme.textMuted }}>
            <ChevronRight size={15} />
          </button>
          <div className="flex items-baseline gap-2">
            <span className="mono text-[11px] tracking-[0.2em] uppercase"
              style={{ color: theme.textDimmer }}>
              § EVENTS
            </span>
            <span className="mono text-[13px] font-semibold tracking-[0.1em]"
              style={{ color: theme.textPrimary }}>
              {year}.{String(month).padStart(2, '0')}
            </span>
            <span className="mono text-[11px] tracking-[0.12em]"
              style={{ color: theme.textFaint }}>
              · {MONTH_EN[month - 1].toUpperCase()} SEOUL · KST
            </span>
          </div>
        </div>

        {/* 오른쪽: 필터 탭 + 새로고침 */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* 필터 탭 */}
          <div className="flex items-center gap-1">
            {FILTER_DEFS.map(({ key, label, color }, i) => {
              const isActive = activeFilters.has(key);
              return (
                <React.Fragment key={key}>
                  {i > 0 && (
                    <span className="mono text-[10px]" style={{ color: theme.borderMid }}>·</span>
                  )}
                  <button
                    onClick={() => toggleFilter(key)}
                    className="mono text-[10px] md:text-[11px] tracking-[0.15em] transition-all px-1 py-0.5"
                    style={{
                      color: isActive ? color : theme.textDimmer,
                      borderBottom: isActive ? `1px solid ${color}` : '1px solid transparent',
                    }}>
                    {label}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* 오늘 버튼 */}
          <button onClick={goToday}
            className="mono text-[10px] tracking-[0.15em] px-1.5 py-0.5 border hover:opacity-70 transition-opacity hidden md:block"
            style={{ borderColor: theme.borderSoft, color: theme.textDimmer }}>
            TODAY
          </button>

          {/* 새로고침 */}
          <div className="flex items-center gap-1.5">
            {loading && <RefreshCw size={9} className="animate-spin" style={{ color: theme.textDimmer }} />}
            {lastUpdated && !loading && (
              <span className="mono text-[10px] hidden md:block" style={{ color: theme.textDimmer }}>
                {new Date(lastUpdated).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button onClick={fetchEarnings}
              className="hover:opacity-60 transition-opacity"
              style={{ color: theme.textFaint }} title="새로고침">
              <RefreshCw size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 어닝 서브필터 (EARNINGS 활성시만) ── */}
      {activeFilters.has('EARNINGS') && (
        <div className="flex items-center gap-1 py-2 border-b overflow-x-auto"
          style={{ borderColor: theme.borderSoft }}>
          <span className="mono text-[10px] shrink-0 mr-1" style={{ color: theme.textDimmer }}>
            {loading ? '···' : String(usCount).padStart(4, '0')} EARNINGS
          </span>
          <span className="w-px h-3 shrink-0 mx-1" style={{ background: theme.borderMid }} />
          {([
            { key: 'ALL' as const, label: 'ALL' },
            { key: 'SP500' as const, label: 'S&P 500' },
            { key: 'NDX100' as const, label: 'NDQ 100' },
          ]).map(({ key, label }) => (
            <button key={key}
              onClick={() => setIndexFilter(key)}
              className="mono text-[10px] md:text-[11px] tracking-[0.15em] px-2 py-0.5 border shrink-0 transition-all"
              style={{
                borderColor: indexFilter === key ? theme.accent : theme.borderSoft,
                background: indexFilter === key ? `${theme.accent}18` : 'transparent',
                color: indexFilter === key ? theme.accent : theme.textDimmer,
              }}>
              {label}
            </button>
          ))}
          {error && (
            <span className="mono text-[10px] ml-1" style={{ color: '#A63D33' }}>{error}</span>
          )}
        </div>
      )}

      {/* ── 달력 ── */}
      <div className="w-full" style={{ marginTop: '0' }}>

        {/* 요일 헤더 — 월요일 시작 */}
        <div className="grid grid-cols-7 border-b border-t mt-2"
          style={{ borderColor: theme.borderSoft }}>
          {DAY_LABELS_EN.map((d, i) => (
            <div key={d}
              className="text-center py-1.5 mono text-[9px] md:text-[10px] tracking-[0.18em]"
              style={{
                color: i === 5 ? '#3a5a7a'    // SAT
                      : i === 6 ? '#A63D33'   // SUN
                      : theme.textDimmer,
              }}>
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7" style={{ background: theme.bgPage }}>
          {days.map(({ date: day, isCurrentMonth }, idx) => {
            const dayNum = parseInt(day.slice(8));
            const dow = dowMon(day); // 0=MON ... 6=SUN
            const isToday = day === today;
            const isSelected = day === selectedDate;
            const isPast = day < today;
            const evs = eventsByDate[day] ?? [];
            const opacity = !isCurrentMonth ? 0.25 : isPast && !isToday ? 0.5 : 1;
            // 주말 여부
            const isSat = dow === 5;
            const isSun = dow === 6;

            return (
              <div
                key={`${day}-${idx}`}
                onClick={() => { setSelectedDate(isSelected ? null : day); setSelectedEarning(null); setSelectedMacroDesc(null); }}
                className="border-r border-b cursor-pointer overflow-hidden relative"
                style={{
                  minHeight: 'clamp(58px, 9.5vw, 130px)',
                  borderColor: theme.borderSoft,
                  background: isSelected
                    ? (isLight ? `${theme.accent}12` : `${theme.accent}0e`)
                    : isToday
                    ? (isLight ? `${todayDot}10` : `${todayDot}0c`)
                    : 'transparent',
                  opacity,
                }}
              >
                {/* 오늘 dot — 우상단 */}
                {isToday && (
                  <span
                    className="absolute top-1 right-1 rounded-full"
                    style={{
                      width: '5px', height: '5px',
                      background: todayDot,
                      boxShadow: `0 0 5px ${todayDot}80`,
                    }}
                  />
                )}

                {/* 날짜 숫자 */}
                <div className="px-1 pt-1 pb-0.5">
                  <span
                    className="mono text-[10px] md:text-[11px] font-medium"
                    style={{
                      color: isToday ? todayDot
                            : isSun ? '#A63D33'
                            : isSat ? '#3a5a7a'
                            : theme.textFaint,
                      fontWeight: isToday ? 700 : 400,
                    }}>
                    {dayNum}
                  </span>
                </div>

                {/* 이벤트 목록 */}
                <div className="flex flex-col gap-px px-0.5 pb-0.5">
                  {evs.slice(0, 3).map((ev, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-0.5 overflow-hidden${i >= 2 ? ' hidden md:flex' : ''}`}
                      style={{
                        borderLeft: `2px solid ${ev.color}`,
                        paddingLeft: '3px',
                        paddingRight: '2px',
                        paddingTop: '1px',
                        paddingBottom: '1px',
                        background: `${ev.color}${isLight ? '28' : '18'}`,
                        marginBottom: '1px',
                      }}>
                      {/* 시간 */}
                      {ev.time && (
                        <span
                          className="mono shrink-0"
                          style={{
                            fontSize: 'clamp(7px,1.5vw,9px)',
                            color: ev.color,
                            opacity: 0.75,
                            whiteSpace: 'nowrap',
                          }}>
                          {ev.time}
                        </span>
                      )}
                      {/* 라벨 */}
                      <span
                        className="truncate flex-1 min-w-0 font-semibold"
                        style={{
                          fontSize: 'clamp(7px,1.8vw,10px)',
                          color: ev.color,
                          lineHeight: '1.2',
                        }}>
                        {ev.label}
                      </span>
                      {/* 중요도 점 */}
                      {ev.importance && (
                        <span
                          className="shrink-0"
                          style={{
                            fontSize: '7px',
                            color: ev.color,
                            letterSpacing: '-1.5px',
                            lineHeight: '1',
                          }}>
                          {importanceDots(ev.importance)}
                        </span>
                      )}
                    </div>
                  ))}
                  {/* 더보기 표시 */}
                  {evs.length > 2 && (
                    <div className="mono px-1 md:hidden"
                      style={{ fontSize: '8px', color: theme.textDimmer }}>
                      +{evs.length - 2}
                    </div>
                  )}
                  {evs.length > 3 && (
                    <div className="mono px-1 hidden md:block"
                      style={{ fontSize: '9px', color: theme.textDimmer }}>
                      +{evs.length - 3}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 범례 패널 ── */}
        <div className="border-t grid grid-cols-3 md:grid-cols-3 gap-0"
          style={{ borderColor: theme.borderSoft, background: theme.bgCard }}>

          {/* FAMILY BAR */}
          <div className="px-3 py-2 border-r" style={{ borderColor: theme.borderSoft }}>
            <div className="mono text-[9px] tracking-[0.18em] mb-1.5 uppercase" style={{ color: theme.textDimmer }}>
              FAMILY BAR
            </div>
            <div className="flex flex-col gap-0.5">
              {[
                { color: '#4F7E7C', label: 'FOMC' },
                { color: '#9C8BBD', label: 'CPI/PCE' },
                { color: '#7C6A9B', label: 'NFP/GDP' },
                { color: '#7BAF7A', label: 'Earnings' },
                { color: '#8A8A8A', label: 'K200 만기' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span
                    style={{
                      display: 'inline-block',
                      width: '2px',
                      height: '10px',
                      background: color,
                      borderRadius: '1px',
                      flexShrink: 0,
                    }}
                  />
                  <span className="mono text-[9px] md:text-[10px]" style={{ color: theme.textDimmer }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* IMPORTANCE DOTS */}
          <div className="px-3 py-2 border-r" style={{ borderColor: theme.borderSoft }}>
            <div className="mono text-[9px] tracking-[0.18em] mb-1.5 uppercase" style={{ color: theme.textDimmer }}>
              IMPORTANCE DOTS
            </div>
            <div className="flex flex-col gap-1">
              {[
                { n: 3 as const, label: 'HIGH' },
                { n: 2 as const, label: 'MED' },
                { n: 1 as const, label: 'LOW' },
              ].map(({ n, label }) => (
                <div key={n} className="flex items-center gap-2">
                  <span style={{ fontSize: '9px', letterSpacing: '-1.5px', color: theme.accent }}>
                    {'●'.repeat(n)}
                    <span style={{ opacity: 0.25 }}>{'●'.repeat(3 - n)}</span>
                  </span>
                  <span className="mono text-[9px] md:text-[10px]" style={{ color: theme.textDimmer }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 오늘 TODAY */}
          <div className="px-3 py-2">
            <div className="mono text-[9px] tracking-[0.18em] mb-1.5 uppercase" style={{ color: theme.textDimmer }}>
              오늘 TODAY
            </div>
            <div className="flex items-center gap-2">
              <span
                className="rounded-full"
                style={{
                  display: 'inline-block',
                  width: '6px', height: '6px',
                  background: todayDot,
                  boxShadow: `0 0 6px ${todayDot}`,
                  flexShrink: 0,
                }}
              />
              <span className="mono text-[9px] md:text-[10px]" style={{ color: theme.textDimmer }}>
                오른쪽 상단 표시
              </span>
            </div>
            <div className="mt-2 mono text-[9px]" style={{ color: theme.textDimmer }}>
              모든 날짜·시간<br />KST 기준
            </div>
          </div>
        </div>
      </div>

      {/* ── 하단: 선택 날짜 상세 + 다가오는 이벤트 ── */}
      <div className="grid md:grid-cols-2 gap-4 mt-4 w-full">

        {/* 선택 날짜 이벤트 */}
        {selectedDate && (
          <div className="border" style={{ borderColor: theme.border }}>
            <div className="px-4 py-2.5 border-b flex items-center justify-between"
              style={{ borderColor: theme.border, background: theme.bgCard }}>
              <span className="mono text-[11px] uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>
                {year}.{String(month).padStart(2,'0')}.{selectedDate.slice(8,10)}
              </span>
              {selectedDate === today && (
                <span className="mono text-[10px] px-1.5 py-0.5 border"
                  style={{ background: `${todayDot}18`, color: todayDot, borderColor: `${todayDot}40` }}>
                  TODAY
                </span>
              )}
            </div>
            {selectedEvents.length === 0 ? (
              <div className="px-4 py-6 text-center mono text-[12px]" style={{ color: theme.textDimmer }}>
                이벤트 없음
              </div>
            ) : (
              <div>
                {selectedEvents.map((ev, i) => {
                  const isExpanded = ev.earning != null && selectedEarning?.symbol === ev.earning?.symbol;
                  const isMacroExpanded = ev.macro != null && selectedMacroDesc === ev.desc;
                  const e = ev.earning;
                  const m = ev.macro;
                  const isClickable = !!e || !!m;
                  return (
                    <div key={i}>
                      <div
                        className="px-4 py-2.5 border-b transition-colors"
                        style={{
                          borderColor: theme.borderSoft,
                          borderLeft: `2px solid ${ev.color}`,
                          background: (isExpanded || isMacroExpanded) ? `${ev.color}${isLight ? '18' : '0f'}` : 'transparent',
                          cursor: isClickable ? 'pointer' : 'default',
                        }}
                        onClick={() => {
                          if (e) setSelectedEarning(isExpanded ? null : e);
                          else if (m) setSelectedMacroDesc(isMacroExpanded ? null : ev.desc);
                        }}
                        onMouseEnter={el => { if (isClickable && !isExpanded && !isMacroExpanded) (el.currentTarget as HTMLElement).style.background = theme.bgHover; }}
                        onMouseLeave={el => { if (isClickable && !isExpanded && !isMacroExpanded) (el.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {ev.time && (
                              <span className="mono text-[10px] shrink-0" style={{ color: ev.color, opacity: 0.75 }}>
                                {ev.time}
                              </span>
                            )}
                            <span className="text-sm font-semibold truncate" style={{ color: ev.color }}>{ev.label}</span>
                            {ev.importance && (
                              <span className="mono shrink-0" style={{ fontSize: '9px', color: ev.color, opacity: 0.8, letterSpacing: '-1px' }}>
                                {importanceDots(ev.importance)}
                              </span>
                            )}
                            {e && (
                              <div className="flex gap-1 flex-wrap">
                                {e.sector && e.sector !== 'Other' && (
                                  <span className="mono text-[10px] px-1 border"
                                    style={{ color: SECTOR_COLOR[e.sector], borderColor: `${SECTOR_COLOR[e.sector]}50` }}>
                                    {SECTOR_LABEL[e.sector]}
                                  </span>
                                )}
                                {e.isSP500 && (
                                  <span className="mono text-[10px] px-1 border"
                                    style={{ color: '#7BAF7A', borderColor: '#7BAF7A50' }}>S&P</span>
                                )}
                                {e.isNDX100 && (
                                  <span className="mono text-[10px] px-1 border"
                                    style={{ color: '#7C6A9B', borderColor: '#7B9FDF50' }}>NDX</span>
                                )}
                              </div>
                            )}
                          </div>
                          {e && (
                            <span className="mono text-[11px] shrink-0" style={{ color: theme.textDimmer }}>
                              {e.surprise != null
                                ? (e.surprise > 0 ? '+' : '') + e.surprise.toFixed(1) + '%'
                                : '상세▸'}
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] mt-0.5" style={{ color: theme.textMuted }}>{ev.desc}</div>
                      </div>

                      {/* 매크로 확장 */}
                      {isMacroExpanded && m && (
                        <div className="px-4 py-3 border-b"
                          style={{ borderColor: theme.borderSoft, background: `${ev.color}${isLight ? '14' : '08'}`, borderLeft: `2px solid ${ev.color}` }}>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: '발표치', val: m.actual },
                              { label: '예상치', val: m.estimate },
                              { label: '이전치', val: m.prev },
                            ].map(({ label, val }) => (
                              <div key={label}>
                                <div className="mono text-[10px] uppercase tracking-[0.15em] mb-1" style={{ color: theme.textDimmer }}>{label}</div>
                                <span className="text-sm font-semibold" style={{ color: val != null ? ev.color : theme.textDimmer }}>
                                  {val != null ? `${val}${m.unit ?? ''}` : '-'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 어닝 확장 */}
                      {isExpanded && e && (
                        <div className="px-4 py-3 border-b"
                          style={{ borderColor: theme.borderSoft, background: `${ev.color}${isLight ? '14' : '08'}`, borderLeft: `2px solid ${ev.color}` }}>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="mono text-[10px] uppercase tracking-[0.15em] mb-1.5" style={{ color: theme.textDimmer }}>EPS</div>
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-sm font-semibold"
                                  style={{ color: e.epsActual != null ? surpriseColor(e.surprise, theme.accent, theme.accentGreen) : theme.textPrimary }}>
                                  {fmtNum(e.epsActual ?? e.epsEstimate)}
                                  {e.epsActual == null && e.epsEstimate != null && (
                                    <span className="text-[11px] ml-1" style={{ color: theme.textDimmer }}>(예상)</span>
                                  )}
                                </span>
                                {e.epsEstimate != null && e.epsActual != null && (
                                  <span className="text-[11px]" style={{ color: theme.textFaint }}>예상 {fmtNum(e.epsEstimate)}</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="mono text-[10px] uppercase tracking-[0.15em] mb-1.5" style={{ color: theme.textDimmer }}>서프라이즈</div>
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
                                <span className="text-[12px]" style={{ color: theme.textDimmer }}>-</span>
                              )}
                            </div>
                            {(e.revenueEstimate != null || e.revenueActual != null) && (
                              <div className="col-span-2">
                                <div className="mono text-[10px] uppercase tracking-[0.15em] mb-1.5" style={{ color: theme.textDimmer }}>매출</div>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                                    {fmtRevenue(e.revenueActual ?? e.revenueEstimate, e.market)}
                                    {e.revenueActual == null && e.revenueEstimate != null && (
                                      <span className="text-[11px] ml-1" style={{ color: theme.textDimmer }}>(예상)</span>
                                    )}
                                  </span>
                                  {e.revenueEstimate != null && e.revenueActual != null && (
                                    <span className="text-[11px]" style={{ color: theme.textFaint }}>예상 {fmtRevenue(e.revenueEstimate, e.market)}</span>
                                  )}
                                </div>
                              </div>
                            )}
                            {e.timing && e.timing !== 'unknown' && (
                              <div className="col-span-2">
                                <span className="mono text-[10px] px-1.5 py-0.5 border"
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

        {/* 다가오는 이벤트 */}
        <div className="border" style={{ borderColor: theme.border }}>
          <div className="px-4 py-2.5 border-b flex items-center justify-between"
            style={{ borderColor: theme.border, background: theme.bgCard }}>
            <span className="mono text-[11px] uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>
              UPCOMING
            </span>
            <span className="mono text-[10px]" style={{ color: theme.textDimmer }}>
              {loading ? '···' : `${allEvents.filter(e => e.dateKST >= today).length}건`}
            </span>
          </div>
          {([
            ...(activeFilters.has('MACRO') ? [...FOMC_2026, ...macroToUse, ...customCalEvents] as CalEvent[] : []),
            ...(activeFilters.has('OPTIONS') ? optionsCalEvents : []),
            ...(activeFilters.has('EARNINGS') ? earningEvents : []),
          ])
            .filter(ev => ev.dateKST >= today)
            .sort((a, b) => {
              const d = a.dateKST.localeCompare(b.dateKST);
              if (d !== 0) return d;
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
                  style={{ borderColor: theme.borderSoft, borderLeft: `2px solid ${ev.color}` }}
                  onMouseEnter={el => (el.currentTarget as HTMLElement).style.background = theme.bgHover}
                  onMouseLeave={el => (el.currentTarget as HTMLElement).style.background = 'transparent'}
                  onClick={() => {
                    setYear(parseInt(ev.dateKST.slice(0, 4)));
                    setMonth(parseInt(ev.dateKST.slice(5, 7)));
                    setSelectedDate(ev.dateKST);
                    setSelectedEarning(null);
                    setSelectedMacroDesc(null);
                  }}
                >
                  {/* D-Day 배지 */}
                  <span className="mono text-[10px] w-12 shrink-0 text-center py-0.5 mt-0.5 border"
                    style={{
                      color: diff === 0 ? ev.color : theme.textDimmer,
                      borderColor: diff === 0 ? ev.color : theme.borderSoft,
                    }}>
                    {diff === 0 ? 'D-DAY' : `D-${diff}`}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      {ev.time && (
                        <span className="mono text-[10px] shrink-0" style={{ color: ev.color, opacity: 0.7 }}>{ev.time}</span>
                      )}
                      <span className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{ev.label}</span>
                      {ev.importance && (
                        <span className="mono shrink-0" style={{ fontSize: '9px', color: ev.color, opacity: 0.8, letterSpacing: '-1px' }}>
                          {importanceDots(ev.importance)}
                        </span>
                      )}
                      {e?.sector && e.sector !== 'Other' && (
                        <span className="mono text-[10px] px-1 border"
                          style={{ color: SECTOR_COLOR[e.sector], borderColor: `${SECTOR_COLOR[e.sector]}40` }}>
                          {SECTOR_LABEL[e.sector]}
                        </span>
                      )}
                      {e?.isSP500 && (
                        <span className="mono text-[10px] px-1 border"
                          style={{ color: '#7BAF7A', borderColor: '#7BAF7A40' }}>S&P</span>
                      )}
                      {e?.isNDX100 && (
                        <span className="mono text-[10px] px-1 border"
                          style={{ color: '#7C6A9B', borderColor: '#7B9FDF40' }}>NDX</span>
                      )}
                      {e?.epsEstimate != null && (
                        <span className="mono text-[10px] ml-auto shrink-0" style={{ color: theme.textDimmer }}>
                          EPS {e.epsEstimate > 0 ? '+' : ''}{e.epsEstimate.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="mono text-[10px] shrink-0" style={{ color: theme.textFaint }}>
                        {ev.dateKST.slice(5).replace('-', '/')}
                      </span>
                      {e ? (
                        <span className="text-[11px] truncate" style={{ color: theme.textMuted }}>· {e.nameKo}</span>
                      ) : (
                        <span className="text-[11px] truncate" style={{ color: theme.textMuted }}>· {ev.desc}</span>
                      )}
                      {e?.marketCap != null && e.marketCap > 0 && (
                        <span className="mono text-[10px] ml-auto shrink-0" style={{ color: theme.textFaint }}>
                          ${e.marketCap >= 1000 ? `${(e.marketCap/1000).toFixed(1)}T` : `${e.marketCap}B`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        <p className="mono text-[10px] text-center mt-1 md:col-span-2" style={{ color: theme.textDimmer }}>
          모든 날짜·시간 KST 기준 · 어닝 데이터: Alpha Vantage · S&P500 / Nasdaq100 필터 지원
        </p>
      </div>
    </div>
  );
}
