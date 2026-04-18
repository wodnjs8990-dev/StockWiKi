'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

type SiteConfig = {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  maintenanceEndTime?: string;
  features: {
    glossary: boolean;
    calculator: boolean;
    commandK: boolean;
    events: boolean;
  };
};

type Stats = {
  terms: number;
  categories: number;
  calcs: number;
  calcGroups: number;
};

type ServiceStatus = { ok: boolean; latencyMs: number; error?: string; earningsCount?: number; earningsDate?: string; todayCount?: number };
type Metrics = {
  checkedAt: string;
  system: {
    nodeVersion: string;
    region: string;
    environment: string;
    memory: { heapUsedMB: number; heapTotalMB: number; rssMB: number };
  };
  services: {
    finnhub: ServiceStatus;
    edgeConfig: ServiceStatus;
    eventsApi: ServiceStatus;
    yahooFinance: ServiceStatus;
    dart: ServiceStatus;
  };
  dart_quota?: {
    daily_limit: number;
    note: string;
  };
} | null;

function StatusDot({ ok, loading }: { ok?: boolean; loading: boolean }) {
  if (loading) return <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#3a3a3a' }} />;
  return <span className="w-2 h-2 rounded-full" style={{ background: ok ? '#4A7045' : '#A63D33' }} />;
}

