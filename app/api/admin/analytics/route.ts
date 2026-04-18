import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { SignJWT, importPKCS8 } from 'jose';

export const dynamic = 'force-dynamic';

const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID ?? '';
const GA_CLIENT_EMAIL = process.env.GA_CLIENT_EMAIL ?? '';
const GA_PRIVATE_KEY = (process.env.GA_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');

// ── Google OAuth2 액세스 토큰 획득 (서비스 계정 JWT)
async function getGoogleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const privateKey = await importPKCS8(GA_PRIVATE_KEY, 'RS256');

  const jwt = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(GA_CLIENT_EMAIL)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OAuth 토큰 실패: ${err}`);
  }
  const data = await res.json();
  return data.access_token;
}

// ── GA Data API runReport 호출
async function runReport(token: string, body: object) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      next: { revalidate: 0 },
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GA API 오류: ${err}`);
  }
  return res.json();
}

// ── 실시간 활성 사용자 (Realtime API)
async function getRealtimeUsers(token: string): Promise<number> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runRealtimeReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics: [{ name: 'activeUsers' }],
      }),
      next: { revalidate: 0 },
    }
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return parseInt(data.rows?.[0]?.metricValues?.[0]?.value ?? '0', 10);
}

function parseRows(data: any, dimIdx = 0, metIdx = 0): { dim: string; value: number }[] {
  return (data.rows ?? []).map((row: any) => ({
    dim: row.dimensionValues?.[dimIdx]?.value ?? '',
    value: parseInt(row.metricValues?.[metIdx]?.value ?? '0', 10),
  }));
}

export async function GET() {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!GA_PROPERTY_ID || !GA_CLIENT_EMAIL || !GA_PRIVATE_KEY) {
    return NextResponse.json({ error: 'GA 환경변수 미설정' }, { status: 500 });
  }

  try {
    const token = await getGoogleAccessToken();

    const dateRanges7  = [{ startDate: '7daysAgo',  endDate: 'today' }];
    const dateRanges28 = [{ startDate: '28daysAgo', endDate: 'today' }];
    const dateRangesYd = [{ startDate: 'yesterday', endDate: 'yesterday' }];
    const dateRangesTod = [{ startDate: 'today',    endDate: 'today' }];

    const [
      realtimeUsers,
      todayData,
      yesterdayData,
      week7Data,
      week28Data,
      topPagesData,
      deviceData,
      countryData,
      hourlyData,
    ] = await Promise.all([
      getRealtimeUsers(token),

      // 오늘 PV + 세션
      runReport(token, {
        dateRanges: dateRangesTod,
        metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }, { name: 'activeUsers' }],
      }),

      // 어제 PV
      runReport(token, {
        dateRanges: dateRangesYd,
        metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }],
      }),

      // 7일 일별 PV
      runReport(token, {
        dateRanges: dateRanges7,
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),

      // 28일 합계
      runReport(token, {
        dateRanges: dateRanges28,
        metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }, { name: 'activeUsers' }],
      }),

      // 인기 페이지 TOP 10 (7일)
      runReport(token, {
        dateRanges: dateRanges7,
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),

      // 기기 유형 (7일)
      runReport(token, {
        dateRanges: dateRanges7,
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),

      // 국가 TOP 5 (7일)
      runReport(token, {
        dateRanges: dateRanges7,
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 5,
      }),

      // 시간대별 (오늘)
      runReport(token, {
        dateRanges: dateRangesTod,
        dimensions: [{ name: 'hour' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ dimension: { dimensionName: 'hour' } }],
      }),
    ]);

    const todayPV   = parseInt(todayData.rows?.[0]?.metricValues?.[0]?.value ?? '0', 10);
    const todaySess = parseInt(todayData.rows?.[0]?.metricValues?.[1]?.value ?? '0', 10);
    const todayUsers= parseInt(todayData.rows?.[0]?.metricValues?.[2]?.value ?? '0', 10);
    const ydPV      = parseInt(yesterdayData.rows?.[0]?.metricValues?.[0]?.value ?? '0', 10);
    const ydSess    = parseInt(yesterdayData.rows?.[0]?.metricValues?.[1]?.value ?? '0', 10);
    const w28PV     = parseInt(week28Data.rows?.[0]?.metricValues?.[0]?.value ?? '0', 10);
    const w28Sess   = parseInt(week28Data.rows?.[0]?.metricValues?.[1]?.value ?? '0', 10);
    const w28Users  = parseInt(week28Data.rows?.[0]?.metricValues?.[2]?.value ?? '0', 10);

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      realtime: realtimeUsers,
      today: { pv: todayPV, sessions: todaySess, users: todayUsers },
      yesterday: { pv: ydPV, sessions: ydSess },
      week28: { pv: w28PV, sessions: w28Sess, users: w28Users },
      daily7: parseRows(week7Data),
      topPages: parseRows(topPagesData).map(r => ({
        path: r.dim,
        pv: r.value,
      })),
      devices: parseRows(deviceData),
      countries: parseRows(countryData),
      hourly: parseRows(hourlyData),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
