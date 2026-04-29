import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import CookieBanner from '@/components/CookieBanner';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { headers } from 'next/headers';
import Script from 'next/script';

// Pretendard Std — 본문·UI 전체 (Noto Sans KR 대체)
const pretendard = localFont({
  src: [
    { path: '../public/fonts/pretendard-std-400.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/pretendard-std-500.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/pretendard-std-600.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/pretendard-std-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Arial',
});

// GmarketSans — 홈화면 히어로 타이틀 전용
const gmarketSans = localFont({
  src: [
    { path: '../public/fonts/GmarketSansTTFLight.woff2',  weight: '300', style: 'normal' },
    { path: '../public/fonts/GmarketSansTTFMedium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/GmarketSansTTFBold.woff2',   weight: '700', style: 'normal' },
  ],
  variable: '--font-gmarket',
  display: 'swap',
  preload: false, // 홈화면 진입 시에만 필요
});

// JetBrains Mono — 모노스페이스 (숫자·코드·태그)
const jetbrainsMono = localFont({
  src: [
    { path: '../public/fonts/jetbrains-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/jetbrains-mono-latin-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://stockwiki.kr'),
  title: {
    default: 'StockWiKi.kr · 금융 사전 & 계산기',
    template: '%s | StockWiKi.kr',
  },
  description: '주식·선물·옵션·거시경제·회계·퀀트까지 — 전업투자자를 위한 금융 용어 사전과 실전 계산기. 16,323개 용어와 69종 계산기 수록.',
  keywords: ['주식 용어', '금융 사전', 'PER', 'PBR', 'ROE', '선물', '옵션', '블랙숄즈', 'DCF', '거시경제', '계산기'],
  openGraph: {
    title: 'StockWiKi.kr · 금융 사전 & 계산기',
    description: '전업투자자를 위한 금융 용어 사전과 실전 계산기',
    url: 'https://stockwiki.kr',
    siteName: 'StockWiKi.kr',
    locale: 'ko_KR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icon-256.png', sizes: '256x256', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

const GA_ID = 'G-N3N8D9KE10';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 어드민 경로면 GA 완전 제외
  const headersList = await headers();
  const pathname = headersList.get('x-invoke-path') ?? headersList.get('x-pathname') ?? '';
  const isAdmin = pathname.startsWith('/admin-stk-2026');

  return (
    <html lang="ko" className={`${pretendard.variable} ${gmarketSans.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* IBM Plex — v2 디자인 시스템 폰트 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;1,300&display=swap" rel="stylesheet" />
      </head>
      <body>
        {/* Liquid mesh gradient — 전체 페이지 공통 ambient 배경 (Magic UI style) */}
        <div className="liquid-bg" aria-hidden="true">
          <div className="liquid-blob-1" />
          <div className="liquid-blob-2" />
          <div className="liquid-blob-3" />
        </div>
        {children}
        {!isAdmin && <CookieBanner />}
        {!isAdmin && <Analytics />}
        {!isAdmin && <SpeedInsights />}
        {/* GA — afterInteractive: 페이지 인터랙티브 후 로딩 → 153KiB 초기 차단 제거 */}
        {!isAdmin && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
