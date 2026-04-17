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
    const key = process.env.FINNHUB_API_KEY;
    if (!key) return { ok: false, latencyMs: 0, error: 'API 키 없음' };

    // 어닝 캘린더는 느리므로 오늘 하루만 조회 (헬스체크용 최소 범위)
    const today = new Date().toISOString().slice(0, 10);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 8000)
    );
    const fetchPromise = fetch(
      `https://finnhub.io/api/v1/calendar/earnings?from=${today}&to=${today}&token=${key}`,
      { next: { revalidate: 0 } }
    ).then(async res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return (data.earningsCalendar ?? []).length as number;
    });

    const count = await Promise.race([fetchPromise, timeoutPromise]);
    return { ok: true, latencyMs: Date.now() - start, earningsCount: count };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - start, error: e.message === 'timeout' ? '응답 초과 (8s)' : e.message };
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
