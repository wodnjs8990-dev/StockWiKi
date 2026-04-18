import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
// 하루 1회 캐싱 (경제지표 일정은 자주 안 바뀜)
export const revalidate = 86400;

const FINNHUB_KEY = process.env.FINNHUB_API_KEY ?? '';

// 중요도 필터: high 이상만 (Finnhub은 "high" 또는 숫자 "1"/"3" 등 혼용)
const IMPACT_WHITELIST = ['high', '1', '3'];

// 표시할 지표명 → 한글 이름 매핑 (Finnhub event 명칭 기반)
const EVENT_LABEL: Record<string, { label: string; color: string }> = {
  // 고용
  'Nonfarm Payrolls':                       { label: 'NFP',        color: '#7B9FDF' },
  'ADP Nonfarm Employment Change':          { label: 'ADP',        color: '#5B8FD4' },
  'Initial Jobless Claims':                 { label: '실업청구',    color: '#8AB4E8' },
  'Unemployment Rate':                      { label: '실업률',      color: '#6A9FD0' },
  // 물가
  'CPI m/m':                                { label: 'CPI',        color: '#E07B54' },
  'Core CPI m/m':                           { label: 'Core CPI',   color: '#E89070' },
  'PPI m/m':                                { label: 'PPI',        color: '#D4956A' },
  'Core PPI m/m':                           { label: 'Core PPI',   color: '#DDA070' },
  'PCE Price Index m/m':                    { label: 'PCE',        color: '#B07AB0' },
  'Core PCE Price Index m/m':               { label: 'Core PCE',   color: '#C090C0' },
  // 성장
  'GDP q/q':                                { label: 'GDP',        color: '#5FA8A0' },
  'GDP Growth Rate QoQ Adv':                { label: 'GDP 속보',   color: '#5FA8A0' },
  'Advance GDP q/q':                        { label: 'GDP 속보',   color: '#5FA8A0' },
  // 소비
  'Retail Sales m/m':                       { label: '소매판매',    color: '#C89650' },
  'Core Retail Sales m/m':                  { label: 'Core 소매',  color: '#D4A060' },
  'Consumer Confidence':                    { label: '소비자신뢰',  color: '#CBA070' },
  'CB Consumer Confidence':                 { label: '소비자신뢰',  color: '#CBA070' },
  'Michigan Consumer Sentiment':            { label: 'UMich신뢰',  color: '#C8A458' },
  // 제조/서비스
  'ISM Manufacturing PMI':                  { label: 'ISM제조',    color: '#7BAF7A' },
  'ISM Services PMI':                       { label: 'ISM서비스',  color: '#7BAF7A' },
  'ISM Non-Manufacturing PMI':              { label: 'ISM서비스',  color: '#7BAF7A' },
  'S&P Global Manufacturing PMI':           { label: 'PMI제조',    color: '#8ABF8A' },
  'S&P Global Services PMI':               { label: 'PMI서비스',  color: '#8ABF8A' },
  'Flash Manufacturing PMI':                { label: 'PMI제조F',   color: '#8ABF8A' },
  'Flash Services PMI':                     { label: 'PMI서비스F', color: '#8ABF8A' },
  // 주택
  'Existing Home Sales':                    { label: '기존주택',    color: '#9B7FD4' },
  'New Home Sales':                         { label: '신규주택',    color: '#9B7FD4' },
  'Housing Starts':                         { label: '주택착공',    color: '#9B7FD4' },
  'Pending Home Sales m/m':                 { label: '주택대기',    color: '#9B7FD4' },
  // 에너지·재고
  'Crude Oil Inventories':                  { label: 'EIA원유',    color: '#C4A84F' },
  'Natural Gas Storage':                    { label: 'EIA천연가스', color: '#C4A84F' },
  'Business Inventories':                   { label: '기업재고',    color: '#A8A870' },
  'Retail Inventories ex Autos':            { label: '소매재고',    color: '#A8A870' },
  // 무역·생산
  'Trade Balance':                          { label: '무역수지',    color: '#8A8A8A' },
  'Industrial Production m/m':              { label: '산업생산',    color: '#8A8A8A' },
  'Durable Goods Orders m/m':               { label: '내구재',      color: '#8A8A8A' },
  // 모기지
  'MBA Mortgage Applications':              { label: 'MBA모기지',  color: '#6A9FA0' },
  // 연준
  'Fed Interest Rate Decision':             { label: 'FOMC',       color: '#4F7E7C' },
  'FOMC Meeting Minutes':                   { label: 'FOMC의사록', color: '#4F7E7C' },
  'Fed Balance Sheet':                      { label: '연준대차대조표', color: '#4F7E7C' },
  // 국채
  '2-Year Note Auction':                    { label: '국채2Y',     color: '#7A9FA0' },
  '5-Year Note Auction':                    { label: '국채5Y',     color: '#7A9FA0' },
  '7-Year Note Auction':                    { label: '국채7Y',     color: '#7A9FA0' },
  '10-Year Note Auction':                   { label: '국채10Y',    color: '#7A9FA0' },
  '20-Year Bond Auction':                   { label: '국채20Y',    color: '#7A9FA0' },
  '30-Year Bond Auction':                   { label: '국채30Y',    color: '#7A9FA0' },
  '3-Month Bill Auction':                   { label: '국채3M',     color: '#7A9FA0' },
  '6-Month Bill Auction':                   { label: '국채6M',     color: '#7A9FA0' },
};

