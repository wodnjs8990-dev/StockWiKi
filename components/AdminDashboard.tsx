'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, Sun, Moon } from 'lucide-react';

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

// ── 테마 정의
const DARK_THEME = {
  bg: '#0f0f0f',
  bgCard: '#141414',
  bgHeader: 'rgba(15,15,15,0.95)',
  bgSection: '#0f0f0f',
  bgInput: 'transparent',
  bgHover: 'rgba(255,255,255,0.05)',
  bgSkeleton: '#1f1f1f',
  bgBarTrack: '#1f1f1f',
  text: '#d4d0c4',
  textPrimary: '#e8e4d6',
  textMuted: '#a8a49a',
  textFaint: '#7a7a7a',
  textDimmer: '#5a5a5a',
  textDimmest: '#4a4a4a',
  border: '#2a2a2a',
  borderSoft: '#1f1f1f',
  borderSofter: '#1a1a1a',
  accent: '#C89650',
  green: '#4A7045',
  red: '#A63D33',
  teal: '#4F7E7C',
  colorScheme: 'dark' as const,
};

const LIGHT_THEME = {
  bg: '#f5f2eb',
  bgCard: '#fffef9',
  bgHeader: 'rgba(245,242,235,0.95)',
  bgSection: '#ece8df',
  bgInput: 'transparent',
  bgHover: 'rgba(0,0,0,0.04)',
  bgSkeleton: '#e0ddd4',
  bgBarTrack: '#e0ddd4',
  text: '#2a2622',
  textPrimary: '#1a1a1a',
  textMuted: '#5a5550',
  textFaint: '#888380',
  textDimmer: '#aaa8a4',
  textDimmest: '#c0bdb8',
  border: '#d8d4c8',
  borderSoft: '#e0ddd4',
  borderSofter: '#e8e4dc',
  accent: '#a07030',
  green: '#3a5c36',
  red: '#8b2a20',
  teal: '#3a6460',
  colorScheme: 'light' as const,
};

type Theme = Omit<typeof DARK_THEME, 'colorScheme'> & { colorScheme: 'dark' | 'light' };

function StatusDot({ ok, loading }: { ok?: boolean; loading: boolean }) {
  if (loading) return <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#3a3a3a' }} />;
  return <span className="w-2.5 h-2.5 rounded-full" style={{ background: ok ? '#4A7045' : '#A63D33' }} />;
}

