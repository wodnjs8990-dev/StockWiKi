import { getSiteConfig } from '@/lib/config';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '점검 중 · StockWiKi.kr',
  description: '시스템 점검 중입니다. 잠시 후 다시 접속해주세요.',
  robots: { index: false, follow: false },
};

export default async function MaintenancePage() {
  const config = await getSiteConfig();
  const endTime = config.maintenanceEndTime
    ? new Date(config.maintenanceEndTime).toLocaleString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden" style={{ background: '#0a0a0a' }}>
      {/* 공사장 체크무늬 상단 바 */}
      <div
        className="absolute top-0 left-0 right-0 h-4"
        style={{
          background: 'repeating-linear-gradient(-45deg, #F5C518 0 20px, #0a0a0a 20px 40px)',
        }}
      />
      {/* 하단 바 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-4"
        style={{
          background: 'repeating-linear-gradient(-45deg, #F5C518 0 20px, #0a0a0a 20px 40px)',
        }}
      />

      {/* 배경 경고 삼각형 패턴 (큰 워터마크) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: 0.03 }}
      >
        <div style={{ fontSize: '40rem', lineHeight: 1, color: '#F5C518' }}>⚠</div>
      </div>

      <div className="relative max-w-xl w-full">
        {/* 경고 배지 */}
        <div className="mb-6 flex items-center gap-3 justify-center md:justify-start">
          <div
            className="px-2.5 py-1 text-[10px] mono uppercase tracking-[0.3em]"
            style={{ background: '#F5C518', color: '#0a0a0a', fontWeight: 700 }}
          >
            ⚠ NOTICE
          </div>
          <div className="text-[10px] mono uppercase tracking-[0.3em]" style={{ color: '#7a7a7a' }}>
            System Maintenance · Code 503
          </div>
        </div>

        {/* 메인 타이틀 */}
        <div className="mb-8">
          <h1
            className="text-5xl md:text-7xl font-light tracking-tight leading-none mb-3"
            style={{ color: '#e8e4d6' }}
          >
            점검 중<span style={{ color: '#F5C518' }}>.</span>
          </h1>
          <div className="mono text-[11px] uppercase tracking-[0.3em]" style={{ color: '#7a7a7a' }}>
            Under Maintenance
          </div>
        </div>

        {/* 메시지 박스 */}
        <div
          className="border-l-4 pl-5 py-4 mb-8"
          style={{ borderColor: '#F5C518', background: '#121212' }}
        >
          <p className="text-sm md:text-base leading-relaxed" style={{ color: '#d4d0c4' }}>
            {config.maintenanceMessage || '더 나은 서비스 제공을 위해 시스템을 점검하고 있습니다.'}
          </p>
        </div>

        {/* 정보 그리드 */}
        <div className="grid grid-cols-2 gap-0 border" style={{ borderColor: '#2a2a2a', background: '#0f0f0f' }}>
          <div className="p-4 border-r" style={{ borderColor: '#2a2a2a' }}>
            <div className="text-[10px] mono uppercase tracking-[0.2em] mb-1" style={{ color: '#7a7a7a' }}>
              Status
            </div>
            <div className="text-sm mono" style={{ color: '#F5C518' }}>● OFFLINE</div>
          </div>
          <div className="p-4">
            <div className="text-[10px] mono uppercase tracking-[0.2em] mb-1" style={{ color: '#7a7a7a' }}>
              Est. Back
            </div>
            <div className="text-sm mono" style={{ color: '#e8e4d6' }}>
              {endTime || 'TBD'}
            </div>
          </div>
        </div>

        {/* 하단 브랜드 */}
        <div className="mt-10 pt-6 border-t flex items-center justify-between" style={{ borderColor: '#2a2a2a' }}>
          <div>
            <div className="text-base font-light" style={{ color: '#e8e4d6' }}>
              Stock<span style={{ color: '#C89650', fontWeight: 500 }}>WiKi</span>
              <span className="text-xs mono ml-1" style={{ color: '#7a7a7a' }}>.kr</span>
            </div>
            <div className="text-[10px] mono mt-1" style={{ color: '#5a5a5a' }}>
              금융 사전 & 계산기
            </div>
          </div>
          <div className="text-[10px] mono uppercase tracking-[0.2em] text-right" style={{ color: '#5a5a5a' }}>
            <div>Designed by Ones</div>
            <div className="mt-1">We'll be right back</div>
          </div>
        </div>
      </div>
    </div>
  );
}
