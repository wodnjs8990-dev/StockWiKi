import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── 타입 ───────────────────────────────────────────────
export type EarningItem = {
  symbol: string;       // 티커 / 종목코드
  nameKo: string;       // 한글 종목명
  date: string;         // YYYY-MM-DD (KST)
  market: 'US' | 'KR';
  timing?: 'BMO' | 'AMC' | 'unknown'; // US만
  epsEstimate?: number | null;
  epsActual?: number | null;
  revenueEstimate?: number | null;  // 억원(KR) / 백만달러(US)
  revenueActual?: number | null;
  surprise?: number | null;         // % (epsActual - epsEstimate) / |epsEstimate| * 100
};

// ─── 야후 파이낸스: 미국 주요 종목 어닝 날짜 ────────────────
const US_WATCHLIST = [
  'AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA','JPM','V','WMT',
  'BRK-B','XOM','UNH','LLY','JNJ','PG','MA','HD','MRK','ABBV',
  'AVGO','COST','CVX','PEP','NFLX','AMD','INTC','QCOM','TXN','MU',
];

async function fetchYahooEarnings(): Promise<EarningItem[]> {
  const results: EarningItem[] = [];

  await Promise.allSettled(
    US_WATCHLIST.map(async (symbol) => {
      try {
        const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=calendarEvents,earningsTrend,price`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
          next: { revalidate: 3600 },
        });
        if (!res.ok) return;
        const data = await res.json();
        const result = data?.quoteSummary?.result?.[0];
        if (!result) return;

        const cal = result.calendarEvents;
        const trend = result.earningsTrend;
        const price = result.price;

        const nameKo = price?.longName || price?.shortName || symbol;

        // 다음 어닝 날짜
        const earningsTimestamps: number[] = cal?.earnings?.earningsDate?.map((d: any) => d.raw) ?? [];
        const nowSec = Date.now() / 1000;

        // 미래 날짜 우선, 없으면 가장 최근 과거
        const futureDates = earningsTimestamps.filter(t => t > nowSec);
        const pastDates = earningsTimestamps.filter(t => t <= nowSec);
        const targetTs = futureDates.length > 0
          ? Math.min(...futureDates)
          : pastDates.length > 0 ? Math.max(...pastDates) : null;

        if (!targetTs) return;

        // UTC → KST 날짜
        const dateKST = new Date((targetTs + 9 * 3600) * 1000).toISOString().slice(0, 10);

        // EPS 예상 (가장 가까운 분기)
        const currentQ = trend?.trend?.find((t: any) => t.period === '0q');
        const epsEstimate = currentQ?.earningsEstimate?.avg?.raw ?? null;
        const epsActual = currentQ?.earningsActual?.raw ?? null;
        const surprise = epsActual != null && epsEstimate != null && epsEstimate !== 0
          ? ((epsActual - epsEstimate) / Math.abs(epsEstimate)) * 100
          : null;

        // 매출 예상
        const revenueEstimate = currentQ?.revenueEstimate?.avg?.raw
          ? currentQ.revenueEstimate.avg.raw / 1_000_000  // → 백만달러
          : null;

        // BMO / AMC 추정 (earningsDate 배열 두 개면 하루 범위 표시)
        let timing: 'BMO' | 'AMC' | 'unknown' = 'unknown';
        if (earningsTimestamps.length >= 2) {
          const sorted = [...earningsTimestamps].sort((a, b) => a - b);
          const diffHours = (sorted[sorted.length - 1] - sorted[0]) / 3600;
          if (diffHours <= 12) timing = 'BMO'; // 같은 날 좁은 범위
        }

        results.push({
          symbol,
          nameKo,
          date: dateKST,
          market: 'US',
          timing,
          epsEstimate,
          epsActual: epsActual !== undefined ? epsActual : null,
          revenueEstimate,
          revenueActual: null,
          surprise,
        });
      } catch {
        // 개별 종목 실패는 무시
      }
    })
  );

  return results;
}

// ─── DART: 한국 주요 종목 실적 공시 ────────────────────────
// DART 공시 유형: A001 = 사업보고서, A002 = 반기보고서, A003 = 분기보고서
const DART_KEY = process.env.DART_API_KEY ?? '';

async function fetchDartEarnings(): Promise<EarningItem[]> {
  if (!DART_KEY) return [];

  const results: EarningItem[] = [];

  // 오늘 기준 ±60일 범위에서 분기/반기/사업보고서 공시 조회
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 30);
  const to = new Date(today);
  to.setDate(to.getDate() + 60);

  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');

  // KOSPI200 주요 종목 corp_code 매핑 (DART 고유 회사 코드)
  // 실제로는 /api/company.xml 로 검색하지만 주요 종목은 하드코딩이 빠름
  const KR_CORPS: { corpCode: string; name: string; symbol: string }[] = [
    { corpCode: '00126380', name: '삼성전자', symbol: '005930' },
    { corpCode: '00164779', name: 'SK하이닉스', symbol: '000660' },
    { corpCode: '00401731', name: 'LG에너지솔루션', symbol: '373220' },
    { corpCode: '00104426', name: '삼성바이오로직스', symbol: '207940' },
    { corpCode: '00113495', name: '현대자동차', symbol: '005380' },
    { corpCode: '00164742', name: '삼성SDI', symbol: '006400' },
    { corpCode: '00126860', name: '기아', symbol: '000270' },
    { corpCode: '00157556', name: 'POSCO홀딩스', symbol: '005490' },
    { corpCode: '00164400', name: 'LG화학', symbol: '051910' },
    { corpCode: '00138345', name: '셀트리온', symbol: '068270' },
    { corpCode: '00105564', name: 'NAVER', symbol: '035420' },
    { corpCode: '00359757', name: '카카오', symbol: '035720' },
    { corpCode: '00113526', name: '현대모비스', symbol: '012330' },
    { corpCode: '00117008', name: 'KB금융', symbol: '105560' },
    { corpCode: '00111722', name: '신한지주', symbol: '055550' },
    { corpCode: '00259454', name: '삼성물산', symbol: '028260' },
    { corpCode: '00164588', name: 'LG전자', symbol: '066570' },
    { corpCode: '00102027', name: '하나금융지주', symbol: '086790' },
    { corpCode: '00164523', name: 'LG', symbol: '003550' },
    { corpCode: '00113028', name: '두산에너빌리티', symbol: '034020' },
    { corpCode: '00143361', name: '한국전력', symbol: '015760' },
    { corpCode: '00102476', name: 'SK텔레콤', symbol: '017670' },
    { corpCode: '00159193', name: 'KT', symbol: '030200' },
    { corpCode: '00113846', name: '삼성생명', symbol: '032830' },
    { corpCode: '00156631', name: '삼성화재', symbol: '000810' },
    { corpCode: '00126929', name: '고려아연', symbol: '010130' },
    { corpCode: '00148064', name: 'S-Oil', symbol: '010950' },
    { corpCode: '00101521', name: '한국조선해양', symbol: '009540' },
    { corpCode: '00115821', name: 'HD현대중공업', symbol: '329180' },
    { corpCode: '00251685', name: '카카오뱅크', symbol: '323410' },
  ];

  // 분기보고서(A003), 반기보고서(A002), 사업보고서(A001) 모두 조회
  const pblntfTypes = ['A001', 'A002', 'A003'];

  for (const pType of pblntfTypes) {
    try {
      const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${DART_KEY}&bgn_de=${fmt(from)}&end_de=${fmt(to)}&pblntf_ty=A&pblntf_detail_ty=${pType}&page_count=100`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status !== '000') continue;

      for (const item of (data.list ?? [])) {
        const corp = KR_CORPS.find(c => c.corpCode === item.corp_code);
        if (!corp) continue;

        // 이미 추가된 종목 중복 방지 (같은 심볼의 더 최신 공시 우선)
        const existing = results.find(r => r.symbol === corp.symbol);
        const rcpDate = item.rcept_dt; // YYYYMMDD
        const dateFormatted = `${rcpDate.slice(0,4)}-${rcpDate.slice(4,6)}-${rcpDate.slice(6,8)}`;

        if (existing) {
          if (dateFormatted > existing.date) existing.date = dateFormatted;
          continue;
        }

        results.push({
          symbol: corp.symbol,
          nameKo: corp.name,
          date: dateFormatted,
          market: 'KR',
          timing: undefined,
          epsEstimate: null,
          epsActual: null,
          revenueEstimate: null,
          revenueActual: null,
          surprise: null,
        });
      }
    } catch {
      // 타입별 실패 무시
    }
  }

  return results;
}

// ─── Route Handler ───────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const market = searchParams.get('market'); // 'US' | 'KR' | null(둘 다)

  try {
    const [usEarnings, krEarnings] = await Promise.allSettled([
      market !== 'KR' ? fetchYahooEarnings() : Promise.resolve([]),
      market !== 'US' ? fetchDartEarnings() : Promise.resolve([]),
    ]);

    const us = usEarnings.status === 'fulfilled' ? usEarnings.value : [];
    const kr = krEarnings.status === 'fulfilled' ? krEarnings.value : [];
    const all = [...us, ...kr].sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      ok: true,
      count: { us: us.length, kr: kr.length },
      earnings: all,
      updatedAt: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=300' },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), earnings: [] }, { status: 500 });
  }
}
