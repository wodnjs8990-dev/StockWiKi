'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const BORDER = '#2a2a2a';

// ── FOMC 2026 일정 (KST 기준, 연준 공식 발표 기준 +14시간)
const FOMC_2026 = [
  { date: '2026-01-29', dateKST: '2026-01-30', label: 'FOMC 정례회의', desc: '금리 결정 발표' },
  { date: '2026-03-19', dateKST: '2026-03-20', label: 'FOMC 정례회의', desc: '금리 결정 발표 + 점도표' },
  { date: '2026-05-07', dateKST: '2026-05-08', label: 'FOMC 정례회의', desc: '금리 결정 발표' },
  { date: '2026-06-18', dateKST: '2026-06-19', label: 'FOMC 정례회의', desc: '금리 결정 발표 + 점도표' },
  { date: '2026-07-30', dateKST: '2026-07-31', label: 'FOMC 정례회의', desc: '금리 결정 발표' },
  { date: '2026-09-17', dateKST: '2026-09-18', label: 'FOMC 정례회의', desc: '금리 결정 발표 + 점도표' },
  { date: '2026-11-05', dateKST: '2026-11-06', label: 'FOMC 정례회의', desc: '금리 결정 발표' },
  { date: '2026-12-17', dateKST: '2026-12-18', label: 'FOMC 정례회의', desc: '금리 결정 발표 + 점도표' },
];

