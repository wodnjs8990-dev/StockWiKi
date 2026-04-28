// 어드민 전용 레이아웃 — GA/Analytics 완전 제외
// 이 layout이 root layout의 GA 스크립트를 override함

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin · StockWiKi',
  robots: { index: false, follow: false }, // 검색엔진 크롤링도 차단
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Ambient mesh gradient — 어드민에도 동일한 배경 적용 */}
      <div className="liquid-bg" aria-hidden="true">
        <div className="liquid-blob-1" />
        <div className="liquid-blob-2" />
        <div className="liquid-blob-3" />
      </div>
      {children}
    </>
  );
}