export type MacroEvent = {
  date: string;       // YYYY-MM-DD
  label: string;      // 한글 약어
  desc: string;       // 원본 영문명
  color: string;
  actual?: number | null;
  estimate?: number | null;
  prev?: number | null;
  unit?: string;
};

async function fetchRange(from: string, to: string): Promise<MacroEvent[]> {
  const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${FINNHUB_KEY}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const json = await res.json();
  const items: any[] = json.economicCalendar ?? [];

  const results: MacroEvent[] = [];
  for (const item of items) {
    // impact 필터: high만 (값이 없으면 매핑 기반으로 허용)
    const impactVal = String(item.impact ?? '').toLowerCase();
    const hasImpact = impactVal !== '' && impactVal !== 'undefined' && impactVal !== 'null';
    if (hasImpact && !IMPACT_WHITELIST.includes(impactVal)) continue;
    // country 필터: US만
    if (item.country && item.country.toUpperCase() !== 'US') continue;

    const mapped = EVENT_LABEL[item.event];
    // 매핑된 지표만 표시 (잡다한 것 제거)
    if (!mapped) continue;

    results.push({
      date: item.date?.slice(0, 10) ?? '',
      label: mapped.label,
      desc: item.event,
      color: mapped.color,
      actual: item.actual ?? null,
      estimate: item.estimate ?? null,
      prev: item.prev ?? null,
      unit: item.unit ?? '',
    });
  }
  return results;
}

export async function GET() {
  try {
    // 오늘 기준 -1개월 ~ +6개월 범위 (두 번 호출로 커버)
    const now = new Date();
    const from1 = new Date(now);
    from1.setMonth(from1.getMonth() - 1);
    const to1 = new Date(now);
    to1.setMonth(to1.getMonth() + 3);
    const to2 = new Date(now);
    to2.setMonth(to2.getMonth() + 6);

    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const [batch1, batch2] = await Promise.all([
      fetchRange(fmt(from1), fmt(to1)),
      fetchRange(fmt(to1), fmt(to2)),
    ]);

    // 날짜+이벤트명 기준 중복 제거
    const seen = new Set<string>();
    const all: MacroEvent[] = [];
    for (const ev of [...batch1, ...batch2]) {
      const key = `${ev.date}__${ev.desc}`;
      if (!seen.has(key)) { seen.add(key); all.push(ev); }
    }

    all.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ ok: true, events: all, updatedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
