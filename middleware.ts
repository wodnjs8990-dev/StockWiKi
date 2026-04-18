import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

// ── 차단할 악성/스크래핑 봇 ──────────────────────────────
const BLOCKED_BOTS = [
  /AhrefsBot/i,
  /SemrushBot/i,
  /MJ12bot/i,
  /DotBot/i,
  /BLEXBot/i,
  /PetalBot/i,
  /YandexBot/i,
  /Bytespider/i,
  /GPTBot/i,
  /ClaudeBot/i,
  /CCBot/i,
  /DataForSeoBot/i,
  /serpstatbot/i,
  /MegaIndex/i,
];

export const config = {
  matcher: [
    // 정적 파일·이미지 제외하고 전체 경로 적용
    '/((?!_next/static|_next/image|favicon.ico|icon-|apple-touch).*)',
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get('user-agent') || '';

  // 1. 악성 봇 차단 (admin 경로 포함 전체)
  if (BLOCKED_BOTS.some(pattern => pattern.test(ua))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 2. 메인 페이지 점검 모드 체크
  if (pathname === '/') {
    try {
      const siteConfig = await get<{ maintenanceMode?: boolean }>('siteConfig');
      if (siteConfig?.maintenanceMode) {
        const url = req.nextUrl.clone();
        url.pathname = '/maintenance';
        return NextResponse.rewrite(url);
      }
    } catch {
      // Edge Config 실패 시 정상 통과
    }
  }

  // 3. 보안 헤더 + 경로별 캐시 설정
  const res = NextResponse.next();

  // 보안 헤더
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // OG 이미지 Edge 캐시 (1시간, stale 24시간)
  if (pathname.startsWith('/og')) {
    res.headers.set(
      'Cache-Control',
      'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
    );
  }

  // API 캐시 방지
  if (pathname.startsWith('/api/')) {
    res.headers.set('Cache-Control', 'no-store');
  }

  return res;
}
