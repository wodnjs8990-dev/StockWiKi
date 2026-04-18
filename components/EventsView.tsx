'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

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

// KST 오늘
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
    for (let d = prevLast - firstDow + 1; d <= prevLast; d++) {
      days.push({ date: dateStr(prevYear, prevMonth, d), isCurrentMonth: false });
    }
  }
  for (let d = 1; d <= lastDay; d++) {
    days.push({ date: dateStr(year, month, d), isCurrentMonth: true });
  }
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  let nd = 1;
  while (days.length % 7 !== 0) {
    days.push({ date: dateStr(nextYear, nextMonth, nd++), isCurrentMonth: false });
  }
  return days;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

type CalEvent = { dateKST: string; label: string; desc: string; color: string; symbol?: string; nameKo?: string; timing?: string };

export default function EventsView({ T }: { T?: any }) {
  // T가 없을 때(SSR 등) 다크 팔레트 기본값
  const theme = T ?? {
    bgPage: '#1a1a1a', bgSurface: '#141414', bgCard: '#0f0f0f',
    bgTabActive: '#e8e4d6', textPrimary: '#e8e4d6', textSecondary: '#d4d0c4',
    textMuted: '#a8a49a', textFaint: '#7a7a7a', textDimmer: '#5a5a5a',
    border: '#2a2a2a', borderSoft: '#252525', borderMid: '#3a3a3a',
    accent: '#C89650', accentGreen: '#4A7045',
  };

  const today = getKSTToday();
  const [year, setYear] = useState(() => parseInt(today.slice(0, 4)));
  const [month, setMonth] = useState(() => parseInt(today.slice(5, 7)));
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const earnings: any[] = [];

  const earningEvents: CalEvent[] = earnings.map(e => ({
    dateKST: e.dateKST,
    label: e.symbol,
    desc: e.nameKo + (e.timing ? ` · ${e.timing}` : ''),
    color: '#C89650',
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
  const goToday = () => { const t = getKSTToday(); setYear(parseInt(t.slice(0, 4))); setMonth(parseInt(t.slice(5, 7))); setSelectedDate(t); };

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const monthEventCount = Object.entries(eventsByDate).filter(([d]) => d.startsWith(monthStr)).reduce((s, [, evs]) => s + evs.length, 0);

  return (
    <div>
      {/* 상단 메타 바 */}
      <div className="mb-6 border-y" style={{ borderColor: theme.border }}>
        <div className="flex items-center justify-between gap-3 py-2 border-b mono text-[10px] uppercase tracking-[0.2em]" style={{ borderColor: theme.border, color: theme.textFaint }}>
          <div className="flex items-center gap-3">
            <span>§ Events Calendar</span>
            <span className="w-4 h-px hidden md:inline-block" style={{ background: theme.borderMid }}></span>
            <span className="hidden md:inline">Index / 003</span>
          </div>
          <span className="flex items-center gap-1.5" style={{ color: theme.accent }}>
            <Clock size={9} />
            어닝 데이터 준비 중
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-6 py-2 mono text-[10px] uppercase tracking-[0.2em]">
          <div className="flex items-baseline gap-1 md:gap-2">
            <span style={{ color: theme.textDimmer }}>이달 이벤트</span>
            <span style={{ color: theme.textPrimary }}>{String(monthEventCount).padStart(3, '0')}</span>
          </div>
          <div className="flex items-baseline gap-1 md:gap-2">
            <span style={{ color: theme.textDimmer }}>어닝</span>
            <span style={{ color: theme.borderMid }}>준비 중</span>
          </div>
          <div className="flex items-baseline gap-1 md:gap-2">
            <span style={{ color: theme.textDimmer }}>KST 기준</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">

        {/* ── 달력 본체 ── */}
        <div className="w-full min-w-0 border" style={{ borderColor: theme.border, maxWidth: '720px', margin: '0 auto' }}>

          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b" style={{ borderColor: theme.border, background: theme.bgCard }}>
            <button onClick={prevMonth} className="p-1.5 transition-colors hover:opacity-70" style={{ color: theme.textMuted }}>
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-4">
              <span className="text-base font-medium tracking-tight" style={{ color: theme.textPrimary }}>
                {year}년 {month}월
              </span>
              <button
                onClick={goToday}
                className="text-[10px] mono uppercase tracking-[0.2em] px-2 py-0.5 border transition-colors hover:opacity-70"
                style={{ borderColor: theme.border, color: theme.textFaint }}
              >
                오늘
              </button>
            </div>
            <button onClick={nextMonth} className="p-1.5 transition-colors hover:opacity-70" style={{ color: theme.textMuted }}>
              <ChevronRight size={16} />
            </button>
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
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className="border-r border-b p-1.5 cursor-pointer transition-colors overflow-hidden"
                  style={{
                    aspectRatio: '1 / 1',
                    borderColor: theme.borderSoft,
                    background: isToday
                      ? `${theme.accent}14`
                      : isSelected
                      ? theme.bgHover
                      : 'transparent',
                    outline: isToday ? `1px solid ${theme.accent}50` : isSelected ? `1px solid ${theme.borderMid}` : 'none',
                    outlineOffset: '-1px',
                    opacity,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs mono w-5 h-5 flex items-center justify-center"
                      style={{
                        color: isToday ? theme.accent : dow === 0 ? '#A63D33' : dow === 6 ? '#3a5a7a' : theme.textFaint,
                        fontWeight: isToday ? 700 : 400,
                        borderRadius: '2px',
                      }}
                    >
                      {dayNum}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    {evs.slice(0, 3).map((ev, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 px-1 py-0.5 text-[9px] md:text-[10px] truncate"
                        style={{
                          background: `${ev.color}22`,
                          borderLeft: `2px solid ${ev.color}`,
                          color: ev.color,
                        }}
                      >
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
          <div className="flex items-center gap-4 px-4 md:px-6 py-3 border-t" style={{ borderColor: theme.border, background: theme.bgCard }}>
            {[
              { color: '#4F7E7C', label: 'FOMC' },
              { color: '#C89650', label: '미국 어닝' },
              { color: '#8A8A8A', label: 'K200 선물만기' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: `${color}33`, borderLeft: `2px solid ${color}` }} />
                <span className="text-[10px] mono" style={{ color: theme.textDimmer }}>{label}</span>
              </div>
            ))}
            <span className="flex items-center gap-1 ml-auto text-[10px] mono" style={{ color: theme.textDimmer }}>
              <Clock size={9} /> 미국 어닝 준비 중
            </span>
          </div>
        </div>

        {/* ── 하단: 선택 날짜 상세 / 다가오는 이벤트 ── */}
        <div className="grid md:grid-cols-2 gap-5" style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>

          {/* 선택 날짜 이벤트 */}
          {selectedDate && (
            <div className="border" style={{ borderColor: theme.border }}>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: theme.border, background: theme.bgCard }}>
                <span className="text-[11px] mono uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>
                  {parseInt(selectedDate.slice(5, 7))}월 {parseInt(selectedDate.slice(8, 10))}일
                </span>
                {selectedDate === today && (
                  <span
                    className="text-[9px] mono px-1.5 py-0.5 border"
                    style={{ background: `${theme.accent}20`, color: theme.accent, borderColor: `${theme.accent}40` }}
                  >
                    TODAY
                  </span>
                )}
              </div>
              {selectedEvents.length === 0 ? (
                <div className="px-4 py-6 text-center text-[11px]" style={{ color: theme.textDimmer }}>이벤트 없음</div>
              ) : (
                <div>
                  {selectedEvents.map((ev, i) => (
                    <div key={i} className="px-4 py-3 border-b" style={{ borderColor: theme.borderSoft, borderLeft: `3px solid ${ev.color}` }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold" style={{ color: ev.color }}>{ev.label}</span>
                      </div>
                      <div className="text-[11px]" style={{ color: theme.textMuted }}>{ev.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 다가오는 이벤트 리스트 */}
          <div className="border" style={{ borderColor: theme.border }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: theme.border, background: theme.bgCard }}>
              <span className="text-[11px] mono uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>다가오는 이벤트</span>
            </div>
            {allEvents
              .filter(ev => ev.dateKST >= today)
              .sort((a, b) => a.dateKST.localeCompare(b.dateKST))
              .slice(0, 10)
              .map((ev, i) => {
                const diff = Math.ceil((new Date(ev.dateKST).getTime() - new Date(today).getTime()) / 86400000);
                return (
                  <div
                    key={i}
                    className="px-4 py-2.5 border-b flex items-start gap-3 cursor-pointer transition-colors"
                    style={{ borderColor: theme.borderSoft }}
                    onMouseEnter={e => (e.currentTarget.style.background = theme.bgHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => {
                      setYear(parseInt(ev.dateKST.slice(0, 4)));
                      setMonth(parseInt(ev.dateKST.slice(5, 7)));
                      setSelectedDate(ev.dateKST);
                    }}
                  >
                    <span
                      className="text-[10px] mono w-10 shrink-0 text-center py-0.5 mt-0.5 border"
                      style={{
                        color: diff === 0 ? ev.color : theme.textDimmer,
                        borderColor: diff === 0 ? ev.color : theme.border,
                      }}
                    >
                      {diff === 0 ? 'D-Day' : `D-${diff}`}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ background: ev.color }} />
                        <span className="text-xs font-medium truncate" style={{ color: theme.textPrimary }}>{ev.label}</span>
                      </div>
                      <div className="text-[10px] mono truncate" style={{ color: theme.textFaint }}>
                        {ev.dateKST.slice(5).replace('-', '/')} · {ev.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <p className="text-[9px] mono text-center mt-1 md:col-span-2" style={{ color: theme.textDimmer }}>
            모든 날짜·시간 KST 기준 · 어닝: Finnhub
          </p>
        </div>
      </div>
    </div>
  );
}
