import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
// 하루 1회 캐싱 (경제지표 일정은 자주 안 바뀜)
export const revalidate = 86400;

const FINNHUB_KEY = process.env.FINNHUB_API_KEY ?? '';
const FRED_KEY    = process.env.FRED_API_KEY ?? '';

// ─────────────────────────────────────────────
// FRED 주요 Release ID → 한글 레이블 매핑
// https://fred.stlouisfed.org/releases
// ─────────────────────────────────────────────
const FRED_RELEASES: Record<number, { label: string; color: string; desc: string }> = {
  10:   { label: 'NFP',       color: '#7B9FDF', desc: 'Nonfarm Payrolls (BLS)' },
  46:   { label: '실업률',     color: '#6A9FD0', desc: 'Unemployment Rate (BLS)' },
  20:   { label: 'CPI',       color: '#E07B54', desc: 'Consumer Price Index (BLS)' },
  31:   { label: 'PCE',       color: '#B07AB0', desc: 'Personal Income & PCE (BEA)' },
  53:   { label: 'GDP',       color: '#5FA8A0', desc: 'Gross Domestic Product (BEA)' },
  14:   { label: 'PPI',       color: '#D4956A', desc: 'Producer Price Index (BLS)' },
  245:  { label: 'Core PCE',  color: '#C090C0', desc: 'Core PCE Price Index (BEA)' },
  185:  { label: '소매판매',   color: '#C89650', desc: 'Advance Retail Sales (Census)' },
  17:   { label: '산업생산',   color: '#8A8A8A', desc: 'Industrial Production (Fed)' },
  175:  { label: '주택착공',   color: '#9B7FD4', desc: 'Housing Starts (Census)' },
  462:  { label: '내구재',     color: '#8A8A8A', desc: 'Durable Goods Orders (Census)' },
  112:  { label: '무역수지',   color: '#8A8A8A', desc: 'U.S. Trade Balance (BEA/Census)' },
  22:   { label: '소비자신뢰', color: '#CBA070', desc: 'Consumer Confidence (Conference Board)' },
  109:  { label: '기존주택',   color: '#9B7FD4', desc: 'Existing Home Sales (NAR)' },
  267:  { label: '신규주택',   color: '#9B7FD4', desc: 'New Home Sales (Census)' },
  418:  { label: 'UMich신뢰',  color: '#C8A458', desc: 'Univ. of Michigan Consumer Sentiment' },
  180:  { label: '실업청구',   color: '#8AB4E8', desc: 'Initial Jobless Claims (DOL)' },
  21:   { label: 'ISM제조',    color: '#7BAF7A', desc: 'ISM Manufacturing PMI' },
  323:  { label: 'ISM서비스',  color: '#7BAF7A', desc: 'ISM Services PMI' },
};

// ─────────────────────────────────────────────
// Finnhub 이벤트명 → 한글 매핑
// ─────────────────────────────────────────────
const FINNHUB_LABEL: Record<string, { label: string; color: string }> = {
  'Nonfarm Payrolls':                { label: 'NFP',        color: '#7B9FDF' },
  'ADP Nonfarm Employment Change':   { label: 'ADP',        color: '#5B8FD4' },
  'Initial Jobless Claims':          { label: '실업청구',    color: '#8AB4E8' },
  'Unemployment Rate':               { label: '실업률',      color: '#6A9FD0' },
  'CPI m/m':                         { label: 'CPI',        color: '#E07B54' },
  'Core CPI m/m':                    { label: 'Core CPI',   color: '#E89070' },
  'PPI m/m':                         { label: 'PPI',        color: '#D4956A' },
  'Core PPI m/m':                    { label: 'Core PPI',   color: '#DDA070' },
  'PCE Price Index m/m':             { label: 'PCE',        color: '#B07AB0' },
  'Core PCE Price Index m/m':        { label: 'Core PCE',   color: '#C090C0' },
  'GDP q/q':                         { label: 'GDP',        color: '#5FA8A0' },
  'GDP Growth Rate QoQ Adv':         { label: 'GDP 속보',   color: '#5FA8A0' },
  'Advance GDP q/q':                 { label: 'GDP 속보',   color: '#5FA8A0' },
  'Retail Sales m/m':                { label: '소매판매',    color: '#C89650' },
  'Core Retail Sales m/m':           { label: 'Core 소매',  color: '#D4A060' },
  'Consumer Confidence':             { label: '소비자신뢰',  color: '#CBA070' },
  'CB Consumer Confidence':          { label: '소비자신뢰',  color: '#CBA070' },
  'Michigan Consumer Sentiment':     { label: 'UMich신뢰',  color: '#C8A458' },
  'ISM Manufacturing PMI':           { label: 'ISM제조',    color: '#7BAF7A' },
  'ISM Services PMI':                { label: 'ISM서비스',  color: '#7BAF7A' },
  'ISM Non-Manufacturing PMI':       { label: 'ISM서비스',  color: '#7BAF7A' },
  'S&P Global Manufacturing PMI':    { label: 'PMI제조',    color: '#8ABF8A' },
  'S&P Global Services PMI':         { label: 'PMI서비스',  color: '#8ABF8A' },
  'Flash Manufacturing PMI':         { label: 'PMI제조F',   color: '#8ABF8A' },
  'Flash Services PMI':              { label: 'PMI서비스F', color: '#8ABF8A' },
  'Existing Home Sales':             { label: '기존주택',    color: '#9B7FD4' },
  'New Home Sales':                  { label: '신규주택',    color: '#9B7FD4' },
  'Housing Starts':                  { label: '주택착공',    color: '#9B7FD4' },
  'Pending Home Sales m/m':          { label: '주택대기',    color: '#9B7FD4' },
  'Crude Oil Inventories':           { label: 'EIA원유',    color: '#C4A84F' },
  'Natural Gas Storage':             { label: 'EIA가스',    color: '#C4A84F' },
  'Business Inventories':            { label: '기업재고',    color: '#A8A870' },
  'Trade Balance':                   { label: '무역수지',    color: '#8A8A8A' },
  'Industrial Production m/m':       { label: '산업생산',    color: '#8A8A8A' },
  'Durable Goods Orders m/m':        { label: '내구재',      color: '#8A8A8A' },
  'MBA Mortgage Applications':       { label: 'MBA모기지',  color: '#6A9FA0' },
  'Fed Interest Rate Decision':      { label: 'FOMC',       color: '#4F7E7C' },
  'FOMC Meeting Minutes':            { label: 'FOMC의사록', color: '#4F7E7C' },
  '2-Year Note Auction':             { label: '국채2Y',     color: '#7A9FA0' },
  '5-Year Note Auction':             { label: '국채5Y',     color: '#7A9FA0' },
  '7-Year Note Auction':             { label: '국채7Y',     color: '#7A9FA0' },
  '10-Year Note Auction':            { label: '국채10Y',    color: '#7A9FA0' },
  '20-Year Bond Auction':            { label: '국채20Y',    color: '#7A9FA0' },
  '30-Year Bond Auction':            { label: '국채30Y',    color: '#7A9FA0' },
  '3-Month Bill Auction':            { label: '국채3M',     color: '#7A9FA0' },
  '6-Month Bill Auction':            { label: '국채6M',     color: '#7A9FA0' },
};

