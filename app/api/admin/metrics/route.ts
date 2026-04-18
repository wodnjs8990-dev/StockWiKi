import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type ServiceStatus = { ok: boolean; latencyMs: number; error?: string; detail?: string };

async function checkFinnhub(): Promise<ServiceStatus> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return { ok: false, latencyMs: 0, error: 'API 키 없음' };
  const start = Date.now();
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${key}`, { next: { revalidate: 0 } });
    const latencyMs = Date.now() - start;
    if (!res.ok) return { ok: false, latencyMs, error: `HTTP ${res.status}` };
    return { ok: true, latencyMs };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message };
  }
}

async function checkEdgeConfig(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const { get } = await import('@vercel/edge-config');
    await get('siteConfig');
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message };
  }
}

async function checkEventsApi(): Promise<ServiceStatus & { earningsCount?: number }> {
  const start = Date.now();
  try {
    const key = process.env.FINNHUB_API_KEY;
    if (!key) return { ok: false, latencyMs: 0, error: 'API 키 없음' };
    const timeout = new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), 5000));
    const fetchP = fetch(`https://finnhub.io/api/v1/stock/earnings?symbol=AAPL&token=${key}`, { next: { revalidate: 0 } })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return Array.isArray(data) ? data.length : 0;
      });
    const count = await Promise.race([fetchP, timeout]);
    return { ok: true, latencyMs: Date.now() - start, earningsCount: count };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message === 'timeout' ? '응답 초과 (5s)' : e.message };
  }
}

// ── Yahoo Finance 헬스체크: AAPL calendarEvents 조회
async function checkYahooFinance(): Promise<ServiceStatus & { earningsDate?: string }> {
  const start = Date.now();
  try {
    const timeout = new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), 6000));
    const fetchP = fetch(
      'https://query2.finance.yahoo.com/v10/finance/quoteSummary/AAPL?modules=calendarEvents',
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        next: { revalidate: 0 },
      }
    ).then(async res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const timestamps: number[] = data?.quoteSummary?.result?.[0]?.calendarEvents?.earnings?.earningsDate?.map((d: any) => d.raw) ?? [];
      const next = timestamps.filter(t => t > Date.now() / 1000).sort((a, b) => a - b)[0];
      const earningsDate = next
        ? new Date((next + 9 * 3600) * 1000).toISOString().slice(0, 10)
        : undefined;
      return earningsDate;
    });
    const earningsDate = await Promise.race([fetchP, timeout]);
    return { ok: true, latencyMs: Date.now() - start, earningsDate };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message === 'timeout' ? '응답 초과 (6s)' : e.message };
  }
}

// ── DART 헬스체크: 오늘 기준 공시 1건 조회
async function checkDart(): Promise<ServiceStatus & { remainingQuota?: number; todayCount?: number }> {
  const key = process.env.DART_API_KEY;
  if (!key) return { ok: false, latencyMs: 0, error: 'API 키 없음' };

  const start = Date.now();
  try {
    const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
    const from = new Date(Date.now() + 9 * 3600 * 1000 - 30 * 86400 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
    const timeout = new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), 6000));
    const fetchP = fetch(
      `https://opendart.fss.or.kr/api/list.json?crtfc_key=${key}&bgn_de=${from}&end_de=${today}&pblntf_ty=A&pblntf_detail_ty=A003&page_count=1`,
      { next: { revalidate: 0 } }
    ).then(async res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status !== '000' && data.status !== '013') throw new Error(`DART ${data.status}: ${data.message}`);
      return { total: data.total_count ?? 0 };
    });
    const result = await Promise.race([fetchP, timeout]);
    // DART 일 허용 40,000건 — 헬스체크 자체는 3건 소비 (pblntf_ty별)
    return { ok: true, latencyMs: Date.now() - start, todayCount: result.total };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message === 'timeout' ? '응답 초과 (6s)' : e.message };
  }
}

export async function GET() {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [finnhub, edgeConfig, eventsApi, yahooFinance, dart] = await Promise.all([
    checkFinnhub(),
    checkEdgeConfig(),
    checkEventsApi(),
    checkYahooFinance(),
    checkDart(),
  ]);

  const mem = process.memoryUsage();

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    system: {
      nodeVersion: process.version,
      region: process.env.VERCEL_REGION ?? process.env.AWS_REGION ?? 'local',
      environment: process.env.VERCEL_ENV ?? 'development',
      memory: {
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        rssMB: Math.round(mem.rss / 1024 / 1024),
      },
    },
    services: {
      finnhub,
      edgeConfig,
      eventsApi,
      yahooFinance,
      dart,
    },
    dart_quota: {
      daily_limit: 40000,
      // 헬스체크 1회당 약 3 API call 소비 (pblntf_ty A001·A002·A003 + 헬스체크)
      note: '일 40,000건 한도 · 어닝 조회 1회 ≈ 30건(30종목×3보고서유형)',
    },
  });
}
