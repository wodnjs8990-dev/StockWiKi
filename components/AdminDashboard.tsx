'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type SiteConfig = {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  maintenanceEndTime?: string;
  features: {
    glossary: boolean;
    calculator: boolean;
    commandK: boolean;
  };
};

type Stats = {
  terms: number;
  categories: number;
  calcs: number;
  calcGroups: number;
};

export default function AdminDashboard({
  initialConfig,
  stats,
}: {
  initialConfig: SiteConfig;
  stats: Stats;
}) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig);
  const [message, setMessage] = useState(initialConfig.maintenanceMessage || '');
  const [endTime, setEndTime] = useState(initialConfig.maintenanceEndTime || '');
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null);
  const router = useRouter();

  const showToast = (text: string, kind: 'ok' | 'err' = 'ok') => {
    setToast({ text, kind });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleMaintenance = async () => {
    startTransition(async () => {
      const next = !config.maintenanceMode;
      try {
        const res = await fetch('/api/admin/toggle-maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            maintenanceMode: next,
            maintenanceMessage: message,
            maintenanceEndTime: endTime,
          }),
        });
        if (res.ok) {
          setConfig({ ...config, maintenanceMode: next });
          showToast(next ? '점검 모드 활성화됨' : '점검 모드 해제됨');
        } else {
          showToast('설정 저장 실패', 'err');
        }
      } catch {
        showToast('네트워크 오류', 'err');
      }
    });
  };

  const saveMaintenanceMeta = async () => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/toggle-maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            maintenanceMode: config.maintenanceMode,
            maintenanceMessage: message,
            maintenanceEndTime: endTime,
          }),
        });
        if (res.ok) showToast('메시지 저장됨');
        else showToast('저장 실패', 'err');
      } catch {
        showToast('네트워크 오류', 'err');
      }
    });
  };

  const toggleFeature = async (key: keyof SiteConfig['features']) => {
    startTransition(async () => {
      const nextFeatures = { ...config.features, [key]: !config.features[key] };
      try {
        const res = await fetch('/api/admin/feature-toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ features: nextFeatures }),
        });
        if (res.ok) {
          setConfig({ ...config, features: nextFeatures });
          showToast(`${key} ${nextFeatures[key] ? '활성화' : '비활성화'}됨`);
        } else {
          showToast('저장 실패', 'err');
        }
      } catch {
        showToast('네트워크 오류', 'err');
      }
    });
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin-stk-2026/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen" style={{ background: '#0f0f0f', color: '#d4d0c4' }}>
      {/* 헤더 */}
      <header className="border-b sticky top-0 z-20" style={{ borderColor: '#2a2a2a', background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-light" style={{ color: '#e8e4d6' }}>
              Stock<span style={{ color: '#C89650', fontWeight: 500 }}>WiKi</span>
            </span>
            <span className="text-[10px] mono uppercase tracking-[0.3em] px-2 py-0.5 border" style={{ borderColor: '#C89650', color: '#C89650' }}>
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank" className="text-[10px] mono uppercase tracking-[0.2em] px-3 py-1.5 border transition-all hover:bg-white/5" style={{ borderColor: '#2a2a2a', color: '#a8a49a' }}>
              사이트 보기 ↗
            </Link>
            <button onClick={logout} className="text-[10px] mono uppercase tracking-[0.2em] px-3 py-1.5 border transition-all hover:bg-white/5" style={{ borderColor: '#2a2a2a', color: '#a8a49a' }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-4 md:px-8 py-8">
        {/* 섹션 라벨 */}
        <div className="mb-8">
          <div className="text-[10px] mono uppercase tracking-[0.3em]" style={{ color: '#7a7a7a' }}>§ Dashboard · Control Panel</div>
        </div>

        {/* 사이트 상태 카드 */}
        <section className="mb-6 border" style={{ borderColor: '#2a2a2a', background: '#141414' }}>
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: '#2a2a2a', background: '#0f0f0f' }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: config.maintenanceMode ? '#C89650' : '#4A7045' }}></span>
              <span className="text-[10px] mono uppercase tracking-[0.2em]" style={{ color: '#a8a49a' }}>Site Status</span>
            </div>
            <span className="text-[10px] mono uppercase tracking-[0.2em]" style={{ color: config.maintenanceMode ? '#C89650' : '#4A7045' }}>
              {config.maintenanceMode ? '● Maintenance' : '● Live'}
            </span>
          </div>

          <div className="p-5 md:p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="text-lg md:text-xl mb-1" style={{ color: '#e8e4d6' }}>
                  {config.maintenanceMode ? '점검 모드 활성화됨' : '서비스 정상 운영 중'}
                </div>
                <div className="text-xs" style={{ color: '#7a7a7a' }}>
                  {config.maintenanceMode
                    ? '모든 방문자가 점검 화면을 보게 됩니다'
                    : '버튼을 클릭해 점검 모드로 전환할 수 있습니다'}
                </div>
              </div>
              <button
                onClick={toggleMaintenance}
                disabled={isPending}
                className="shrink-0 px-4 py-2 text-xs mono uppercase tracking-[0.2em] border transition-all"
                style={{
                  borderColor: config.maintenanceMode ? '#4A7045' : '#C89650',
                  background: config.maintenanceMode ? '#4A7045' : '#C89650',
                  color: '#0a0a0a',
                  opacity: isPending ? 0.5 : 1,
                  cursor: isPending ? 'wait' : 'pointer',
                }}
              >
                {isPending ? '처리 중...' : config.maintenanceMode ? '점검 해제' : '점검 시작'}
              </button>
            </div>

            {/* 점검 메시지 설정 */}
            <div className="space-y-4 pt-5 border-t" style={{ borderColor: '#2a2a2a' }}>
              <div>
                <label className="block mb-2">
                  <div className="text-[10px] mono uppercase tracking-[0.2em] mb-2" style={{ color: '#7a7a7a' }}>점검 메시지</div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    className="w-full bg-transparent border px-3 py-2 text-sm outline-none resize-none"
                    style={{ borderColor: '#2a2a2a', color: '#e8e4d6' }}
                    placeholder="시스템 점검 중입니다..."
                  />
                </label>
              </div>

              <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
                <label className="block">
                  <div className="text-[10px] mono uppercase tracking-[0.2em] mb-2" style={{ color: '#7a7a7a' }}>예상 종료 시각 (선택)</div>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-transparent border px-3 py-2 text-sm outline-none mono"
                    style={{ borderColor: '#2a2a2a', color: '#e8e4d6', colorScheme: 'dark' }}
                  />
                </label>
                <button
                  onClick={saveMaintenanceMeta}
                  disabled={isPending}
                  className="px-4 py-2 text-xs mono uppercase tracking-[0.2em] border transition-all hover:bg-white/5"
                  style={{ borderColor: '#2a2a2a', color: '#a8a49a' }}
                >
                  메시지 저장
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 기능 토글 */}
        <section className="mb-6 border" style={{ borderColor: '#2a2a2a', background: '#141414' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: '#2a2a2a', background: '#0f0f0f' }}>
            <span className="text-[10px] mono uppercase tracking-[0.2em]" style={{ color: '#a8a49a' }}>Feature Toggles</span>
          </div>
          <div>
            {[
              { key: 'glossary' as const, label: '금융 사전', desc: '용어 사전 전체 탭' },
              { key: 'calculator' as const, label: '계산기', desc: '29개 금융 계산기 탭' },
              { key: 'commandK' as const, label: '빠른 검색', desc: 'Cmd+K 빠른 검색 팝업' },
            ].map((f, i) => (
              <div
                key={f.key}
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: i === 2 ? 'transparent' : '#1f1f1f' }}
              >
                <div>
                  <div className="text-sm mb-0.5" style={{ color: '#e8e4d6' }}>{f.label}</div>
                  <div className="text-[11px]" style={{ color: '#7a7a7a' }}>{f.desc}</div>
                </div>
                <button
                  onClick={() => toggleFeature(f.key)}
                  disabled={isPending}
                  className="relative w-12 h-6 transition-all"
                  style={{
                    background: config.features[f.key] ? '#4A7045' : '#2a2a2a',
                    opacity: isPending ? 0.5 : 1,
                  }}
                  aria-label={`Toggle ${f.label}`}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 transition-all"
                    style={{
                      left: config.features[f.key] ? 'calc(100% - 22px)' : '2px',
                      background: '#e8e4d6',
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 통계 */}
        <section className="mb-6 border" style={{ borderColor: '#2a2a2a', background: '#141414' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: '#2a2a2a', background: '#0f0f0f' }}>
            <span className="text-[10px] mono uppercase tracking-[0.2em]" style={{ color: '#a8a49a' }}>Content Statistics</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { label: 'Terms', value: stats.terms, color: '#C89650' },
              { label: 'Categories', value: stats.categories, color: '#A63D33' },
              { label: 'Calculators', value: stats.calcs, color: '#4A7045' },
              { label: 'Calc Groups', value: stats.calcGroups, color: '#4F7E7C' },
            ].map((s, i) => (
              <div
                key={s.label}
                className={`p-5 md:p-6 ${i % 2 === 1 ? '' : 'border-r'} ${i < 2 ? 'border-b md:border-b-0' : ''} md:[&:not(:last-child)]:border-r`}
                style={{ borderColor: '#1f1f1f' }}
              >
                <div className="text-[10px] mono uppercase tracking-[0.2em] mb-2" style={{ color: '#7a7a7a' }}>{s.label}</div>
                <div className="text-3xl md:text-4xl font-light tracking-tight" style={{ color: s.color }}>
                  {String(s.value).padStart(3, '0')}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 배포 정보 */}
        <section className="border" style={{ borderColor: '#2a2a2a', background: '#141414' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: '#2a2a2a', background: '#0f0f0f' }}>
            <span className="text-[10px] mono uppercase tracking-[0.2em]" style={{ color: '#a8a49a' }}>Deployment</span>
          </div>
          <div className="p-5 grid md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[10px] mono uppercase tracking-[0.2em] mb-1" style={{ color: '#7a7a7a' }}>Domain</div>
              <div style={{ color: '#e8e4d6' }}>stockwiki.kr</div>
            </div>
            <div>
              <div className="text-[10px] mono uppercase tracking-[0.2em] mb-1" style={{ color: '#7a7a7a' }}>Last Loaded</div>
              <div className="mono" style={{ color: '#e8e4d6' }}>
                {new Date().toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'medium' })}
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-10 pb-6 text-center">
          <div className="text-[10px] mono uppercase tracking-[0.3em]" style={{ color: '#5a5a5a' }}>
            Restricted Area · Designed by Ones
          </div>
        </footer>
      </main>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 px-4 py-3 border text-xs mono uppercase tracking-[0.15em] z-30"
          style={{
            background: '#141414',
            borderColor: toast.kind === 'ok' ? '#4A7045' : '#A63D33',
            color: toast.kind === 'ok' ? '#6FA85C' : '#E87965',
          }}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
