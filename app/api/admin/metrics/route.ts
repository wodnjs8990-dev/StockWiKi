import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function checkFinnhub(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return { ok: false, latencyMs: 0, error: 'API 키 없음' };

  const start = Date.now();
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${key}`,
      { next: { revalidate: 0 } }
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) return { ok: false, latencyMs, error: `HTTP ${res.status}` };
    return { ok: true, latencyMs };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message };
  }
}

async function checkEdgeConfig(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const { get } = await import('@vercel/edge-config');
    await get('siteConfig');
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message };
  }
}

async function checkEventsApi(): Promise<{ ok: boolean; latencyMs: number; earningsCount?: number; error?: string }> {
  const start = Date.now();
  try {
    // 내부 /api/events를 직접 호출하는 대신 Finnhub 어닝 엔드포인트 간단히 체크
    const key = process.env.FINNHUB_API_KEY;
    if (!key) return { ok: false, latencyMs: 0, error: 'API 키 없음' };

    const now = new Date();
    const from = new Date(now); from.setDate(now.getDate() - 7);
    const to = new Date(now); to.setDate(now.getDate() + 7);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const res = await fetch(
      `https://finnhub.io/api/v1/calendar/earnings?from=${fmt(from)}&to=${fmt(to)}&token=${key}`,
      { next: { revalidate: 0 } }
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) return { ok: false, latencyMs, error: `HTTP ${res.status}` };
    const data = await res.json();
    const count = (data.earningsCalendar ?? []).length;
    return { ok: true, latencyMs, earningsCount: count };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message };
  }
}

export async function GET() {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 병렬로 모든 체크 실행
  const [finnhub, edgeConfig, eventsApi] = await Promise.all([
    checkFinnhub(),
    checkEdgeConfig(),
    checkEventsApi(),
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
    },
  });
}