export type MacroEvent = {
  date: string;
  label: string;
  desc: string;
  color: string;
  source: 'fred' | 'finnhub';
  actual?: number | null;
  estimate?: number | null;
  prev?: number | null;
  unit?: string;
};

// ─────────────────────────────────────────────
// FRED: 각 release_id의 발표 예정일 fetch
// ─────────────────────────────────────────────
async function fetchFredReleaseDates(releaseId: number, from: string, to: string): Promise<string[]> {
  const url = `https://api.stlouisfed.org/fred/release/dates?release_id=${releaseId}&realtime_start=${from}&realtime_end=${to}&include_release_dates_with_no_data=true&api_key=${FRED_KEY}&file_type=json`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.release_dates ?? []).map((d: any) => d.date as string);
  } catch {
    return [];
  }
}

async function fetchFredEvents(from: string, to: string): Promise<MacroEvent[]> {
  if (!FRED_KEY) return [];

  const results: MacroEvent[] = [];
  // 병렬 fetch
  const entries = Object.entries(FRED_RELEASES);
  const batches = await Promise.all(
    entries.map(([idStr, meta]) =>
      fetchFredReleaseDates(Number(idStr), from, to).then(dates =>
        dates.map(date => ({
          date,
          label: meta.label,
          desc:  meta.desc,
          color: meta.color,
          source: 'fred' as const,
          actual: null,
          estimate: null,
          prev: null,
        }))
      )
    )
  );
  for (const batch of batches) results.push(...batch);
  return results;
}

// ─────────────────────────────────────────────
// Finnhub: 경제지표 캘린더 fetch
// ─────────────────────────────────────────────
async function fetchFinnhubEvents(from: string, to: string): Promise<MacroEvent[]> {
  if (!FINNHUB_KEY) return [];
  const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${FINNHUB_KEY}`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const json = await res.json();
    const items: any[] = json.economicCalendar ?? [];

    const results: MacroEvent[] = [];
    for (const item of items) {
      if (item.country && item.country.toUpperCase() !== 'US') continue;
      const mapped = FINNHUB_LABEL[item.event];
      if (!mapped) continue;
      // impact 필터: high 또는 매핑된 것만
      const impact = String(item.impact ?? '').toLowerCase();
      if (impact && !['high', '1', '3'].includes(impact)) continue;
      results.push({
        date:     item.date?.slice(0, 10) ?? '',
        label:    mapped.label,
        desc:     item.event,
        color:    mapped.color,
        source:   'finnhub',
        actual:   item.actual ?? null,
        estimate: item.estimate ?? null,
        prev:     item.prev ?? null,
        unit:     item.unit ?? '',
      });
    }
    return results;
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// GET handler
// ─────────────────────────────────────────────
export async function GET() {
  try {
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const from = fmt(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const to   = fmt(new Date(now.getFullYear(), now.getMonth() + 7, 0));

    // FRED + Finnhub 병렬 fetch
    const [fredEvs, finnhubEvs] = await Promise.all([
      fetchFredEvents(from, to),
      fetchFinnhubEvents(from, to),
    ]);

    // 날짜+레이블 기준 중복 제거 — Finnhub 실적값(actual/estimate) 우선, FRED는 일정 보완
    const seen = new Map<string, MacroEvent>();
    // FRED 먼저 (일정 기준)
    for (const ev of fredEvs) {
      const key = `${ev.date}__${ev.label}`;
      if (!seen.has(key)) seen.set(key, ev);
    }
    // Finnhub으로 actual/estimate 덮어쓰기 (더 풍부한 데이터)
    for (const ev of finnhubEvs) {
      const key = `${ev.date}__${ev.label}`;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, ev);
      } else {
        // actual/estimate가 있으면 Finnhub 데이터로 업데이트
        seen.set(key, { ...existing, ...ev, source: 'finnhub' });
      }
    }

    const all = Array.from(seen.values())
      .filter(ev => ev.date >= from && ev.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      ok: true,
      events: all,
      sources: { fred: fredEvs.length, finnhub: finnhubEvs.length },
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
