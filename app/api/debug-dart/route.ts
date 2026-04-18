import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const DART_KEY = process.env.DART_API_KEY ?? '';
  if (DART_KEY === '') return NextResponse.json({ error: 'DART_API_KEY 없음' });

  const currentYear = new Date().getFullYear();
  const bgn = `${currentYear}0101`;
  const end = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, '');

  // 삼성전자(00126380), SK하이닉스(00164779), 현대차(00113495) 3개만 테스트
  const testCorps = [
    { name: '삼성전자', corpCode: '00126380' },
    { name: 'SK하이닉스', corpCode: '00164779' },
    { name: '현대자동차', corpCode: '00113495' },
  ];

  const results: Record<string, any> = {};

  for (const corp of testCorps) {
    results[corp.name] = {};
    for (const pType of ['A003', 'A002', 'A001']) {
      try {
        const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${DART_KEY}&corp_code=${corp.corpCode}&bgn_de=${bgn}&end_de=${end}&pblntf_ty=A&pblntf_detail_ty=${pType}&page_count=5`;
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        results[corp.name][pType] = {
          status: data.status,
          message: data.message,
          total_count: data.total_count,
          sample: (data.list ?? []).slice(0, 3).map((i: any) => ({
            corp_name: i.corp_name,
            rcept_dt: i.rcept_dt,
            report_nm: i.report_nm,
          })),
        };
      } catch (e: any) {
        results[corp.name][pType] = { error: e.message };
      }
    }
  }

  return NextResponse.json({ bgn, end, results });
}