function LatencyBadge({ ms }: { ms: number }) {
  const color = ms < 300 ? '#4A7045' : ms < 800 ? '#C89650' : '#A63D33';
  return (
    <span className="text-[10px] mono px-1.5 py-0.5" style={{ color, border: `1px solid ${color}40`, background: `${color}10` }}>
      {ms}ms
    </span>
  );
}

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

  // 모니터링 상태
  const [metrics, setMetrics] = useState<Metrics>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const showToast = (text: string, kind: 'ok' | 'err' = 'ok') => {
    setToast({ text, kind });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const res = await fetch('/api/admin/metrics');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMetrics(data);
      setLastChecked(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e: any) {
      setMetricsError(e.message);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // 페이지 로드 시 자동 1회 체크
  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

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

  const services = metrics?.services;

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
              { key: 'events' as const, label: '이벤트', desc: 'FOMC·미국 어닝·선물만기 달력' },
            ].map((f, i, arr) => (
              <div
                key={f.key}
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: i === arr.length - 1 ? 'transparent' : '#1f1f1f' }}
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

        {/* ── 시스템 모니터링 ── */}
        <section className="mb-6 border" style={{ borderColor: '#2a2a2a', background: '#141414' }}>
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: '#2a2a2a', background: '#0f0f0f' }}>
            <span className="text-[10px] mono uppercase tracking-[0.2em]" style={{ color: '#a8a49a' }}>System Monitor</span>
            <div className="flex items-center gap-3">
              {lastChecked && (
                <span className="text-[10px] mono" style={{ color: '#4a4a4a' }}>
                  마지막 체크 {lastChecked}
                </span>
              )}
              <button
                onClick={fetchMetrics}
                disabled={metricsLoading}
                className="flex items-center gap-1.5 text-[10px] mono uppercase tracking-[0.2em] px-2.5 py-1 border transition-all hover:bg-white/5"
                style={{ borderColor: '#2a2a2a', color: '#7a7a7a', opacity: metricsLoading ? 0.5 : 1 }}
              >
                <RefreshCw size={9} className={metricsLoading ? 'animate-spin' : ''} />
                새로고침
              </button>
            </div>
          </div>

          {/* API 서비스 상태 */}
          <div className="border-b" style={{ borderColor: '#1f1f1f' }}>
            <div className="px-5 py-2" style={{ color: '#5a5a5a' }}>
              <span className="text-[9px] mono uppercase tracking-[0.25em]">API Services</span>
            </div>
            {([
              { key: 'finnhub' as const, label: 'Finnhub', desc: '주식 시세 · 어닝 데이터' },
              { key: 'edgeConfig' as const, label: 'Edge Config', desc: 'Vercel 실시간 설정' },
              { key: 'eventsApi' as const, label: 'Events API', desc: '어닝 캘린더 엔드포인트' },
              { key: 'yahooFinance' as const, label: 'Yahoo Finance', desc: '미국 어닝 · EPS 예상' },
              { key: 'dart' as const, label: 'DART', desc: '국내 공시 · 분기실적' },
            ] as const).map((svc, i, arr) => {
              const s = services?.[svc.key];
              const getDetail = () => {
                if (!s || s.error) return null;
                if (svc.key === 'eventsApi' && s.earningsCount !== undefined) return `${s.earningsCount}개 종목`;
                if (svc.key === 'yahooFinance' && s.earningsDate) return `AAPL 다음 어닝: ${s.earningsDate}`;
                if (svc.key === 'dart' && s.todayCount !== undefined) return `공시 ${s.todayCount.toLocaleString()}건 조회됨`;
                return null;
              };
              const detail = getDetail();
              return (
                <div
                  key={svc.key}
                  className="flex items-center justify-between px-5 py-3 border-b"
                  style={{ borderColor: i === arr.length - 1 ? 'transparent' : '#1a1a1a' }}
                >
                  <div className="flex items-center gap-3">
                    <StatusDot ok={s?.ok} loading={metricsLoading} />
                    <div>
                      <div className="text-sm" style={{ color: '#e8e4d6' }}>{svc.label}</div>
                      <div className="text-[10px] mono" style={{ color: '#5a5a5a' }}>
                        {s?.error
                          ? <span style={{ color: '#A63D33' }}>{s.error}</span>
                          : detail
                          ? <>{svc.desc} · <span style={{ color: '#a8a49a' }}>{detail}</span></>
                          : svc.desc}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s && !metricsLoading && <LatencyBadge ms={s.latencyMs} />}
                    {!metricsLoading && s && (
                      <span className="text-[10px] mono" style={{ color: s.ok ? '#4A7045' : '#A63D33' }}>
                        {s.ok ? '● 정상' : '● 오류'}
                      </span>
                    )}
                    {metricsLoading && (
                      <span className="text-[10px] mono" style={{ color: '#3a3a3a' }}>확인 중</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DART 할당량 표시 — 항상 렌더링, 로딩 중엔 스켈레톤 */}
          <div className="px-5 py-3 border-b" style={{ borderColor: '#1a1a1a' }}>
            <div className="text-[9px] mono uppercase tracking-[0.25em] mb-2" style={{ color: '#5a5a5a' }}>DART 일일 할당량</div>
            {metricsLoading ? (
              <div className="h-1.5 rounded-sm animate-pulse" style={{ background: '#1f1f1f' }} />
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-1.5 rounded-sm overflow-hidden" style={{ background: '#1f1f1f' }}>
                    {/* 헬스체크 1회 ≈ 1건, 어닝 풀조회 ≈ 3건(보고서유형별) — 추산치 */}
                    <div
                      className="h-full rounded-sm transition-all duration-500"
                      style={{
                        width: `${Math.min(((services?.dart?.todayCount ?? 0) / 40000) * 100, 100).toFixed(2)}%`,
                        minWidth: '2px',
                        background: (services?.dart?.todayCount ?? 0) > 35000 ? '#A63D33'
                          : (services?.dart?.todayCount ?? 0) > 20000 ? '#C89650'
                          : '#4A7045',
                      }}
                    />
                  </div>
                  <span className="text-[10px] mono shrink-0" style={{ color: '#7a7a7a' }}>
                    한도: {(40000).toLocaleString()}건/일
                  </span>
                </div>
                <div className="text-[9px] mono mt-1" style={{ color: '#4a4a4a' }}>
                  {services?.dart?.todayCount !== undefined
                    ? `오늘 공시 ${services.dart.todayCount.toLocaleString()}건 · `
                    : ''}
                  일 40,000건 한도 · 어닝 조회 1회 ≈ 3건(3보고서유형)
                </div>
              </>
            )}
          </div>

          {/* 시스템 정보 */}
          <div className="px-5 py-2 border-b" style={{ borderColor: '#1f1f1f', color: '#5a5a5a' }}>
            <span className="text-[9px] mono uppercase tracking-[0.25em]">Runtime</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              {
                label: 'Node.js',
                value: metricsLoading ? '···' : metrics?.system.nodeVersion ?? '-',
                color: '#4F7E7C',
              },
              {
                label: 'Region',
                value: metricsLoading ? '···' : metrics?.system.region ?? '-',
                color: '#a8a49a',
              },
              {
                label: 'Heap Used',
                value: metricsLoading ? '···' : metrics ? `${metrics.system.memory.heapUsedMB}MB` : '-',
                color: metrics && !metricsLoading
                  ? metrics.system.memory.heapUsedMB / metrics.system.memory.heapTotalMB > 0.8
                    ? '#A63D33'
                    : metrics.system.memory.heapUsedMB / metrics.system.memory.heapTotalMB > 0.6
                    ? '#C89650'
                    : '#4A7045'
                  : '#5a5a5a',
              },
              {
                label: 'Heap Total',
                value: metricsLoading ? '···' : metrics ? `${metrics.system.memory.heapTotalMB}MB` : '-',
                color: '#7a7a7a',
              },
            ].map((item, i) => (
              <div
                key={item.label}
                className={`p-4 md:p-5 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b md:border-b-0' : ''} md:[&:not(:last-child)]:border-r`}
                style={{ borderColor: '#1a1a1a' }}
              >
                <div className="text-[9px] mono uppercase tracking-[0.2em] mb-1.5" style={{ color: '#5a5a5a' }}>{item.label}</div>
                <div className="text-base md:text-lg font-light mono" style={{ color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          {metricsError && (
            <div className="px-5 py-3 border-t text-[11px] mono" style={{ borderColor: '#1f1f1f', color: '#A63D33' }}>
              ⚠ 메트릭 로드 실패: {metricsError}
            </div>
          )}
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
