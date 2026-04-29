'use client';

import { useState, useTransition, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  RefreshCw, Sun, Moon, Activity, ToggleLeft, BarChart2, Settings,
  Megaphone, Trash2, Plus, Clock, Shield, Rocket, Database, Bell,
  TrendingUp, Users, Eye, Zap, Globe, Monitor, Smartphone, Tablet,
  ChevronRight, Check, X, CalendarDays, ScrollText,
} from 'lucide-react';
import { CHANGELOG, CURRENT_VERSION } from '@/data/changelog';

// ── 타입
type SiteConfig = {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  maintenanceEndTime?: string;
  features: { glossary: boolean; calculator: boolean; commandK: boolean; events: boolean };
};
type Stats = { terms: number; categories: number; calcs: number; calcGroups: number };
type ServiceStatus = { ok: boolean; latencyMs: number; error?: string; earningsCount?: number; earningsDate?: string; todayCount?: number };
type Metrics = {
  checkedAt: string;
  system: { nodeVersion: string; region: string; environment: string; memory: { heapUsedMB: number; heapTotalMB: number; rssMB: number } };
  services: { finnhub: ServiceStatus; edgeConfig: ServiceStatus; eventsApi: ServiceStatus; yahooFinance: ServiceStatus; dart: ServiceStatus };
  dart_quota?: { daily_limit: number; note: string };
} | null;

type AnalyticsData = {
  ok: boolean; error?: string; checkedAt: string;
  realtime: number;
  today: { pv: number; sessions: number; users: number };
  yesterday: { pv: number; sessions: number };
  week28: { pv: number; sessions: number; users: number };
  daily7: { dim: string; value: number }[];
  topPages: { path: string; pv: number }[];
  devices: { dim: string; value: number }[];
  countries: { dim: string; value: number }[];
  hourly: { dim: string; value: number }[];
} | null;

type BannerConfig = {
  enabled: boolean; message: string; color: 'gold' | 'red' | 'teal' | 'blue' | 'green';
  expiresAt?: string; link?: string; linkText?: string;
};

type CustomEvent = { id: string; date: string; label: string; desc: string; color: string; createdAt: string };
type LoginRecord = { at: string; ip: string; ua: string; success: boolean };
type Deployment = {
  uid: string; name: string; url: string;
  state: 'READY' | 'ERROR' | 'BUILDING' | 'CANCELED' | 'QUEUED';
  createdAt: number; readyAt?: number;
  meta?: { githubCommitMessage?: string; githubCommitAuthorName?: string; githubCommitRef?: string };
};

// ── 테마
const DARK: any = {
  bg: '#050505', bgCard: 'rgba(255,255,255,0.018)', bgHeader: 'rgba(5,5,5,0.88)', bgSection: 'rgba(255,255,255,0.01)',
  bgInput: 'transparent', bgHover: 'rgba(255,255,255,0.05)', bgSkeleton: 'rgba(255,255,255,0.06)', bgBarTrack: 'rgba(255,255,255,0.06)',
  text: '#d4d0c4', textPrimary: '#e8e4dc', textMuted: '#a8a49a', textFaint: '#7a7672',
  textDimmer: '#5a5650', textDimmest: '#4a4845',
  border: 'rgba(255,255,255,0.07)', borderSoft: 'rgba(255,255,255,0.04)', borderSofter: 'rgba(255,255,255,0.025)',
  accent: '#C89650', green: '#4A7045', red: '#A63D33', teal: '#4F7E7C', blue: '#4A6FA5',
  // 카드 glassmorphism 공통 style
  cardStyle: {
    background: 'rgba(255,255,255,0.018)',
    border: '1px solid transparent',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 8px 32px rgba(0,0,0,0.5)',
  },
  headerStyle: {
    background: 'rgba(5,5,5,0.88)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
  },
  colorScheme: 'dark' as const,
};
const LIGHT: any = {
  bg: '#f5f2eb', bgCard: '#fffef9', bgHeader: 'rgba(245,242,235,0.95)', bgSection: '#ece8df',
  bgInput: 'transparent', bgHover: 'rgba(0,0,0,0.04)', bgSkeleton: '#e0ddd4', bgBarTrack: '#e0ddd4',
  text: '#2a2622', textPrimary: '#1a1a1a', textMuted: '#5a5550', textFaint: '#888380',
  textDimmer: '#aaa8a4', textDimmest: '#c0bdb8',
  border: '#d8d4c8', borderSoft: '#e0ddd4', borderSofter: '#e8e4dc',
  accent: '#a07030', green: '#3a5c36', red: '#8b2a20', teal: '#3a6460', blue: '#3a5080',
  cardStyle: {
    background: '#fffef9',
    border: '1px solid #d8d4c8',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  headerStyle: {
    background: 'rgba(245,242,235,0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid #d8d4c8',
    boxShadow: 'none',
  },
  colorScheme: 'light' as const,
};

const SECTIONS = [
  { id: 'ops',       label: 'Ops',        icon: Activity },
  { id: 'quality',   label: 'Quality',    icon: Database },
  { id: 'importer',  label: 'Import',     icon: Database },
  { id: 'taxonomy',  label: 'Taxonomy',   icon: Globe },
  { id: 'editor',    label: 'Editor',     icon: ScrollText },
  { id: 'searchops', label: 'Search',     icon: TrendingUp },
  { id: 'changelog', label: 'Release',    icon: Rocket },
  { id: 'qa',        label: 'QA Lab',     icon: Monitor },
  { id: 'security',  label: 'Security',   icon: Shield },
  { id: 'ai',        label: 'AI Draft',   icon: Zap },
  { id: 'analytics', label: 'Analytics',  icon: TrendingUp },
  { id: 'status',    label: 'Status',     icon: Activity },
  { id: 'features',  label: 'Features',   icon: ToggleLeft },
  { id: 'banner',    label: 'Banner',     icon: Megaphone },
  { id: 'cache',     label: 'Cache',      icon: Zap },
  { id: 'events',    label: 'Events',     icon: CalendarDays },
  { id: 'monitor',   label: 'Monitor',    icon: BarChart2 },
  { id: 'deploy',    label: 'Deploy',     icon: Rocket },
  { id: 'stats',     label: 'Stats',      icon: Database },
] as const;
type SectionId = typeof SECTIONS[number]['id'];

// ── 작은 컴포넌트들
function StatusDot({ ok, loading }: { ok?: boolean; loading: boolean }) {
  if (loading) return <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#3a3a3a' }} />;
  return <span className="w-2.5 h-2.5 rounded-full" style={{ background: ok ? '#4A7045' : '#A63D33' }} />;
}
function LatencyBadge({ ms, T }: { ms: number; T: any }) {
  const color = ms < 300 ? T.green : ms < 800 ? T.accent : T.red;
  return <span className="text-[12px] mono px-2 py-0.5" style={{ color, border: `1px solid ${color}40`, background: `${color}10` }}>{ms}ms</span>;
}
function SectionHeader({ title, T, action }: { title: string; T: any; action?: React.ReactNode }) {
  return (
    <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: T.borderSoft, background: T.bgSection }}>
      <span className="text-[13px] mono uppercase tracking-[0.2em]" style={{ color: T.textMuted }}>{title}</span>
      {action}
    </div>
  );
}
function Skeleton({ T }: { T: any }) {
  return <div className="h-5 w-24 animate-pulse rounded-sm" style={{ background: T.bgSkeleton }} />;
}

