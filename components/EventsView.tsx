'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, AlertCircle, Clock } from 'lucide-react';

const BORDER = '#2a2a2a';

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

// 날짜 문자열 생성 헬퍼
function dateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// 달력 날짜 배열 생성 (전달/다음달 날짜 포함, null 없음)
function getCalendarDays(year: number, month: number): { date: string; isCurrentMonth: boolean }[] {
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=일
  const lastDay = new Date(year, month, 0).getDate();
  const days: { date: string; isCurrentMonth: boolean }[] = [];

  // 전달 날짜 채우기
  if (firstDow > 0) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevLast = new Date(prevYear, prevMonth, 0).getDate();
    for (let d = prevLast - firstDow + 1; d <= prevLast; d++) {
      days.push({ date: dateStr(prevYear, prevMonth, d), isCurrentMonth: false });
    }
  }

  // 이번달
  for (let d = 1; d <= lastDay; d++) {
    days.push({ date: dateStr(year, month, d), isCurrentMonth: true });
  }

  // 다음달 채우기
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

export default function EventsView() {
  const today = getKSTToday();
  const [year, setYear] = useState(() => parseInt(today.slice(0, 4)));
  const [month, setMonth] = useState(() => parseInt(today.slice(5, 7)));
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const earnings: any[] = []; // 어닝 데이터 준비 중
  const loading = false;
  const updatedAt = null;

  // 어닝 → 달력 이벤트 변환
  const earningEvents: CalEvent[] = earnings.map(e => ({
    dateKST: e.dateKST,
    label: e.symbol,
    desc: e.nameKo + (e.timing ? ` · ${e.timing}` : ''),
    color: '#C89650',
    symbol: e.symbol,
    nameKo: e.nameKo,
    timing: e.timing,
  }));

  // 모든 이벤트를 날짜별로 그룹화
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

  // 선택된 날짜 이벤트
  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];

  // 이번 달 이벤트 요약 (범례용)
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const monthEventCount = Object.entries(eventsByDate).filter(([d]) => d.startsWith(monthStr)).reduce((s, [, evs]) => s + evs.length, 0);

  return (
    <div>
      {/* 상단 메타 바 */}
      <div className="mb-6 border-y" style={{ borderColor: BORDER }}>
        <div className="flex items-center justify-between gap-3 py-2 border-b mono text-[10px] uppercase tracking-[0.2em]" style={{ borderColor: BORDER, color: '#7a7a7a' }}>
          <div className="flex items-center gap-3">
            <span>§ Events Calendar</span>
            <span className="w-4 h-px hidden md:inline-block" style={{ background: '#3a3a3a' }}></span>
            <span className="hidden md:inline">Index / 003</span>
          </div>
          <span className="flex items-center gap-1.5" style={{ color: '#4a4a4a' }}>
            <Clock size={9} />
            어닝 데이터 준비 중
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-6 py-2 mono text-[10px] uppercase tracking-[0.2em]">
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: '#5a5a5a' }}>이달 이벤트</span><span style={{ color: '#e8e4d6' }}>{String(monthEventCount).padStart(3, '0')}</span></div>
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: '#5a5a5a' }}>어닝</span><span style={{ color: '#3a3a3a' }}>준비 중</span></div>
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: '#5a5a5a' }}>KST 기준</span></div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-5 items-start">

        {/* ── 달력 본체 ── */}
        <div className="w-full xl:flex-1 min-w-0 border" style={{ borderColor: BORDER }}>

          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b" style={{ borderColor: BORDER, background: '#0f0f0f' }}>
            <button onClick={prevMonth} className="p-1.5 hover:bg-white/5 transition-colors" style={{ color: '#a8a49a' }}>
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-4">
              <span className="text-base font-medium tracking-tight" style={{ color: '#e8e4d6' }}>
                {year}년 {month}월
              </span>
              <button
                onClick={goToday}
                className="text-[10px] mono uppercase tracking-[0.2em] px-2 py-0.5 border hover:bg-white/5 transition-colors"
                style={{ borderColor: BORDER, color: '#7a7a7a' }}
              >
                오늘
              </button>
            </div>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white/5 transition-colors" style={{ color: '#a8a49a' }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: BORDER }}>
            {DAY_LABELS.map((d, i) => (
              <div key={d} className="text-center py-2 text-[10px] mono uppercase tracking-[0.15em]"
                style={{ color: i === 0 ? '#7a3a3a' : i === 6 ? '#3a5a7a' : '#5a5a5a' }}>
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 — 6행 고정 (달마다 높이 통일) */}
          <div className="grid grid-cols-7" style={{ gridTemplateRows: `repeat(${days.length / 7}, 1fr)` }}>
            {days.map(({ date: day, isCurrentMonth }, idx) => {
              const dayNum = parseInt(day.slice(8));
              const dow = new Date(day + 'T00:00:00').getDay();
              const isToday = day === today;
              const isSelected = day === selectedDate;
              const isPast = day < today;
              const evs = eventsByDate[day] ?? [];

              // 불투명도: 이번달=1.0, 전/다음달=0.3, 지난날(이번달)=0.5
              const opacity = !isCurrentMonth ? 0.3 : isPast && !isToday ? 0.5 : 1;

              return (
                <div
                  key={`${day}-${idx}`}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className="border-r border-b p-1.5 cursor-pointer transition-colors"
                  style={{ height: '90px' }}
                  style={{
                    borderColor: '#1a1a1a',
                    background: isSelected ? '#1e1e1e' : isToday ? '#161610' : 'transparent',
                    outline: isSelected ? `1px solid #C89650` : isToday ? '1px solid #3a3a20' : 'none',
                    outlineOffset: '-1px',
                    opacity,
                  }}
                >
                  {/* 날짜 숫자 */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs mono w-5 h-5 flex items-center justify-center"
                      style={{
                        color: isToday ? '#C89650' : dow === 0 ? '#7a3a3a' : dow === 6 ? '#3a5a7a' : '#7a7a7a',
                        fontWeight: isToday ? 700 : 400,
                        background: isToday ? '#C8965020' : 'transparent',
                        borderRadius: '2px',
                      }}
                    >
                      {dayNum}
                    </span>
                  </div>

                  {/* 이벤트 도트/뱃지 */}
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
                      <div className="text-[9px] mono px-1" style={{ color: '#5a5a5a' }}>+{evs.length - 3}개</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 범례 */}
          <div className="flex items-center gap-4 px-4 md:px-6 py-3 border-t" style={{ borderColor: BORDER, background: '#0a0a0a' }}>
            {[
              { color: '#4F7E7C', label: 'FOMC' },
              { color: '#C89650', label: '미국 어닝' },
              { color: '#8A8A8A', label: 'K200 선물만기' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: `${color}44`, borderLeft: `2px solid ${color}` }} />
                <span className="text-[10px] mono" style={{ color: '#5a5a5a' }}>{label}</span>
              </div>
            ))}
            <span className="flex items-center gap-1 ml-auto text-[10px] mono" style={{ color: '#3a3a3a' }}>
              <Clock size={9} /> 미국 어닝 준비 중
            </span>
          </div>
        </div>

        {/* ── 우측: 선택 날짜 상세 / 다가오는 이벤트 ── */}
        <div className="w-full xl:w-[260px] shrink-0 xl:sticky xl:top-[90px]">

          {/* 선택 날짜 이벤트 */}
          {selectedDate && (
            <div className="border mb-4" style={{ borderColor: BORDER }}>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: BORDER, background: '#0f0f0f' }}>
                <span className="text-[11px] mono uppercase tracking-[0.2em]" style={{ color: '#a8a49a' }}>
                  {parseInt(selectedDate.slice(5, 7))}월 {parseInt(selectedDate.slice(8, 10))}일
                </span>
                {selectedDate === today && (
                  <span className="text-[9px] mono px-1.5 py-0.5" style={{ background: '#C8965020', color: '#C89650', border: '1px solid #C8965040' }}>TODAY</span>
                )}
              </div>
              {selectedEvents.length === 0 ? (
                <div className="px-4 py-6 text-center text-[11px]" style={{ color: '#4a4a4a' }}>이벤트 없음</div>
              ) : (
                <div>
                  {selectedEvents.map((ev, i) => (
                    <div key={i} className="px-4 py-3 border-b" style={{ borderColor: '#1a1a1a', borderLeft: `3px solid ${ev.color}` }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold" style={{ color: ev.color }}>{ev.label}</span>
                      </div>
                      <div className="text-[11px]" style={{ color: '#7a7a7a' }}>{ev.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 다가오는 이벤트 리스트 */}
          <div className="border" style={{ borderColor: BORDER }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: BORDER, background: '#0f0f0f' }}>
              <span className="text-[11px] mono uppercase tracking-[0.2em]" style={{ color: '#a8a49a' }}>다가오는 이벤트</span>
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
                    className="px-4 py-2.5 border-b flex items-start gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                    style={{ borderColor: '#1a1a1a' }}
                    onClick={() => {
                      setYear(parseInt(ev.dateKST.slice(0, 4)));
                      setMonth(parseInt(ev.dateKST.slice(5, 7)));
                      setSelectedDate(ev.dateKST);
                    }}
                  >
                    <span className="text-[10px] mono w-10 shrink-0 text-center py-0.5 mt-0.5"
                      style={{ color: diff === 0 ? ev.color : '#5a5a5a', border: `1px solid ${diff === 0 ? ev.color : '#2a2a2a'}` }}>
                      {diff === 0 ? 'D-Day' : `D-${diff}`}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ background: ev.color }} />
                        <span className="text-xs font-medium truncate" style={{ color: '#e8e4d6' }}>{ev.label}</span>
                      </div>
                      <div className="text-[10px] mono truncate" style={{ color: '#5a5a5a' }}>
                        {ev.dateKST.slice(5).replace('-', '/')} · {ev.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <p className="text-[9px] mono text-center mt-3" style={{ color: '#2a2a2a' }}>
            모든 날짜·시간 KST 기준 · 어닝: Finnhub
          </p>
        </div>
      </div>
    </div>
  );
}
