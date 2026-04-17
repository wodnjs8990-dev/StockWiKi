import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

export const config = {
  // admin 페이지, API, 정적 파일, 점검 페이지는 제외
  matcher: [
    '/((?!admin-stk-2026|api|maintenance|_next|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};

export async function middleware(req: NextRequest) {
  try {
    const siteConfig = await get<{ maintenanceMode?: boolean }>('siteConfig');
    if (siteConfig?.maintenanceMode) {
      const url = req.nextUrl.clone();
      url.pathname = '/maintenance';
      return NextResponse.rewrite(url);
    }
  } catch (e) {
    // Edge Config 실패 시 정상 통과 (안전장치)
  }
  return NextResponse.next();
}
