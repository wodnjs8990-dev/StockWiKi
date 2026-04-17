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

// 종목별로 쪼개서 조회하지 않고, 기간을 4주씩 2번 나눠서 병렬 요청
async function fetchEarnings(from: string, to: string, token: string): Promise<any[]> {
  const url = `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${token}`;

  // AbortController와 next.revalidate를 함께 쓰면 캐시 충돌 → Promise.race로 타임아웃
  const fetchPromise = fetch(url, { next: { revalidate: 3600 } })
    .then(res => {
      if (!res.ok) throw new Error(`Finnhub ${res.status}`);
      return res.json();
    })
    .then(data => data.earningsCalendar ?? []);

  const timeoutPromise = new Promise<any[]>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 9000)
  );

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch {
    return [];
  }
}

const fmt = (d: Date) => d.toISOString().slice(0, 10);

export async function GET() {
  const watchlist = new Set(Object.keys(COMPANY_KO));

  // 2주 전 ~ 4주 후, 4주 후 ~ 12주 후 — 병렬 요청으로 타임아웃 방지
  const now = new Date();
  const p1From = new Date(now); p1From.setDate(now.getDate() - 14);
  const p1To   = new Date(now); p1To.setDate(now.getDate() + 28);
  const p2From = new Date(now); p2From.setDate(now.getDate() + 29);
  const p2To   = new Date(now); p2To.setDate(now.getDate() + 84);

  try {
    const [part1, part2] = await Promise.all([
      fetchEarnings(fmt(p1From), fmt(p1To), FINNHUB_KEY!),
      fetchEarnings(fmt(p2From), fmt(p2To), FINNHUB_KEY!),
    ]);

    const earnings = [...part1, ...part2];

    const filtered = earnings
      .filter((e) => watchlist.has(e.symbol))
      .map((e) => {
        const { dateKST } = toKST(e.date, null);
        return {
          symbol: e.symbol,
          nameKo: COMPANY_KO[e.symbol] ?? e.symbol,
          date: e.date,
          dateKST,
          timing: translateTiming(e.hour),
          epsEstimate: e.epsEstimate ?? null,
          revenueEstimate: e.revenueEstimate ?? null,
        };
      })
      // 중복 제거 (symbol+date 기준)
      .filter((e, i, arr) => arr.findIndex(x => x.symbol === e.symbol && x.date === e.date) === i)
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ ok: true, earnings: filtered, updatedAt: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message, earnings: [] }, { status: 500 });
  }
}
