import type { Metadata } from 'next';
import { Noto_Sans_KR, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import CookieBanner from '@/components/CookieBanner';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { headers } from 'next/headers';
import Script from 'next/script';

// Noto Sans KR — OFL 1.1, 상업용 무료
const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
  // optional: 폰트 로딩이 LCP/FCP를 차단하지 않음 — 캐시된 경우에만 적용
  display: 'optional',
  preload: true,
  adjustFontFallback: true,
});

// JetBrains Mono — OFL 1.1, 상업용 무료 (수치/모노용)
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://stockwiki.kr'),
  title: {
    default: 'StockWiKi.kr · 금융 사전 & 계산기',
    template: '%s | StockWiKi.kr',
  },
  description: '주식·선물·옵션·거시경제·회계·퀀트까지 — 전업투자자를 위한 금융 용어 사전과 실전 계산기. 530여 개 용어, 29개 계산기 수록.',
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
    <html lang="ko" className={`${notoSansKR.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Google Fonts 조기 연결 — DNS + TLS 핸드셰이크 선선 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* FOUC 방지: hydration 전에 테마 클래스 적용 */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('stockwiki_theme');if(t==='light')document.documentElement.classList.add('light');}catch(e){}})();` }} />
      </head>
      <body>
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
