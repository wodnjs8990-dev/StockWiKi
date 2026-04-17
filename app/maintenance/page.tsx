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

  const now = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const border = '#2a2a2a';

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#1a1a1a',
        color: '#d4d0c4',
        fontFamily: "'Inter', 'Noto Sans KR', sans-serif",
      }}
    >
      <style>{`
        .mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }

        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .loading-bar { position: relative; overflow: hidden; }
        .loading-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          width: 25%;
          background: linear-gradient(90deg, transparent, #C89650, transparent);
          animation: loading-bar 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* ─────────── 헤더 ─────────── */}
      <header className="border-b" style={{ borderColor: border }}>
        <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-4 md:py-5 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2 min-w-0">
            <span
              className="text-lg md:text-2xl font-light tracking-tight whitespace-nowrap"
              style={{ color: '#e8e4d6' }}
            >
              Stock<span style={{ color: '#C89650', fontWeight: 500 }}>WiKi</span>
            </span>
            <span className="text-[10px] md:text-xs mono" style={{ color: '#7a7a7a' }}>
              .kr
            </span>
          </div>
          <div
            className="flex items-center gap-2 md:gap-4 mono text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] whitespace-nowrap"
            style={{ color: '#7a7a7a' }}
          >
            <span>§ Maintenance</span>
            <span
              className="hidden md:inline-block w-4 h-px"
              style={{ background: '#3a3a3a' }}
            ></span>
            <span>503</span>
          </div>
        </div>
      </header>

      {/* ─────────── 메인 ─────────── */}
      <main className="max-w-[1000px] mx-auto px-4 md:px-8 py-10 md:py-24">
        {/* 타이틀 영역 */}
        <div className="mb-8 md:mb-12">
          <div
            className="text-[9px] md:text-[10px] mono uppercase tracking-[0.25em] md:tracking-[0.3em] mb-2 md:mb-3"
            style={{ color: '#7a7a7a' }}
          >
            § Notice / Offline
          </div>
          <h1
            className="font-light tracking-tight leading-none"
            style={{ color: '#e8e4d6', fontSize: 'clamp(2.5rem, 12vw, 5.5rem)' }}
          >
            점검 중<span style={{ color: '#C89650' }}>.</span>
          </h1>
          <div
            className="mono text-[10px] md:text-[11px] uppercase tracking-[0.25em] md:tracking-[0.3em] mt-2 md:mt-3"
            style={{ color: '#7a7a7a' }}
          >
            Under Maintenance
          </div>
        </div>

        {/* 프로세스 바 */}
        <div className="mb-8 md:mb-10">
          <div className="flex items-center justify-between mb-2 mono text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.25em]">
            <span style={{ color: '#7a7a7a' }}>System Process</span>
            <span style={{ color: '#C89650' }}>Working</span>
          </div>
          <div className="loading-bar h-[2px]" style={{ background: '#2a2a2a' }} />
        </div>

        {/* 메시지 박스 */}
        <div
          className="mb-8 md:mb-10 border-l-4 pl-4 md:pl-5 py-3 md:py-4"
          style={{ borderColor: '#C89650', background: '#141414' }}
        >
          <p
            className="text-sm md:text-base leading-relaxed mb-2"
            style={{ color: '#e8e4d6' }}
          >
            {config.maintenanceMessage ||
              '더 나은 서비스 제공을 위해 시스템을 점검하고 있습니다.'}
          </p>
          <p className="text-[11px] md:text-xs leading-relaxed" style={{ color: '#7a7a7a' }}>
            잠시 후 다시 접속해 주시기 바랍니다.
          </p>
        </div>

        {/* 정보 그리드 - 모바일: 3행 1열, 데스크톱: 1행 3열 */}
        <div className="border" style={{ borderColor: border }}>
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div
              className="px-4 py-3 md:p-6 border-b md:border-b-0 md:border-r flex md:block items-center justify-between"
              style={{ borderColor: border, background: '#141414' }}
            >
              <div
                className="text-[9px] md:text-[10px] mono uppercase tracking-[0.2em] md:tracking-[0.25em] md:mb-2"
                style={{ color: '#7a7a7a' }}
              >
                Status
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#C89650' }}
                />
                <span className="text-xs md:text-sm mono" style={{ color: '#C89650' }}>
                  Offline
                </span>
              </div>
            </div>

            <div
              className="px-4 py-3 md:p-6 border-b md:border-b-0 md:border-r flex md:block items-center justify-between"
              style={{ borderColor: border, background: '#141414' }}
            >
              <div
                className="text-[9px] md:text-[10px] mono uppercase tracking-[0.2em] md:tracking-[0.25em] md:mb-2"
                style={{ color: '#7a7a7a' }}
              >
                Estimated Back
              </div>
              <div className="text-xs md:text-sm mono" style={{ color: '#e8e4d6' }}>
                {endTime || '미정'}
              </div>
            </div>

            <div
              className="px-4 py-3 md:p-6 flex md:block items-center justify-between"
              style={{ borderColor: border, background: '#141414' }}
            >
              <div
                className="text-[9px] md:text-[10px] mono uppercase tracking-[0.2em] md:tracking-[0.25em] md:mb-2"
                style={{ color: '#7a7a7a' }}
              >
                Loaded
              </div>
              <div className="text-xs md:text-sm mono text-right md:text-left" style={{ color: '#a8a49a' }}>
                {now}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─────────── 푸터 ─────────── */}
      <footer className="border-t" style={{ borderColor: border, background: '#141414' }}>
        <div
          className="max-w-[1000px] mx-auto px-4 md:px-8 py-4 md:py-5 flex items-center justify-between text-[9px] md:text-[10px] mono uppercase tracking-[0.25em] md:tracking-[0.3em] gap-3"
          style={{ color: '#6a6a6a' }}
        >
          <span className="truncate">금융 사전 & 계산기</span>
          <span className="whitespace-nowrap">Designed by Ones</span>
        </div>
      </footer>
    </div>
  );
}
