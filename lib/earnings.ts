// 서버 전용 — Finnhub 어닝 데이터 fetch 공통 로직

export type EarningItem = {
  symbol: string;
  nameKo: string;
  date: string;
  dateKST: string;
  timing: string;
  epsEstimate: number | null;
  revenueEstimate: number | null;
};

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

function translateTiming(hour: string | null): string {
  if (!hour) return '';
  const t = hour.toLowerCase();
  if (t === 'bmo' || t.includes('before')) return '장 전';
  if (t === 'amc' || t.includes('after')) return '장 후';
  return '';
}

const fmt = (d: Date) => d.toISOString().slice(0, 10);

async function fetchRange(from: string, to: string, token: string): Promise<any[]> {
  try {
    // next.revalidate + signal 동시 사용 시 캐시 무시됨 → signal 제거하고 캐시 우선
    const res = await fetch(
      `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${token}`,
      { next: { revalidate: 3600, tags: ['finnhub-earnings'] } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.earningsCalendar ?? [];
  } catch {
    return [];
  }
}

export async function getEarnings(): Promise<{ earnings: EarningItem[]; updatedAt: string }> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return { earnings: [], updatedAt: new Date().toISOString() };

  const now = new Date();
  const p1From = new Date(now); p1From.setDate(now.getDate() - 14);
  const p1To   = new Date(now); p1To.setDate(now.getDate() + 28);
  const p2From = new Date(now); p2From.setDate(now.getDate() + 29);
  const p2To   = new Date(now); p2To.setDate(now.getDate() + 84);

  const [part1, part2] = await Promise.all([
    fetchRange(fmt(p1From), fmt(p1To), key),
    fetchRange(fmt(p2From), fmt(p2To), key),
  ]);

  const watchlist = new Set(Object.keys(COMPANY_KO));
  const earnings: EarningItem[] = [...part1, ...part2]
    .filter(e => watchlist.has(e.symbol))
    .map(e => ({
      symbol: e.symbol,
      nameKo: COMPANY_KO[e.symbol],
      date: e.date,
      dateKST: e.date, // 날짜만 사용 (시간 없으면 KST 동일)
      timing: translateTiming(e.hour),
      epsEstimate: e.epsEstimate ?? null,
      revenueEstimate: e.revenueEstimate ?? null,
    }))
    .filter((e, i, arr) => arr.findIndex(x => x.symbol === e.symbol && x.date === e.date) === i)
    .sort((a, b) => a.date.localeCompare(b.date));

  return { earnings, updatedAt: new Date().toISOString() };
}
