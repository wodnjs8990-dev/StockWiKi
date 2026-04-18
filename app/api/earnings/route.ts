import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── 타입 ───────────────────────────────────────────────
export type EarningItem = {
  symbol: string;
  nameKo: string;
  date: string;         // YYYY-MM-DD (KST)
  market: 'US' | 'KR';
  timing?: 'BMO' | 'AMC' | 'unknown';
  epsEstimate?: number | null;
  epsActual?: number | null;
  revenueEstimate?: number | null;  // 백만달러(US)
  revenueActual?: number | null;
  surprise?: number | null;         // %
};

// ─── 미국 주요 종목 한글 이름 매핑 ─────────────────────────
const US_NAME_MAP: Record<string, string> = {
  'AAPL': '애플', 'MSFT': '마이크로소프트', 'NVDA': '엔비디아',
  'AMZN': '아마존', 'GOOGL': '구글', 'META': '메타',
  'TSLA': '테슬라', 'JPM': 'JP모건', 'V': '비자', 'WMT': '월마트',
  'BRK-B': '버크셔해서웨이', 'XOM': '엑슨모빌', 'UNH': '유나이티드헬스',
  'LLY': '일라이릴리', 'JNJ': '존슨앤존슨', 'PG': 'P&G',
  'MA': '마스터카드', 'HD': '홈디포', 'MRK': '머크', 'ABBV': '애브비',
  'AVGO': '브로드컴', 'COST': '코스트코', 'CVX': '쉐브론',
  'PEP': '펩시코', 'NFLX': '넷플릭스', 'AMD': 'AMD',
  'INTC': '인텔', 'QCOM': '퀄컴', 'TXN': '텍사스인스트루먼트', 'MU': '마이크론',
  'GS': '골드만삭스', 'MS': '모건스탠리', 'BAC': '뱅크오브아메리카',
  'ORCL': '오라클', 'CRM': '세일즈포스', 'ADBE': '어도비',
};

const FINNHUB_KEY = process.env.FINNHUB_API_KEY ?? '';

// ─── Finnhub: 미국 어닝 캘린더 (올해 1월~향후 90일) ──────
async function fetchFinnhubEarnings(): Promise<EarningItem[]> {
  if (!FINNHUB_KEY) return [];

  const todayKST = new Date(Date.now() + 9 * 3600 * 1000);
  // 올해 1월 1일부터 조회 (연간 어닝 시즌 전체 커버)
  const currentYear = todayKST.getUTCFullYear();
  const fromStr = `${currentYear}-01-01`;
  const toDate = new Date(todayKST);
  toDate.setDate(toDate.getDate() + 90);
  const toStr = toDate.toISOString().slice(0, 10);

  // Finnhub 어닝 캘린더: 날짜 범위 내 모든 종목 반환
  try {
    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${fromStr}&to=${toStr}&token=${FINNHUB_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const earningsArr = data?.earningsCalendar ?? [];

    // US_NAME_MAP에 있는 종목만 필터 (주요 종목)
    const watchSymbols = new Set(Object.keys(US_NAME_MAP));
    const filtered = earningsArr.filter((e: any) => watchSymbols.has(e.symbol));

    return filtered.map((e: any) => {
      const epsEstimate = typeof e.epsEstimate === 'number' ? e.epsEstimate : null;
      const epsActual = typeof e.epsActual === 'number' ? e.epsActual : null;
      const surprise = epsActual != null && epsEstimate != null && epsEstimate !== 0
        ? ((epsActual - epsEstimate) / Math.abs(epsEstimate)) * 100
        : null;

      // Finnhub hour: 'bmo' | 'amc' | 'dmh' | ''
      const hour = (e.hour ?? '').toLowerCase();
      const timing: 'BMO' | 'AMC' | 'unknown' =
        hour === 'bmo' ? 'BMO' : hour === 'amc' ? 'AMC' : 'unknown';

      // date는 ET 기준 YYYY-MM-DD — KST로 변환 (AMC면 +1일)
      let dateKST = e.date ?? '';
      if (timing === 'AMC' && dateKST) {
        const d = new Date(dateKST + 'T00:00:00-05:00');
        d.setDate(d.getDate() + 1);
        dateKST = new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
      }

      return {
        symbol: e.symbol,
        nameKo: US_NAME_MAP[e.symbol] ?? e.symbol,
        date: dateKST,
        market: 'US' as const,
        timing,
        epsEstimate,
        epsActual,
        revenueEstimate: typeof e.revenueEstimate === 'number' ? e.revenueEstimate / 1_000_000 : null,
        revenueActual: typeof e.revenueActual === 'number' ? e.revenueActual / 1_000_000 : null,
        surprise,
      };
    });
  } catch {
    return [];
  }
}

// ─── DART: 한국 주요 종목 실적 공시 ────────────────────────
const DART_KEY = process.env.DART_API_KEY ?? '';

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

async function fetchDartEarnings(): Promise<EarningItem[]> {
  if (!DART_KEY) return [];

  const results: EarningItem[] = [];
  const today = new Date(Date.now() + 9 * 3600 * 1000);
  // 올해 1월 1일부터 조회
  const from = new Date(`${today.getUTCFullYear()}-01-01T00:00:00Z`);
  const to = new Date(today); to.setDate(to.getDate() + 90);
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');

  // 분기(A003) → 반기(A002) → 사업(A001) 순으로 조회
  for (const pType of ['A003', 'A002', 'A001']) {
    try {
      const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${DART_KEY}&bgn_de=${fmt(from)}&end_de=${fmt(to)}&pblntf_ty=A&pblntf_detail_ty=${pType}&page_count=100`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) continue;
      const data = await res.json();
      // 013 = 조회 결과 없음 (정상)
      if (data.status !== '000' && data.status !== '013') continue;

      for (const item of (data.list ?? [])) {
        const corp = KR_CORPS.find(c => c.corpCode === item.corp_code);
        if (!corp) continue;

        const rcpDate = item.rcept_dt as string; // YYYYMMDD
        const dateFormatted = `${rcpDate.slice(0, 4)}-${rcpDate.slice(4, 6)}-${rcpDate.slice(6, 8)}`;
        const existing = results.find(r => r.symbol === corp.symbol);

        if (existing) {
          // 더 최신 공시로 날짜 업데이트
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
      // 개별 실패 무시
    }
  }

  return results;
}

// ─── Route Handler ───────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const market = searchParams.get('market');

  try {
    const [usResult, krResult] = await Promise.allSettled([
      market !== 'KR' ? fetchFinnhubEarnings() : Promise.resolve([]),
      market !== 'US' ? fetchDartEarnings() : Promise.resolve([]),
    ]);

    const us = usResult.status === 'fulfilled' ? usResult.value : [];
    const kr = krResult.status === 'fulfilled' ? krResult.value : [];
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
