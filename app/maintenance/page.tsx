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

  // 점검 시작 시각 표시용 (배포 시점)
  const now = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
      {/* CSS 애니메이션 */}
      <style>{`
        @keyframes slideStripe {
          0% { background-position: 0 0; }
          100% { background-position: 56px 0; }
        }
        @keyframes pulse-warn {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(245, 197, 24, 0.7); }
          50% { opacity: 0.85; box-shadow: 0 0 0 12px rgba(245, 197, 24, 0); }
        }
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.2; }
        }
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          3% { opacity: 0.4; }
          6% { opacity: 1; }
          9% { opacity: 0.3; }
          12% { opacity: 1; }
        }

        .stripe-top, .stripe-bottom {
          background: repeating-linear-gradient(
            -45deg,
            #F5C518 0 28px,
            #0a0a0a 28px 56px
          );
          background-size: 56px 56px;
          animation: slideStripe 2s linear infinite;
        }
        .grid-bg {
          background-image:
            linear-gradient(rgba(245,197,24,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,197,24,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .warn-pulse {
          animation: pulse-warn 2s ease-in-out infinite;
        }
        .blink {
          animation: blink 1.2s steps(2, start) infinite;
        }
        .loading-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, #F5C518, transparent);
          width: 25%;
          animation: loading-bar 2.5s ease-in-out infinite;
        }
        .gear {
          animation: spin-slow 8s linear infinite;
        }
        .gear-reverse {
          animation: spin-slow 12s linear infinite reverse;
        }
        .scanline {
          animation: scan 8s linear infinite;
        }
        .flicker-text {
          animation: flicker 4s ease-in-out infinite;
        }
        .noise {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
          background-size: 200px 200px;
          mix-blend-mode: overlay;
          opacity: 0.06;
        }
      `}</style>

      {/* 상단 공사장 체크무늬 바 */}
      <div className="absolute top-0 left-0 right-0 h-6 stripe-top z-20" />
      {/* 하단 공사장 체크무늬 바 */}
      <div className="absolute bottom-0 left-0 right-0 h-6 stripe-bottom z-20" />

      {/* 격자 배경 */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      {/* 노이즈 오버레이 */}
      <div className="absolute inset-0 noise pointer-events-none z-10" />
      {/* 스캔라인 */}
      <div
        className="absolute left-0 right-0 h-[2px] pointer-events-none z-10 scanline"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(245,197,24,0.15), transparent)' }}
      />

      {/* 거대한 배경 경고 삼각형 (왼쪽 아래) */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '-8%',
          bottom: '8%',
          fontSize: '36rem',
          lineHeight: 1,
          color: '#F5C518',
          opacity: 0.04,
          fontWeight: 900,
          userSelect: 'none',
        }}
      >
        ⚠
      </div>

      {/* 거대한 "503" 배경 (오른쪽 위) */}
      <div
        className="absolute pointer-events-none mono"
        style={{
          right: '-2%',
          top: '10%',
          fontSize: '28rem',
          lineHeight: 1,
          color: '#F5C518',
          opacity: 0.025,
          fontWeight: 900,
          letterSpacing: '-0.08em',
          userSelect: 'none',
        }}
      >
        503
      </div>

      {/* 기어 아이콘 데코 (우측 상단) */}
      <svg
        className="absolute gear pointer-events-none"
        style={{ top: '80px', right: '40px', opacity: 0.08 }}
        width="200"
        height="200"
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M50 10 L55 22 L68 18 L65 31 L78 30 L72 42 L85 46 L75 55 L85 64 L72 68 L78 80 L65 79 L68 92 L55 88 L50 100 L45 88 L32 92 L35 79 L22 80 L28 68 L15 64 L25 55 L15 46 L28 42 L22 30 L35 31 L32 18 L45 22 Z"
          stroke="#F5C518"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="55" r="14" stroke="#F5C518" strokeWidth="1.5" />
      </svg>

      {/* 기어 아이콘 데코 (좌측 하단) */}
      <svg
        className="absolute gear-reverse pointer-events-none"
        style={{ bottom: '80px', left: '40px', opacity: 0.06 }}
        width="140"
        height="140"
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M50 10 L55 22 L68 18 L65 31 L78 30 L72 42 L85 46 L75 55 L85 64 L72 68 L78 80 L65 79 L68 92 L55 88 L50 100 L45 88 L32 92 L35 79 L22 80 L28 68 L15 64 L25 55 L15 46 L28 42 L22 30 L35 31 L32 18 L45 22 Z"
          stroke="#F5C518"
          strokeWidth="1.5"
        />
      </svg>

      {/* DO NOT ENTER 테이프 (상단 대각선) */}
      <div
        className="absolute pointer-events-none mono z-10"
        style={{
          top: '120px',
          right: '-80px',
          transform: 'rotate(-8deg)',
          background: '#F5C518',
          color: '#0a0a0a',
          padding: '6px 100px',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.3em',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        ▲ DO NOT ENTER · 접근 금지 · 공사 중 · DO NOT ENTER ▲
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative z-20 min-h-screen flex items-center justify-center px-4 md:px-8 py-20">
        <div className="w-full max-w-3xl">

          {/* 상단 태그 줄 */}
          <div className="flex items-center gap-3 mb-8 flex-wrap">
            <div
              className="px-3 py-1.5 text-[10px] mono uppercase tracking-[0.25em] flex items-center gap-2 warn-pulse"
              style={{ background: '#F5C518', color: '#0a0a0a', fontWeight: 900 }}
            >
              <span>⚠</span>
              <span>NOTICE</span>
            </div>
            <div className="text-[10px] mono uppercase tracking-[0.3em]" style={{ color: '#7a7a7a' }}>
              System Maintenance
            </div>
            <div className="text-[10px] mono uppercase tracking-[0.3em] px-2 py-1 border" style={{ borderColor: '#F5C518', color: '#F5C518' }}>
              Error Code 503
            </div>
            <div className="ml-auto flex items-center gap-2 text-[10px] mono uppercase tracking-[0.2em]" style={{ color: '#6a6a6a' }}>
              <span className="w-1.5 h-1.5 rounded-full blink" style={{ background: '#F5C518' }} />
              <span>OFFLINE</span>
            </div>
          </div>

          {/* 메인 타이틀 — 엄청 크고 임팩트 있게 */}
          <div className="mb-10">
            <div className="flex items-baseline gap-4 md:gap-6 mb-4 flex-wrap">
              <h1
                className="font-light tracking-tight leading-none flicker-text"
                style={{ color: '#e8e4d6', fontSize: 'clamp(5rem, 16vw, 11rem)' }}
              >
                점검 중
                <span style={{ color: '#F5C518' }}>.</span>
              </h1>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="mono text-[11px] md:text-sm uppercase tracking-[0.35em]" style={{ color: '#7a7a7a' }}>
                Under Maintenance
              </div>
              <div className="flex-1 min-w-[60px] h-px" style={{ background: 'linear-gradient(90deg, #2a2a2a, transparent)' }} />
              <div className="mono text-[10px] uppercase tracking-[0.3em]" style={{ color: '#5a5a5a' }}>
                Ref #SWK-{new Date().getTime().toString().slice(-8)}
              </div>
            </div>
          </div>

          {/* 로딩 바 (가짜 진행도) */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-2 mono text-[10px] uppercase tracking-[0.25em]">
              <span style={{ color: '#7a7a7a' }}>System Process</span>
              <span style={{ color: '#F5C518' }}>WORKING...</span>
            </div>
            <div
              className="relative h-1 loading-bar overflow-hidden"
              style={{ background: '#1a1a1a' }}
            />
          </div>

          {/* 메시지 박스 — 경고 배너 스타일 */}
          <div
            className="mb-10 relative border-l-4 overflow-hidden"
            style={{ borderColor: '#F5C518', background: 'linear-gradient(90deg, rgba(245,197,24,0.04), transparent)' }}
          >
            <div className="p-5 md:p-6">
              <div className="flex items-start gap-4">
                <div className="hidden md:block shrink-0 mt-0.5">
                  {/* 공사 헬멧 아이콘 SVG */}
                  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                    <path
                      d="M24 10C16 10 10 16 10 24V30H38V24C38 16 32 10 24 10Z"
                      fill="#F5C518"
                    />
                    <rect x="8" y="30" width="32" height="4" fill="#d9a812" />
                    <path
                      d="M22 10V16M26 10V16"
                      stroke="#0a0a0a"
                      strokeWidth="1.5"
                    />
                    <rect x="18" y="20" width="12" height="2" fill="#0a0a0a" opacity="0.3" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p
                    className="text-base md:text-lg leading-relaxed"
                    style={{ color: '#e8e4d6' }}
                  >
                    {config.maintenanceMessage || '더 나은 서비스 제공을 위해 시스템을 점검하고 있습니다.'}
                  </p>
                  <p className="text-xs mt-3" style={{ color: '#7a7a7a' }}>
                    잠시 후 다시 접속해 주시기 바랍니다. 불편을 끼쳐드려 죄송합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 정보 그리드 — 3개 박스 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border mb-10" style={{ borderColor: '#2a2a2a' }}>
            <div className="p-5 border-b md:border-b-0 md:border-r relative overflow-hidden" style={{ borderColor: '#2a2a2a', background: '#0f0f0f' }}>
              <div className="text-[10px] mono uppercase tracking-[0.25em] mb-2" style={{ color: '#6a6a6a' }}>
                Status
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full blink" style={{ background: '#F5C518' }} />
                <span className="text-sm mono" style={{ color: '#F5C518' }}>OFFLINE</span>
              </div>
              {/* 미세한 장식 줄 */}
              <div
                className="absolute bottom-0 left-0 w-full h-px"
                style={{ background: 'linear-gradient(90deg, #F5C518, transparent)' }}
              />
            </div>

            <div className="p-5 border-b md:border-b-0 md:border-r" style={{ borderColor: '#2a2a2a', background: '#0f0f0f' }}>
              <div className="text-[10px] mono uppercase tracking-[0.25em] mb-2" style={{ color: '#6a6a6a' }}>
                Estimated Back
              </div>
              <div className="text-sm mono" style={{ color: '#e8e4d6' }}>
                {endTime || '미정 · TBD'}
              </div>
            </div>

            <div className="p-5" style={{ borderColor: '#2a2a2a', background: '#0f0f0f' }}>
              <div className="text-[10px] mono uppercase tracking-[0.25em] mb-2" style={{ color: '#6a6a6a' }}>
                Started
              </div>
              <div className="text-sm mono" style={{ color: '#a8a49a' }}>
                {now}
              </div>
            </div>
          </div>

          {/* 하단 Brand 푸터 */}
          <div className="pt-6 border-t flex items-center justify-between flex-wrap gap-4" style={{ borderColor: '#2a2a2a' }}>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-light" style={{ color: '#e8e4d6' }}>
                  Stock<span style={{ color: '#C89650', fontWeight: 500 }}>WiKi</span>
                </span>
                <span className="text-xs mono" style={{ color: '#7a7a7a' }}>.kr</span>
              </div>
              <div className="text-[10px] mono mt-1 uppercase tracking-[0.2em]" style={{ color: '#5a5a5a' }}>
                금융 사전 & 계산기
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* 작은 공구 아이콘 3개 */}
              <div className="flex items-center gap-2 opacity-40">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5C518" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5C518" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5C518" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-[10px] mono uppercase tracking-[0.3em]" style={{ color: '#6a6a6a' }}>
                  Designed by Ones
                </div>
                <div className="text-[10px] mono mt-1 uppercase tracking-[0.2em]" style={{ color: '#5a5a5a' }}>
                  We'll be right back
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
