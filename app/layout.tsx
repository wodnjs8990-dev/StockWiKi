import type { Metadata } from 'next';
import './globals.css';

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
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