function LatencyBadge({ ms, T }: { ms: number; T: Theme }) {
  const color = ms < 300 ? T.green : ms < 800 ? T.accent : T.red;
  return (
    <span className="text-[12px] mono px-2 py-0.5" style={{ color, border: `1px solid ${color}40`, background: `${color}10` }}>
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
  const [dark, setDark] = useState(true);
  const router = useRouter();

  const T = dark ? DARK_THEME : LIGHT_THEME;

  // 모니터링 상태
  const [metrics, setMetrics] = useState<Metrics>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  // 로컬스토리지 테마 유지
  useEffect(() => {
    const saved = localStorage.getItem('admin_theme');
    if (saved === 'light') setDark(false);
  }, []);

  const toggleTheme = () => {
    setDark(d => {
      localStorage.setItem('admin_theme', d ? 'light' : 'dark');
      return !d;
    });
  };

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

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const toggleMaintenance = async () => {
    startTransition(async () => {
      const next = !config.maintenanceMode;
      try {
        const res = await fetch('/api/admin/toggle-maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maintenanceMode: next, maintenanceMessage: message, maintenanceEndTime: endTime }),
        });
        if (res.ok) {
          setConfig({ ...config, maintenanceMode: next });
          showToast(next ? '점검 모드 활성화됨' : '점검 모드 해제됨');
        } else showToast('설정 저장 실패', 'err');
      } catch { showToast('네트워크 오류', 'err'); }
    });
  };

  const saveMaintenanceMeta = async () => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/toggle-maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maintenanceMode: config.maintenanceMode, maintenanceMessage: message, maintenanceEndTime: endTime }),
        });
        if (res.ok) showToast('메시지 저장됨');
        else showToast('저장 실패', 'err');
      } catch { showToast('네트워크 오류', 'err'); }
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
        } else showToast('저장 실패', 'err');
      } catch { showToast('네트워크 오류', 'err'); }
    });
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin-stk-2026/login');
    router.refresh();
  };

  const services = metrics?.services;

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text }}>
      {/* 헤더 */}
      <header className="border-b sticky top-0 z-20" style={{ borderColor: T.border, background: T.bgHeader, backdropFilter: 'blur(8px)' }}>
        <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-light" style={{ color: T.textPrimary }}>
              Stock<span style={{ color: T.accent, fontWeight: 500 }}>WiKi</span>
            </span>
            <span className="text-[13px] mono uppercase tracking-[0.3em] px-2 py-0.5 border" style={{ borderColor: T.accent, color: T.accent }}>
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* 테마 토글 */}
            <button
              onClick={toggleTheme}
              className="p-2 border transition-all hover:opacity-70"
              style={{ borderColor: T.border, color: T.textFaint }}
              title={dark ? '라이트 모드' : '다크 모드'}
            >
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <Link href="/" target="_blank"
              className="text-[13px] mono uppercase tracking-[0.2em] px-3 py-1.5 border transition-all hover:opacity-70"
              style={{ borderColor: T.border, color: T.textMuted }}>
              사이트 보기 ↗
            </Link>
            <button onClick={logout}
              className="text-[13px] mono uppercase tracking-[0.2em] px-3 py-1.5 border transition-all hover:opacity-70"
              style={{ borderColor: T.border, color: T.textMuted }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-4 md:px-8 py-8">
        {/* 섹션 라벨 */}
        <div className="mb-8">
          <div className="text-[13px] mono uppercase tracking-[0.3em]" style={{ color: T.textFaint }}>§ Dashboard · Control Panel</div>
        </div>

        {/* 사이트 상태 카드 */}
        <section className="mb-6 border" style={{ borderColor: T.border, background: T.bgCard }}>
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: T.border, background: T.bgSection }}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: config.maintenanceMode ? T.accent : T.green }} />
              <span className="text-[13px] mono uppercase tracking-[0.2em]" style={{ color: T.textMuted }}>Site Status</span>
            </div>
            <span className="text-[13px] mono uppercase tracking-[0.2em]" style={{ color: config.maintenanceMode ? T.accent : T.green }}>
              {config.maintenanceMode ? '● Maintenance' : '● Live'}
            </span>
          </div>

          <div className="p-5 md:p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="text-lg md:text-xl mb-1.5" style={{ color: T.textPrimary }}>
                  {config.maintenanceMode ? '점검 모드 활성화됨' : '서비스 정상 운영 중'}
                </div>
                <div className="text-sm" style={{ color: T.textFaint }}>
                  {config.maintenanceMode
                    ? '모든 방문자가 점검 화면을 보게 됩니다'
                    : '버튼을 클릭해 점검 모드로 전환할 수 있습니다'}
                </div>
              </div>
              <button
                onClick={toggleMaintenance}
                disabled={isPending}
                className="shrink-0 px-4 py-2 text-sm mono uppercase tracking-[0.2em] border transition-all"
                style={{
                  borderColor: config.maintenanceMode ? T.green : T.accent,
                  background: config.maintenanceMode ? T.green : T.accent,
                  color: '#0a0a0a',
                  opacity: isPending ? 0.5 : 1,
                  cursor: isPending ? 'wait' : 'pointer',
                }}>
                {isPending ? '처리 중...' : config.maintenanceMode ? '점검 해제' : '점검 시작'}
              </button>
            </div>

            <div className="space-y-4 pt-5 border-t" style={{ borderColor: T.border }}>
              <div>
                <label className="block">
                  <div className="text-[13px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textFaint }}>점검 메시지</div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    className="w-full border px-3 py-2 text-sm outline-none resize-none"
                    style={{ borderColor: T.border, color: T.textPrimary, background: T.bgInput, colorScheme: T.colorScheme }}
                    placeholder="시스템 점검 중입니다..."
                  />
                </label>
              </div>
              <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
                <label className="block">
                  <div className="text-[13px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textFaint }}>예상 종료 시각 (선택)</div>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border px-3 py-2 text-sm outline-none mono"
                    style={{ borderColor: T.border, color: T.textPrimary, background: T.bgInput, colorScheme: T.colorScheme }}
                  />
                </label>
                <button
                  onClick={saveMaintenanceMeta}
                  disabled={isPending}
                  className="px-4 py-2 text-sm mono uppercase tracking-[0.2em] border transition-all hover:opacity-70"
                  style={{ borderColor: T.border, color: T.textMuted, background: T.bgHover }}>
                  메시지 저장
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 기능 토글 */}
        <section className="mb-6 border" style={{ borderColor: T.border, background: T.bgCard }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: T.border, background: T.bgSection }}>
            <span className="text-[13px] mono uppercase tracking-[0.2em]" style={{ color: T.textMuted }}>Feature Toggles</span>
          </div>
          <div>
            {[
              { key: 'glossary' as const, label: '금융 사전', desc: '용어 사전 전체 탭' },
              { key: 'calculator' as const, label: '계산기', desc: '29개 금융 계산기 탭' },
              { key: 'commandK' as const, label: '빠른 검색', desc: 'Cmd+K 빠른 검색 팝업' },
              { key: 'events' as const, label: '이벤트', desc: 'FOMC·미국 어닝·선물만기 달력' },
            ].map((f, i, arr) => (
              <div key={f.key} className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: i === arr.length - 1 ? 'transparent' : T.borderSoft }}>
                <div>
                  <div className="text-base mb-0.5" style={{ color: T.textPrimary }}>{f.label}</div>
                  <div className="text-sm" style={{ color: T.textFaint }}>{f.desc}</div>
                </div>
                <button
                  onClick={() => toggleFeature(f.key)}
                  disabled={isPending}
                  className="relative w-12 h-6 transition-all"
                  style={{ background: config.features[f.key] ? T.green : T.border, opacity: isPending ? 0.5 : 1 }}
                  aria-label={`Toggle ${f.label}`}>
                  <span className="absolute top-0.5 w-5 h-5 transition-all"
                    style={{ left: config.features[f.key] ? 'calc(100% - 22px)' : '2px', background: T.textPrimary }} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 시스템 모니터링 */}
        <section className="mb-6 border" style={{ borderColor: T.border, background: T.bgCard }}>
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: T.border, background: T.bgSection }}>
            <span className="text-[13px] mono uppercase tracking-[0.2em]" style={{ color: T.textMuted }}>System Monitor</span>
            <div className="flex items-center gap-3">
              {lastChecked && (
                <span className="text-[12px] mono" style={{ color: T.textDimmer }}>마지막 체크 {lastChecked}</span>
              )}
              <button onClick={fetchMetrics} disabled={metricsLoading}
                className="flex items-center gap-1.5 text-[13px] mono uppercase tracking-[0.2em] px-2.5 py-1 border transition-all hover:opacity-70"
                style={{ borderColor: T.border, color: T.textFaint, opacity: metricsLoading ? 0.5 : 1 }}>
                <RefreshCw size={10} className={metricsLoading ? 'animate-spin' : ''} />
                새로고침
              </button>
            </div>
          </div>

          {/* API 서비스 상태 */}
          <div className="border-b" style={{ borderColor: T.borderSoft }}>
            <div className="px-5 py-2.5" style={{ color: T.textDimmer }}>
              <span className="text-[12px] mono uppercase tracking-[0.25em]">API Services</span>
            </div>
            {([
              { key: 'finnhub' as const, label: 'Finnhub', desc: '주식 시세 · 어닝 데이터' },
              { key: 'edgeConfig' as const, label: 'Edge Config', desc: 'Vercel 실시간 설정' },
              { key: 'eventsApi' as const, label: 'Events API', desc: '어닝 캘린더 엔드포인트' },
              { key: 'yahooFinance' as const, label: 'Yahoo Finance', desc: '미국 어닝 · EPS 예상' },
              { key: 'dart' as const, label: 'DART', desc: '국내 공시 · 분기실적' },
            ] as const).map((svc, i, arr) => {
              const s = services?.[svc.key];
              const detail = (() => {
                if (!s || s.error) return null;
                if (svc.key === 'eventsApi' && s.earningsCount !== undefined) return `${s.earningsCount}개 종목`;
                if (svc.key === 'yahooFinance' && s.earningsDate) return `AAPL 다음 어닝: ${s.earningsDate}`;
                if (svc.key === 'dart' && s.todayCount !== undefined) return `공시 ${s.todayCount.toLocaleString()}건 조회됨`;
                return null;
              })();
              return (
                <div key={svc.key} className="flex items-center justify-between px-5 py-3.5 border-b"
                  style={{ borderColor: i === arr.length - 1 ? 'transparent' : T.borderSofter }}>
                  <div className="flex items-center gap-3">
                    <StatusDot ok={s?.ok} loading={metricsLoading} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: T.textPrimary }}>{svc.label}</div>
                      <div className="text-[12px] mono mt-0.5" style={{ color: T.textDimmer }}>
                        {s?.error
                          ? <span style={{ color: T.red }}>{s.error}</span>
                          : detail
                          ? <>{svc.desc} · <span style={{ color: T.textMuted }}>{detail}</span></>
                          : svc.desc}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s && !metricsLoading && <LatencyBadge ms={s.latencyMs} T={T} />}
                    {!metricsLoading && s && (
                      <span className="text-[13px] mono" style={{ color: s.ok ? T.green : T.red }}>
                        {s.ok ? '● 정상' : '● 오류'}
                      </span>
                    )}
                    {metricsLoading && (
                      <span className="text-[13px] mono" style={{ color: T.textDimmer }}>확인 중</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DART 할당량 */}
          <div className="px-5 py-4 border-b" style={{ borderColor: T.borderSofter }}>
            <div className="text-[12px] mono uppercase tracking-[0.25em] mb-2.5" style={{ color: T.textDimmer }}>DART 일일 할당량</div>
            {metricsLoading ? (
              <div className="h-1.5 rounded-sm animate-pulse" style={{ background: T.bgSkeleton }} />
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 rounded-sm overflow-hidden" style={{ background: T.bgBarTrack }}>
                    <div className="h-full rounded-sm transition-all duration-500"
                      style={{
                        width: `${Math.min(((services?.dart?.todayCount ?? 0) / 40000) * 100, 100).toFixed(2)}%`,
                        minWidth: '2px',
                        background: (services?.dart?.todayCount ?? 0) > 35000 ? T.red
                          : (services?.dart?.todayCount ?? 0) > 20000 ? T.accent : T.green,
                      }} />
                  </div>
                  <span className="text-[13px] mono shrink-0" style={{ color: T.textFaint }}>
                    한도: {(40000).toLocaleString()}건/일
                  </span>
                </div>
                <div className="text-[12px] mono mt-1.5" style={{ color: T.textDimmer }}>
                  {services?.dart?.todayCount !== undefined ? `오늘 공시 ${services.dart.todayCount.toLocaleString()}건 · ` : ''}
                  일 40,000건 한도 · 어닝 조회 1회 ≈ 3건(3보고서유형)
                </div>
              </>
            )}
          </div>

          {/* Runtime */}
          <div className="px-5 py-2.5 border-b" style={{ borderColor: T.borderSoft, color: T.textDimmer }}>
            <span className="text-[12px] mono uppercase tracking-[0.25em]">Runtime</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { label: 'Node.js', value: metricsLoading ? '···' : metrics?.system.nodeVersion ?? '-', color: T.teal },
              { label: 'Region', value: metricsLoading ? '···' : metrics?.system.region ?? '-', color: T.textMuted },
              {
                label: 'Heap Used',
                value: metricsLoading ? '···' : metrics ? `${metrics.system.memory.heapUsedMB}MB` : '-',
                color: metrics && !metricsLoading
                  ? metrics.system.memory.heapUsedMB / metrics.system.memory.heapTotalMB > 0.8 ? T.red
                    : metrics.system.memory.heapUsedMB / metrics.system.memory.heapTotalMB > 0.6 ? T.accent : T.green
                  : T.textDimmer,
              },
              { label: 'Heap Total', value: metricsLoading ? '···' : metrics ? `${metrics.system.memory.heapTotalMB}MB` : '-', color: T.textFaint },
            ].map((item, i) => (
              <div key={item.label}
                className={`p-4 md:p-5 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b md:border-b-0' : ''} md:[&:not(:last-child)]:border-r`}
                style={{ borderColor: T.borderSofter }}>
                <div className="text-[12px] mono uppercase tracking-[0.2em] mb-1.5" style={{ color: T.textDimmer }}>{item.label}</div>
                <div className="text-lg md:text-xl font-light mono" style={{ color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          {metricsError && (
            <div className="px-5 py-3 border-t text-[13px] mono" style={{ borderColor: T.borderSoft, color: T.red }}>
              ⚠ 메트릭 로드 실패: {metricsError}
            </div>
          )}
        </section>

        {/* 통계 */}
        <section className="mb-6 border" style={{ borderColor: T.border, background: T.bgCard }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: T.border, background: T.bgSection }}>
            <span className="text-[13px] mono uppercase tracking-[0.2em]" style={{ color: T.textMuted }}>Content Statistics</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { label: 'Terms', value: stats.terms, color: T.accent },
              { label: 'Categories', value: stats.categories, color: T.red },
              { label: 'Calculators', value: stats.calcs, color: T.green },
              { label: 'Calc Groups', value: stats.calcGroups, color: T.teal },
            ].map((s, i) => (
              <div key={s.label}
                className={`p-5 md:p-6 ${i % 2 === 1 ? '' : 'border-r'} ${i < 2 ? 'border-b md:border-b-0' : ''} md:[&:not(:last-child)]:border-r`}
                style={{ borderColor: T.borderSoft }}>
                <div className="text-[13px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textFaint }}>{s.label}</div>
                <div className="text-3xl md:text-4xl font-light tracking-tight" style={{ color: s.color }}>
                  {String(s.value).padStart(3, '0')}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 배포 정보 */}
        <section className="border" style={{ borderColor: T.border, background: T.bgCard }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: T.border, background: T.bgSection }}>
            <span className="text-[13px] mono uppercase tracking-[0.2em]" style={{ color: T.textMuted }}>Deployment</span>
          </div>
          <div className="p-5 grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[13px] mono uppercase tracking-[0.2em] mb-1.5" style={{ color: T.textFaint }}>Domain</div>
              <div style={{ color: T.textPrimary }}>stockwiki.kr</div>
            </div>
            <div>
              <div className="text-[13px] mono uppercase tracking-[0.2em] mb-1.5" style={{ color: T.textFaint }}>Last Loaded</div>
              <div className="mono" style={{ color: T.textPrimary }}>
                {new Date().toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'medium' })}
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-10 pb-6 text-center">
          <div className="text-[13px] mono uppercase tracking-[0.3em]" style={{ color: T.textDimmer }}>
            Restricted Area · Designed by Ones
          </div>
        </footer>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 border text-sm mono uppercase tracking-[0.15em] z-30"
          style={{
            background: T.bgCard,
            borderColor: toast.kind === 'ok' ? T.green : T.red,
            color: toast.kind === 'ok' ? T.green : T.red,
          }}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
