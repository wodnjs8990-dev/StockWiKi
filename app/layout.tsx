import type { Metadata } from 'next';
import './globals.css';
import CookieBanner from '@/components/CookieBanner';

export const metadata: Metadata = {
  metadataBase: new URL('https://stockwiki.kr'),
  title: {
    default: 'StockWiKi.kr · 금융 사전 & 계산기',
    template: '%s | StockWiKi.kr',
  },
  description: '주식·선물·옵션·거시경제·회계·퀀트까지 — 전업투자자를 위한 금융 용어 사전과 실전 계산기 288개 용어, 28개 계산기 수록.',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `,
          }}
        />
      </head>
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
