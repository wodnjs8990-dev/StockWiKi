import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const DART_KEY = process.env.DART_API_KEY ?? '';
  if (DART_KEY === '') return NextResponse.json({ error: 'DART_API_KEY 없음' });

  const bgn = '20260101';
  const end = '20260418';

  const results: Record<string, any> = {};

  for (const pType of ['A003', 'A002', 'A001']) {
    try {
      const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${DART_KEY}&bgn_de=${bgn}&end_de=${end}&pblntf_ty=A&pblntf_detail_ty=${pType}&page_no=1&page_count=10`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      results[pType] = {
        status: data.status,
        message: data.message,
        total_count: data.total_count,
        sample: (data.list ?? []).slice(0, 3).map((i: any) => ({
          corp_name: i.corp_name,
          corp_code: i.corp_code,
          rcept_dt: i.rcept_dt,
          report_nm: i.report_nm,
        })),
      };
    } catch (e: any) {
      results[pType] = { error: e.message };
    }
  }

  return NextResponse.json(results);
}