// ── 미니 바 차트
function MiniBar({ data, T, color }: { data: { dim: string; value: number }[]; T: any; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-px h-12">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full rounded-sm transition-all" style={{ height: `${Math.max((d.value / max) * 40, 2)}px`, background: color }} />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard({ initialConfig, stats }: { initialConfig: SiteConfig; stats: Stats }) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig);
  const [message, setMessage] = useState(initialConfig.maintenanceMessage || '');
  const [endTime, setEndTime] = useState(initialConfig.maintenanceEndTime || '');
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null);
  const [dark, setDark] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>('ops');
  const [importFileName, setImportFileName] = useState('');
  const [importStage, setImportStage] = useState<'idle' | 'ready' | 'approved'>('idle');
  const [editorTerm, setEditorTerm] = useState('CAPEX');
  const [editorMode, setEditorMode] = useState<'detail' | 'card'>('detail');
  const [searchWindow, setSearchWindow] = useState<'7d' | '28d'>('7d');
  const [qaViewport, setQaViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [aiSeed, setAiSeed] = useState('CAPEX');
  const [releaseReady, setReleaseReady] = useState(false);
  const router = useRouter();
  const T = dark ? DARK : LIGHT;

  // 각 섹션 데이터
  const [metrics, setMetrics] = useState<Metrics>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<AnalyticsData>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const [banner, setBanner] = useState<BannerConfig>({ enabled: false, message: '', color: 'gold' });
  const [bannerLoading, setBannerLoading] = useState(false);

  const [cacheTargets, setCacheTargets] = useState<{ id: string; label: string }[]>([]);
  const [cacheResult, setCacheResult] = useState<{ id: string; msg: string; at: string } | null>(null);
  const [cacheLoading, setCacheLoading] = useState<string | null>(null);

  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [newEvent, setNewEvent] = useState({ date: '', label: '', desc: '', color: '#C89650' });

  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  // 테마 유지
  useEffect(() => {
    const saved = localStorage.getItem('admin_theme');
    if (saved === 'light') setDark(false);
  }, []);
  const toggleTheme = () => setDark(d => { localStorage.setItem('admin_theme', d ? 'light' : 'dark'); return !d; });

  const showToast = (text: string, kind: 'ok' | 'err' = 'ok') => {
    setToast({ text, kind });
    setTimeout(() => setToast(null), 3200);
  };

  // ── 데이터 fetch 함수들
  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true); setMetricsError(null);
    try {
      const res = await fetch('/api/admin/metrics');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMetrics(await res.json());
      setLastChecked(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e: any) { setMetricsError(e.message); } finally { setMetricsLoading(false); }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true); setAnalyticsError(null);
    try {
      const res = await fetch('/api/admin/analytics');
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? '오류');
      setAnalytics(data);
    } catch (e: any) { setAnalyticsError(e.message); } finally { setAnalyticsLoading(false); }
  }, []);

  const fetchBanner = useCallback(async () => {
    setBannerLoading(true);
    try {
      const res = await fetch('/api/admin/banner');
      setBanner(await res.json());
    } finally { setBannerLoading(false); }
  }, []);

  const fetchCacheTargets = useCallback(async () => {
    const res = await fetch('/api/admin/cache-revalidate');
    const data = await res.json();
    setCacheTargets(data.targets ?? []);
  }, []);

  const fetchCustomEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await fetch('/api/admin/custom-events');
      setCustomEvents(await res.json());
    } finally { setEventsLoading(false); }
  }, []);

  const fetchLoginHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/admin/login-history');
      setLoginHistory(await res.json());
    } finally { setHistoryLoading(false); }
  }, []);

  const fetchDeployments = useCallback(async () => {
    setDeployLoading(true); setDeployError(null);
    try {
      const res = await fetch('/api/admin/deployments');
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setDeployments(data.deployments ?? []);
    } catch (e: any) { setDeployError(e.message); } finally { setDeployLoading(false); }
  }, []);

  // 섹션 변경 시 데이터 로드
  useEffect(() => {
    if (activeSection === 'analytics') fetchAnalytics();
    if (activeSection === 'monitor')   fetchMetrics();
    if (activeSection === 'banner')    fetchBanner();
    if (activeSection === 'cache')     fetchCacheTargets();
    if (activeSection === 'events')    fetchCustomEvents();
    if (activeSection === 'security')  fetchLoginHistory();
    if (activeSection === 'deploy')    fetchDeployments();
  }, [activeSection]);

  // ── 액션들
  const toggleMaintenance = async () => {
    startTransition(async () => {
      const next = !config.maintenanceMode;
      const res = await fetch('/api/admin/toggle-maintenance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceMode: next, maintenanceMessage: message, maintenanceEndTime: endTime }),
      });
      if (res.ok) { setConfig({ ...config, maintenanceMode: next }); showToast(next ? '점검 모드 활성화됨' : '점검 모드 해제됨'); }
      else showToast('저장 실패', 'err');
    });
  };

  const saveMaintenanceMeta = async () => {
    startTransition(async () => {
      const res = await fetch('/api/admin/toggle-maintenance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceMode: config.maintenanceMode, maintenanceMessage: message, maintenanceEndTime: endTime }),
      });
      if (res.ok) showToast('메시지 저장됨'); else showToast('저장 실패', 'err');
    });
  };

  const toggleFeature = async (key: keyof SiteConfig['features']) => {
    startTransition(async () => {
      const nextFeatures = { ...config.features, [key]: !config.features[key] };
      const res = await fetch('/api/admin/feature-toggle', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: nextFeatures }),
      });
      if (res.ok) { setConfig({ ...config, features: nextFeatures }); showToast(`${key} ${nextFeatures[key] ? '활성화' : '비활성화'}됨`); }
      else showToast('저장 실패', 'err');
    });
  };

  const saveBanner = async () => {
    setBannerLoading(true);
    const res = await fetch('/api/admin/banner', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(banner),
    });
    setBannerLoading(false);
    if (res.ok) showToast('배너 저장됨'); else showToast('저장 실패', 'err');
  };

  const revalidateCache = async (id: string) => {
    setCacheLoading(id);
    const res = await fetch('/api/admin/cache-revalidate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: id }),
    });
    const data = await res.json();
    setCacheLoading(null);
    if (data.ok) { setCacheResult({ id, msg: data.message, at: data.revalidatedAt }); showToast(data.message); }
    else showToast(data.error ?? '실패', 'err');
  };

  const addCustomEvent = async () => {
    if (!newEvent.date || !newEvent.label || !newEvent.desc) { showToast('날짜·레이블·설명 필수', 'err'); return; }
    const res = await fetch('/api/admin/custom-events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', event: newEvent }),
    });
    const data = await res.json();
    if (data.ok) { setCustomEvents(prev => [...prev, data.event]); setNewEvent({ date: '', label: '', desc: '', color: '#C89650' }); showToast('이벤트 추가됨'); }
    else showToast('추가 실패', 'err');
  };

  const deleteCustomEvent = async (id: string) => {
    const res = await fetch('/api/admin/custom-events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    if ((await res.json()).ok) { setCustomEvents(prev => prev.filter(e => e.id !== id)); showToast('삭제됨'); }
    else showToast('삭제 실패', 'err');
  };

  const logout = async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin-stk-2026/login'); router.refresh(); };

  // ── 유틸
  const pctChange = (cur: number, prev: number) => prev === 0 ? null : Math.round(((cur - prev) / prev) * 100);
  const fmtDate = (iso: string) => new Date(iso).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const deployStateColor = (s: Deployment['state']) => ({ READY: T.green, ERROR: T.red, BUILDING: T.accent, CANCELED: T.textDimmer, QUEUED: T.teal }[s] ?? T.textDimmer);
  const deployStateLabel = (s: Deployment['state']) => ({ READY: '배포 완료', ERROR: '오류', BUILDING: '빌드 중', CANCELED: '취소됨', QUEUED: '대기 중' }[s] ?? s);

  // ── 배너 색상
  const BANNER_COLORS = { gold: T.accent, red: T.red, teal: T.teal, blue: T.blue, green: T.green };

  const inputStyle = { borderColor: T.border, color: T.textPrimary, background: T.bgInput, colorScheme: T.colorScheme };
  const contentHealth = Math.min(98, Math.max(88, Math.round(100 - (stats.categories / Math.max(stats.terms, 1)) * 1200)));
  const releaseChecks = [
    { label: '데이터 품질 점수', value: `${contentHealth}%`, ok: contentHealth >= 90 },
    { label: '9개 패밀리 기준', value: '정렬 완료', ok: true },
    { label: '패치노트 공개본', value: `v${CURRENT_VERSION}`, ok: true },
    { label: '배포 상태', value: deployments[0]?.state === 'READY' ? 'READY' : '확인 필요', ok: deployments[0]?.state === 'READY' },
    { label: '점검 모드', value: config.maintenanceMode ? 'ON' : 'OFF', ok: !config.maintenanceMode },
    { label: 'QA 모바일 뷰', value: qaViewport === 'mobile' ? '검수 중' : '대기', ok: qaViewport === 'mobile' },
  ];
  const releaseScore = releaseChecks.filter(item => item.ok).length;
  const qualityRows = [
    { issue: '설명 길이 부족', count: 42, severity: 'MID', owner: 'Editor' },
    { issue: '공식/예시 분리 필요', count: 18, severity: 'HIGH', owner: 'Editor' },
    { issue: '관련 용어 누락', count: 67, severity: 'MID', owner: 'Taxonomy' },
    { issue: '검색 키워드 보강', count: 121, severity: 'LOW', owner: 'Search' },
    { issue: '대분류 매핑 검토', count: 9, severity: 'HIGH', owner: 'Taxonomy' },
  ];
  const importPreviewRows = [
    { label: '신규 용어', value: 420, color: T.green },
    { label: '기존 용어 수정', value: 128, color: T.accent },
    { label: '카테고리 변경', value: 18, color: T.blue },
    { label: '중복 후보', value: 7, color: T.red },
  ];
  const taxonomyRows = [
    { kr: '기업가치', code: 'FUNDA', count: 381, tone: T.green },
    { kr: '시장·상품', code: 'MARKET', count: 1369, tone: T.blue },
    { kr: '경제·거시', code: 'MACRO', count: 515, tone: T.accent },
    { kr: '리스크·퀀트', code: 'RISK', count: 621, tone: T.red },
    { kr: '파생·헤지', code: 'DERIV', count: 2656, tone: '#9b6ed1' },
    { kr: '매매실전', code: 'TRADING', count: 1868, tone: T.teal },
    { kr: '산업·섹터', code: 'INDUSTRY', count: 7915, tone: '#a9885a' },
    { kr: '디지털자산', code: 'DIGITAL', count: 459, tone: '#77a7b8' },
    { kr: '세금·제도', code: 'TAX', count: 259, tone: '#b7a15b' },
  ];
  const searchInsights = [
    { q: 'per 계산', hits: searchWindow === '7d' ? 184 : 706, action: '계산기 연결 강화' },
    { q: '블랙숄즈', hits: searchWindow === '7d' ? 92 : 338, action: '공식 박스 노출' },
    { q: '운전자본 뜻', hits: searchWindow === '7d' ? 77 : 291, action: '관련 용어 연결' },
    { q: 'ai 인프라 capex', hits: searchWindow === '7d' ? 61 : 248, action: '산업 태그 보강' },
  ];
  const qaRows = [
    { page: '홈', target: '리퀴드 hero surface', state: 'PASS', link: '/' },
    { page: '사전', target: '필터·무한 로딩·카드 밀도', state: 'WATCH', link: '/?cat=기업재무' },
    { page: '상세', target: '우측 contents·관련 용어 단일화', state: 'PASS', link: '/?term=CAPEX' },
    { page: '계산기', target: 'A/B 비교 입력 안정성', state: 'PASS', link: '/?view=calculator' },
    { page: '패치노트', target: '공개용 릴리즈 노트', state: 'READY', link: '/changelog' },
  ];
  const auditRows = [
    { who: 'admin', action: '릴리즈 초안 검수', at: '방금 전', risk: 'LOW' },
    { who: 'system', action: '검색 인사이트 집계', at: '12분 전', risk: 'LOW' },
    { who: 'admin', action: '배너 설정 변경', at: '1시간 전', risk: 'MID' },
    { who: 'deploy', action: 'production 배포 확인', at: '오늘', risk: 'MID' },
  ];
  const aiDraft = {
    title: aiSeed.trim() || 'CAPEX',
    easy: `${aiSeed.trim() || 'CAPEX'}는 투자 판단 전에 숫자만 보지 않고 맥락과 흐름을 함께 확인해야 하는 핵심 용어입니다.`,
    summary: '초안은 자동 반영하지 않고, 편집자가 표현·공식·관련 용어를 검수한 뒤 공개 큐로 넘기는 방식입니다.',
    keywords: ['쉬운 설명', '공식 보강', '관련 용어', '검색 키워드'],
  };

  return (
    <div className="min-h-screen" style={{ background: dark ? 'transparent' : T.bg, color: T.text }}>

      {/* ── 헤더 */}
      <header className="border-b sticky top-0 z-20" style={{ ...T.headerStyle }}>
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-light" style={{ color: T.textPrimary }}>
              Stock<span style={{ color: T.accent, fontWeight: 500 }}>WiKi</span>
            </span>
            <span className="text-[11px] mono uppercase tracking-[0.25em] px-1.5 py-0.5 border" style={{ borderColor: T.accent, color: T.accent }}>ADMIN</span>
            {analytics?.realtime !== undefined && (
              <span className="hidden md:flex items-center gap-1 text-[11px] mono px-2 py-0.5" style={{ color: '#22c55e', border: '1px solid #22c55e40', background: '#22c55e10' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
                {analytics.realtime}명 접속 중
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={toggleTheme} className="w-8 h-8 flex items-center justify-center border transition-all hover:opacity-70" style={{ borderColor: T.border, color: T.textFaint }}>
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <Link href="/" target="_blank" className="hidden md:flex items-center gap-1.5 text-[12px] mono uppercase tracking-[0.15em] px-2.5 py-1.5 border transition-all hover:opacity-70" style={{ borderColor: T.border, color: T.textMuted }}>
              <Eye size={12} /> 사이트
            </Link>
            <button onClick={logout} className="text-[12px] mono uppercase tracking-[0.2em] px-2.5 py-1.5 border transition-all hover:opacity-70" style={{ borderColor: T.border, color: T.textMuted }}>
              Logout
            </button>
          </div>
        </div>

        {/* 섹션 탭 */}
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 overflow-x-auto">
          <div className="flex gap-0 border-t" style={{ borderColor: T.borderSoft }}>
            {SECTIONS.map(sec => {
              const active = activeSection === sec.id;
              const Icon = sec.icon;
              return (
                <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                  className="relative flex items-center gap-1.5 px-3 py-2.5 text-[11px] mono uppercase tracking-[0.15em] whitespace-nowrap transition-all"
                  style={{ color: active ? T.accent : T.textDimmer, borderBottom: active ? `2px solid ${T.accent}` : '2px solid transparent' }}>
                  <Icon size={11} />
                  {sec.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 md:px-8 py-6 pb-20">

        {/* ══ OPS COMMAND CENTER ══ */}
        {activeSection === 'ops' && (
          <div className="space-y-5">
            <div className="admin-card overflow-hidden" style={{ ...T.cardStyle }}>
              <div className="relative p-6 md:p-7 border-b" style={{ borderColor: T.borderSoft }}>
                <div className="absolute inset-0 pointer-events-none opacity-70"
                  style={{
                    background: `radial-gradient(circle at 12% 20%, ${T.accent}18, transparent 32%), radial-gradient(circle at 88% 18%, ${T.teal}18, transparent 34%), linear-gradient(135deg, transparent, ${T.bgHover})`,
                  }}
                />
                <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                  <div>
                    <div className="text-[11px] mono uppercase tracking-[0.35em] mb-3" style={{ color: T.accent }}>Admin Command Surface</div>
                    <h1 className="text-3xl md:text-5xl font-light tracking-tight" style={{ color: T.textPrimary }}>StockWiki 운영실</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7" style={{ color: T.textMuted }}>
                      데이터 품질, 임포트, 분류, 릴리즈, QA까지 한 화면 흐름으로 확인하고 공개 전 위험을 낮춥니다.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 min-w-[260px]">
                    {[
                      { label: 'Terms', value: stats.terms.toLocaleString('ko-KR'), color: T.accent },
                      { label: 'Health', value: `${contentHealth}%`, color: T.green },
                      { label: 'Release Gate', value: `${releaseScore}/${releaseChecks.length}`, color: T.blue },
                      { label: 'Version', value: `v${CURRENT_VERSION}`, color: T.teal },
                    ].map(item => (
                      <div key={item.label} className="p-3 border rounded-sm" style={{ borderColor: T.border, background: T.bgCard }}>
                        <div className="text-[10px] mono uppercase tracking-[0.2em]" style={{ color: T.textDimmer }}>{item.label}</div>
                        <div className="mt-2 text-2xl mono tracking-tight" style={{ color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: T.borderSoft }}>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[12px] mono uppercase tracking-[0.2em]" style={{ color: T.textFaint }}>Quality Pulse</span>
                    <span className="text-[12px] mono" style={{ color: T.green }}>{contentHealth}%</span>
                  </div>
                  {qualityRows.slice(0, 3).map(row => (
                    <button key={row.issue} onClick={() => setActiveSection(row.owner === 'Taxonomy' ? 'taxonomy' : 'editor')}
                      className="w-full flex items-center justify-between py-2 border-t text-left"
                      style={{ borderColor: T.borderSofter }}>
                      <span className="text-sm" style={{ color: T.textMuted }}>{row.issue}</span>
                      <span className="mono text-[12px]" style={{ color: row.severity === 'HIGH' ? T.red : T.accent }}>{row.count}</span>
                    </button>
                  ))}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[12px] mono uppercase tracking-[0.2em]" style={{ color: T.textFaint }}>Release Gate</span>
                    <span className="text-[12px] mono" style={{ color: releaseScore === releaseChecks.length ? T.green : T.accent }}>{releaseScore}/{releaseChecks.length}</span>
                  </div>
                  {releaseChecks.map(check => (
                    <div key={check.label} className="flex items-center gap-2 py-1.5">
                      {check.ok ? <Check size={13} style={{ color: T.green }} /> : <Clock size={13} style={{ color: T.accent }} />}
                      <span className="text-sm flex-1" style={{ color: T.textMuted }}>{check.label}</span>
                      <span className="mono text-[11px]" style={{ color: T.textDimmer }}>{check.value}</span>
                    </div>
                  ))}
                </div>
                <div className="p-5">
                  <div className="text-[12px] mono uppercase tracking-[0.2em] mb-4" style={{ color: T.textFaint }}>Fast Actions</div>
                  {[
                    { label: '품질 센터 열기', id: 'quality' as SectionId },
                    { label: '엑셀 임포트 미리보기', id: 'importer' as SectionId },
                    { label: '릴리즈 체크리스트', id: 'changelog' as SectionId },
                    { label: '모바일 QA 확인', id: 'qa' as SectionId },
                  ].map(action => (
                    <button key={action.id} onClick={() => setActiveSection(action.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 mb-2 border rounded-sm text-sm hover:opacity-80"
                      style={{ borderColor: T.border, color: T.textPrimary, background: T.bgHover }}>
                      {action.label}<ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ DATA QUALITY CENTER ══ */}
        {activeSection === 'quality' && (
          <div className="space-y-5">
            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="데이터 품질 센터" T={T} action={
                <button onClick={() => showToast('품질 스캔 초안 생성됨')}
                  className="text-[11px] mono uppercase tracking-[0.15em] px-3 py-1 border hover:opacity-70"
                  style={{ borderColor: T.border, color: T.textMuted }}>Scan</button>
              } />
              <div className="grid md:grid-cols-[280px_1fr] divide-y md:divide-y-0 md:divide-x" style={{ borderColor: T.borderSoft }}>
                <div className="p-6">
                  <div className="text-[11px] mono uppercase tracking-[0.25em]" style={{ color: T.textFaint }}>Content Health</div>
                  <div className="mt-4 text-6xl font-light mono" style={{ color: T.green }}>{contentHealth}</div>
                  <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: T.bgBarTrack }}>
                    <div className="h-full" style={{ width: `${contentHealth}%`, background: `linear-gradient(90deg, ${T.green}, ${T.accent})` }} />
                  </div>
                  <p className="mt-4 text-sm leading-6" style={{ color: T.textMuted }}>설명, 공식, 예시, 관련 용어, 검색 키워드를 공개 전 점검하는 큐입니다.</p>
                </div>
                <div className="divide-y" style={{ borderColor: T.borderSofter }}>
                  {qualityRows.map(row => (
                    <div key={row.issue} className="px-5 py-4 grid grid-cols-[1fr_auto_auto] items-center gap-4">
                      <div>
                        <div className="text-sm" style={{ color: T.textPrimary }}>{row.issue}</div>
                        <div className="text-[11px] mono uppercase tracking-[0.18em] mt-1" style={{ color: T.textDimmer }}>{row.owner} Queue</div>
                      </div>
                      <span className="text-xl mono" style={{ color: row.severity === 'HIGH' ? T.red : row.severity === 'MID' ? T.accent : T.textMuted }}>{row.count}</span>
                      <button onClick={() => setActiveSection(row.owner === 'Taxonomy' ? 'taxonomy' : row.owner === 'Search' ? 'searchops' : 'editor')}
                        className="text-[11px] mono px-2.5 py-1 border hover:opacity-70"
                        style={{ borderColor: T.border, color: T.textMuted }}>처리</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ IMPORT PREVIEW ══ */}
        {activeSection === 'importer' && (
          <div className="space-y-5">
            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="엑셀 임포트 미리보기" T={T} />
              <div className="p-5 grid md:grid-cols-[320px_1fr] gap-5">
                <label className="min-h-[220px] border border-dashed rounded-sm flex flex-col items-center justify-center text-center px-5 cursor-pointer hover:opacity-85"
                  style={{ borderColor: importStage === 'idle' ? T.border : T.accent, background: T.bgSection }}>
                  <Database size={28} style={{ color: T.accent }} />
                  <div className="mt-4 text-sm" style={{ color: T.textPrimary }}>{importFileName || 'xlsx / csv 파일 선택'}</div>
                  <div className="mt-2 text-[11px] mono uppercase tracking-[0.2em]" style={{ color: T.textDimmer }}>Preview Only · No Auto Publish</div>
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                    onChange={e => {
                      setImportFileName(e.target.files?.[0]?.name ?? '');
                      setImportStage(e.target.files?.[0] ? 'ready' : 'idle');
                    }}
                  />
                </label>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {importPreviewRows.map(item => (
                      <div key={item.label} className="p-4 border rounded-sm" style={{ borderColor: T.border, background: T.bgCard }}>
                        <div className="text-[11px] mono uppercase tracking-[0.18em]" style={{ color: T.textDimmer }}>{item.label}</div>
                        <div className="mt-3 text-3xl mono" style={{ color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="border rounded-sm overflow-hidden" style={{ borderColor: T.border }}>
                    {['헤더/필수 컬럼 확인', '중복 title·alias 감지', '9개 패밀리 매핑 검증', '롤백 포인트 생성'].map((label, i) => (
                      <div key={label} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0" style={{ borderColor: T.borderSofter }}>
                        <Check size={13} style={{ color: i === 3 && importStage !== 'approved' ? T.textDimmer : T.green }} />
                        <span className="text-sm flex-1" style={{ color: T.textMuted }}>{label}</span>
                        <span className="mono text-[11px]" style={{ color: T.textDimmer }}>{i === 3 && importStage !== 'approved' ? '대기' : 'OK'}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setImportStage('ready'); showToast('임포트 프리플라이트 완료'); }}
                      className="px-4 py-2 border text-sm mono uppercase tracking-[0.15em]"
                      style={{ borderColor: T.border, color: T.textPrimary }}>Preflight</button>
                    <button onClick={() => { setImportStage('approved'); showToast('승인 대기 큐에 올림'); }}
                      className="px-4 py-2 text-sm mono uppercase tracking-[0.15em]"
                      style={{ background: T.accent, color: '#050505' }}>승인 큐로 이동</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAXONOMY MANAGER ══ */}
        {activeSection === 'taxonomy' && (
          <div className="space-y-5">
            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="카테고리 · 그룹핑 관리자" T={T} />
              <div className="p-5 border-b grid md:grid-cols-3 gap-3" style={{ borderColor: T.borderSoft }}>
                {[
                  { label: '운영 패밀리', value: '9', sub: '원본 사이트 기준' },
                  { label: '중분류', value: stats.categories, sub: '카드 필터 유지' },
                  { label: '총 용어', value: stats.terms.toLocaleString('ko-KR'), sub: '데이터 변경 없음' },
                ].map(item => (
                  <div key={item.label} className="p-4 border rounded-sm" style={{ borderColor: T.border, background: T.bgSection }}>
                    <div className="text-[11px] mono uppercase tracking-[0.2em]" style={{ color: T.textDimmer }}>{item.label}</div>
                    <div className="mt-2 text-3xl mono" style={{ color: T.accent }}>{item.value}</div>
                    <div className="mt-1 text-xs" style={{ color: T.textFaint }}>{item.sub}</div>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-3 gap-3 p-5">
                {taxonomyRows.map(row => (
                  <div key={row.code} className="p-4 border rounded-sm relative overflow-hidden" style={{ borderColor: `${row.tone}55`, background: T.bgCard }}>
                    <div className="absolute inset-x-0 top-0 h-px" style={{ background: row.tone }} />
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: T.textPrimary }}>{row.kr}</span>
                      <span className="text-[10px] mono tracking-[0.18em]" style={{ color: row.tone }}>{row.code}</span>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <span className="text-2xl mono" style={{ color: row.tone }}>{row.count.toLocaleString('ko-KR')}</span>
                      <span className="text-[11px] mono" style={{ color: T.textDimmer }}>{Math.max(2, Math.round((row.count / stats.terms) * 100))}%</span>
                    </div>
                    <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: T.bgBarTrack }}>
                      <div className="h-full" style={{ width: `${Math.min(100, (row.count / Math.max(...taxonomyRows.map(r => r.count))) * 100)}%`, background: row.tone }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ TERM EDITOR ══ */}
        {activeSection === 'editor' && (
          <div className="space-y-5">
            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="용어 상세 편집기" T={T} action={
                <div className="flex gap-1">
                  {(['detail', 'card'] as const).map(mode => (
                    <button key={mode} onClick={() => setEditorMode(mode)}
                      className="text-[11px] mono uppercase tracking-[0.15em] px-3 py-1 border"
                      style={{ borderColor: editorMode === mode ? T.accent : T.border, color: editorMode === mode ? T.accent : T.textMuted }}>
                      {mode}
                    </button>
                  ))}
                </div>
              } />
              <div className="grid lg:grid-cols-[1fr_360px] divide-y lg:divide-y-0 lg:divide-x" style={{ borderColor: T.borderSoft }}>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-[11px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textDimmer }}>대표 용어</label>
                    <input value={editorTerm} onChange={e => setEditorTerm(e.target.value)}
                      className="w-full border px-4 py-3 text-lg outline-none rounded-sm"
                      style={inputStyle}
                    />
                  </div>
                  {[
                    ['쉽게 말하면', '투자자가 숫자를 해석할 때 먼저 확인해야 하는 핵심 기준입니다.'],
                    ['개요', '정의, 회계 기준, 산업별 차이, 일회성 요인을 함께 정리합니다.'],
                    ['공식', '계산 기준과 분모·분자의 회계기간을 맞춥니다.'],
                    ['예시', '실무에서는 과거 평균과 업종 특성을 함께 비교합니다.'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <label className="block text-[11px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textDimmer }}>{label}</label>
                      <textarea defaultValue={value} rows={2}
                        className="w-full border px-4 py-3 text-sm outline-none resize-none rounded-sm"
                        style={inputStyle}
                      />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button onClick={() => showToast('초안 저장됨')}
                      className="px-4 py-2 text-sm mono uppercase tracking-[0.15em]"
                      style={{ background: T.accent, color: '#050505' }}>초안 저장</button>
                    <button onClick={() => setActiveSection('qa')}
                      className="px-4 py-2 border text-sm mono uppercase tracking-[0.15em]"
                      style={{ borderColor: T.border, color: T.textMuted }}>QA로 보내기</button>
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-[11px] mono uppercase tracking-[0.25em] mb-4" style={{ color: T.textFaint }}>Live Preview</div>
                  <div className="border rounded-sm p-5 min-h-[320px]" style={{ borderColor: T.border, background: editorMode === 'detail' ? T.bgSection : T.bgCard }}>
                    <div className="text-[10px] mono uppercase tracking-[0.25em]" style={{ color: T.accent }}>FUNDAMENTAL</div>
                    <div className={editorMode === 'detail' ? 'mt-8 text-5xl font-light' : 'mt-5 text-3xl font-semibold'} style={{ color: T.textPrimary }}>
                      {editorTerm || 'Untitled'}
                    </div>
                    <div className="mt-3 text-sm italic" style={{ color: T.textMuted }}>Capital Expenditure</div>
                    <div className="mt-8 h-px" style={{ background: T.border }} />
                    <p className="mt-6 text-sm leading-7" style={{ color: T.textMuted }}>
                      공개 화면의 상세 페이지와 카드에서 보일 문장 길이, 줄바꿈, 섹션 밀도를 동시에 확인합니다.
                    </p>
                    <div className="mt-6 grid grid-cols-4 gap-2">
                      {['01', '02', '03', '04'].map(num => (
                        <span key={num} className="text-center py-2 border mono text-[12px]" style={{ borderColor: T.border, color: T.accent }}>{num}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ SEARCH OPS ══ */}
        {activeSection === 'searchops' && (
          <div className="space-y-5">
            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="검색 분석 · 사전 보강 큐" T={T} action={
                <div className="flex gap-1">
                  {(['7d', '28d'] as const).map(win => (
                    <button key={win} onClick={() => setSearchWindow(win)}
                      className="text-[11px] mono uppercase tracking-[0.15em] px-3 py-1 border"
                      style={{ borderColor: searchWindow === win ? T.accent : T.border, color: searchWindow === win ? T.accent : T.textMuted }}>
                      {win}
                    </button>
                  ))}
                </div>
              } />
              <div className="grid md:grid-cols-[1fr_300px] divide-y md:divide-y-0 md:divide-x" style={{ borderColor: T.borderSoft }}>
                <div className="divide-y" style={{ borderColor: T.borderSofter }}>
                  {searchInsights.map(row => (
                    <div key={row.q} className="px-5 py-4 grid grid-cols-[1fr_auto] gap-4">
                      <div>
                        <div className="text-lg" style={{ color: T.textPrimary }}>{row.q}</div>
                        <div className="text-[12px] mt-1" style={{ color: T.textMuted }}>{row.action}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl mono" style={{ color: T.accent }}>{row.hits}</div>
                        <div className="text-[10px] mono uppercase tracking-[0.18em]" style={{ color: T.textDimmer }}>searches</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-5">
                  <div className="text-[11px] mono uppercase tracking-[0.25em] mb-4" style={{ color: T.textFaint }}>No Result Clusters</div>
                  {['per/epr 오타', 'DCF 할인율', 'AI CAPEX', 'ETF 세금'].map((tag, i) => (
                    <div key={tag} className="flex items-center justify-between py-2 border-b" style={{ borderColor: T.borderSofter }}>
                      <span className="text-sm" style={{ color: T.textMuted }}>{tag}</span>
                      <span className="mono text-[12px]" style={{ color: i === 0 ? T.red : T.textDimmer }}>{12 - i * 2}</span>
                    </div>
                  ))}
                  <button onClick={() => setActiveSection('editor')}
                    className="mt-5 w-full py-2 border text-sm mono uppercase tracking-[0.15em]"
                    style={{ borderColor: T.border, color: T.textPrimary }}>편집 큐로 보내기</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ VISUAL QA LAB ══ */}
        {activeSection === 'qa' && (
          <div className="space-y-5">
            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="시각 QA 랩" T={T} action={
                <div className="flex gap-1">
                  {(['desktop', 'tablet', 'mobile'] as const).map(vp => (
                    <button key={vp} onClick={() => setQaViewport(vp)}
                      className="flex items-center gap-1 text-[11px] mono uppercase tracking-[0.15em] px-3 py-1 border"
                      style={{ borderColor: qaViewport === vp ? T.accent : T.border, color: qaViewport === vp ? T.accent : T.textMuted }}>
                      {vp === 'desktop' ? <Monitor size={11} /> : vp === 'tablet' ? <Tablet size={11} /> : <Smartphone size={11} />}
                      {vp}
                    </button>
                  ))}
                </div>
              } />
              <div className="p-5 grid lg:grid-cols-[1fr_320px] gap-5">
                <div className="border rounded-sm overflow-hidden" style={{ borderColor: T.border }}>
                  {qaRows.map(row => (
                    <a key={row.page} href={row.link} target="_blank" rel="noreferrer"
                      className="flex items-center gap-4 px-4 py-4 border-b last:border-b-0 hover:opacity-80"
                      style={{ borderColor: T.borderSofter }}>
                      <span className="w-16 text-sm" style={{ color: T.textPrimary }}>{row.page}</span>
                      <span className="flex-1 text-sm" style={{ color: T.textMuted }}>{row.target}</span>
                      <span className="mono text-[11px] px-2 py-0.5 border"
                        style={{ color: row.state === 'WATCH' ? T.accent : T.green, borderColor: row.state === 'WATCH' ? `${T.accent}55` : `${T.green}55` }}>
                        {row.state}
                      </span>
                    </a>
                  ))}
                </div>
                <div className="border rounded-sm p-5" style={{ borderColor: T.border, background: T.bgSection }}>
                  <div className="text-[11px] mono uppercase tracking-[0.25em]" style={{ color: T.textFaint }}>Viewport Preview</div>
                  <div className="mt-5 mx-auto border rounded-sm transition-all"
                    style={{
                      width: qaViewport === 'desktop' ? '100%' : qaViewport === 'tablet' ? 220 : 132,
                      height: qaViewport === 'desktop' ? 150 : qaViewport === 'tablet' ? 190 : 230,
                      borderColor: T.border,
                      background: `linear-gradient(145deg, ${T.bgHover}, transparent), radial-gradient(circle at 30% 20%, ${T.accent}18, transparent 38%)`,
                    }}>
                    <div className="m-3 h-4 rounded-sm" style={{ background: T.bgSkeleton }} />
                    <div className="m-3 h-16 rounded-sm" style={{ background: `${T.accent}22` }} />
                    <div className="m-3 grid grid-cols-3 gap-2">
                      <span className="h-8 rounded-sm" style={{ background: T.bgSkeleton }} />
                      <span className="h-8 rounded-sm" style={{ background: T.bgSkeleton }} />
                      <span className="h-8 rounded-sm" style={{ background: T.bgSkeleton }} />
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-6" style={{ color: T.textMuted }}>PC 경험과 동일한 정보 밀도를 유지하되, 모바일에서는 가로 넘침과 고정 바 간섭을 먼저 확인합니다.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ AI DRAFT ASSISTANT ══ */}
        {activeSection === 'ai' && (
          <div className="space-y-5">
            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="AI 초안 보조 · 자동 반영 금지" T={T} action={
                <button onClick={() => showToast('AI 초안이 편집 큐에 생성됨')}
                  className="text-[11px] mono uppercase tracking-[0.15em] px-3 py-1 border"
                  style={{ borderColor: T.border, color: T.textMuted }}>Draft</button>
              } />
              <div className="grid md:grid-cols-[320px_1fr] divide-y md:divide-y-0 md:divide-x" style={{ borderColor: T.borderSoft }}>
                <div className="p-5">
                  <label className="block text-[11px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textDimmer }}>Seed Term</label>
                  <input value={aiSeed} onChange={e => setAiSeed(e.target.value)}
                    className="w-full border px-4 py-3 text-lg outline-none rounded-sm"
                    style={inputStyle}
                  />
                  <div className="mt-5 p-4 border rounded-sm" style={{ borderColor: `${T.accent}55`, background: `${T.accent}10` }}>
                    <div className="text-[11px] mono uppercase tracking-[0.25em]" style={{ color: T.accent }}>Review Rule</div>
                    <p className="mt-3 text-sm leading-6" style={{ color: T.textMuted }}>AI 결과는 공개 데이터에 바로 쓰지 않고, 편집자가 검토한 뒤 초안 저장 또는 폐기합니다.</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <div className="text-[11px] mono uppercase tracking-[0.25em] mb-2" style={{ color: T.textFaint }}>Title</div>
                    <div className="text-3xl font-light" style={{ color: T.textPrimary }}>{aiDraft.title}</div>
                  </div>
                  <div className="p-4 border rounded-sm" style={{ borderColor: T.border, background: T.bgSection }}>
                    <div className="text-[11px] mono uppercase tracking-[0.25em] mb-2" style={{ color: T.accent }}>쉽게 말하면</div>
                    <p className="text-sm leading-7" style={{ color: T.textMuted }}>{aiDraft.easy}</p>
                  </div>
                  <div className="p-4 border rounded-sm" style={{ borderColor: T.border, background: T.bgCard }}>
                    <div className="text-[11px] mono uppercase tracking-[0.25em] mb-2" style={{ color: T.teal }}>검수 메모</div>
                    <p className="text-sm leading-7" style={{ color: T.textMuted }}>{aiDraft.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiDraft.keywords.map(keyword => (
                      <span key={keyword} className="px-3 py-1 border text-[12px]" style={{ borderColor: T.border, color: T.textMuted }}>{keyword}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setActiveSection('editor')}
                      className="px-4 py-2 text-sm mono uppercase tracking-[0.15em]"
                      style={{ background: T.accent, color: '#050505' }}>편집기로 보내기</button>
                    <button onClick={() => showToast('초안 폐기됨')}
                      className="px-4 py-2 border text-sm mono uppercase tracking-[0.15em]"
                      style={{ borderColor: T.border, color: T.textMuted }}>폐기</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ ANALYTICS ══ */}
        {activeSection === 'analytics' && (
          <div className="space-y-5">
            <SectionHeader title="§ Google Analytics · 방문자 분석" T={T} action={
              <button onClick={fetchAnalytics} disabled={analyticsLoading}
                className="flex items-center gap-1.5 text-[12px] mono uppercase tracking-[0.15em] px-2.5 py-1 border hover:opacity-70"
                style={{ borderColor: T.border, color: T.textFaint, opacity: analyticsLoading ? 0.5 : 1 }}>
                <RefreshCw size={11} className={analyticsLoading ? 'animate-spin' : ''} /> 새로고침
              </button>
            } />

            {analyticsError && (
              <div className="border px-4 py-3 text-[13px] mono" style={{ borderColor: T.red, color: T.red, background: `${T.red}10` }}>
                ⚠ GA 연동 오류: {analyticsError}
              </div>
            )}

            {/* KPI 카드 4개 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: '실시간 접속', value: analytics?.realtime, unit: '명', color: '#22c55e', pulse: true },
                { label: '오늘 PV', value: analytics?.today.pv, unit: '회', color: T.accent,
                  change: analytics ? pctChange(analytics.today.pv, analytics.yesterday.pv) : null, changeLabel: '어제 대비' },
                { label: '오늘 세션', value: analytics?.today.sessions, unit: '건', color: T.teal,
                  change: analytics ? pctChange(analytics.today.sessions, analytics.yesterday.sessions) : null, changeLabel: '어제 대비' },
                { label: '28일 순방문', value: analytics?.week28.users, unit: '명', color: T.blue },
              ].map((kpi, i) => (
                <div key={i} className="admin-card" style={{ ...T.cardStyle }}>
                  <div className="text-[11px] mono uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5" style={{ color: T.textFaint }}>
                    {kpi.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />}
                    {kpi.label}
                  </div>
                  {analyticsLoading ? <Skeleton T={T} /> : (
                    <>
                      <div className="text-3xl font-light mono" style={{ color: kpi.color }}>
                        {kpi.value?.toLocaleString() ?? '—'}
                        <span className="text-sm ml-1" style={{ color: T.textDimmer }}>{kpi.unit}</span>
                      </div>
                      {kpi.change !== null && kpi.change !== undefined && (
                        <div className="text-[11px] mono mt-1" style={{ color: kpi.change >= 0 ? T.green : T.red }}>
                          {kpi.change >= 0 ? '▲' : '▼'} {Math.abs(kpi.change)}% {kpi.changeLabel}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* 7일 일별 PV 바 차트 */}
            <div className="admin-card" style={{ ...T.cardStyle }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: T.borderSoft }}>
                <span className="text-[12px] mono uppercase tracking-[0.2em]" style={{ color: T.textMuted }}>7일 PV 추이</span>
              </div>
              <div className="p-5">
                {analyticsLoading ? <div className="h-12 animate-pulse rounded-sm" style={{ background: T.bgSkeleton }} /> : (
                  analytics?.daily7?.length ? (
                    <div className="space-y-2">
                      <MiniBar data={analytics.daily7} T={T} color={T.accent} />
                      <div className="flex justify-between">
                        {analytics.daily7.map((d, i) => (
                          <div key={i} className="flex-1 text-center">
                            <div className="text-[10px] mono" style={{ color: T.textDimmer }}>
                              {d.dim.slice(4, 6)}/{d.dim.slice(6, 8)}
                            </div>
                            <div className="text-[10px] mono" style={{ color: T.textFaint }}>{d.value.toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : <div className="text-[13px] mono" style={{ color: T.textDimmer }}>데이터 없음</div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* 인기 페이지 TOP 10 */}
              <div className="md:col-span-2 admin-card" style={{ ...T.cardStyle }}>
                <div className="px-5 py-3 border-b" style={{ borderColor: T.borderSoft }}>
                  <span className="text-[12px] mono uppercase tracking-[0.2em]" style={{ color: T.textMuted }}>인기 페이지 TOP 10 · 7일</span>
                </div>
                <div className="divide-y" style={{ borderColor: T.borderSofter }}>
                  {analyticsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-5 py-3">
                        <Skeleton T={T} />
                      </div>
                    ))
                  ) : analytics?.topPages?.length ? (
                    analytics.topPages.map((p, i) => {
                      const max = analytics.topPages[0].pv;
                      return (
                        <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                          <span className="text-[11px] mono w-4 shrink-0" style={{ color: T.textDimmer }}>{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] mono truncate" style={{ color: T.textPrimary }}>{p.path}</div>
                            <div className="h-1 mt-1 rounded-sm" style={{ width: `${(p.pv / max) * 100}%`, background: T.accent + '80' }} />
                          </div>
                          <span className="text-[12px] mono shrink-0" style={{ color: T.accent }}>{p.pv.toLocaleString()}</span>
                        </div>
                      );
                    })
                  ) : <div className="px-5 py-4 text-[13px] mono" style={{ color: T.textDimmer }}>데이터 없음</div>}
                </div>
              </div>

              {/* 기기·국가 */}
              <div className="space-y-4">
                <div className="admin-card" style={{ ...T.cardStyle }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: T.borderSoft }}>
                    <span className="text-[12px] mono uppercase tracking-[0.2em]" style={{ color: T.textMuted }}>기기 유형</span>
                  </div>
                  <div className="p-4 space-y-2">
                    {analyticsLoading ? <Skeleton T={T} /> : analytics?.devices?.map((d, i) => {
                      const total = analytics.devices.reduce((s, x) => s + x.value, 0);
                      const pct = Math.round((d.value / total) * 100);
                      const Icon = d.dim === 'mobile' ? Smartphone : d.dim === 'tablet' ? Tablet : Monitor;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <Icon size={12} style={{ color: T.textDimmer }} />
                          <span className="text-[12px] mono flex-1 capitalize" style={{ color: T.textMuted }}>{d.dim}</span>
                          <span className="text-[12px] mono" style={{ color: T.accent }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="admin-card" style={{ ...T.cardStyle }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: T.borderSoft }}>
                    <span className="text-[12px] mono uppercase tracking-[0.2em]" style={{ color: T.textMuted }}>국가 TOP 5</span>
                  </div>
                  <div className="p-4 space-y-2">
                    {analyticsLoading ? <Skeleton T={T} /> : analytics?.countries?.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[11px] mono w-3" style={{ color: T.textDimmer }}>{i + 1}</span>
                        <span className="text-[12px] mono flex-1" style={{ color: T.textMuted }}>{c.dim}</span>
                        <span className="text-[12px] mono" style={{ color: T.textFaint }}>{c.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 시간대별 오늘 PV */}
            {analytics?.hourly && analytics.hourly.length > 0 && (
              <div className="admin-card" style={{ ...T.cardStyle }}>
                <div className="px-5 py-3 border-b" style={{ borderColor: T.borderSoft }}>
                  <span className="text-[12px] mono uppercase tracking-[0.2em]" style={{ color: T.textMuted }}>오늘 시간대별 PV</span>
                </div>
                <div className="p-5">
                  <MiniBar data={analytics.hourly} T={T} color={T.teal} />
                  <div className="flex justify-between mt-1">
                    {[0, 6, 12, 18, 23].map(h => (
                      <span key={h} className="text-[10px] mono" style={{ color: T.textDimmer }}>{String(h).padStart(2, '0')}시</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ STATUS ══ */}
        {activeSection === 'status' && (
          <div className="admin-card" style={{ ...T.cardStyle }}>
            <SectionHeader title="Site Status" T={T} action={
              <span className="text-[13px] mono uppercase tracking-[0.2em]" style={{ color: config.maintenanceMode ? T.accent : T.green }}>
                {config.maintenanceMode ? '● Maintenance' : '● Live'}
              </span>
            } />
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-xl mb-1.5" style={{ color: T.textPrimary }}>{config.maintenanceMode ? '점검 모드 활성화됨' : '서비스 정상 운영 중'}</div>
                  <div className="text-sm" style={{ color: T.textFaint }}>{config.maintenanceMode ? '모든 방문자가 점검 화면을 보게 됩니다' : '버튼을 클릭해 점검 모드로 전환할 수 있습니다'}</div>
                </div>
                <button onClick={toggleMaintenance} disabled={isPending}
                  className="shrink-0 px-4 py-2.5 text-sm mono uppercase tracking-[0.2em] border transition-all"
                  style={{ borderColor: config.maintenanceMode ? T.green : T.accent, background: config.maintenanceMode ? T.green : T.accent, color: '#0a0a0a', opacity: isPending ? 0.5 : 1, minWidth: '5.5rem' }}>
                  {isPending ? '처리 중...' : config.maintenanceMode ? '점검 해제' : '점검 시작'}
                </button>
              </div>
              <div className="space-y-4 pt-5 border-t" style={{ borderColor: T.borderSoft }}>
                <label className="block">
                  <div className="text-[13px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textFaint }}>점검 메시지</div>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
                    className="w-full border px-3 py-2 text-sm outline-none resize-none" style={inputStyle}
                    placeholder="시스템 점검 중입니다..." />
                </label>
                <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
                  <label className="block">
                    <div className="text-[13px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textFaint }}>예상 종료 시각 (선택)</div>
                    <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)}
                      className="w-full border px-3 py-2 text-sm outline-none mono" style={inputStyle} />
                  </label>
                  <button onClick={saveMaintenanceMeta} disabled={isPending}
                    className="px-4 py-2 text-sm mono uppercase tracking-[0.2em] border transition-all hover:opacity-70"
                    style={{ borderColor: T.border, color: T.textMuted, background: T.bgHover }}>
                    메시지 저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ FEATURES ══ */}
        {activeSection === 'features' && (
          <div className="admin-card" style={{ ...T.cardStyle }}>
            <SectionHeader title="Feature Toggles" T={T} />
            <div>
              {([
                { key: 'glossary' as const, label: '금융 사전', desc: '용어 사전 전체 탭' },
                { key: 'calculator' as const, label: '계산기', desc: '금융 계산기 탭' },
                { key: 'commandK' as const, label: '빠른 검색', desc: 'Cmd+K 빠른 검색 팝업' },
                { key: 'events' as const, label: '이벤트', desc: 'FOMC·어닝·선물만기 달력' },
              ]).map((f, i, arr) => (
                <div key={f.key} className="flex items-center justify-between px-5 py-4 border-b"
                  style={{ borderColor: i === arr.length - 1 ? 'transparent' : T.borderSoft }}>
                  <div>
                    <div className="text-base mb-0.5" style={{ color: T.textPrimary }}>{f.label}</div>
                    <div className="text-sm" style={{ color: T.textFaint }}>{f.desc}</div>
                  </div>
                  <button onClick={() => toggleFeature(f.key)} disabled={isPending}
                    className="relative w-12 h-6 shrink-0 transition-all"
                    style={{ background: config.features[f.key] ? T.green : T.border, opacity: isPending ? 0.5 : 1 }}>
                    <span className="absolute top-0.5 w-5 h-5 transition-all" style={{ left: config.features[f.key] ? 'calc(100% - 22px)' : '2px', background: T.textPrimary }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ BANNER ══ */}
        {activeSection === 'banner' && (
          <div className="space-y-5">
            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="배너 · 공지 관리" T={T} />
              <div className="p-5 space-y-4">
                {/* 미리보기 */}
                {banner.message && (
                  <div className="px-4 py-2.5 border text-sm" style={{ borderColor: BANNER_COLORS[banner.color] + '60', background: BANNER_COLORS[banner.color] + '18', color: BANNER_COLORS[banner.color] }}>
                    <span className="font-medium">미리보기: </span>{banner.message}
                    {banner.link && <> · <span className="underline">{banner.linkText || '자세히 보기'}</span></>}
                  </div>
                )}

                <div className="grid md:grid-cols-[auto_1fr] gap-4 items-center">
                  <div>
                    <div className="text-[12px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textFaint }}>활성화</div>
                    <button onClick={() => setBanner(b => ({ ...b, enabled: !b.enabled }))}
                      className="relative w-12 h-6" style={{ background: banner.enabled ? T.green : T.border }}>
                      <span className="absolute top-0.5 w-5 h-5 transition-all" style={{ left: banner.enabled ? 'calc(100% - 22px)' : '2px', background: T.textPrimary }} />
                    </button>
                  </div>
                  <div>
                    <div className="text-[12px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textFaint }}>색상</div>
                    <div className="flex gap-2">
                      {(Object.entries(BANNER_COLORS) as [BannerConfig['color'], string][]).map(([key, val]) => (
                        <button key={key} onClick={() => setBanner(b => ({ ...b, color: key }))}
                          className="w-8 h-8 border-2 transition-all"
                          style={{ background: val, borderColor: banner.color === key ? T.textPrimary : 'transparent' }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[12px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textFaint }}>메시지</div>
                  <input value={banner.message} onChange={e => setBanner(b => ({ ...b, message: e.target.value }))}
                    className="w-full border px-3 py-2 text-sm outline-none" style={inputStyle}
                    placeholder="예: FOMC 결과 발표 · 오늘 밤 3시" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[12px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textFaint }}>링크 URL (선택)</div>
                    <input value={banner.link ?? ''} onChange={e => setBanner(b => ({ ...b, link: e.target.value }))}
                      className="w-full border px-3 py-2 text-sm outline-none" style={inputStyle}
                      placeholder="https://..." />
                  </div>
                  <div>
                    <div className="text-[12px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textFaint }}>링크 텍스트 (선택)</div>
                    <input value={banner.linkText ?? ''} onChange={e => setBanner(b => ({ ...b, linkText: e.target.value }))}
                      className="w-full border px-3 py-2 text-sm outline-none" style={inputStyle}
                      placeholder="자세히 보기" />
                  </div>
                </div>

                <div>
                  <div className="text-[12px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textFaint }}>만료 시각 (선택)</div>
                  <input type="datetime-local" value={banner.expiresAt ?? ''} onChange={e => setBanner(b => ({ ...b, expiresAt: e.target.value }))}
                    className="w-full border px-3 py-2 text-sm outline-none mono" style={inputStyle} />
                </div>

                <button onClick={saveBanner} disabled={bannerLoading}
                  className="px-5 py-2 text-sm mono uppercase tracking-[0.2em] border transition-all hover:opacity-80"
                  style={{ borderColor: T.accent, color: T.accent, background: `${T.accent}15`, opacity: bannerLoading ? 0.5 : 1 }}>
                  {bannerLoading ? '저장 중...' : '배너 저장'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ CACHE ══ */}
        {activeSection === 'cache' && (
          <div className="admin-card" style={{ ...T.cardStyle }}>
            <SectionHeader title="캐시 무효화" T={T} />
            <div className="p-5 space-y-3">
              <div className="text-[13px]" style={{ color: T.textMuted }}>
                지표 발표 직후, 배포 후 데이터를 즉시 최신화하고 싶을 때 사용하세요.
              </div>
              <div className="divide-y" style={{ borderColor: T.borderSoft }}>
                {cacheTargets.map(target => (
                  <div key={target.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-sm" style={{ color: T.textPrimary }}>{target.label}</div>
                      {cacheResult?.id === target.id && (
                        <div className="text-[11px] mono mt-0.5" style={{ color: T.green }}>
                          ✓ {fmtDate(cacheResult.at)} 무효화됨
                        </div>
                      )}
                    </div>
                    <button onClick={() => revalidateCache(target.id)} disabled={!!cacheLoading}
                      className="flex items-center gap-1.5 text-[12px] mono uppercase tracking-[0.15em] px-3 py-1.5 border transition-all hover:opacity-70"
                      style={{ borderColor: T.border, color: cacheLoading === target.id ? T.accent : T.textMuted, opacity: cacheLoading ? 0.6 : 1 }}>
                      <RefreshCw size={11} className={cacheLoading === target.id ? 'animate-spin' : ''} />
                      {target.id === 'all' ? '전체 무효화' : '무효화'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ EVENTS ══ */}
        {activeSection === 'events' && (
          <div className="space-y-5">
            {/* 이벤트 추가 폼 */}
            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="이벤트 수동 추가 (한국 금통위, BOJ 등)" T={T} />
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <div className="text-[11px] mono uppercase tracking-[0.2em] mb-1.5" style={{ color: T.textFaint }}>날짜 *</div>
                    <input type="date" value={newEvent.date} onChange={e => setNewEvent(v => ({ ...v, date: e.target.value }))}
                      className="w-full border px-3 py-2 text-sm outline-none mono" style={inputStyle} />
                  </div>
                  <div>
                    <div className="text-[11px] mono uppercase tracking-[0.2em] mb-1.5" style={{ color: T.textFaint }}>레이블 * (최대 8자)</div>
                    <input value={newEvent.label} onChange={e => setNewEvent(v => ({ ...v, label: e.target.value.slice(0, 8) }))}
                      className="w-full border px-3 py-2 text-sm outline-none" style={inputStyle}
                      placeholder="금통위" />
                  </div>
                  <div>
                    <div className="text-[11px] mono uppercase tracking-[0.2em] mb-1.5" style={{ color: T.textFaint }}>색상</div>
                    <input type="color" value={newEvent.color} onChange={e => setNewEvent(v => ({ ...v, color: e.target.value }))}
                      className="w-full h-9 border cursor-pointer" style={{ borderColor: T.border }} />
                  </div>
                  <div className="flex items-end">
                    <button onClick={addCustomEvent}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm mono uppercase tracking-[0.15em] border transition-all hover:opacity-80"
                      style={{ borderColor: T.accent, color: T.accent, background: `${T.accent}15` }}>
                      <Plus size={13} /> 추가
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] mono uppercase tracking-[0.2em] mb-1.5" style={{ color: T.textFaint }}>설명 *</div>
                  <input value={newEvent.desc} onChange={e => setNewEvent(v => ({ ...v, desc: e.target.value }))}
                    className="w-full border px-3 py-2 text-sm outline-none" style={inputStyle}
                    placeholder="한국은행 금융통화위원회 기준금리 결정" />
                </div>
              </div>
            </div>

            {/* 기존 이벤트 목록 */}
            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title={`등록된 이벤트 (${customEvents.length}개)`} T={T} />
              {eventsLoading ? (
                <div className="p-5"><Skeleton T={T} /></div>
              ) : customEvents.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px] mono" style={{ color: T.textDimmer }}>등록된 이벤트 없음</div>
              ) : (
                <div className="divide-y" style={{ borderColor: T.borderSofter }}>
                  {customEvents.sort((a, b) => a.date.localeCompare(b.date)).map(ev => (
                    <div key={ev.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ev.color }} />
                      <span className="mono text-[12px] w-24 shrink-0" style={{ color: T.textMuted }}>{ev.date}</span>
                      <span className="mono text-[12px] w-16 shrink-0 font-medium" style={{ color: ev.color }}>{ev.label}</span>
                      <span className="text-[13px] flex-1 truncate" style={{ color: T.textPrimary }}>{ev.desc}</span>
                      <button onClick={() => deleteCustomEvent(ev.id)}
                        className="shrink-0 w-6 h-6 flex items-center justify-center hover:opacity-70"
                        style={{ color: T.red }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ MONITOR ══ */}
        {activeSection === 'monitor' && (
          <div className="admin-card" style={{ ...T.cardStyle }}>
            <SectionHeader title="System Monitor" T={T} action={
              <div className="flex items-center gap-3">
                {lastChecked && <span className="text-[12px] mono" style={{ color: T.textDimmer }}>마지막 체크 {lastChecked}</span>}
                <button onClick={fetchMetrics} disabled={metricsLoading}
                  className="flex items-center gap-1.5 text-[12px] mono uppercase tracking-[0.15em] px-2.5 py-1 border hover:opacity-70"
                  style={{ borderColor: T.border, color: T.textFaint, opacity: metricsLoading ? 0.5 : 1 }}>
                  <RefreshCw size={11} className={metricsLoading ? 'animate-spin' : ''} /> 새로고침
                </button>
              </div>
            } />

            <div className="px-5 py-2.5 border-b" style={{ borderColor: T.borderSoft }}>
              <span className="text-[12px] mono uppercase tracking-[0.25em]" style={{ color: T.textDimmer }}>API Services</span>
            </div>
            {([
              { key: 'finnhub' as const,      label: 'Finnhub',       desc: '주식 시세 · 어닝 데이터' },
              { key: 'edgeConfig' as const,   label: 'Edge Config',   desc: 'Vercel 실시간 설정' },
              { key: 'eventsApi' as const,    label: 'Events API',    desc: '어닝 캘린더 엔드포인트' },
              { key: 'yahooFinance' as const, label: 'Yahoo Finance', desc: '미국 어닝 · EPS 예상' },
              { key: 'dart' as const,         label: 'DART',          desc: '국내 공시 · 분기실적' },
            ] as const).map((svc, i, arr) => {
              const s = metrics?.services?.[svc.key];
              return (
                <div key={svc.key} className="flex items-center justify-between px-5 py-3.5 border-b"
                  style={{ borderColor: i === arr.length - 1 ? 'transparent' : T.borderSofter }}>
                  <div className="flex items-center gap-3">
                    <StatusDot ok={s?.ok} loading={metricsLoading} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: T.textPrimary }}>{svc.label}</div>
                      <div className="text-[12px] mono mt-0.5" style={{ color: T.textDimmer }}>
                        {s?.error ? <span style={{ color: T.red }}>{s.error}</span> : svc.desc}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s && !metricsLoading && <LatencyBadge ms={s.latencyMs} T={T} />}
                    <span className="text-[13px] mono" style={{ color: s?.ok ? T.green : T.red }}>
                      {metricsLoading ? '확인 중' : s?.ok ? '● 정상' : '● 오류'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Runtime */}
            <div className="px-5 py-2.5 border-t border-b" style={{ borderColor: T.borderSoft }}>
              <span className="text-[12px] mono uppercase tracking-[0.25em]" style={{ color: T.textDimmer }}>Runtime</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4">
              {[
                { label: 'Node.js', value: metricsLoading ? '···' : metrics?.system.nodeVersion ?? '-', color: T.teal },
                { label: 'Region', value: metricsLoading ? '···' : metrics?.system.region ?? '-', color: T.textMuted },
                { label: 'Heap Used', value: metricsLoading ? '···' : metrics ? `${metrics.system.memory.heapUsedMB}MB` : '-', color: T.green },
                { label: 'Heap Total', value: metricsLoading ? '···' : metrics ? `${metrics.system.memory.heapTotalMB}MB` : '-', color: T.textFaint },
              ].map((item, i) => (
                <div key={item.label} className={`p-4 ${i < 3 ? 'border-r' : ''}`} style={{ borderColor: T.borderSofter }}>
                  <div className="text-[12px] mono uppercase tracking-[0.2em] mb-1.5" style={{ color: T.textDimmer }}>{item.label}</div>
                  <div className="text-xl font-light mono" style={{ color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
            {metricsError && (
              <div className="px-5 py-3 border-t text-[13px] mono" style={{ borderColor: T.borderSoft, color: T.red }}>
                ⚠ 메트릭 로드 실패: {metricsError}
              </div>
            )}
          </div>
        )}

        {/* ══ DEPLOY ══ */}
        {activeSection === 'deploy' && (
          <div className="admin-card" style={{ ...T.cardStyle }}>
            <SectionHeader title="배포 히스토리 · Vercel" T={T} action={
              <button onClick={fetchDeployments} disabled={deployLoading}
                className="flex items-center gap-1.5 text-[12px] mono uppercase tracking-[0.15em] px-2.5 py-1 border hover:opacity-70"
                style={{ borderColor: T.border, color: T.textFaint, opacity: deployLoading ? 0.5 : 1 }}>
                <RefreshCw size={11} className={deployLoading ? 'animate-spin' : ''} /> 새로고침
              </button>
            } />
            {deployError && (
              <div className="px-5 py-3 border-b text-[13px] mono" style={{ borderColor: T.borderSoft, color: T.red }}>
                ⚠ {deployError} — VERCEL_PROJECT_ID 환경변수를 추가하면 해당 프로젝트만 조회됩니다.
              </div>
            )}
            <div className="divide-y" style={{ borderColor: T.borderSofter }}>
              {deployLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-4"><Skeleton T={T} /></div>
                ))
              ) : deployments.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px] mono" style={{ color: T.textDimmer }}>
                  {deployError ? '조회 실패' : '배포 내역 없음'}
                </div>
              ) : (
                deployments.map(dep => (
                  <div key={dep.uid} className="flex items-start gap-4 px-5 py-4">
                    <div className="shrink-0 mt-0.5">
                      <span className="text-[11px] mono px-2 py-0.5" style={{ color: deployStateColor(dep.state), border: `1px solid ${deployStateColor(dep.state)}40`, background: `${deployStateColor(dep.state)}10` }}>
                        {deployStateLabel(dep.state)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate" style={{ color: T.textPrimary }}>
                        {dep.meta?.githubCommitMessage ?? dep.name}
                      </div>
                      <div className="text-[11px] mono mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: T.textDimmer }}>
                        {dep.meta?.githubCommitRef && <span style={{ color: T.teal }}>{dep.meta.githubCommitRef}</span>}
                        {dep.meta?.githubCommitAuthorName && <span>{dep.meta.githubCommitAuthorName}</span>}
                        <span>{fmtDate(new Date(dep.createdAt).toISOString())}</span>
                        {dep.readyAt && dep.createdAt && (
                          <span>{Math.round((dep.readyAt - dep.createdAt) / 1000)}s</span>
                        )}
                      </div>
                    </div>
                    <a href={`https://${dep.url}`} target="_blank" rel="noopener"
                      className="shrink-0 text-[11px] mono hover:opacity-70" style={{ color: T.textDimmer }}>
                      <ChevronRight size={14} />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ══ SECURITY ══ */}
        {activeSection === 'security' && (
          <div className="space-y-5">
            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="권한 매트릭스" T={T} />
              <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: T.borderSoft }}>
                {[
                  { role: 'Owner', scope: '배포 · 설정 · 릴리즈', status: 'Full' },
                  { role: 'Editor', scope: '용어 초안 · QA · 패치노트', status: 'Write' },
                  { role: 'Viewer', scope: '분석 · 감사 로그', status: 'Read' },
                ].map(item => (
                  <div key={item.role} className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xl" style={{ color: T.textPrimary }}>{item.role}</span>
                      <span className="text-[10px] mono uppercase tracking-[0.18em] px-2 py-0.5 border"
                        style={{ borderColor: T.border, color: item.role === 'Owner' ? T.accent : T.textMuted }}>
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-3 text-sm leading-6" style={{ color: T.textMuted }}>{item.scope}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="감사 로그" T={T} />
              <div className="divide-y" style={{ borderColor: T.borderSofter }}>
                {auditRows.map(row => (
                  <div key={`${row.who}-${row.action}`} className="px-5 py-3 grid grid-cols-[90px_1fr_auto_auto] gap-3 items-center">
                    <span className="mono text-[12px]" style={{ color: T.accent }}>{row.who}</span>
                    <span className="text-sm" style={{ color: T.textMuted }}>{row.action}</span>
                    <span className="mono text-[11px]" style={{ color: T.textDimmer }}>{row.at}</span>
                    <span className="mono text-[10px] px-2 py-0.5 border" style={{ color: row.risk === 'MID' ? T.accent : T.green, borderColor: T.border }}>{row.risk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="로그인 이력" T={T} action={
                <button onClick={fetchLoginHistory} disabled={historyLoading}
                  className="flex items-center gap-1.5 text-[12px] mono uppercase tracking-[0.15em] px-2.5 py-1 border hover:opacity-70"
                  style={{ borderColor: T.border, color: T.textFaint, opacity: historyLoading ? 0.5 : 1 }}>
                  <RefreshCw size={11} className={historyLoading ? 'animate-spin' : ''} /> 새로고침
                </button>
              } />
              <div className="divide-y" style={{ borderColor: T.borderSofter }}>
                {historyLoading ? (
                  <div className="p-5"><Skeleton T={T} /></div>
                ) : loginHistory.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[13px] mono" style={{ color: T.textDimmer }}>로그인 이력 없음</div>
                ) : (
                  loginHistory.map((rec, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3">
                      <span className="shrink-0">
                        {rec.success
                          ? <Check size={13} style={{ color: T.green }} />
                          : <X size={13} style={{ color: T.red }} />}
                      </span>
                      <span className="mono text-[12px] w-36 shrink-0" style={{ color: rec.success ? T.textMuted : T.red }}>
                        {fmtDate(rec.at)}
                      </span>
                      <span className="mono text-[12px] w-32 shrink-0" style={{ color: T.textDimmer }}>{rec.ip}</span>
                      <span className="mono text-[11px] flex-1 truncate" style={{ color: T.textDimmest }}>{rec.ua}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ STATS ══ */}
        {activeSection === 'stats' && (
          <div className="space-y-5">
            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="Content Statistics" T={T} />
              <div className="grid grid-cols-2 md:grid-cols-4">
                {[
                  { label: 'Terms',       value: stats.terms,       color: T.accent },
                  { label: 'Categories',  value: stats.categories,  color: T.red },
                  { label: 'Calculators', value: stats.calcs,       color: T.green },
                  { label: 'Calc Groups', value: stats.calcGroups,  color: T.teal },
                ].map((s, i) => (
                  <div key={s.label} className={`p-5 ${i < 3 ? 'border-r' : ''} ${i < 2 ? 'border-b md:border-b-0' : ''} md:[&:not(:last-child)]:border-r`}
                    style={{ borderColor: T.borderSoft }}>
                    <div className="text-[13px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textFaint }}>{s.label}</div>
                    <div className="text-4xl font-light tracking-tight" style={{ color: s.color }}>{String(s.value).padStart(3, '0')}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="Deployment" T={T} />
              <div className="p-5 grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-[13px] mono uppercase tracking-[0.2em] mb-1.5" style={{ color: T.textFaint }}>Domain</div>
                  <div style={{ color: T.textPrimary }}>stockwiki.kr</div>
                </div>
                <div>
                  <div className="text-[13px] mono uppercase tracking-[0.2em] mb-1.5" style={{ color: T.textFaint }}>Last Loaded</div>
                  <div className="mono" style={{ color: T.textPrimary }}>{new Date().toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'medium' })}</div>
                </div>
              </div>
            </div>

            <div className="text-center py-4">
              <div className="text-[13px] mono uppercase tracking-[0.3em]" style={{ color: T.textDimmer }}>Restricted Area · Designed by Ones</div>
            </div>
          </div>
        )}

        {activeSection === 'changelog' && (
          <div className="space-y-5">
            {/* 버전 요약 카드 */}
            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="Version" T={T} action={
                <a href="/changelog" target="_blank" rel="noreferrer"
                  className="text-[11px] mono uppercase tracking-[0.15em] px-3 py-1 border"
                  style={{ color: T.textMuted, borderColor: T.border }}>
                  Public Page ↗
                </a>
              } />
              <div className="grid grid-cols-3 divide-x" style={{ borderColor: T.borderSoft }}>
                <div className="p-5">
                  <div className="text-[11px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textFaint }}>Current</div>
                  <div className="text-3xl font-light mono tracking-tight" style={{ color: T.accent }}>v{CURRENT_VERSION}</div>
                </div>
                <div className="p-5">
                  <div className="text-[11px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textFaint }}>Total Releases</div>
                  <div className="text-3xl font-light mono tracking-tight" style={{ color: T.text }}>{CHANGELOG.length}</div>
                </div>
                <div className="p-5">
                  <div className="text-[11px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textFaint }}>Latest Date</div>
                  <div className="text-xl font-light mono" style={{ color: T.text }}>{CHANGELOG[0].date}</div>
                </div>
              </div>
            </div>

            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="정식 릴리즈 관리자" T={T} action={
                <button onClick={() => { setReleaseReady(r => !r); showToast(releaseReady ? '릴리즈 승인 해제' : '릴리즈 승인 표시됨'); }}
                  className="text-[11px] mono uppercase tracking-[0.15em] px-3 py-1 border"
                  style={{ color: releaseReady ? T.green : T.textMuted, borderColor: releaseReady ? `${T.green}66` : T.border }}>
                  {releaseReady ? 'Approved' : 'Mark Ready'}
                </button>
              } />
              <div className="grid lg:grid-cols-[320px_1fr] divide-y lg:divide-y-0 lg:divide-x" style={{ borderColor: T.borderSoft }}>
                <div className="p-5">
                  <div className="text-[11px] mono uppercase tracking-[0.25em]" style={{ color: T.textFaint }}>Release Gate</div>
                  <div className="mt-4 text-5xl mono font-light" style={{ color: releaseScore === releaseChecks.length || releaseReady ? T.green : T.accent }}>
                    {releaseScore}/{releaseChecks.length}
                  </div>
                  <div className="mt-4 space-y-2">
                    {releaseChecks.map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        {item.ok || releaseReady ? <Check size={13} style={{ color: T.green }} /> : <Clock size={13} style={{ color: T.accent }} />}
                        <span className="text-sm flex-1" style={{ color: T.textMuted }}>{item.label}</span>
                        <span className="mono text-[11px]" style={{ color: T.textDimmer }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 grid md:grid-cols-2 gap-4">
                  <div className="border rounded-sm p-4" style={{ borderColor: T.border, background: T.bgSection }}>
                    <div className="text-[11px] mono uppercase tracking-[0.25em] mb-3" style={{ color: T.accent }}>Admin Note</div>
                    <p className="text-sm leading-7" style={{ color: T.textMuted }}>
                      운영자용에는 데이터 변경 범위, QA 결과, 배포 체크, 롤백 포인트를 남깁니다. 내부 판단 근거가 중심입니다.
                    </p>
                  </div>
                  <div className="border rounded-sm p-4" style={{ borderColor: T.border, background: T.bgCard }}>
                    <div className="text-[11px] mono uppercase tracking-[0.25em] mb-3" style={{ color: T.teal }}>Public Note</div>
                    <p className="text-sm leading-7" style={{ color: T.textMuted }}>
                      공개용에는 사용자에게 보이는 개선점, 사전/계산기/모바일 경험 변화만 간결하게 노출합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 패치 히스토리 */}
            <div className="admin-card" style={{ ...T.cardStyle }}>
              <SectionHeader title="Patch History" T={T} />
              <div className="divide-y" style={{ borderColor: T.borderSoft }}>
                {CHANGELOG.map((entry, idx) => {
                  const TYPE_COLOR: Record<string, string> = {
                    major: T.accent, feature: '#6ea8c8', fix: '#8bc87a', perf: '#c87a8b',
                  };
                  const col = TYPE_COLOR[entry.type] || T.textMuted;
                  return (
                    <div key={entry.version} className="px-5 py-4">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="mono text-[15px] font-semibold" style={{ color: idx === 0 ? T.accent : T.textPrimary }}>
                          v{entry.version}
                        </span>
                        {idx === 0 && (
                          <span className="text-[9px] mono tracking-[0.15em] px-2 py-0.5 font-bold"
                            style={{ background: T.accent, color: '#0a0a0a' }}>LATEST</span>
                        )}
                        <span className="text-[9px] mono tracking-[0.15em] px-2 py-0.5 border uppercase"
                          style={{ color: col, borderColor: `${col}44`, background: `${col}18` }}>
                          {entry.type}
                        </span>
                        <span className="text-[11px] mono ml-auto" style={{ color: T.textDimmer }}>{entry.date}</span>
                      </div>
                      <div className="text-[13px] mb-2" style={{ color: T.textMuted }}>{entry.title}</div>
                      <ul className="space-y-1">
                        {entry.items.map((item, i) => (
                          <li key={i} className="flex gap-2 text-[12px]" style={{ color: T.textFaint }}>
                            <span style={{ color: col, flexShrink: 0 }}>▸</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-4 md:right-6 px-4 py-3 text-sm mono uppercase tracking-[0.15em] z-50 admin-card"
          style={{
            ...T.cardStyle,
            borderLeft: `3px solid ${toast.kind === 'ok' ? T.green : T.red}`,
            color: toast.kind === 'ok' ? T.green : T.red,
            boxShadow: `0 0 24px ${toast.kind === 'ok' ? T.green : T.red}28, 0 8px 32px rgba(0,0,0,0.5)`,
            animation: 'resultFadeIn .35s cubic-bezier(.16,1,.3,1) both',
          }}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