// ── 코스피200 선물 만기일 계산 (매 분기 둘째 주 목요일)
function getFuturesExpiry(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  let thursCount = 0;
  while (true) {
    if (d.getMonth() !== month - 1) break;
    if (d.getDay() === 4) {
      thursCount++;
      if (thursCount === 2) break;
    }
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().slice(0, 10);
}

function getFuturesEvents() {
  const quarters = [3, 6, 9, 12];
  const events = [];
  for (const m of quarters) {
    const date = getFuturesExpiry(2026, m);
    events.push({
      date,
      dateKST: date,
      label: `코스피200 선물 만기`,
      desc: `${m}월 분기물 최종거래일`,
    });
  }
  return events;
}

// D-Day 계산 (KST 기준 오늘)
function getDDay(dateStr: string): { label: string; value: number } {
  const today = new Date();
  const kstToday = new Date(today.getTime() + 9 * 60 * 60 * 1000);
  const todayStr = kstToday.toISOString().slice(0, 10);
  const diff = Math.ceil(
    (new Date(dateStr).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return { label: 'D-Day', value: 0 };
  if (diff > 0) return { label: `D-${diff}`, value: diff };
  return { label: `D+${Math.abs(diff)}`, value: diff };
}

function formatDateKO(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${dateStr.slice(0, 4)}년 ${parseInt(dateStr.slice(5, 7))}월 ${parseInt(dateStr.slice(8, 10))}일 (${days[d.getDay()]})`;
}

// 섹션 헤더
function SectionHeader({ title, color, count }: { title: string; color: string; count: number }) {
  return (
    <div className="px-4 md:px-6 py-3 flex items-center gap-3 border-b" style={{ background: '#0f0f0f', borderColor: BORDER }}>
      <span className="w-2 h-2 rounded-full" style={{ background: color }}></span>
      <span className="text-xs md:text-sm mono uppercase tracking-[0.2em]" style={{ color: '#a8a49a' }}>{title}</span>
      <span className="ml-auto text-[10px] mono" style={{ color: '#5a5a5a' }}>{String(count).padStart(2, '0')} EVENTS</span>
    </div>
  );
}

// 이벤트 행 (FOMC / 선물만기)
function EventRow({ event, color }: { event: any; color: string }) {
  const dday = getDDay(event.dateKST);
  const isPast = dday.value < 0;
  const isToday = dday.value === 0;

  return (
    <div
      className="flex items-center gap-3 px-4 md:px-6 py-3 border-b text-sm"
      style={{
        borderColor: '#1a1a1a',
        opacity: isPast ? 0.4 : 1,
        background: isToday ? `${color}10` : 'transparent',
      }}
    >
      {/* D-Day 뱃지 */}
      <span
        className="text-[10px] mono w-14 shrink-0 text-center py-0.5 border"
        style={{
          borderColor: isToday ? color : '#2a2a2a',
          color: isToday ? color : dday.value > 0 ? '#a8a49a' : '#5a5a5a',
          background: isToday ? `${color}15` : 'transparent',
        }}
      >
        {dday.label}
      </span>

      {/* 날짜 */}
      <span className="text-[11px] mono shrink-0" style={{ color: '#7a7a7a' }}>
        {formatDateKO(event.dateKST)}
      </span>

      {/* 이벤트명 */}
      <div className="flex-1 min-w-0">
        <span className="font-medium" style={{ color: '#e8e4d6' }}>{event.label}</span>
        {event.desc && (
          <span className="ml-2 text-[11px]" style={{ color: '#5a5a5a' }}>{event.desc}</span>
        )}
      </div>
    </div>
  );
}

// 어닝 행
function EarningRow({ e }: { e: any }) {
  const dday = getDDay(e.dateKST);
  const isPast = dday.value < 0;
  const isToday = dday.value === 0;
  const color = '#C89650';

  return (
    <div
      className="flex items-center gap-3 px-4 md:px-6 py-3 border-b text-sm"
      style={{
        borderColor: '#1a1a1a',
        opacity: isPast ? 0.4 : 1,
        background: isToday ? `${color}10` : 'transparent',
      }}
    >
      {/* D-Day */}
      <span
        className="text-[10px] mono w-14 shrink-0 text-center py-0.5 border"
        style={{
          borderColor: isToday ? color : '#2a2a2a',
          color: isToday ? color : dday.value > 0 ? '#a8a49a' : '#5a5a5a',
          background: isToday ? `${color}15` : 'transparent',
        }}
      >
        {dday.label}
      </span>

      {/* 날짜 */}
      <span className="text-[11px] mono shrink-0 hidden md:inline" style={{ color: '#7a7a7a' }}>
        {formatDateKO(e.dateKST)}
      </span>
      <span className="text-[11px] mono shrink-0 md:hidden" style={{ color: '#7a7a7a' }}>
        {e.dateKST.slice(5).replace('-', '/')}
      </span>

      {/* 종목 */}
      <span
        className="text-[11px] mono w-12 shrink-0 font-bold"
        style={{ color: '#C89650' }}
      >
        {e.symbol}
      </span>

      {/* 회사명 */}
      <span className="font-medium truncate" style={{ color: '#e8e4d6' }}>{e.nameKo}</span>

      {/* 발표 타이밍 */}
      {e.timing && (
        <span className="ml-auto text-[10px] mono shrink-0 hidden sm:inline" style={{ color: '#5a5a5a' }}>
          {e.timing}
        </span>
      )}
    </div>
  );
}

export default function EventsView() {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  const futuresEvents = getFuturesEvents();
  const today = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // 예정 FOMC (오늘 이후)
  const upcomingFomc = FOMC_2026.filter(f => f.dateKST >= today);
  const pastFomc = FOMC_2026.filter(f => f.dateKST < today);
  const upcomingFutures = futuresEvents.filter(f => f.dateKST >= today);

  useEffect(() => {
    fetch('/api/events')
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setEarnings(data.earnings ?? []);
          setUpdatedAt(data.updatedAt);
        } else {
          setError(data.error ?? '데이터 로드 실패');
        }
      })
      .catch(() => setError('네트워크 오류'))
      .finally(() => setLoading(false));
  }, []);

  const upcomingEarnings = earnings.filter(e => e.dateKST >= today);
  const pastEarnings = earnings.filter(e => e.dateKST < today);

  // 다음 FOMC까지 D-Day
  const nextFomc = upcomingFomc[0];
  const nextFomcDday = nextFomc ? getDDay(nextFomc.dateKST) : null;

  return (
    <div>
      {/* 헤더 메타 바 */}
      <div className="mb-6 border-y" style={{ borderColor: BORDER }}>
        <div className="flex items-center justify-between gap-3 py-2 border-b mono text-[10px] uppercase tracking-[0.2em]" style={{ borderColor: BORDER, color: '#7a7a7a' }}>
          <div className="flex items-center gap-3">
            <span>§ Events</span>
            <span className="w-4 h-px hidden md:inline-block" style={{ background: '#3a3a3a' }}></span>
            <span className="hidden md:inline">Index / 003</span>
          </div>
          {updatedAt && (
            <span className="flex items-center gap-1.5" style={{ color: '#4a4a4a' }}>
              <RefreshCw size={9} />
              KST {new Date(new Date(updatedAt).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(11, 16)} 업데이트
            </span>
          )}
        </div>

        {/* 요약 카운터 */}
        <div className="grid grid-cols-3 gap-2 md:gap-6 py-2 mono text-[10px] uppercase tracking-[0.2em]">
          <div className="flex items-baseline gap-1 md:gap-2">
            <span style={{ color: '#5a5a5a' }}>FOMC</span>
            <span style={{ color: nextFomcDday ? '#C89650' : '#e8e4d6' }}>
              {nextFomcDday ? nextFomcDday.label : '—'}
            </span>
          </div>
          <div className="flex items-baseline gap-1 md:gap-2">
            <span style={{ color: '#5a5a5a' }}>어닝</span>
            <span style={{ color: '#e8e4d6' }}>{String(upcomingEarnings.length).padStart(3, '0')}</span>
          </div>
          <div className="flex items-baseline gap-1 md:gap-2">
            <span style={{ color: '#5a5a5a' }}>만기</span>
            <span style={{ color: '#e8e4d6' }}>{upcomingFutures.length > 0 ? getDDay(upcomingFutures[0].dateKST).label : '—'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-5">

        {/* ── FOMC 섹션 ── */}
        <div className="border" style={{ borderColor: BORDER }}>
          <SectionHeader title="FOMC 금리 결정" color="#4F7E7C" count={upcomingFomc.length} />
          {upcomingFomc.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm" style={{ color: '#5a5a5a' }}>2026년 일정 종료</div>
          ) : (
            upcomingFomc.map((f, i) => (
              <EventRow key={i} event={f} color="#4F7E7C" />
            ))
          )}
          {pastFomc.length > 0 && (
            <button
              onClick={() => setShowPast(p => !p)}
              className="w-full flex items-center justify-center gap-2 py-2 text-[11px] mono uppercase tracking-[0.2em] hover:bg-white/5 transition-colors border-t"
              style={{ borderColor: BORDER, color: '#4a4a4a' }}
            >
              {showPast ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              {showPast ? '지난 일정 접기' : `지난 일정 ${pastFomc.length}개 보기`}
            </button>
          )}
          {showPast && pastFomc.map((f, i) => (
            <EventRow key={`past-${i}`} event={f} color="#4F7E7C" />
          ))}
        </div>

        {/* ── 미국 주요 어닝 섹션 ── */}
        <div className="border" style={{ borderColor: BORDER }}>
          <SectionHeader title="미국 주요 실적 발표 (KST)" color="#C89650" count={upcomingEarnings.length} />
          {loading && (
            <div className="flex items-center justify-center gap-3 py-12" style={{ color: '#5a5a5a' }}>
              <RefreshCw size={14} className="animate-spin" />
              <span className="text-sm">Finnhub에서 불러오는 중...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 px-6 py-5 text-sm" style={{ color: '#A63D33' }}>
              <AlertCircle size={14} />
              <span>데이터 로드 실패: {error}</span>
            </div>
          )}
          {!loading && !error && upcomingEarnings.length === 0 && (
            <div className="px-6 py-8 text-center text-sm" style={{ color: '#5a5a5a' }}>
              향후 8주 이내 주요 실적 발표 없음
            </div>
          )}
          {!loading && upcomingEarnings.map((e, i) => (
            <EarningRow key={i} e={e} />
          ))}
          {!loading && pastEarnings.length > 0 && (
            <div className="px-4 md:px-6 py-2 text-[10px] mono border-t" style={{ borderColor: BORDER, color: '#4a4a4a' }}>
              지난 실적 {pastEarnings.length}개 — 스크롤 상단 기준 오늘부터 표시
            </div>
          )}
        </div>

        {/* ── 선물 만기 섹션 ── */}
        <div className="border" style={{ borderColor: BORDER }}>
          <SectionHeader title="코스피200 선물 만기" color="#8A8A8A" count={upcomingFutures.length} />
          {upcomingFutures.map((f, i) => (
            <EventRow key={i} event={f} color="#8A8A8A" />
          ))}
          {upcomingFutures.length === 0 && (
            <div className="px-6 py-8 text-center text-sm" style={{ color: '#5a5a5a' }}>2026년 만기 종료</div>
          )}
        </div>

        {/* 주의 문구 */}
        <p className="text-[10px] mono text-center pb-4" style={{ color: '#3a3a3a' }}>
          모든 날짜·시간은 KST(한국 표준시) 기준 · 어닝 데이터 출처: Finnhub · FOMC 일정은 연준 공식 발표 기준
        </p>
      </div>
    </div>
  );
}
