import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

export const config = {
  // 메인 페이지만 점검 모드 체크 대상으로 제한
  // 다른 경로(terms, calc, admin, api 등)는 모두 정상 통과
  matcher: ['/'],
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
