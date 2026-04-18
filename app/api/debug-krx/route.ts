import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, any> = {};

  // 테스트 1: 실적 발표 일정 (MDCSTAT23901)
  try {
    const body1 = new URLSearchParams({
      bld: 'dbms/MDC/STAT/standard/MDCSTAT23901',
      locale: 'ko_KR',
      strtDd: '20260101',
      endDd: '20260630',
      share: '1',
      money: '1',
      csvxls_isNo: 'false',
    });
    const res1 = await fetch('https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': 'https://data.krx.co.kr/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: body1.toString(),
      cache: 'no-store',
    });
    const text1 = await res1.text();
    results['MDCSTAT23901'] = {
      status: res1.status,
      // 응답 앞 2000자만
      raw: text1.slice(0, 2000),
      keys: (() => {
        try {
          const j = JSON.parse(text1);
          const firstKey = Object.keys(j)[0];
          const arr = j[firstKey];
          return {
            topKeys: Object.keys(j),
            firstKey,
            count: Array.isArray(arr) ? arr.length : 'not array',
            sample: Array.isArray(arr) ? arr[0] : arr,
          };
        } catch { return 'parse error'; }
      })(),
    };
  } catch (e: any) {
    results['MDCSTAT23901'] = { error: e.message };
  }

  // 테스트 2: 다른 bld 시도 (실적 관련)
  try {
    const body2 = new URLSearchParams({
      bld: 'dbms/MDC/STAT/standard/MDCSTAT23901',
      locale: 'ko_KR',
      strtDd: '20260401',
      endDd: '20260418',
      share: '1',
      money: '1',
      csvxls_isNo: 'false',
    });
    const res2 = await fetch('https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': 'https://data.krx.co.kr/contents/MDC/MAIN/main/MDCMain.jsp',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://data.krx.co.kr',
      },
      body: body2.toString(),
      cache: 'no-store',
    });
    const text2 = await res2.text();
    results['MDCSTAT23901_narrow'] = {
      status: res2.status,
      raw: text2.slice(0, 2000),
    };
  } catch (e: any) {
    results['MDCSTAT23901_narrow'] = { error: e.message };
  }

  return NextResponse.json(results);
}
