import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── In-memory 캐시 ──────────────────────────────────────
// 과거 데이터: 24시간 TTL (변하지 않음)
// 미래 데이터: 1시간 TTL
type CacheEntry = { data: EarningItem[]; expiresAt: number };
const cache: Record<string, CacheEntry> = {};

function getCached(key: string): EarningItem[] | null {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { delete cache[key]; return null; }
  return entry.data;
}

function setCached(key: string, data: EarningItem[], ttlMs: number) {
  cache[key] = { data, expiresAt: Date.now() + ttlMs };
}

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

// ─── Finnhub: 미국 어닝 캘린더 ──────────────────────────
// 분기별로 쪼개서 캐싱: 과거 분기는 24h TTL, 현재/미래는 1h TTL
async function fetchFinnhubEarnings(): Promise<EarningItem[]> {
  if (!FINNHUB_KEY) return [];

  const todayKST = new Date(Date.now() + 9 * 3600 * 1000);
  const currentYear = todayKST.getUTCFullYear();
  const todayStr = todayKST.toISOString().slice(0, 10);

  // 분기 구간 정의: Q1~Q4 + 미래(현재분기 이후 90일)
  const quarters = [
    { key: `finnhub-${currentYear}-Q1`, from: `${currentYear}-01-01`, to: `${currentYear}-03-31` },
    { key: `finnhub-${currentYear}-Q2`, from: `${currentYear}-04-01`, to: `${currentYear}-06-30` },
    { key: `finnhub-${currentYear}-Q3`, from: `${currentYear}-07-01`, to: `${currentYear}-09-30` },
    { key: `finnhub-${currentYear}-Q4`, from: `${currentYear}-10-01`, to: `${currentYear}-12-31` },
  ];

  // 미래 90일 (현재 분기 이후 구간 보완)
  const futureEnd = new Date(todayKST);
  futureEnd.setDate(futureEnd.getDate() + 90);
  const futureKey = `finnhub-future-${todayStr}`;

  const allResults: EarningItem[] = [];

  const parseItems = (earningsArr: any[]): EarningItem[] => {
    const watchSymbols = new Set(Object.keys(US_NAME_MAP));
    return earningsArr
      .filter((e: any) => watchSymbols.has(e.symbol))
      .map((e: any) => {
        const epsEstimate = typeof e.epsEstimate === 'number' ? e.epsEstimate : null;
        const epsActual = typeof e.epsActual === 'number' ? e.epsActual : null;
        const surprise = epsActual != null && epsEstimate != null && epsEstimate !== 0
          ? ((epsActual - epsEstimate) / Math.abs(epsEstimate)) * 100
          : null;
        const hour = (e.hour ?? '').toLowerCase();
        const timing: 'BMO' | 'AMC' | 'unknown' =
          hour === 'bmo' ? 'BMO' : hour === 'amc' ? 'AMC' : 'unknown';
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
  };

  const fetchRange = async (from: string, to: string): Promise<EarningItem[]> => {
    try {
      const url = `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${FINNHUB_KEY}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();
      return parseItems(data?.earningsCalendar ?? []);
    } catch {
      return [];
    }
  };

  // 분기별 캐시 조회 / fetch
  for (const q of quarters) {
    const isPastQuarter = q.to < todayStr;
    const cached = getCached(q.key);
    if (cached) {
      allResults.push(...cached);
      continue;
    }
    const items = await fetchRange(q.from, q.to);
    if (items.length > 0 || isPastQuarter) {
      // 과거 분기: 24시간, 현재/미래 분기: 1시간
      const ttl = isPastQuarter ? 24 * 3600 * 1000 : 3600 * 1000;
      setCached(q.key, items, ttl);
      allResults.push(...items);
    }
  }

  // 미래 90일 추가 fetch (분기 경계 넘는 구간 보완, 1시간 캐시)
  const futureCached = getCached(futureKey);
  if (futureCached) {
    allResults.push(...futureCached);
  } else {
    const futureItems = await fetchRange(todayStr, futureEnd.toISOString().slice(0, 10));
    setCached(futureKey, futureItems, 3600 * 1000);
    allResults.push(...futureItems);
  }

  // 중복 제거 (symbol+date 기준)
  const seen = new Set<string>();
  return allResults.filter(e => {
    const k = `${e.symbol}-${e.date}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
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

// 종목별로 corp_code를 지정해서 직접 조회 — page_count 한계로 누락되는 문제 해결
async function fetchDartEarnings(): Promise<EarningItem[]> {
  if (!DART_KEY) return [];

  const today = new Date(Date.now() + 9 * 3600 * 1000);
  const todayStr = today.toISOString().slice(0, 10);
  const currentYear = today.getUTCFullYear();
  const fromStr = `${currentYear}0101`;
  const toStr = todayStr.replace(/-/g, '');

  // 분기별 캐시 키 — 과거 분기는 한번만 fetch
  const quarters = [
    { key: `dart-${currentYear}-Q1`, from: `${currentYear}0101`, to: `${currentYear}0331` },
    { key: `dart-${currentYear}-Q2`, from: `${currentYear}0401`, to: `${currentYear}0630` },
    { key: `dart-${currentYear}-Q3`, from: `${currentYear}0701`, to: `${currentYear}0930` },
    { key: `dart-${currentYear}-Q4`, from: `${currentYear}1001`, to: `${currentYear}1231` },
  ];

  // 종목별로 corp_code 지정해서 직접 조회하는 함수
  // DART list API: corp_code 파라미터로 특정 회사만 조회 가능
  const fetchCorpEarnings = async (
    corp: typeof KR_CORPS[0],
    bgn: string,
    end: string
  ): Promise<{ date: string } | null> => {
    // 분기(A003) 우선, 없으면 반기(A002), 없으면 사업(A001)
    for (const pType of ['A003', 'A002', 'A001']) {
      try {
        const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${DART_KEY}&corp_code=${corp.corpCode}&bgn_de=${bgn}&end_de=${end}&pblntf_ty=A&pblntf_detail_ty=${pType}&page_count=10`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status !== '000' && data.status !== '013') continue;
        const list: any[] = data.list ?? [];
        if (list.length === 0) continue;
        // 가장 최신 공시일
        const latest = list.reduce((a: any, b: any) => a.rcept_dt > b.rcept_dt ? a : b);
        const rdt = latest.rcept_dt as string;
        return { date: `${rdt.slice(0, 4)}-${rdt.slice(4, 6)}-${rdt.slice(6, 8)}` };
      } catch { /* 개별 실패 무시 */ }
    }
    return null;
  };

  const allResults: EarningItem[] = [];

  for (const q of quarters) {
    // 아직 시작 안 한 분기는 스킵
    if (q.from > toStr) continue;

    const isPastQuarter = q.to < todayStr.replace(/-/g, '');
    const cached = getCached(q.key);
    if (cached) {
      allResults.push(...cached);
      continue;
    }

    // 이 분기의 실제 조회 범위 (오늘 이후는 오늘까지만)
    const effectiveTo = q.to > toStr ? toStr : q.to;

    // 30개 종목을 5개씩 병렬로 (DART API 부하 제한)
    const quarterResults: EarningItem[] = [];
    const BATCH = 5;
    for (let i = 0; i < KR_CORPS.length; i += BATCH) {
      const batch = KR_CORPS.slice(i, i + BATCH);
      const settled = await Promise.allSettled(
        batch.map(corp => fetchCorpEarnings(corp, q.from, effectiveTo))
      );
      for (let j = 0; j < batch.length; j++) {
        const result = settled[j];
        if (result.status === 'fulfilled' && result.value) {
          quarterResults.push({
            symbol: batch[j].symbol,
            nameKo: batch[j].name,
            date: result.value.date,
            market: 'KR',
            timing: undefined,
            epsEstimate: null, epsActual: null,
            revenueEstimate: null, revenueActual: null, surprise: null,
          });
        }
      }
    }

    // 과거 분기: 24h TTL, 현재 분기: 1h TTL
    const ttl = isPastQuarter ? 24 * 3600 * 1000 : 3600 * 1000;
    setCached(q.key, quarterResults, ttl);
    allResults.push(...quarterResults);
  }

  // symbol 중복 제거 (여러 분기에 같은 종목이 있으면 최신 날짜 우선)
  const bySymbol = new Map<string, EarningItem>();
  for (const e of allResults) {
    const existing = bySymbol.get(e.symbol);
    if (!existing || e.date > existing.date) bySymbol.set(e.symbol, e);
  }
  return Array.from(bySymbol.values());
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
