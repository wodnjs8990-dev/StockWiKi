import { NextResponse } from 'next/server';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;

// 주요 종목 한국어 매핑
const COMPANY_KO: Record<string, string> = {
  AAPL: '애플', MSFT: '마이크로소프트', GOOGL: '알파벳(구글)', GOOG: '알파벳(구글)',
  AMZN: '아마존', NVDA: '엔비디아', META: '메타', TSLA: '테슬라',
  AVGO: '브로드컴', TSM: 'TSMC', ORCL: '오라클', AMD: 'AMD',
  NFLX: '넷플릭스', ADBE: '어도비', INTC: '인텔', QCOM: '퀄컴',
  CRM: '세일즈포스', UBER: '우버', SHOP: '쇼피파이', COIN: '코인베이스',
  JPM: 'JP모건', BAC: '뱅크오브아메리카', GS: '골드만삭스', MS: '모건스탠리',
  WMT: '월마트', KO: '코카콜라', PG: 'P&G', JNJ: '존슨앤드존슨',
  V: '비자', MA: '마스터카드', BRK: '버크셔해서웨이',
  XOM: '엑슨모빌', CVX: '쉐브론', UNH: '유나이티드헬스',
  LLY: '일라이릴리', PFE: '화이자', MRK: '머크',
  DIS: '월트디즈니', BABA: '알리바바', PDD: '핀둬둬',
};

// 장 전/후 한국어 변환
function translateTiming(timing: string | null): string {
  if (!timing) return '';
  const t = timing.toLowerCase();
  if (t.includes('before') || t === 'bmo') return '장 전 발표';
  if (t.includes('after') || t === 'amc') return '장 후 발표';
  return timing;
}

// UTC → KST 변환 (date: "YYYY-MM-DD", time: "HH:MM:SS" or null)
function toKST(date: string, time?: string | null): { date: string; time: string | null; dateKST: string } {
  if (!time) {
    return { date, time: null, dateKST: date };
  }
  try {
    const utc = new Date(`${date}T${time}Z`);
    const kst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
    const dateKST = kst.toISOString().slice(0, 10);
    const timeKST = kst.toISOString().slice(11, 16); // HH:MM
    return { date, time: timeKST, dateKST };
  } catch {
    return { date, time: null, dateKST: date };
  }
}

export async function GET() {
  // 오늘부터 8주치 조회
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + 56);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  try {
    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${fmt(from)}&to=${fmt(to)}&token=${FINNHUB_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } }); // 1시간 캐시

    if (!res.ok) throw new Error(`Finnhub error: ${res.status}`);

    const data = await res.json();
    const earnings: any[] = data.earningsCalendar ?? [];

    // 주요 종목 필터 + KST 변환 + 한국어 매핑
    const watchlist = new Set(Object.keys(COMPANY_KO));
    const filtered = earnings
      .filter((e) => watchlist.has(e.symbol))
      .map((e) => {
        const { dateKST, time } = toKST(e.date, e.hour === 'bmo' || e.hour === 'amc' ? null : null);
        return {
          symbol: e.symbol,
          nameKo: COMPANY_KO[e.symbol] ?? e.symbol,
          date: e.date,
          dateKST,
          timeKST: time,
          timing: translateTiming(e.hour),
          epsEstimate: e.epsEstimate ?? null,
          revenueEstimate: e.revenueEstimate ?? null,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ ok: true, earnings: filtered, updatedAt: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message, earnings: [] }, { status: 500 });
  }
}
