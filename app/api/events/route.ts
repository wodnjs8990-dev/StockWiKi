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
  V: '비자', MA: '마스터카드',
  XOM: '엑슨모빌', CVX: '쉐브론', UNH: '유나이티드헬스',
  LLY: '일라이릴리', PFE: '화이자', MRK: '머크',
  DIS: '월트디즈니', BABA: '알리바바', PDD: '핀둬둬',
};

// 워치리스트 (GOOG 중복 제거, BRK 제외 — Finnhub에서 BRK.A/BRK.B로 달라서)
const WATCHLIST = [
  'AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA',
  'AVGO','TSM','ORCL','AMD','NFLX','ADBE','INTC','QCOM',
  'CRM','UBER','SHOP','COIN',
  'JPM','BAC','GS','MS',
  'WMT','KO','PG','JNJ','V','MA',
  'XOM','CVX','UNH','LLY','PFE','MRK',
  'DIS','BABA','PDD',
];

function translateTiming(timing: string | null | undefined): string {
  if (!timing) return '';
  const t = timing.toLowerCase();
  if (t.includes('before') || t === 'bmo') return '장 전 발표';
  if (t.includes('after') || t === 'amc') return '장 후 발표';
  return '';
}

// 종목별 earnings 조회 — calendar/earnings보다 훨씬 빠름
async function fetchEarningBySymbol(symbol: string, token: string): Promise<any | null> {
  try {
    const url = `https://finnhub.io/api/v1/stock/earnings?symbol=${symbol}&token=${token}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data: any[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    // 오늘 기준 가장 가까운 미래 or 최근 과거 어닝 찾기
    const today = new Date().toISOString().slice(0, 10);

    // period 기준으로 정렬 (최신순)
    const sorted = [...data].sort((a, b) =>
      (b.period ?? '').localeCompare(a.period ?? '')
    );

    // 가장 최근 데이터 반환
    const latest = sorted[0];
    if (!latest?.period) return null;

    return {
      symbol,
      nameKo: COMPANY_KO[symbol] ?? symbol,
      date: latest.period,
      dateKST: latest.period,
      timing: '',
      epsEstimate: latest.estimate ?? null,
      epsActual: latest.actual ?? null,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  if (!FINNHUB_KEY) {
    return NextResponse.json({ ok: false, error: 'API 키 없음', earnings: [] }, { status: 500 });
  }

  // 종목별 병렬 조회 — 한 번에 너무 많으면 rate limit, 10개씩 배치
  const BATCH = 10;
  const results: any[] = [];

  for (let i = 0; i < WATCHLIST.length; i += BATCH) {
    const batch = WATCHLIST.slice(i, i + BATCH);
    const batchResults = await Promise.all(
      batch.map(symbol => fetchEarningBySymbol(symbol, FINNHUB_KEY!))
    );
    results.push(...batchResults.filter(Boolean));
    // 배치 간 짧은 딜레이 (rate limit 방지)
    if (i + BATCH < WATCHLIST.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // 날짜순 정렬
  const earnings = results.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    ok: true,
    earnings,
    updatedAt: new Date().toISOString(),
  });
}
