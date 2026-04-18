'use client';

import React, { useState, useMemo, useEffect, useRef, createContext, useContext } from 'react';

// 계산기 세션 key prefix — 비교 모드에서 B 패널이 독립적인 state를 갖도록
const CalcPrefixContext = createContext<string>('');
import { Search, Calculator, BookOpen, ChevronRight, ChevronLeft, X, ArrowUpRight, Star, Clock, Menu, Link as LinkIcon, Copy, Check, Share2, CalendarDays, Info, Keyboard, LayoutDashboard, TrendingUp } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TERMS, CATEGORIES, CATEGORY_COLORS, HUE_FAMILIES, CATEGORY_FAMILY } from '@/data/terms';
import { CALC_CATEGORIES } from '@/data/calcs';
import EventsView from '@/components/EventsView';

// sessionStorage와 연동하는 useState 헬퍼
// CalcPrefixContext가 있으면 key에 prefix를 붙여 A/B 시나리오 독립 state 보장
function useSessionState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const prefix = useContext(CalcPrefixContext);
  const fullKey = prefix ? `${prefix}_${key}` : key;
  const [val, setVal] = useState<T>(() => {
    try {
      const s = typeof window !== 'undefined' ? sessionStorage.getItem(fullKey) : null;
      return s !== null ? JSON.parse(s) : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { sessionStorage.setItem(fullKey, JSON.stringify(val)); } catch {}
  }, [fullKey, val]);
  return [val, setVal];
}

type Features = {
  glossary: boolean;
  calculator: boolean;
  commandK: boolean;
  events?: boolean;
};

// example 문자열 → KPI 3칸 파싱
// "주가 50,000원, EPS 5,000원 → PER = 10배" 패턴 추출
function parseExampleKPI(example: string, formula: string): { label: string; value: string }[] | null {
  if (!example) return null;
  // "→" 기준으로 입력부 / 결과부 분리
  const arrowIdx = example.indexOf('→');
  if (arrowIdx === -1) return null;
  const inputPart = example.slice(0, arrowIdx).trim();
  const resultPart = example.slice(arrowIdx + 1).trim();
  // 입력부: 쉼표·및 구분으로 최대 2개 추출
  // 각 청크에서 숫자+단위 추출
  function extractChunks(s: string): { label: string; value: string }[] {
    return s.split(/[,，]/).map(chunk => {
      const m = chunk.match(/^(.+?)\s+([\d,.]+\s*[%배조억원B만T\w]*)\s*$/);
      if (m) return { label: m[1].trim().replace(/^(주가|EPS|BPS|ROE|시총|순이익|자본|자산|영업익|매출|PER|성장률)\s*/,'').replace(/\s*(은|는|이|가|을|를)\s*$/, ''), value: m[2].trim() };
      const m2 = chunk.match(/([\d,.]+\s*[%배조억원B만T\w]*)/);
      const label2 = chunk.replace(/[\d,.]+\s*[%배조억원B만T\w]*/g,'').trim().replace(/[,，\s]+$/,'').replace(/^\s*/,'') || '입력';
      return m2 ? { label: label2, value: m2[1].trim() } : null;
    }).filter(Boolean) as { label: string; value: string }[];
  }
  const inputs = extractChunks(inputPart).slice(0, 2);
  if (inputs.length === 0) return null;
  // 결과부: "= 10배", "= 20%" 형태에서 결과값 추출
  const resultM = resultPart.match(/=?\s*([\d,.]+\s*[%배조억원B만T배\w]*)/) ;
  if (!resultM) return null;
  const resultLabel = resultPart.replace(/=?\s*[\d,.]+\s*[%배조억원B만T배\w]*/,'').trim().replace(/^=\s*/,'') || formula.split('=')[0]?.trim() || '결과';
  const result = { label: resultLabel || '결과', value: resultM[1].trim() };
  const items = [...inputs, result];
  if (items.length < 2) return null;
  return items;
}

// 검색 키워드 하이라이팅 컴포넌트
function Highlight({ text, query, color }: { text: string; query: string; color: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: color, color: 'inherit', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function StockWiki({ features }: { features?: Features }) {
  const feat = features ?? { glossary: true, calculator: true, commandK: true, events: true };
  const searchParams = useSearchParams();
  const router = useRouter();

  // 접근 가능한 탭 결정 — 활성화된 탭 중 첫 번째를 기본값으로
  const tabFromUrl = searchParams?.get('tab');
  const validTabs = ['home', 'glossary', 'calculator', 'events'] as const;
  const initialTabFromUrl = validTabs.includes(tabFromUrl as any) ? tabFromUrl : 'home';
  const isRequestedTabAvailable = initialTabFromUrl === 'home' ? true : feat[initialTabFromUrl as keyof Features];
  const fallbackTab = 'home';
  const initialTab = isRequestedTabAvailable ? initialTabFromUrl : fallbackTab;
  const initialCalc = searchParams?.get('calc') || 'per';
  const termFromUrl = searchParams?.get('term');
  const catFromUrl = searchParams?.get('cat');

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    catFromUrl && [...CATEGORIES, '★ 즐겨찾기'].includes(catFromUrl) ? catFromUrl : '전체'
  );
  const [selectedCalc, setSelectedCalc] = useState(initialCalc);
  const [selectedTerm, setSelectedTerm] = useState<any>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favMemos, setFavMemos] = useState<Record<string, string>>({}); // 즐겨찾기 메모
  const [recent, setRecent] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCommandK, setShowCommandK] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [toasts, setToasts] = useState<{ id: number; msg: string; type?: 'success'|'info' }[]>([]);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const sidebarPanelRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string, type: 'success'|'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
  };

  // 테마 초기화 (localStorage)
  useEffect(() => {
    const saved = localStorage.getItem('stockwiki_theme');
    const dark = saved ? saved === 'dark' : true;
    setIsDark(dark);
    document.documentElement.classList.toggle('light', !dark);
  }, []);

  // URL의 term 파라미터에서 용어 로드 (마운트 시)
  useEffect(() => {
    if (termFromUrl) {
      const t = TERMS.find(x => x.id === termFromUrl);
      if (t) openTerm(t);
    }
  }, []); // 마운트 1회만

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('light', !next);
    localStorage.setItem('stockwiki_theme', next ? 'dark' : 'light');
  };

  // 즐겨찾기 초기화 (마운트 시)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('stockwiki_favorites');
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    } catch {}
    try {
      const memos = localStorage.getItem('stockwiki_fav_memos');
      if (memos) setFavMemos(JSON.parse(memos));
    } catch {}
  }, []);

  // 즐겨찾기 저장 (변경 시)
  useEffect(() => {
    try {
      localStorage.setItem('stockwiki_favorites', JSON.stringify([...favorites]));
    } catch {}
  }, [favorites]);

  // 즐겨찾기 메모 저장
  useEffect(() => {
    try {
      localStorage.setItem('stockwiki_fav_memos', JSON.stringify(favMemos));
    } catch {}
  }, [favMemos]);

  const updateFavMemo = (id: string, memo: string) => {
    setFavMemos(prev => ({ ...prev, [id]: memo }));
  };

  // 최근 본 용어 초기화 (마운트 시)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('stockwiki_recent');
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        const terms = ids.map(id => TERMS.find(t => t.id === id)).filter(Boolean);
        setRecent(terms);
      }
    } catch {}
  }, []);

  // 최근 본 용어 저장 (변경 시)
  useEffect(() => {
    try {
      localStorage.setItem('stockwiki_recent', JSON.stringify(recent.map(t => t.id)));
    } catch {}
  }, [recent]);

  // 모달 열림/닫힘 시 배경 스크롤 제어
  useEffect(() => {
    if (selectedTerm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedTerm]);

  // 검색 디바운스
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 150);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // 키보드 단축키
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (feat.commandK) setShowCommandK(prev => !prev);
      }
      if (e.key === '/' && (document.activeElement as HTMLElement)?.tagName !== 'INPUT' && (document.activeElement as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSelectedTerm(null);
        setShowCommandK(false);
        setSidebarOpen(false);
        setShowGuide(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // feat은 안정적인 객체이므로 ref 패턴 없이 feat.commandK만 의존
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feat.commandK]);

  const toggleFav = (id) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openTerm = (term) => {
    lastFocusRef.current = document.activeElement as HTMLElement;
    setSelectedTerm(term);
    setRecent(prev => {
      const filtered = prev.filter(t => t.id !== term.id);
      return [term, ...filtered].slice(0, 5);
    });
    // URL에 term 파라미터 추가
    const params = new URLSearchParams(window.location.search);
    params.set('term', term.id);
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const closeTerm = () => {
    setSelectedTerm(null);
    const params = new URLSearchParams(window.location.search);
    params.delete('term');
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
    // 포커스 복원
    setTimeout(() => lastFocusRef.current?.focus(), 50);
  };

  const changeCategory = (cat: string) => {
    setSelectedCategory(cat);
    const params = new URLSearchParams(window.location.search);
    if (cat === '전체') {
      params.delete('cat');
    } else {
      params.set('cat', cat);
    }
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  };

  // 홈으로 돌아가기 (로고 클릭 시)
  const goHome = () => {
    setActiveTab(feat.glossary ? 'glossary' : (feat.calculator ? 'calculator' : 'none'));
    setSelectedCategory('전체');
    setSearchQuery('');
    setSelectedTerm(null);
    setShowCommandK(false);
    setSidebarOpen(false);
    setSelectedCalc('');
    // URL 파라미터 제거
    if (typeof window !== 'undefined') {
      router.replace('/', { scroll: false });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const filteredTerms = useMemo(() => {
    return TERMS.filter(t => {
      const q = debouncedQuery.toLowerCase();
      const matchSearch = !q ||
        t.name.toLowerCase().includes(q) ||
        t.fullName.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.en.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      const matchCat = selectedCategory === '전체' ||
        (selectedCategory === '★ 즐겨찾기' && favorites.has(t.id)) ||
        t.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [debouncedQuery, selectedCategory, favorites]);

  const categoriesWithFav = favorites.size > 0
    ? ['전체', '★ 즐겨찾기', ...CATEGORIES.slice(1)]
    : CATEGORIES;

  // 다크/라이트 모드 색상 팔레트
  const T = isDark ? {
    bgPage:      '#1a1a1a',
    bgSurface:   '#141414',
    bgCard:      '#0f0f0f',
    bgHover:     'rgba(255,255,255,0.04)',
    bgTabActive: '#e8e4d6',
    bgHeader:    'rgba(20,20,20,0.95)',
    bgOverlay:   'rgba(0,0,0,0.8)',
    bgOverlay2:  'rgba(0,0,0,0.7)',
    bgInput:     '#0d1f0d',
    textPrimary:   '#e8e4d6',
    textSecondary: '#d4d0c4',
    textMuted:     '#a8a49a',
    textFaint:     '#7a7a7a',
    textDimmer:    '#5a5a5a',
    textFooter:    '#6a6a6a',
    textTabActive: '#1a1a1a',
    border:      '#2a2a2a',
    borderSoft:  '#252525',
    borderMid:   '#3a3a3a',
    accent:      '#C89650',
    accentGreen: '#4A7045',
    accentGreenBg: '#0d1f0d',
    accentGreenText: '#c8d4c8',
    placeholder: '#5a5a5a',
    commandKSelected: '#1f1f1f',
    inputBg:     'transparent',
    marketImpactBg: '#0f0f0f',
  } : {
    bgPage:      '#f5f2eb',
    bgSurface:   '#fffef9',
    bgCard:      '#ece8df',
    bgHover:     'rgba(0,0,0,0.04)',
    bgTabActive: '#1a1a1a',
    bgHeader:    'rgba(245,242,235,0.95)',
    bgOverlay:   'rgba(0,0,0,0.5)',
    bgOverlay2:  'rgba(0,0,0,0.4)',
    bgInput:     '#edf5ec',
    textPrimary:   '#1a1a1a',
    textSecondary: '#2a2622',
    textMuted:     '#5a5550',
    textFaint:     '#888380',
    textDimmer:    '#aaa8a4',
    textFooter:    '#888380',
    textTabActive: '#f5f2eb',
    border:      '#d8d4c8',
    borderSoft:  '#e0ddd4',
    borderMid:   '#c8c4b8',
    accent:      '#a07030',
    accentGreen: '#3a5c36',
    accentGreenBg: '#edf5ec',
    accentGreenText: '#3a5c36',
    placeholder: '#aaa8a4',
    commandKSelected: '#ece8df',
    inputBg:     'transparent',
    marketImpactBg: '#ece8df',
  };

  return (
    <div className="min-h-screen" style={{ background: T.bgPage, color: T.textSecondary, fontFamily: "'Inter', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { -webkit-font-smoothing: antialiased; }
        .mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        input, button, select { font-family: inherit; color: inherit; }
        input:focus { outline: none; }
        input::placeholder { color: ${T.placeholder}; }
        .ball-joint { width: 8px; height: 8px; border-radius: 50%; background: #8a8a8a; display: inline-block; box-shadow: inset 0 1px 0 rgba(255,255,255,0.15); }
        .scroll-hide::-webkit-scrollbar { display: none; }
        .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 헤더 */}
      <header className="border-b sticky top-0 z-30" style={{ borderColor: T.border, background: T.bgHeader, backdropFilter: 'blur(8px)' }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <button
              onClick={goHome}
              className="flex items-baseline gap-2 md:gap-3 leading-none min-w-0 transition-opacity hover:opacity-80 cursor-pointer"
              title="홈으로"
              aria-label="홈으로 이동"
            >
              <span className="text-xl md:text-2xl font-light tracking-tight whitespace-nowrap" style={{ color: T.textPrimary }}>
                Stock<span style={{ color: T.accent, fontWeight: 500 }}>WiKi</span>
              </span>
              <span className="text-xs mono" style={{ color: T.textFaint }}>.kr</span>
              <span className="hidden lg:inline-block w-px h-4" style={{ background: T.border }}></span>
              <span className="hidden lg:inline-block text-[12px] tracking-[0.3em] mono uppercase" style={{ color: T.textFaint }}>Terms & Calculators</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {feat.commandK && (
              <button
                onClick={() => setShowCommandK(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 border text-xs"
                style={{ borderColor: T.border, color: T.textFaint }}
              >
                <Search size={12} />
                <span>빠른 검색</span>
                <span className="mono text-[12px] px-1.5 py-0.5 border" style={{ borderColor: T.border }}>⌘K</span>
              </button>
            )}
            {/* 다크/라이트 토글 */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 border transition-all hover:opacity-80"
              style={{ borderColor: T.border, color: T.textFaint, background: 'transparent' }}
              title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {isDark ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <div className="hidden lg:flex items-center gap-4 text-[13px] mono uppercase tracking-wider" style={{ color: T.textFaint }}>
              <span>{new Date().toLocaleDateString('ko-KR')}</span>
              <button
                onClick={() => setShowGuide(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 border transition-all hover:opacity-80"
                style={{ borderColor: T.border, color: T.textFaint, fontSize: '11px', letterSpacing: '0.15em' }}
                title="사용 가이드"
              >
                <span>?</span>
                <span>GUIDE</span>
              </button>
            </div>
            {/* 모바일: 검색 버튼 */}
            {feat.commandK && (
              <button
                onClick={() => setShowCommandK(true)}
                className="flex md:hidden items-center justify-center w-8 h-8 border"
                style={{ borderColor: T.border, color: T.textFaint }}
                aria-label="검색"
              >
                <Search size={15} />
              </button>
            )}
            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex md:hidden items-center justify-center w-8 h-8 border"
              style={{ borderColor: T.border, color: T.textFaint }}
              title="메뉴"
              aria-label="메뉴 열기"
            >
              <Menu size={16} />
            </button>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 hidden md:flex border-t overflow-x-auto scroll-hide" style={{ borderColor: T.border }}>
          {[
            { id: 'home',       label: '홈',       icon: LayoutDashboard, idx: '00', count: null },
            { id: 'glossary',   label: '금융 사전', icon: BookOpen,        idx: '01', count: TERMS.length },
            { id: 'calculator', label: '계산기',    icon: Calculator,      idx: '02', count: CALC_CATEGORIES.reduce((s, c) => s + c.calcs.length, 0) },
            { id: 'events',     label: '이벤트',    icon: CalendarDays,    idx: '03', count: null },
          ].filter(tab => tab.id === 'home' || feat[tab.id as keyof Features] !== false).map(tab => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 text-sm transition-all whitespace-nowrap"
                style={{
                  background: active ? T.bgTabActive : 'transparent',
                  color: active ? T.textTabActive : T.textMuted,
                }}
              >
                <span className="text-[12px] mono opacity-60">{tab.idx}</span>
                <Icon size={14} />
                <span className="font-medium">{tab.label}</span>
                {tab.count !== null && <span className="text-[12px] mono opacity-50">{tab.count}</span>}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 pt-5 md:pt-6 pb-24 md:pb-12 min-h-[calc(100vh-180px)]">
        {activeTab === 'home' && (
          <HomeView
            T={T}
            isDark={isDark}
            totalTerms={TERMS.length}
            recent={recent}
            favorites={favorites}
            categoryColors={CATEGORY_COLORS}
            setActiveTab={setActiveTab}
            setSelectedTerm={setSelectedTerm}
            setSelectedCalc={setSelectedCalc}
            setSearchQuery={setSearchQuery}
            searchRef={searchRef}
          />
        )}
        {activeTab === 'glossary' && feat.glossary && (
          <GlossaryView
            terms={filteredTerms}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchRef={searchRef}
            categories={categoriesWithFav}
            selectedCategory={selectedCategory}
            setSelectedCategory={changeCategory}
            selectedTerm={selectedTerm}
            setSelectedTerm={openTerm}
            closeTerm={closeTerm}
            totalCount={TERMS.length}
            categoryColors={CATEGORY_COLORS}
            favorites={favorites}
            toggleFav={toggleFav}
            favMemos={favMemos}
            updateFavMemo={updateFavMemo}
            recent={recent}
            T={T}
            isDark={isDark}
            showToast={showToast}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'calculator' && feat.calculator && (
          <CalculatorView
            selectedCalc={selectedCalc}
            setSelectedCalc={setSelectedCalc}
            T={T}
            isDark={isDark}
          />
        )}
        {activeTab === 'events' && feat.events !== false && (
          <EventsView T={T} />
        )}
      </main>

      {/* 모바일 사이드바 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          style={{ background: T.bgOverlay2 }}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            ref={sidebarPanelRef}
            className="relative w-[85vw] max-w-[320px] h-full flex flex-col overflow-y-auto"
            style={{ background: T.bgSurface, borderRight: `1px solid ${T.border}` }}
            onClick={e => e.stopPropagation()}
          >
            {/* 사이드바 헤더 — 오른쪽 스와이프로 닫기 */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b select-none"
              style={{ borderColor: T.border, touchAction: 'none' }}
              onTouchStart={e => {
                const panel = sidebarPanelRef.current;
                if (!panel) return;
                (panel as any)._swipeStartX = e.touches[0].clientX;
                (panel as any)._swipeStartY = e.touches[0].clientY;
              }}
              onTouchMove={e => {
                const panel = sidebarPanelRef.current;
                if (!panel || (panel as any)._swipeStartX == null) return;
                const dx = e.touches[0].clientX - (panel as any)._swipeStartX;
                const dy = Math.abs(e.touches[0].clientY - (panel as any)._swipeStartY);
                if (dx > 0 && dx > dy) {
                  panel.style.transform = `translateX(${Math.min(dx, 280)}px)`;
                  panel.style.transition = 'none';
                }
              }}
              onTouchEnd={e => {
                const panel = sidebarPanelRef.current;
                if (!panel) return;
                const dx = e.changedTouches[0].clientX - ((panel as any)._swipeStartX ?? 0);
                const dy = Math.abs(e.changedTouches[0].clientY - ((panel as any)._swipeStartY ?? 0));
                (panel as any)._swipeStartX = null;
                if (dx > 80 && dx > dy) {
                  panel.style.transform = 'translateX(100%)';
                  panel.style.transition = 'transform 0.22s ease';
                  setTimeout(() => setSidebarOpen(false), 200);
                } else {
                  panel.style.transform = '';
                  panel.style.transition = 'transform 0.2s ease';
                }
              }}
            >
              <button onClick={goHome} className="flex items-baseline gap-2">
                <span className="text-lg font-light tracking-tight" style={{ color: T.textPrimary }}>
                  Stock<span style={{ color: T.accent, fontWeight: 500 }}>WiKi</span>
                </span>
                <span className="text-xs mono" style={{ color: T.textFaint }}>.kr</span>
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-center w-8 h-8"
                style={{ color: T.textFaint }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 최근 본 용어 */}
            {recent.length > 0 && (
              <div className="px-4 py-3 border-b" style={{ borderColor: T.border }}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={11} style={{ color: T.textFaint }} />
                  <div className="text-[12px] mono uppercase tracking-[0.2em]" style={{ color: T.textFaint }}>최근 본 용어</div>
                </div>
                <div className="flex flex-col gap-0.5">
                  {recent.slice(0, 5).map(t => {
                    const color = CATEGORY_COLORS[t.category];
                    return (
                      <button
                        key={t.id}
                        onClick={() => { openTerm(t); setActiveTab('glossary'); setSidebarOpen(false); }}
                        className="flex items-center gap-2 px-2 py-2 text-xs text-left hover:bg-white/5 transition-colors"
                        style={{ color: T.textSecondary }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color?.bg }}></span>
                        <span className="font-medium">{t.name}</span>
                        <span className="ml-1" style={{ color: T.textFaint }}>{t.fullName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 빠른 검색 */}
            {feat.commandK && (
              <div className="px-4 py-3">
                <button
                  onClick={() => { setSidebarOpen(false); setShowCommandK(true); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 border text-sm"
                  style={{ borderColor: T.border, color: T.textFaint }}
                >
                  <Search size={14} />
                  <span>빠른 검색 (⌘K)</span>
                </button>
              </div>
            )}

            {/* 사용 가이드 */}
            <div className="px-4 py-3 border-b" style={{ borderColor: T.border }}>
              <button
                onClick={() => { setSidebarOpen(false); setShowGuide(true); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 border text-sm"
                style={{ borderColor: T.accent + '60', color: T.accent }}
              >
                <span className="text-base leading-none">?</span>
                <span>사용 가이드</span>
              </button>
            </div>

            {/* 테마 토글 */}
            <div className="mt-auto px-4 py-4 border-t" style={{ borderColor: T.border }}>
              <button
                onClick={() => { toggleTheme(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 border text-sm"
                style={{ borderColor: T.border, color: T.textFaint }}
              >
                {isDark ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
                <span>{isDark ? '라이트 모드' : '다크 모드'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showGuide && (
        <GuideDrawer onClose={() => setShowGuide(false)} T={T} isDark={isDark} />
      )}

      {/* 모바일 하단 탭바 */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t"
        style={{ background: T.bgHeader, borderColor: T.border, backdropFilter: 'blur(12px)' }}
      >
        {[
          { id: 'glossary', label: '금융 사전', icon: BookOpen },
          { id: 'calculator', label: '계산기', icon: Calculator },
          { id: 'events', label: '이벤트', icon: CalendarDays },
        ].filter(tab => feat[tab.id as keyof Features] !== false).map(tab => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all"
              style={{ color: active ? T.accent : T.textFaint }}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] mono tracking-wide">{tab.label}</span>
              {active && (
                <span
                  className="absolute top-0 inset-x-4 h-0.5"
                  style={{ background: T.accent }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {showCommandK && feat.commandK && (
        <CommandK
          terms={TERMS}
          onClose={() => setShowCommandK(false)}
          onSelect={(term) => {
            openTerm(term);
            setActiveTab('glossary');
            setShowCommandK(false);
          }}
          T={T}
        />
      )}

      <footer className="border-t" style={{ borderColor: T.border, background: T.bgSurface }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row md:justify-between md:items-center gap-3 text-[13px] mono uppercase tracking-wider" style={{ color: T.textFooter }}>
          <div className="flex items-center gap-4 flex-wrap">
            <span style={{ color: T.textMuted }}>
              Stock<span style={{ color: T.accent }}>WiKi</span>.kr
            </span>
            <span className="w-px h-3 hidden md:inline-block" style={{ background: T.border }}></span>
            <span>© {new Date().getFullYear()} · 정보 제공 목적 · 투자 권유 아님</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Designed by Ones</span>
          </div>
        </div>
      </footer>

      {/* 전역 토스트 */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="toast-in px-4 py-2.5 text-sm mono flex items-center gap-2 shadow-lg"
            style={{
              background: T.bgTabActive,
              color: T.textTabActive,
              minWidth: '180px',
              textAlign: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={13} />
            {toast.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CommandK 팔레트
// ─────────────────────────────────────────────
function CommandK({ terms, onClose, onSelect, T }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 포커스 트랩
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'input, button, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    el.addEventListener('keydown', trap);
    return () => el.removeEventListener('keydown', trap);
  }, []);

  const results = useMemo(() => {
    if (!q) return terms.slice(0, 8);
    const lower = q.toLowerCase();
    return terms.filter(t =>
      t.name.toLowerCase().includes(lower) ||
      t.fullName.toLowerCase().includes(lower) ||
      t.en.toLowerCase().includes(lower) ||
      t.category.toLowerCase().includes(lower)
    ).slice(0, 10);
  }, [q, terms]);

  useEffect(() => setIdx(0), [q]);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[idx]) onSelect(results[idx]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] p-4" style={{ background: T.bgOverlay2 }} onClick={onClose}>
      <div ref={containerRef} className="commandk-in w-full max-w-2xl border" style={{ background: T.bgSurface, borderColor: T.border }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: T.border }}>
          <Search size={16} style={{ color: T.textFaint }} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={handleKey}
            placeholder="용어 빠른 검색..."
            className="flex-1 bg-transparent text-base"
            style={{ color: T.textPrimary }}
          />
          <span className="text-[12px] mono px-2 py-1 border" style={{ borderColor: T.border, color: T.textFaint }}>ESC</span>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {results.map((t, i) => {
            const color = CATEGORY_COLORS[t.category];
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                onMouseEnter={() => setIdx(i)}
                className="w-full flex items-center gap-4 px-5 py-3 text-left transition-colors"
                style={{ background: i === idx ? T.commandKSelected : 'transparent' }}
              >
                <span className="text-[12px] mono px-2 py-1" style={{ background: color?.bg, color: color?.text }}>{t.category}</span>
                <span className="font-medium" style={{ color: T.textPrimary }}>{t.name}</span>
                <span className="text-sm" style={{ color: T.textFaint }}>{t.fullName}</span>
                <span className="ml-auto text-xs mono italic" style={{ color: T.textDimmer }}>{t.en}</span>
              </button>
            );
          })}
          {results.length === 0 && (
            <div className="px-5 py-8 text-center text-sm" style={{ color: T.textDimmer }}>결과 없음</div>
          )}
        </div>
        <div className="flex items-center gap-4 px-5 py-3 border-t text-[12px] mono uppercase" style={{ borderColor: T.border, color: T.textFaint }}>
          <span>↑↓ 이동</span>
          <span>↵ 선택</span>
          <span className="ml-auto">{results.length} results</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 용어 사전 뷰
// ─────────────────────────────────────────────
function GlossaryView({ terms, searchQuery, setSearchQuery, searchRef, categories, selectedCategory, setSelectedCategory, selectedTerm, setSelectedTerm, closeTerm, totalCount, categoryColors, favorites, toggleFav, favMemos, updateFavMemo, recent, T, isDark, showToast, setActiveTab }) {
  // ── 2단 카테고리 필터: family(1단) + sub(2단)
  const [selectedFamily, setSelectedFamily] = React.useState<string | null>(null);

  const FAMILY_LIST = [
    { id: 'fundamental', name: '펀더멘털',    en: 'FUNDAMENTAL' },
    { id: 'market',      name: '시장',        en: 'MARKET'      },
    { id: 'macro',       name: '경제',        en: 'ECON'        },
    { id: 'risk',        name: '리스크·퀀트', en: 'RISK'        },
    { id: 'derivatives', name: '파생',        en: 'DERIV'       },
    { id: 'trading',     name: '매매실전',    en: 'TRADING'     },
  ];

  // family 선택 시 sub-category 초기화
  const handleFamilyClick = (fid: string | null) => {
    setSelectedFamily(fid);
    setSelectedCategory('전체');
  };

  // family 필터링된 terms
  const familyFilteredTerms = React.useMemo(() => {
    if (!selectedFamily) return terms;
    return terms.filter(t => CATEGORY_FAMILY[t.category]?.family === selectedFamily);
  }, [terms, selectedFamily]);

  // 현재 family의 sub-categories
  const subCategories = React.useMemo(() => {
    if (!selectedFamily) return [];
    return categories.filter(cat =>
      cat !== '전체' && cat !== '★ 즐겨찾기' &&
      CATEGORY_FAMILY[cat]?.family === selectedFamily
    );
  }, [selectedFamily, categories]);

  // 최종 표시 terms
  const displayTerms = React.useMemo(() => {
    if (selectedCategory === '전체' || selectedCategory === '★ 즐겨찾기') return familyFilteredTerms;
    return familyFilteredTerms.filter(t => t.category === selectedCategory);
  }, [familyFilteredTerms, selectedCategory]);

  return (
    <div>
      <div className="mb-6 border-y" style={{ borderColor: T.border }}>
        <div className="flex items-center justify-end gap-3 py-2 border-b mono text-[12px] uppercase tracking-[0.2em] whitespace-nowrap" style={{ borderColor: T.border, color: T.textFaint }}>
          <span>§ Glossary</span>
          <span className="w-4 h-px" style={{ background: T.borderMid }}></span>
          <span>Index / 001</span>
        </div>
        <div className="grid grid-cols-4 gap-2 md:gap-6 py-2 mono text-[12px] uppercase tracking-[0.2em]">
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: T.textDimmer }}>Total</span><span style={{ color: T.textPrimary }}>{String(totalCount).padStart(3, '0')}</span></div>
          <div className="flex items-baseline gap-1 md:gap-2 min-w-0"><span style={{ color: T.textDimmer }}>Filter</span><span className="truncate" style={{ color: T.textPrimary }}>{selectedCategory === '전체' ? 'ALL' : selectedCategory.replace('★ ', '')}</span></div>
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: T.textDimmer }}>Shown</span><span style={{ color: T.textPrimary }}>{String(terms.length).padStart(3, '0')}</span></div>
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: T.textDimmer }}>Fav</span><span style={{ color: T.accent }}>{String(favorites.size).padStart(3, '0')}</span></div>
        </div>
      </div>

      {/* 최근 본 용어 */}
      {recent.length > 0 && !searchQuery && selectedCategory === '전체' && (
        <div className="mb-6 border" style={{ borderColor: T.border, background: T.bgSurface }}>
          <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: T.border }}>
            <Clock size={12} style={{ color: T.textFaint }} />
            <span className="text-[12px] mono uppercase tracking-[0.2em]" style={{ color: T.textFaint }}>최근 본 용어</span>
          </div>
          <div className="flex flex-wrap p-2 gap-1">
            {recent.map(t => {
              const color = categoryColors[t.category];
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTerm(t)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs border transition-all hover:bg-white/5"
                  style={{ borderColor: T.border, color: T.textSecondary }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: color?.bg }}></span>
                  <span className="font-medium">{t.name}</span>
                  <span style={{ color: T.textFaint }}>{t.fullName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 검색 */}
      <div className="mb-4 md:mb-6 flex border" style={{ borderColor: T.border }}>
        <div className="px-4 md:px-5 py-3 md:py-4 border-r flex items-center gap-2" style={{ borderColor: T.border, background: T.bgTabActive, color: T.textTabActive }}>
          <Search size={16} />
          <span className="hidden md:inline text-xs mono uppercase tracking-wider">Search</span>
        </div>
        <input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="검색 — 용어명 · 영문 · 설명"
          className="flex-1 px-4 md:px-5 py-3.5 md:py-4 bg-transparent text-sm md:text-base"
          style={{ color: T.textPrimary }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="px-4 md:px-5 border-l" style={{ borderColor: T.border, color: T.textMuted }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── 2단 카테고리 필터 ── */}
      <div className="mb-6 md:mb-10 border-y" style={{ borderColor: T.border }}>
        {/* 1단: family 6개 */}
        <div className="flex overflow-x-auto scroll-hide border-b" style={{ borderColor: T.border }}>
          <button
            onClick={() => handleFamilyClick(null)}
            className="shrink-0 px-4 py-2.5 text-xs mono uppercase tracking-[0.18em] border-r transition-all"
            style={{
              borderColor: T.border,
              background: !selectedFamily && selectedCategory === '전체' ? T.bgTabActive : 'transparent',
              color: !selectedFamily && selectedCategory === '전체' ? T.textTabActive : T.textMuted,
            }}
          >전체</button>
          {FAMILY_LIST.map(fam => {
            const ft = HUE_FAMILIES[fam.id as keyof typeof HUE_FAMILIES];
            const active = selectedFamily === fam.id;
            return (
              <button
                key={fam.id}
                onClick={() => handleFamilyClick(active ? null : fam.id)}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 text-xs mono uppercase tracking-[0.18em] border-r transition-all whitespace-nowrap"
                style={{
                  borderColor: T.border,
                  background: active ? ft.bg : 'transparent',
                  color: active ? ft.text : T.textMuted,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: active ? ft.text : ft.base }} />
                {fam.name}
                <span className="opacity-50 text-[10px]">{fam.en}</span>
              </button>
            );
          })}
          {/* 즐겨찾기 */}
          {categories.includes('★ 즐겨찾기') && (
            <button
              onClick={() => { handleFamilyClick(null); setSelectedCategory('★ 즐겨찾기'); }}
              className="shrink-0 px-4 py-2.5 text-xs mono uppercase tracking-[0.18em] border-r transition-all"
              style={{
                borderColor: T.border,
                background: selectedCategory === '★ 즐겨찾기' ? T.accent : 'transparent',
                color: selectedCategory === '★ 즐겨찾기' ? '#0a0a0a' : T.textMuted,
              }}
            >★ 즐겨찾기</button>
          )}
        </div>

        {/* 2단: sub-categories (family 선택 시만 노출) */}
        {selectedFamily && subCategories.length > 0 && (
          <div className="flex overflow-x-auto scroll-hide" style={{ background: T.bgSurface }}>
            <button
              onClick={() => setSelectedCategory('전체')}
              className="shrink-0 px-4 py-2 text-[11px] mono uppercase tracking-[0.2em] border-r transition-all"
              style={{
                borderColor: T.border,
                color: selectedCategory === '전체' ? HUE_FAMILIES[selectedFamily as keyof typeof HUE_FAMILIES].base : T.textDimmer,
                borderBottom: selectedCategory === '전체' ? `2px solid ${HUE_FAMILIES[selectedFamily as keyof typeof HUE_FAMILIES].base}` : '2px solid transparent',
              }}
            >전체</button>
            {subCategories.map(cat => {
              const active = selectedCategory === cat;
              const ft = HUE_FAMILIES[selectedFamily as keyof typeof HUE_FAMILIES];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(active ? '전체' : cat)}
                  className="shrink-0 px-4 py-2 text-[11px] mono uppercase tracking-[0.15em] border-r transition-all"
                  style={{
                    borderColor: T.border,
                    color: active ? ft.base : T.textDimmer,
                    borderBottom: active ? `2px solid ${ft.base}` : '2px solid transparent',
                  }}
                >{cat}</button>
              );
            })}
          </div>
        )}
      </div>

      {/* 용어 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l" style={{ borderColor: T.borderSoft }}>
        {displayTerms.map((term) => {
          const color = categoryColors[term.category];
          const isFav = favorites.has(term.id);
          return (
            <div
              key={term.id}
              className="border-r border-b transition-all group relative"
              style={{ borderColor: T.borderSoft, background: T.bgPage }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? '#202020' : '#ece0d0'}
              onMouseLeave={e => e.currentTarget.style.background = T.bgPage}
            >
              {/* 즐겨찾기 버튼 — 절대 위치 */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFav(term.id); }}
                className="absolute top-3 md:top-5 right-3 md:right-5 z-10 p-1.5"
                style={{ color: isFav ? T.accent : T.textDimmer }}
              >
                <Star size={14} fill={isFav ? T.accent : 'none'} />
              </button>
              {/* 전체 클릭 가능 영역 */}
              <button
                onClick={() => setSelectedTerm(term)}
                className="w-full text-left px-4 md:px-6 pt-4 md:pt-6 pb-4 md:pb-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] md:text-[12px] mono uppercase tracking-wider px-2 py-1" style={{ background: color?.bg, color: color?.text }}>
                    {term.category}
                  </span>
                  {term.detailed && (
                    <span className="text-[11px] mono uppercase tracking-wider px-1.5 py-0.5 border" style={{ borderColor: T.borderMid, color: T.textFaint }}>
                      심화
                    </span>
                  )}
                </div>
                <div className="text-xl md:text-2xl font-medium tracking-tight leading-tight mb-1 pr-8" style={{ color: T.textPrimary }}>
                  <Highlight text={term.name} query={searchQuery} color={T.accent + '55'} />
                </div>
                <div className="text-xs mono italic mb-3" style={{ color: T.textFaint }}>{term.en}</div>
                <div className="text-sm leading-relaxed line-clamp-2" style={{ color: T.textMuted }}>{term.description}</div>
                {/* 공식 strip */}
                {term.formula && (
                  <div className="mt-3 mono text-[11px] px-2 py-1.5 border-l-2 truncate" style={{ background: T.bgCard, borderColor: color?.bg || T.accent, color: T.textFaint }}>
                    ƒ {term.formula}
                  </div>
                )}
                {/* KPI 3칸 — example 파싱 인라인 예시 */}
                {(() => {
                  const kpi = parseExampleKPI(term.example, term.formula);
                  if (!kpi || kpi.length < 2) return null;
                  const items = kpi.slice(0, 3);
                  return (
                    <div className="mt-2 grid gap-px border" style={{ gridTemplateColumns: `repeat(${items.length},1fr)`, borderColor: T.border, background: T.border }}>
                      {items.map((item, ki) => (
                        <div key={ki} className="flex flex-col gap-0.5 px-2 py-1.5" style={{ background: T.bgCard }}>
                          <span className="mono text-[9px] uppercase tracking-[0.15em] truncate" style={{ color: T.textDimmer }}>{item.label}</span>
                          <span className="mono text-[12px] font-medium leading-none truncate" style={{ color: ki === items.length - 1 ? (color?.bg || T.accent) : T.textSecondary }}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {/* 관련 용어 chips */}
                {term.related && term.related.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {term.related.slice(0, 3).map((relId: string) => {
                      const relTerm = TERMS.find(t => t.id === relId);
                      if (!relTerm) return null;
                      return (
                        <span key={relId} className="text-[10px] mono px-1.5 py-0.5 border" style={{ borderColor: T.border, color: T.textDimmer }}>
                          {relTerm.name}
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="mt-3 md:mt-4 flex items-center gap-1 text-[12px] mono uppercase tracking-wider" style={{ color: T.textDimmer }}>
                  <span>자세히</span>
                  <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {terms.length === 0 && (
        <div className="text-center py-16 md:py-20 border-x border-b" style={{ borderColor: T.borderSoft }}>
          <div className="text-xl md:text-2xl font-light italic" style={{ color: T.textDimmer }}>검색 결과 없음</div>
          <div className="text-xs mono mt-2 uppercase tracking-wider" style={{ color: T.textFaint }}>No Results Found</div>
        </div>
      )}

      {selectedTerm && (
        <TermModal
          term={selectedTerm}
          termList={terms}
          onClose={closeTerm}
          categoryColors={categoryColors}
          favorites={favorites}
          toggleFav={toggleFav}
          favMemos={favMemos}
          updateFavMemo={updateFavMemo}
          T={T}
          showToast={showToast}
          onNavigate={(id) => {
            const t = TERMS.find(x => x.id === id);
            if (t) setSelectedTerm(t);
          }}
          onNavigateCalc={() => {
            closeTerm();
            if (setActiveTab) setActiveTab('calculator');
          }}
          onPrev={() => {
            const idx = terms.findIndex(t => t.id === selectedTerm.id);
            if (idx > 0) setSelectedTerm(terms[idx - 1]);
          }}
          onNext={() => {
            const idx = terms.findIndex(t => t.id === selectedTerm.id);
            if (idx < terms.length - 1) setSelectedTerm(terms[idx + 1]);
          }}
        />
      )}
    </div>
  );
}

function TermModal({ term, termList, onClose, categoryColors, favorites, toggleFav, favMemos, updateFavMemo, onNavigate, onNavigateCalc, onPrev, onNext, T, showToast }: any): JSX.Element {
  const isFav = favorites.has(term.id);
  const memo = favMemos?.[term.id] || '';
  const [memoText, setMemoText] = useState(memo);
  const [memoSaved, setMemoSaved] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const saveMemo = () => {
    updateFavMemo?.(term.id, memoText);
    setMemoSaved(true);
    setTimeout(() => setMemoSaved(false), 1500);
    showToast?.('메모 저장됨');
  };

  // 모바일: 드래그 다운으로 닫기
  const handleTouchStart = (e: React.TouchEvent) => {
    const el = modalRef.current;
    if (!el) return;
    (el as any)._touchStartY = e.touches[0].clientY;
    (el as any)._touchStartScrollTop = el.scrollTop;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const el = modalRef.current;
    if (!el) return;
    const dy = e.touches[0].clientY - ((el as any)._touchStartY ?? 0);
    const startScroll = (el as any)._touchStartScrollTop ?? 0;
    // 최상단에서 아래로 드래그할 때만
    if (dy > 0 && startScroll <= 0) {
      el.style.transform = `translateY(${Math.min(dy * 0.5, 120)}px)`;
      el.style.transition = 'none';
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const el = modalRef.current;
    if (!el) return;
    const dy = e.changedTouches[0].clientY - ((el as any)._touchStartY ?? 0);
    const startScroll = (el as any)._touchStartScrollTop ?? 0;
    if (dy > 80 && startScroll <= 0) {
      el.style.transform = 'translateY(100%)';
      el.style.transition = 'transform 0.25s ease';
      setTimeout(() => onClose(), 220);
    } else {
      el.style.transform = '';
      el.style.transition = 'transform 0.2s ease';
    }
  };
  const relatedTerms = term.related?.map(id => TERMS.find(t => t.id === id)).filter(Boolean) || [];
  const hasDetailed = !!term.detailed;
  const hasRelations = term.relations && Object.keys(term.relations).length > 0;
  const hasImpact = !!term.marketImpact;
  const hasEasy = !!term.easy;

  const currentIdx = termList ? termList.findIndex(t => t.id === term.id) : -1;
  const hasPrev = currentIdx > 0;
  const hasNext = termList && currentIdx < termList.length - 1;
  const total = termList ? termList.length : 0;

  // 용어 비교 상태
  const [compareMode, setCompareMode] = useState(false);
  const [compareTerm, setCompareTerm] = useState<any>(null);
  const [compareSearch, setCompareSearch] = useState('');
  const compareResults = useMemo(() => {
    if (!compareSearch) return relatedTerms.slice(0, 6);
    const q = compareSearch.toLowerCase();
    return TERMS.filter(t =>
      t.id !== term.id &&
      (t.name.toLowerCase().includes(q) || t.fullName.toLowerCase().includes(q) || t.en.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [compareSearch, term.id, relatedTerms]);

  // 키보드 ← → 네비게이션
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (compareMode) return; // 비교 모드에서는 화살표 비활성
      if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
      if (e.key === 'ArrowRight' && hasNext) onNext?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasPrev, hasNext, onPrev, onNext, compareMode]);

  // Scrollspy — 본문 섹션 교차 관찰
  const [activeTocId, setActiveTocId] = useState<string>('sec-overview');
  const mainScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = mainScrollRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      entries => {
        // 가장 위에 있는 intersecting 섹션을 활성으로
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveTocId(visible[0].target.id);
      },
      { root: container, threshold: 0.25, rootMargin: '0px 0px -40% 0px' }
    );
    const sections = container.querySelectorAll('[id^="sec-"]');
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, [term.id]);

  return (
    <div
      className="modal-overlay-in fixed inset-0 z-50 flex md:items-center md:justify-center md:p-4 items-end"
      style={{ background: T.bgOverlay }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="modal-panel-in w-full md:max-w-5xl border flex flex-col"
        style={{
          background: T.bgSurface,
          borderColor: T.border,
          maxHeight: '92vh',
          borderRadius: '0',
        }}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 모바일 드래그 핸들 */}
        <div className="md:hidden flex justify-center pt-3 pb-1" style={{ touchAction: 'none' }}>
          <div className="w-10 h-1 rounded-full" style={{ background: T.borderMid }} />
        </div>
        <div
          className="px-4 md:px-8 py-4 md:py-5 flex items-center justify-between border-b sticky top-0 z-10"
          style={{ background: categoryColors[term.category]?.bg, color: categoryColors[term.category]?.text, borderColor: T.border }}
        >
          <div className="flex items-center gap-2 md:gap-3">
            <span className="ball-joint hidden sm:inline-block" style={{ background: categoryColors[term.category]?.text }}></span>
            <span className="text-[12px] mono uppercase tracking-[0.3em]">{term.category}</span>
            {total > 0 && (
              <span className="text-[12px] mono opacity-60 hidden sm:inline">
                {currentIdx + 1} / {total}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 md:gap-3">
            <button onClick={() => toggleFav(term.id)} style={{ color: 'inherit' }} title="이 용어 즐겨찾기">
              <Star size={15} fill={isFav ? 'currentColor' : 'none'} />
            </button>
            {/* 비교 버튼 */}
            <button
              onClick={() => { setCompareMode(m => !m); setCompareTerm(null); setCompareSearch(''); }}
              className="flex items-center gap-1 text-[12px] mono px-1.5 md:px-2 py-1 border transition-all"
              style={{
                borderColor: compareMode ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
                background: compareMode ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: 'inherit',
              }}
              title="다른 용어와 비교"
            >
              <span className="hidden sm:inline">비교</span>
              <span className="sm:hidden">≡</span>
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const url = `${window.location.origin}/?term=${term.id}`;
                if (navigator.share && /Mobi/i.test(navigator.userAgent)) {
                  await navigator.share({ title: term.name, text: term.fullName, url });
                } else {
                  await navigator.clipboard.writeText(url);
                  showToast?.('링크 복사됨');
                }
              }}
              style={{ color: 'inherit' }}
              title="이 용어 공유"
            >
              <Share2 size={15} />
            </button>
            <button onClick={onClose} className="flex items-center justify-center w-10 h-10 md:w-7 md:h-7 shrink-0"><X size={18} /></button>
          </div>
        </div>

        {/* ── 2단 바디: 본문 + 사이드 (md 이상) ── */}
        <div className="flex flex-1 min-h-0">

          {/* 본문 스크롤 영역 */}
          <div ref={mainScrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 min-w-0">

          {/* 비교 모드 */}
          {compareMode && (
            <div className="mb-8 pb-8 border-b" style={{ borderColor: T.border }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[12px] mono uppercase tracking-[0.2em]" style={{ color: T.textFaint }}>용어 비교 · Compare Terms</span>
                <button
                  onClick={() => { setCompareMode(false); setCompareTerm(null); }}
                  className="ml-auto text-[12px] mono px-2 py-0.5 border"
                  style={{ borderColor: T.border, color: T.textFaint }}
                >
                  비교 종료
                </button>
              </div>

              {!compareTerm ? (
                /* 비교 용어 선택 */
                <div>
                  <div className="flex border mb-3" style={{ borderColor: T.border }}>
                    <div className="px-3 py-2 border-r flex items-center" style={{ borderColor: T.border, background: T.bgCard }}>
                      <Search size={12} style={{ color: T.textFaint }} />
                    </div>
                    <input
                      value={compareSearch}
                      onChange={e => setCompareSearch(e.target.value)}
                      placeholder="비교할 용어 검색..."
                      className="flex-1 px-3 py-2 text-sm bg-transparent"
                      style={{ color: T.textPrimary }}
                      autoFocus
                    />
                  </div>
                  <div className="text-[12px] mono mb-2" style={{ color: T.textFaint }}>
                    {compareSearch ? '검색 결과' : '관련 용어'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {compareResults.map((rt: any) => {
                      const rc = categoryColors[rt.category];
                      return (
                        <button
                          key={rt.id}
                          onClick={() => setCompareTerm(rt)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs border transition-all hover:bg-white/5"
                          style={{ borderColor: T.border, color: T.textSecondary }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: rc?.bg }}></span>
                          <span className="font-medium">{rt.name}</span>
                          <span style={{ color: T.textFaint }}>{rt.fullName}</span>
                        </button>
                      );
                    })}
                    {compareResults.length === 0 && (
                      <div className="text-xs" style={{ color: T.textDimmer }}>결과 없음</div>
                    )}
                  </div>
                </div>
              ) : (
                /* 나란히 비교 */
                <div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* 현재 용어 */}
                    <div className="border p-4" style={{ borderColor: categoryColors[term.category]?.bg || T.border, background: T.bgCard }}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[11px] mono px-2 py-0.5" style={{ background: categoryColors[term.category]?.bg, color: categoryColors[term.category]?.text }}>{term.category}</span>
                        <span className="text-[12px] mono" style={{ color: T.textFaint }}>현재</span>
                      </div>
                      <div className="text-2xl font-medium mb-1" style={{ color: T.textPrimary }}>{term.name}</div>
                      <div className="text-xs mb-3" style={{ color: T.textFaint }}>{term.fullName}</div>
                      <div className="text-xs leading-relaxed mb-4" style={{ color: T.textMuted }}>{term.description}</div>
                      {term.formula && (
                        <div className="mono text-xs px-3 py-2 border-l-2 mb-3" style={{ background: T.bgSurface, borderColor: categoryColors[term.category]?.bg, color: T.textPrimary }}>
                          {term.formula}
                        </div>
                      )}
                    </div>
                    {/* 비교 용어 */}
                    <div className="border p-4" style={{ borderColor: categoryColors[compareTerm.category]?.bg || T.border, background: T.bgCard }}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[11px] mono px-2 py-0.5" style={{ background: categoryColors[compareTerm.category]?.bg, color: categoryColors[compareTerm.category]?.text }}>{compareTerm.category}</span>
                        <button
                          onClick={() => setCompareTerm(null)}
                          className="ml-auto text-[12px] mono px-1.5 py-0.5 border"
                          style={{ borderColor: T.border, color: T.textFaint }}
                        >변경</button>
                      </div>
                      <div className="text-2xl font-medium mb-1" style={{ color: T.textPrimary }}>{compareTerm.name}</div>
                      <div className="text-xs mb-3" style={{ color: T.textFaint }}>{compareTerm.fullName}</div>
                      <div className="text-xs leading-relaxed mb-4" style={{ color: T.textMuted }}>{compareTerm.description}</div>
                      {compareTerm.formula && (
                        <div className="mono text-xs px-3 py-2 border-l-2 mb-3" style={{ background: T.bgSurface, borderColor: categoryColors[compareTerm.category]?.bg, color: T.textPrimary }}>
                          {compareTerm.formula}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* 항목별 비교표 */}
                  <div className="mt-4 border" style={{ borderColor: T.border }}>
                    {[
                      { key: 'category', label: '카테고리' },
                      { key: 'en', label: '영문' },
                    ].map(row => (
                      <div key={row.key} className="grid grid-cols-[120px_1fr_1fr] border-b last:border-b-0" style={{ borderColor: T.border }}>
                        <div className="px-3 py-2 text-[12px] mono uppercase flex items-center" style={{ background: T.bgCard, color: T.textFaint, borderRight: `1px solid ${T.border}` }}>{row.label}</div>
                        <div className="px-3 py-2 text-xs border-r" style={{ borderColor: T.border, color: T.textSecondary }}>{term[row.key]}</div>
                        <div className="px-3 py-2 text-xs" style={{ color: T.textSecondary }}>{compareTerm[row.key]}</div>
                      </div>
                    ))}
                    <div className="grid grid-cols-[120px_1fr_1fr] border-b" style={{ borderColor: T.border }}>
                      <div className="px-3 py-2 text-[12px] mono uppercase flex items-center" style={{ background: T.bgCard, color: T.textFaint, borderRight: `1px solid ${T.border}` }}>예시</div>
                      <div className="px-3 py-2 text-xs border-r italic" style={{ borderColor: T.border, color: T.textMuted }}>{term.example?.slice(0, 80)}{term.example?.length > 80 ? '…' : ''}</div>
                      <div className="px-3 py-2 text-xs italic" style={{ color: T.textMuted }}>{compareTerm.example?.slice(0, 80)}{compareTerm.example?.length > 80 ? '…' : ''}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => onNavigate(compareTerm.id)}
                      className="text-xs px-3 py-1.5 border transition-all hover:bg-white/5"
                      style={{ borderColor: T.border, color: T.textMuted }}
                    >
                      {compareTerm.name} 상세 보기 →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 타이틀 */}
          <div className="mb-8 pb-6 border-b" style={{ borderColor: T.border }}>
            <div className="text-4xl md:text-6xl font-light tracking-tight mb-3" style={{ color: T.textPrimary }}>{term.name}</div>
            <div className="text-base md:text-lg" style={{ color: T.textMuted }}>{term.fullName}</div>
            <div className="text-sm mono italic mt-1" style={{ color: T.textFaint }}>{term.en}</div>
          </div>

          {/* 한 줄 요약 (easy) */}
          {hasEasy && (
            <div id="sec-easy" className="mb-6 px-5 py-4 border-l-4" style={{ background: T.accentGreenBg, borderColor: T.accentGreen, scrollMarginTop: '8px' }}>
              <div className="text-[12px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.accentGreen }}>💡 쉽게 말하면</div>
              <p className="text-sm md:text-base leading-relaxed" style={{ color: T.accentGreenText }}>{term.easy}</p>
            </div>
          )}

          {/* 요약 */}
          <Section id="sec-overview" label="개요 · Summary" color={categoryColors[term.category]?.bg} T={T}>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: T.textPrimary }}>{term.description}</p>
          </Section>

          {/* 상세 설명 */}
          {hasDetailed && (
            <Section id="sec-detailed" label="심화 · In-Depth" color={categoryColors[term.category]?.bg} T={T}>
              <p className="text-sm md:text-base leading-[1.8]" style={{ color: T.textSecondary }}>{term.detailed}</p>
            </Section>
          )}

          {/* 공식 */}
          <Section id="sec-formula" label="공식 · Formula" color={categoryColors[term.category]?.bg} T={T}>
            <div className="mono text-sm md:text-base px-4 md:px-5 py-3 md:py-4 border-l-4" style={{ background: T.bgCard, borderColor: categoryColors[term.category]?.bg, color: T.textPrimary }}>
              {term.formula}
            </div>
          </Section>

          {/* 예시 */}
          <Section id="sec-example" label="예시 · Example" color={categoryColors[term.category]?.bg} T={T}>
            <div className="text-sm italic" style={{ color: T.textMuted }}>{term.example}</div>
          </Section>

          {/* 관계성 카드 */}
          {hasRelations && (
            <Section id="sec-relations" label="연결 관계 · Relations" color={categoryColors[term.category]?.bg} T={T}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {Object.entries(term.relations).map(([key, value]) => {
                  const matchTerm = TERMS.find(t =>
                    t.name === key ||
                    t.fullName === key ||
                    key.includes(t.name) ||
                    (t.en && key.toLowerCase().includes(t.en.toLowerCase()))
                  );
                  const matchColor = matchTerm ? categoryColors[matchTerm.category] : null;
                  return (
                    <div
                      key={key}
                      className={`border p-4 transition-all ${matchTerm ? 'cursor-pointer hover:bg-white/5' : ''}`}
                      style={{ borderColor: T.border, background: T.bgCard }}
                      onClick={matchTerm ? () => onNavigate(matchTerm.id) : undefined}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {matchColor && <span className="w-1.5 h-1.5 rounded-full" style={{ background: matchColor.bg }}></span>}
                          <span className="text-sm font-medium" style={{ color: T.textPrimary }}>{key}</span>
                        </div>
                        {matchTerm && <ArrowUpRight size={12} style={{ color: T.textFaint }} />}
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: T.textMuted } as any}>{value as React.ReactNode}</p>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* 시장 영향 */}
          {hasImpact && (
            <Section id="sec-impact" label="시장 영향 · Market Impact" color={categoryColors[term.category]?.bg} T={T}>
              <div className="text-sm md:text-base leading-relaxed px-4 py-3 border-l-2" style={{ background: T.marketImpactBg, borderColor: T.accent, color: T.textPrimary }}>
                {term.marketImpact}
              </div>
            </Section>
          )}

          {/* 관련 용어 */}
          {relatedTerms.length > 0 && (
            <div className="mt-6 pt-6 border-t" style={{ borderColor: T.border }}>
              <div className="text-[12px] mono uppercase tracking-[0.2em] mb-3" style={{ color: T.textFaint }}>관련 용어 · Related Terms</div>
              <div className="flex flex-wrap gap-2">
                {relatedTerms.map(rt => {
                  const rc = categoryColors[rt.category];
                  return (
                    <button
                      key={rt.id}
                      onClick={() => onNavigate(rt.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs border transition-all hover:bg-white/5"
                      style={{ borderColor: T.border, color: T.textSecondary }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: rc?.bg }}></span>
                      <span className="font-medium">{rt.name}</span>
                      <ChevronRight size={10} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 즐겨찾기 메모 */}
          {isFav && (
            <div className="mt-6 pt-6 border-t" style={{ borderColor: T.border }}>
              <div className="flex items-center gap-2 mb-3">
                <Star size={11} fill={T.accent} stroke={T.accent} />
                <div className="text-[12px] mono uppercase tracking-[0.2em]" style={{ color: T.textFaint }}>내 메모 · My Note</div>
                {memoText !== memo && (
                  <span className="text-[11px] mono ml-1" style={{ color: T.accent }}>● 미저장</span>
                )}
              </div>
              <div className="relative border" style={{ borderColor: T.border }}>
                <textarea
                  value={memoText}
                  onChange={e => setMemoText(e.target.value)}
                  placeholder="이 용어에 대한 메모를 남겨보세요 (예: 투자 전략, 참고 사항 등)"
                  rows={3}
                  className="w-full px-4 py-3 text-sm bg-transparent resize-none"
                  style={{ color: T.textPrimary, fontFamily: 'inherit' }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[12px] mono" style={{ color: T.textFaint }}>
                  {memoText.length > 0 ? `${memoText.length}자` : ''}
                </span>
                <button
                  onClick={saveMemo}
                  disabled={memoText === memo}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs mono transition-all"
                  style={{
                    background: memoSaved ? T.accentGreen : (memoText !== memo ? T.accent : T.borderMid),
                    color: memoText !== memo ? (memoSaved ? '#fff' : '#0a0a0a') : T.textFaint,
                    cursor: memoText !== memo ? 'pointer' : 'not-allowed',
                  }}
                >
                  {memoSaved ? <><Check size={11} /><span>저장됨</span></> : <span>저장</span>}
                </button>
              </div>
            </div>
          )}
          {!isFav && (
            <div className="mt-6 pt-6 border-t flex items-center gap-2" style={{ borderColor: T.border }}>
              <Star size={11} style={{ color: T.textDimmer }} />
              <span className="text-[12px] mono" style={{ color: T.textDimmer }}>즐겨찾기 추가 시 개인 메모를 작성할 수 있습니다</span>
            </div>
          )}
          </div>{/* /본문 스크롤 */}

          {/* ── 사이드바 (PC only) ── */}
          <aside
            className="hidden md:flex flex-col shrink-0 border-l overflow-y-auto"
            style={{ width: '260px', borderColor: T.border, background: T.bgCard }}
          >
            {/* § 목차 */}
            <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: T.border }}>
              <div className="text-[11px] mono uppercase tracking-[0.25em] mb-3" style={{ color: T.textFaint }}>목차 · Contents</div>
              <div className="flex flex-col">
                {([
                  ...(hasEasy ? [{ id: 'sec-easy', n: '01', label: '쉽게 말하면' }] : []),
                  { id: 'sec-overview',  n: hasEasy ? '02' : '01', label: '개요' },
                  ...(hasDetailed ? [{ id: 'sec-detailed', n: hasEasy ? '03' : '02', label: '심화 설명' }] : []),
                  { id: 'sec-formula', n: (() => { let c = 1; if (hasEasy) c++; if (hasDetailed) c++; return String(c + 1).padStart(2,'0'); })(), label: '공식' },
                  { id: 'sec-example', n: (() => { let c = 2; if (hasEasy) c++; if (hasDetailed) c++; return String(c + 1).padStart(2,'0'); })(), label: '예시' },
                  ...(hasRelations ? [{ id: 'sec-relations', n: (() => { let c = 3; if (hasEasy) c++; if (hasDetailed) c++; return String(c + 1).padStart(2,'0'); })(), label: '연결 관계' }] : []),
                  ...(hasImpact ? [{ id: 'sec-impact', n: (() => { let c = 4; if (hasEasy) c++; if (hasDetailed) c++; if (hasRelations) c++; return String(c + 1).padStart(2,'0'); })(), label: '시장 영향' }] : []),
                ] as { id: string; n: string; label: string }[]).map(item => {
                  const isActive = activeTocId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        const el = mainScrollRef.current?.querySelector(`#${item.id}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="flex items-center gap-2 text-xs py-1.5 px-1 rounded-sm text-left transition-all"
                      style={{
                        color: isActive ? (categoryColors[term.category]?.bg || T.accent) : T.textMuted,
                        background: isActive ? `${categoryColors[term.category]?.bg || T.accent}15` : 'transparent',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      <span className="w-4 text-right mono text-[10px] shrink-0" style={{ color: isActive ? (categoryColors[term.category]?.bg || T.accent) : T.textDimmer }}>{item.n}</span>
                      <span>{item.label}</span>
                      {isActive && <span className="ml-auto w-1 h-3 rounded-full shrink-0" style={{ background: categoryColors[term.category]?.bg || T.accent }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* § 관련 용어 */}
            {relatedTerms.length > 0 && (
              <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: T.border }}>
                <div className="text-[11px] mono uppercase tracking-[0.25em] mb-3" style={{ color: T.textFaint }}>관련 용어</div>
                <div className="flex flex-col gap-1">
                  {relatedTerms.slice(0, 6).map(rt => {
                    const rc = categoryColors[rt.category];
                    return (
                      <button
                        key={rt.id}
                        onClick={() => onNavigate(rt.id)}
                        className="flex items-center gap-2 text-xs py-1.5 text-left hover:opacity-80 transition-opacity"
                        style={{ color: T.textSecondary }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: rc?.bg }}></span>
                        <span className="font-medium truncate">{rt.name}</span>
                        <ChevronRight size={10} className="ml-auto shrink-0" style={{ color: T.textFaint }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* § 계산기 바로가기 */}
            <div className="px-5 pt-4 pb-4 mt-auto">
              <div className="text-[11px] mono uppercase tracking-[0.25em] mb-3" style={{ color: T.textFaint }}>계산기 바로가기</div>
              <button
                onClick={() => { onClose(); if (onNavigateCalc) onNavigateCalc(); }}
                className="w-full flex items-center justify-between px-3 py-2.5 border text-xs transition-all hover:opacity-80"
                style={{ borderColor: T.border, color: T.textMuted, background: T.bgSurface }}
              >
                <span>관련 계산기 보기</span>
                <Calculator size={12} />
              </button>
            </div>
          </aside>
        </div>{/* /flex 2단 */}

        {/* ── 하단 prev/next 바 ── */}
        <div
          className="flex items-center justify-between border-t px-5 py-3 shrink-0"
          style={{ borderColor: T.border, background: T.bgCard }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
            disabled={!hasPrev}
            className="flex items-center gap-2 text-xs mono px-3 py-2 border transition-all"
            style={{
              borderColor: hasPrev ? T.borderMid : T.border,
              color: hasPrev ? T.textMuted : T.textDimmer,
              background: 'transparent',
              cursor: hasPrev ? 'pointer' : 'not-allowed',
              opacity: hasPrev ? 1 : 0.4,
            }}
          >
            <ChevronLeft size={12} />
            <span>이전</span>
          </button>
          {total > 0 && (
            <span className="text-[11px] mono" style={{ color: T.textDimmer }}>
              {currentIdx + 1} / {total}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onNext?.(); }}
            disabled={!hasNext}
            className="flex items-center gap-2 text-xs mono px-3 py-2 border transition-all"
            style={{
              borderColor: hasNext ? T.borderMid : T.border,
              color: hasNext ? T.textMuted : T.textDimmer,
              background: 'transparent',
              cursor: hasNext ? 'pointer' : 'not-allowed',
              opacity: hasNext ? 1 : 0.4,
            }}
          >
            <span>다음</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ label, color, children, T, id }: { label: any; color: any; children: React.ReactNode; T: any; id?: string }): JSX.Element {
  return (
    <div id={id} className="mb-6 md:mb-8" style={{ scrollMarginTop: '8px' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1 h-3" style={{ background: color || T.accent }}></span>
        <div className="text-[12px] mono uppercase tracking-[0.25em]" style={{ color: T.textFaint }}>{label}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 계산기 뷰
// ─────────────────────────────────────────────

// 계산기 히스토리 타입
type CalcHistoryEntry = {
  id: string; // calcId
  label: string; // 계산기 이름
  results: { label: string; value: string; unit?: string }[];
  ts: number; // timestamp
};

// 계산기 히스토리 이벤트 (ResultBox → CalculatorView 통신)
const CALC_HISTORY_EVENT = 'stockwiki:calc_history';

function CalculatorView({ selectedCalc, setSelectedCalc, T, isDark }) {
  // 테마 싱글톤 동기화
  _T = T;
  _BORDER = T.border;
  const BORDER_LOCAL = T.border;

  const allCalcs = CALC_CATEGORIES.flatMap(cat => cat.calcs.map(c => ({ ...c, category: cat.name, color: cat.color })));
  const currentCalc = allCalcs.find(c => c.id === selectedCalc);

  // 계산기 히스토리 (계산기별 최근 5개)
  const [calcHistory, setCalcHistory] = useState<CalcHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // 계산기 비교 모드
  const [compareCalcMode, setCompareCalcMode] = useState(false);
  const [compareCalcId, setCompareCalcId] = useState('');

  // A/B diff — DOM polling
  const panelARef = React.useRef<HTMLDivElement>(null);
  const panelBRef = React.useRef<HTMLDivElement>(null);
  type DiffRow = { label: string; a: string; b: string; unit: string; aNum: number; bNum: number; diff: number; pct: number };
  const [diffRows, setDiffRows] = useState<DiffRow[]>([]);

  const readPanel = (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return [];
    return Array.from(ref.current.querySelectorAll('[data-result-label]')).map(el => ({
      label: el.getAttribute('data-result-label') || '',
      value: el.getAttribute('data-result-value') || '',
      unit:  el.getAttribute('data-result-unit') || '',
    }));
  };

  const refreshDiff = React.useCallback(() => {
    const a = readPanel(panelARef);
    const b = readPanel(panelBRef);
    const rows: DiffRow[] = a.map(ar => {
      const br = b.find(r => r.label === ar.label);
      const aNum = parseFloat(ar.value.replace(/[^0-9.-]/g,'')) || 0;
      const bNum = parseFloat(br?.value?.replace(/[^0-9.-]/g,'') || '0') || 0;
      const diff = bNum - aNum;
      const pct  = aNum !== 0 ? (diff / Math.abs(aNum)) * 100 : 0;
      return { label: ar.label, a: ar.value, b: br?.value || '—', unit: ar.unit, aNum, bNum, diff, pct };
    });
    setDiffRows(rows);
  }, []);

  React.useEffect(() => {
    if (!compareCalcMode) return;
    const obs = new MutationObserver(refreshDiff);
    const cfg = { subtree: true, childList: true, characterData: true };
    if (panelARef.current) obs.observe(panelARef.current, cfg);
    if (panelBRef.current) obs.observe(panelBRef.current, cfg);
    refreshDiff();
    return () => obs.disconnect();
  }, [compareCalcMode, selectedCalc, refreshDiff]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('stockwiki_calc_history');
      if (saved) setCalcHistory(JSON.parse(saved));
    } catch {}
  }, []);

  // 히스토리 이벤트 수신
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const entry: CalcHistoryEntry = e.detail;
      setCalcHistory(prev => {
        // 같은 계산기 최대 5개 유지
        const filtered = prev.filter(h => !(h.id === entry.id));
        const next = [entry, ...filtered].slice(0, 20); // 전체 최대 20개
        try { localStorage.setItem('stockwiki_calc_history', JSON.stringify(next)); } catch {}
        return next;
      });
    };
    window.addEventListener(CALC_HISTORY_EVENT, handler as EventListener);
    return () => window.removeEventListener(CALC_HISTORY_EVENT, handler as EventListener);
  }, []);

  // 선택된 계산기 패널로 자동 스크롤 (id 기반 — 루프 내 ref 중복 문제 해결)
  useEffect(() => {
    if (!selectedCalc) return;
    // 두 프레임 대기: 패널 렌더 완료 후 정확한 위치 계산
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 모바일: 하단 모바일 패널로 스크롤, PC: 우측 패널로 스크롤
        const isMobile = window.innerWidth < 1024;
        const panelId = isMobile
          ? `calc-panel-mobile-${selectedCalc}`
          : `calc-panel-${selectedCalc}`;
        const el = document.getElementById(panelId);
        if (!el) return;
        const headerOffset = isMobile ? 70 : 90;
        const rect = el.getBoundingClientRect();
        const targetY = window.scrollY + rect.top - headerOffset;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      });
    });
    return () => cancelAnimationFrame(raf1);
  }, [selectedCalc]);

  // 즐겨찾기 상태 (LocalStorage 동기화)
  const [favCalcs, setFavCalcs] = useState<Set<string>>(new Set());
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('stockwiki_fav_calcs');
      if (saved) setFavCalcs(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  const toggleFavCalc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavCalcs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('stockwiki_fav_calcs', JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  // 현재 페이지 URL 공유
  const handleShareUrl = async () => {
    const url = `${window.location.origin}/?tab=calculator&calc=${selectedCalc}`;
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch {}
  };

  // 즐겨찾기된 계산기 배열
  const favCalcList = allCalcs.filter(c => favCalcs.has(c.id));

  const renderCalcComponent = (id) => {
    switch (id) {
      case 'per': return <PERCalc />;
      case 'psr': return <PSRCalc />;
      case 'pbr': return <PBRCalc />;
      case 'target': return <TargetPriceCalc />;
      case 'dcf': return <DCFCalc />;
      case 'wacc': return <WACCCalc />;
      case 'roe': return <ROECalc />;
      case 'dupont': return <DuPontCalc />;
      case 'margin': return <MarginCalc />;
      case 'bep': return <BEPCalc />;
      case 'dividend': return <DividendCalc />;
      case 'compound': return <CompoundCalc />;
      case 'cagr': return <CAGRCalc />;
      case 'rule72': return <Rule72Calc />;
      case 'avgprice': return <AvgPriceCalc />;
      case 'commission': return <CommissionCalc />;
      case 'breakeven': return <BreakevenCalc />;
      case 'positionsize': return <PositionSizeCalc />;
      case 'futures': return <FuturesCalc />;
      case 'leverage': return <LeverageCalc />;
      case 'bs': return <BlackScholesCalc />;
      case 'greeks': return <GreeksCalc />;
      case 'sharpe': return <SharpeCalc />;
      case 'kelly': return <KellyCalc />;
      case 'mdd': return <MDDCalc />;
      case 'var': return <VaRCalc />;
      case 'fx': return <FXCalc />;
      case 'realrate': return <RealRateCalc />;
      case 'bondprice': return <BondPriceCalc />;
      case 'capitalgain': return <CapitalGainCalc />;
      case 'healthinsurance': return <HealthInsuranceCalc />;
      case 'incometax': return <IncomeTaxCalc />;
      case 'gifttax': return <GiftTaxCalc />;
      case 'pension': return <PensionCalc />;
      case 'taxsaving': return <TaxSavingCalc />;
      case 'fxconvert': return <FxConvertCalc />;
      case 'shortsell': return <ShortSellCalc />;
      case 'splitorder': return <SplitOrderCalc />;
      case 'rollover': return <RolloverCalc />;
      case 'optionbep': return <OptionBEPCalc />;
      case 'sectorweight': return <SectorWeightCalc />;
      case 'fxhedge': return <FxHedgeCalc />;
      case 'rebalance': return <RebalanceCalc />;
      case 'finincometax': return <FinIncomeTaxCalc />;
      case 'taxaccount': return <TaxAccountCalc />;
      case 'gapcalc': return <GapCalc />;
      case 'marginliquid': return <MarginLiquidCalc />;
      case 'futuresfair': return <FuturesFairCalc />;
      case 'optionspread': return <OptionSpreadCalc />;
      case 'winrate': return <WinRateCalc />;
      case 'margincheck': return <MarginCheckCalc />;
      case 'derivtax': return <DerivTaxCalc />;
      default: return null;
    }
  };

  return (
    <div>
      <MarketPulseRail T={T} totalTerms={TERMS.length} />
      {/* 상단 메타 바 */}
      <div className="mb-6 border-y" style={{ borderColor: T.border }}>
        <div className="flex items-center justify-between gap-3 py-2 border-b mono text-[12px] uppercase tracking-[0.2em] whitespace-nowrap" style={{ borderColor: T.border, color: T.textFaint }}>
          <div className="flex items-center gap-3">
            <span>§ Calculator</span>
            <span className="w-4 h-px hidden md:inline-block" style={{ background: T.borderMid }}></span>
            <span className="hidden md:inline">Index / 002</span>
          </div>
          <div className="flex items-center gap-2">
            {/* 히스토리 버튼 */}
            {calcHistory.length > 0 && (
              <button
                onClick={() => setShowHistory(h => !h)}
                className="flex items-center gap-1.5 px-2 py-1 border transition-all hover:bg-white/5"
                style={{ borderColor: T.border, color: showHistory ? T.accent : T.textMuted }}
                title="계산 히스토리"
              >
                <Clock size={10} />
                <span>히스토리 {calcHistory.length}</span>
              </button>
            )}
            {selectedCalc && (
              <button
                onClick={handleShareUrl}
                className="flex items-center gap-1.5 px-2 py-1 border transition-all hover:bg-white/5"
                style={{ borderColor: T.border, color: urlCopied ? T.accent : T.textMuted }}
                title="이 계산기 링크 복사"
              >
                {urlCopied ? (
                  <><Check size={10} /><span>링크 복사됨</span></>
                ) : (
                  <><Share2 size={10} /><span>링크 공유</span></>
                )}
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-6 py-2 mono text-[12px] uppercase tracking-[0.2em]">
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: T.textDimmer }}>Groups</span><span style={{ color: T.textPrimary }}>{String(CALC_CATEGORIES.length).padStart(3, '0')}</span></div>
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: T.textDimmer }}>Modules</span><span style={{ color: T.textPrimary }}>{String(allCalcs.length).padStart(3, '0')}</span></div>
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: T.textDimmer }}>Active</span><span style={{ color: currentCalc?.color || T.textPrimary }}>M—{currentCalc?.num || '—'}</span></div>
        </div>
      </div>

      {/* PC: 좌측 목록 + 우측 계산기 패널 / 모바일: 세로 스택 */}
      <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 lg:items-start">

        {/* ── 좌측: 항목 목록 ── */}
        <div className="w-full lg:w-[320px] xl:w-[360px] lg:shrink-0">

          {/* 즐겨찾기 섹션 */}
          {favCalcList.length > 0 && (
            <div className="mb-4 border" style={{ borderColor: T.border }}>
              <div className="px-4 py-2.5 flex items-center gap-3 border-b" style={{ background: T.bgCard, borderColor: T.border }}>
                <Star size={11} fill={T.accent} stroke={T.accent} />
                <span className="text-[13px] mono uppercase tracking-[0.2em]" style={{ color: T.accent }}>즐겨찾기</span>
                <span className="ml-auto text-[12px] mono" style={{ color: T.textDimmer }}>{String(favCalcList.length).padStart(2, '0')} PINNED</span>
              </div>
              <div className="grid grid-cols-2">
                {favCalcList.map((calc, i) => {
                  const active = selectedCalc === calc.id;
                  return (
                    <button
                      key={`fav-${calc.id}`}
                      onClick={() => setSelectedCalc(active ? '' : calc.id)}
                      className="flex items-center gap-2 px-3 py-2.5 text-xs transition-all text-left border-r border-b"
                      style={{
                        borderColor: T.commandKSelected,
                        background: active ? calc.color : 'transparent',
                        color: active ? '#0a0a0a' : T.textSecondary,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: active ? '#0a0a0a' : calc.color }}></span>
                      <span className="font-medium truncate">{calc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 카테고리별 계산기 목록 */}
          <div className="border" style={{ borderColor: T.border }}>
            {CALC_CATEGORIES.map((cat, ci) => (
              <div key={cat.name} className={ci !== CALC_CATEGORIES.length - 1 ? 'border-b' : ''} style={{ borderColor: T.border }}>
                {/* 카테고리 헤더 */}
                <div className="px-4 py-2.5 flex items-center gap-2.5" style={{ background: T.bgCard }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }}></span>
                  <span className="text-[13px] mono uppercase tracking-[0.2em]" style={{ color: T.textMuted }}>{cat.name}</span>
                  <span className="ml-auto text-[12px] mono" style={{ color: T.textDimmer }}>{String(cat.calcs.length).padStart(2, '0')}</span>
                </div>
                {/* 계산기 버튼 — 2열 */}
                <div className="grid grid-cols-2 border-t" style={{ borderColor: T.border }}>
                  {cat.calcs.map((calc) => {
                    const active = selectedCalc === calc.id;
                    const isFav = favCalcs.has(calc.id);
                    return (
                      <div key={calc.id} className="relative group flex items-stretch border-r border-b" style={{ borderColor: T.commandKSelected }}>
                        <button
                          onClick={() => setSelectedCalc(active ? '' : calc.id)}
                          className="flex-1 flex items-center gap-2 px-3 py-2.5 text-xs transition-all text-left"
                          style={{
                            background: active ? cat.color : 'transparent',
                            color: active ? '#0a0a0a' : T.textSecondary,
                          }}
                        >
                          <span className="text-[12px] mono opacity-50 w-4 shrink-0">{calc.num}</span>
                          <span className="font-medium truncate">{calc.name}</span>
                        </button>
                        {/* 즐겨찾기 별 — hover + 이미 즐겨찾기된 경우 항상 표시 */}
                        <button
                          onClick={(e) => toggleFavCalc(calc.id, e)}
                          className="absolute top-1/2 right-1 -translate-y-1/2 p-1 transition-opacity group-hover:opacity-100"
                          style={{ opacity: isFav ? 1 : 0, color: active ? '#0a0a0a' : (isFav ? T.accent : T.textFaint) }}
                          title={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                        >
                          <Star size={10} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* 모바일 인라인 패널은 목록 아래로 이동됨 */}
              </div>
            ))}
          </div>
        </div>

        {/* ── 모바일: 계산기 패널 (항목 목록 아래) ── */}
        {selectedCalc && currentCalc && (
          <div className="lg:hidden mt-4 border" style={{ borderColor: T.border, background: T.bgSurface }}>
            {/* 패널 헤더 */}
            <div className="px-4 py-3 border-b flex items-center gap-3 sticky top-[56px] z-10"
              style={{ borderColor: T.border, background: T.bgCard }}>
              <span className="text-[11px] mono uppercase tracking-[0.2em]" style={{ color: currentCalc.color }}>
                M—{currentCalc.num}
              </span>
              <span className="text-sm font-medium flex-1 truncate" style={{ color: T.textPrimary }}>{currentCalc.name}</span>
              {/* 결과 저장 버튼 */}
              <button
                onClick={() => {
                  const panel = document.getElementById(`calc-panel-mobile-${selectedCalc}`);
                  if (!panel) return;
                  const boxes = panel.querySelectorAll('[data-result-label]');
                  const results: { label: string; value: string; unit?: string }[] = [];
                  boxes.forEach(box => {
                    const label = box.getAttribute('data-result-label') || '';
                    const value = box.getAttribute('data-result-value') || '';
                    const unit = box.getAttribute('data-result-unit') || undefined;
                    if (value && value !== '—' && value !== '') results.push({ label, value, unit });
                  });
                  if (results.length > 0) {
                    dispatchCalcHistory(selectedCalc, currentCalc.name, results);
                    setShowHistory(true);
                  }
                }}
                className="flex items-center gap-1 text-[11px] mono px-2 py-1 border"
                style={{ borderColor: T.border, color: T.textFaint }}
              >
                <Clock size={10} />
                <span>저장</span>
              </button>
              <button
                onClick={() => setSelectedCalc('')}
                className="p-1.5"
                style={{ color: T.textDimmer }}
              >
                <X size={14} />
              </button>
            </div>
            <div id={`calc-panel-mobile-${selectedCalc}`} className="p-5">
              {renderCalcComponent(selectedCalc)}
            </div>
          </div>
        )}

        {/* ── 우측: 계산기 패널 (PC 전용 sticky) ── */}
        <div className="hidden lg:block flex-1 min-w-0 sticky top-[90px] self-start">
          {selectedCalc ? (
            <div
              id={`calc-panel-${selectedCalc}`}
              className="border overflow-y-auto"
              style={{
                borderColor: T.border,
                background: T.bgSurface,
                maxHeight: 'calc(100vh - 110px)',
              }}
            >
              {/* 패널 헤더 */}
              <div className="px-6 py-3 border-b flex items-center gap-3" style={{ borderColor: T.border, background: T.bgCard }}>
                <span className="text-[12px] mono uppercase tracking-[0.2em]" style={{ color: currentCalc?.color || T.textMuted }}>
                  M—{currentCalc?.num}
                </span>
                <span className="text-sm font-medium" style={{ color: T.textPrimary }}>{currentCalc?.name}</span>
                {/* 시나리오 비교 버튼 */}
                <button
                  onClick={() => { setCompareCalcMode(m => !m); setCompareCalcId(selectedCalc); }}
                  className="flex items-center gap-1 text-[12px] mono px-2 py-1 border transition-all hover:bg-white/5"
                  style={{
                    borderColor: compareCalcMode ? T.accent : T.border,
                    color: compareCalcMode ? T.accent : T.textFaint,
                  }}
                  title="A/B 시나리오 비교"
                >
                  <span>A/B 비교</span>
                </button>
                {/* 결과 저장 버튼 */}
                <button
                  onClick={() => {
                    const panel = document.getElementById(`calc-panel-${selectedCalc}`);
                    if (!panel) return;
                    const boxes = panel.querySelectorAll('[data-result-label]');
                    const results: { label: string; value: string; unit?: string }[] = [];
                    boxes.forEach(box => {
                      const label = box.getAttribute('data-result-label') || '';
                      const value = box.getAttribute('data-result-value') || '';
                      const unit = box.getAttribute('data-result-unit') || undefined;
                      if (value && value !== '—' && value !== '') results.push({ label, value, unit });
                    });
                    if (results.length > 0 && currentCalc) {
                      dispatchCalcHistory(selectedCalc, currentCalc.name, results);
                      setShowHistory(true);
                    }
                  }}
                  className="flex items-center gap-1 text-[12px] mono px-2 py-1 border transition-all hover:bg-white/5"
                  style={{ borderColor: T.border, color: T.textFaint }}
                  title="현재 결과를 히스토리에 저장"
                >
                  <Clock size={10} />
                  <span>저장</span>
                </button>
                <button
                  onClick={() => setSelectedCalc('')}
                  className="ml-auto p-1 hover:bg-white/5 transition-colors"
                  style={{ color: T.textDimmer }}
                  title="닫기"
                >
                  <X size={14} />
                </button>
              </div>

              {/* A/B 비교 모드 */}
              {compareCalcMode ? (
                <div className="grid overflow-y-auto" style={{ gridTemplateColumns: '1fr 180px 1fr', borderColor: T.border, maxHeight: 'calc(100vh - 160px)' }}>
                  {/* ── 시나리오 A ── */}
                  <div className="p-5" ref={panelARef} style={{ borderRight: `1px solid ${T.border}` }}>
                    <div className="text-[12px] mono uppercase tracking-[0.2em] mb-4 flex items-center gap-2" style={{ color: T.textFaint }}>
                      <span className="px-1.5 py-0.5 text-[11px]" style={{ background: T.accent, color: '#0a0a0a' }}>A</span>
                      <span>시나리오 A</span>
                    </div>
                    <CalcPrefixContext.Provider value="scenarioA">
                      {renderCalcComponent(selectedCalc)}
                    </CalcPrefixContext.Provider>
                  </div>

                  {/* ── Diff 컬럼 ── */}
                  <div className="flex flex-col border-r" style={{ borderColor: T.border, background: T.bgWell ?? T.bgCard }}>
                    <div className="px-3 py-3 border-b text-center" style={{ borderColor: T.border }}>
                      <span className="mono text-[10px] uppercase tracking-[0.3em]" style={{ color: T.textFaint }}>§ Δ Diff</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {diffRows.length === 0 ? (
                        <div className="px-3 py-8 text-center mono text-[10px]" style={{ color: T.textDimmer }}>
                          입력 후<br/>자동 갱신
                        </div>
                      ) : diffRows.map((row, i) => {
                        const isUp = row.diff > 0;
                        const isDown = row.diff < 0;
                        const diffColor = isUp ? '#6f9c6a' : isDown ? '#b94040' : T.textDimmer;
                        const hasNum = row.aNum !== 0 || row.bNum !== 0;
                        return (
                          <div key={i} className="px-3 py-3 border-b" style={{ borderColor: T.border }}>
                            <div className="mono text-[9px] uppercase tracking-[0.18em] mb-1.5 truncate" style={{ color: T.textFaint }}>{row.label}</div>
                            {hasNum ? (
                              <>
                                <div className="mono font-medium text-center" style={{ fontSize: 15, color: diffColor }}>
                                  {isUp ? '+' : ''}{row.diff % 1 === 0 ? row.diff.toLocaleString() : row.diff.toFixed(2)}
                                  {row.unit && <span className="text-[10px] ml-0.5" style={{ color: T.textDimmer }}>{row.unit}</span>}
                                </div>
                                {row.aNum !== 0 && (
                                  <div className="mono text-[10px] text-center mt-0.5" style={{ color: diffColor, opacity: 0.7 }}>
                                    {isUp ? '▲' : isDown ? '▼' : '—'} {Math.abs(row.pct).toFixed(1)}%
                                  </div>
                                )}
                                {/* 미니 게이지 */}
                                <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${Math.min(Math.abs(row.pct), 100)}%`,
                                    background: diffColor,
                                    marginLeft: isDown ? `${100 - Math.min(Math.abs(row.pct), 100)}%` : 0,
                                    transition: 'width 0.3s ease',
                                  }} />
                                </div>
                              </>
                            ) : (
                              <div className="mono text-[10px] text-center" style={{ color: T.textDimmer }}>—</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── 시나리오 B ── */}
                  <div className="p-5" ref={panelBRef}>
                    <div className="text-[12px] mono uppercase tracking-[0.2em] mb-4 flex items-center gap-2" style={{ color: T.textFaint }}>
                      <span className="px-1.5 py-0.5 text-[11px]" style={{ background: T.accentGreen, color: '#fff' }}>B</span>
                      <span>시나리오 B</span>
                      <span className="ml-auto text-[11px]" style={{ color: T.textDimmer }}>독립 입력</span>
                    </div>
                    <CalcPrefixContext.Provider value="scenarioB">
                      {renderCalcComponent(selectedCalc)}
                    </CalcPrefixContext.Provider>
                  </div>
                </div>
              ) : (
              <div className="p-6 md:p-10">
                {renderCalcComponent(selectedCalc)}
              </div>
              )}
            </div>
          ) : (
            <div className="border flex flex-col items-center justify-center py-24" style={{ borderColor: T.border, background: T.bgCard }}>
              <span className="text-[12px] mono uppercase tracking-[0.3em]" style={{ color: T.borderMid }}>No Module Selected</span>
              <span className="mt-3 text-xs" style={{ color: T.textDimmer }}>← 좌측에서 계산기를 선택하세요</span>
            </div>
          )}
        </div>

      </div>

      {/* 히스토리 패널 */}
      {showHistory && calcHistory.length > 0 && (
        <div className="mt-6 border" style={{ borderColor: T.border, background: T.bgSurface }}>
          <div className="px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: T.border, background: T.bgCard }}>
            <Clock size={12} style={{ color: T.accent }} />
            <span className="text-[13px] mono uppercase tracking-[0.2em]" style={{ color: T.textMuted }}>계산 히스토리 · Calculation History</span>
            <button
              onClick={() => {
                setCalcHistory([]);
                try { localStorage.removeItem('stockwiki_calc_history'); } catch {}
                setShowHistory(false);
              }}
              className="ml-auto text-[12px] mono px-2 py-1 border transition-all hover:bg-white/5"
              style={{ borderColor: T.border, color: T.textFaint }}
            >
              전체 삭제
            </button>
            <button onClick={() => setShowHistory(false)} style={{ color: T.textFaint }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ borderColor: T.border }}>
            {calcHistory.map((entry, i) => {
              const calcInfo = allCalcs.find(c => c.id === entry.id);
              return (
                <div key={i} className="px-5 py-4 transition-colors" style={{ borderTop: i > 0 ? `1px solid ${T.border}` : 'none', background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.bgHover}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: calcInfo?.color || T.accent }}></span>
                    <span className="text-xs font-medium" style={{ color: T.textPrimary }}>{entry.label}</span>
                    <span className="ml-auto text-[12px] mono" style={{ color: T.textFaint }}>
                      {new Date(entry.ts).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => setSelectedCalc(entry.id)}
                      className="text-[12px] mono px-2 py-0.5 border"
                      style={{ borderColor: T.border, color: T.textMuted }}
                    >
                      다시 열기
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {entry.results.map((r, j) => (
                      <div key={j} className="flex items-baseline gap-1.5">
                        <span className="text-[12px] mono" style={{ color: T.textFaint }}>{r.label}:</span>
                        <span className="text-sm mono font-medium" style={{ color: T.accent }}>{r.value}</span>
                        {r.unit && <span className="text-[12px] mono" style={{ color: T.textDimmer }}>{r.unit}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// 테마 싱글톤 — CalculatorView 렌더 시 동기화
let _T: any = {
  bgPage:'#1a1a1a', bgSurface:'#141414', bgCard:'#0f0f0f',
  bgTabActive:'#e8e4d6', textPrimary:'#e8e4d6', textSecondary:'#d4d0c4',
  textMuted:'#a8a49a', textFaint:'#7a7a7a', textDimmer:'#5a5a5a',
  textFooter:'#6a6a6a', textTabActive:'#1a1a1a', border:'#2a2a2a',
  borderSoft:'#252525', borderMid:'#3a3a3a', accent:'#C89650',
  accentGreen:'#4A7045', accentGreenBg:'#0d1f0d', accentGreenText:'#c8d4c8',
  placeholder:'#5a5a5a', commandKSelected:'#1f1f1f', marketImpactBg:'#0f0f0f',
  bgHeader:'rgba(20,20,20,0.95)', bgOverlay:'rgba(0,0,0,0.8)',
  bgOverlay2:'rgba(0,0,0,0.7)', bgHover:'rgba(255,255,255,0.04)',
};
let _BORDER = '#2a2a2a';

// 숫자를 한국어 단위로 변환 (100000000 → "1억")
function formatKoreanUnit(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!isFinite(n) || n === 0) return '';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';

  if (abs >= 1e12) {
    const jo = Math.floor(abs / 1e12);
    const rest = Math.floor((abs % 1e12) / 1e8);
    return sign + (rest > 0 ? `${jo}조 ${rest}억` : `${jo}조`);
  }
  if (abs >= 1e8) {
    const eok = Math.floor(abs / 1e8);
    const rest = Math.floor((abs % 1e8) / 1e4);
    return sign + (rest > 0 ? `${eok}억 ${rest.toLocaleString()}만` : `${eok}억`);
  }
  if (abs >= 1e4) {
    const man = abs / 1e4;
    // 정수면 정수로, 소수면 소수점 1자리
    const manStr = man % 1 === 0 ? man.toString() : man.toFixed(1);
    return sign + `${manStr}만`;
  }
  return '';
}

function NumInput({ label, value, onChange, unit, placeholder, hint }: any) {
  const [isFocused, setIsFocused] = useState(false);

  // 포커스 중: 원본값 표시 (소수점 입력 가능하도록)
  // 포커스 해제 시: 쉼표 포함 형식으로 표시
  const displayValue = (() => {
    if (value === '' || value === null || value === undefined) return '';
    if (isFocused) return String(value); // 편집 중엔 원본 그대로
    const num = Number(value);
    if (!isFinite(num)) return String(value);
    // 소수점 이하 자리 보존 (toLocaleString은 소수점 잘라낼 수 있음)
    return num.toLocaleString('ko-KR', { maximumFractionDigits: 10 });
  })();

  // 입력 시: 쉼표 제거하고 숫자만 저장
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d.-]/g, ''); // 숫자·소수점·음수만
    onChange(raw);
  };

  // 한국어 단위
  const koreanUnit = formatKoreanUnit(value);

  return (
    <div>
      <label className="block text-[12px] mono uppercase tracking-[0.2em] mb-2" style={{ color: _T.textFaint }}>{label}</label>
      <div className="relative border" style={{ borderColor: _BORDER, background: _T.bgSurface }}>
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full px-4 py-3 mono text-base bg-transparent"
          style={{ color: _T.textPrimary }}
        />
        {unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs mono" style={{ color: _T.textFaint }}>{unit}</span>}
      </div>
      {/* 한국어 단위 표시 (입력값 있을 때만) */}
      {koreanUnit && (
        <div className="text-xs mt-1.5 mono" style={{ color: _T.accent }}>
          ≈ {koreanUnit}
        </div>
      )}
      {hint && !koreanUnit && <div className="text-[12px] mt-1" style={{ color: _T.textFooter }}>{hint}</div>}
      {hint && koreanUnit && <div className="text-[12px] mt-0.5" style={{ color: _T.textFooter }}>{hint}</div>}
      {Number(value) < 0 && (
        <div className="text-[12px] mt-1" style={{ color: '#A63D33' }}>⚠ 음수 입력됨</div>
      )}
    </div>
  );
}

// 히스토리 저장 헬퍼 — ResultBox에서 highlight된 결과를 전송
function dispatchCalcHistory(calcId: string, calcName: string, results: { label: string; value: string; unit?: string }[]) {
  const validResults = results.filter(r => r.value && r.value !== '—' && r.value !== '' && r.value !== '0');
  if (validResults.length === 0) return;
  window.dispatchEvent(new CustomEvent(CALC_HISTORY_EVENT, {
    detail: { id: calcId, label: calcName, results: validResults, ts: Date.now() } as CalcHistoryEntry
  }));
}

function ResultBox({ label, value, unit, highlight, color = '#C89650', bands, interpret }: any) {
  const [copied, setCopied] = useState(false);

  // value가 쉼표 포함 숫자 문자열인지 확인해서 한국어 단위 계산
  let koreanUnit = '';
  if (typeof value === 'string') {
    const num = Number(value.replace(/,/g, ''));
    if (isFinite(num) && num !== 0) {
      if (unit === '원' || unit === 'KRW') {
        koreanUnit = formatKoreanUnit(num);
      }
    }
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = koreanUnit
      ? `${label}: ${value} ${unit || ''} (${koreanUnit}) · stockwiki.kr`
      : `${label}: ${value} ${unit || ''} · stockwiki.kr`;
    try {
      await navigator.clipboard.writeText(text.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const hasValue = value && value !== '—' && value !== '0';

  return (
    <div
      className="p-4 md:p-5 relative group"
      data-result-label={label}
      data-result-value={value}
      data-result-unit={unit || ''}
      style={{
        background: highlight ? color : _T.bgCard,
        color: highlight ? '#0a0a0a' : _T.textPrimary
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[12px] mono uppercase tracking-[0.2em]" style={{ opacity: 0.7 }}>{label}</div>
        {hasValue && (
          <button
            onClick={handleCopy}
            className="text-[11px] mono uppercase tracking-[0.15em] px-1.5 py-0.5 transition-all flex items-center gap-1"
            style={{ opacity: copied ? 1 : 0.4, color: 'inherit' }}
            title="결과 복사"
          >
            {copied ? <><Check size={10} /><span>복사됨</span></> : <><Copy size={10} /><span>복사</span></>}
          </button>
        )}
      </div>
      <div className="text-2xl md:text-3xl font-light mono tabular-nums">
        {value} <span className="text-xs md:text-sm" style={{ opacity: 0.6 }}>{unit}</span>
      </div>
      {koreanUnit && (
        <div className="text-xs mt-2 mono" style={{ opacity: 0.7 }}>≈ {koreanUnit}</div>
      )}
      {/* 게이지 바 + 판정 칩 (highlight + bands prop 있을 때) */}
      {highlight && bands && (() => {
        const num = parseFloat((value || '').replace(/,/g, ''));
        if (!isFinite(num)) return null;
        const [low, high] = bands as [number, number];
        const range = high - low;
        const pct = Math.min(95, Math.max(5, ((num - low) / range) * 100));
        const isLow  = num < low;
        const isHigh = num >= high;
        const judgeColor = isLow ? '#6f9c6a' : isHigh ? '#b94040' : '#c89650';
        const judgeLabel = isLow ? '저평가 구간' : isHigh ? '고평가 구간' : '중립 구간';
        const defaultInterp = isLow
          ? `${num.toFixed(1)} — 업종 기준(${low}~${high}) 대비 저평가.`
          : isHigh
            ? `${num.toFixed(1)} — 업종 기준(${low}~${high}) 대비 고평가.`
            : `${num.toFixed(1)} — 업종 기준 중립 범위.`;
        return (
          <div style={{ marginTop: 14 }}>
            <div style={{ height: 4, background: 'rgba(0,0,0,0.25)', position: 'relative', marginBottom: 4 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pct}%`, background: 'linear-gradient(90deg, #6f9c6a 0%, #c89650 50%, #b94040 100%)' }} />
              <div style={{ position: 'absolute', top: -3, left: `${pct}%`, width: 2, height: 10, background: 'rgba(255,255,255,0.9)', transform: 'translateX(-50%)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 8 }}>
              <span>저평가</span><span>중립</span><span>고평가</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ border: `1px solid ${judgeColor}`, color: judgeColor, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '2px 7px', background: 'rgba(0,0,0,0.2)' }}>◉ {judgeLabel}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
              {interpret ? interpret(num, isLow, isHigh) : defaultInterp}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function CalcHeader({ num, title, desc, color = '#C89650', calcId, results }: any) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!calcId || !results) return;
    dispatchCalcHistory(calcId, title, results);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const hasResults = results && results.some((r: any) => r.value && r.value !== '—' && r.value !== '' && r.value !== '0');

  return (
    <div className="mb-6 md:mb-8 pb-5 md:pb-6 border-b" style={{ borderColor: _BORDER }}>
      <div className="flex items-baseline gap-4 mb-2">
        <span className="text-xs mono" style={{ color }}>M—{num}</span>
        <span className="h-px flex-1" style={{ background: _BORDER }}></span>
        {hasResults && (
          <button
            onClick={handleSave}
            className="flex items-center gap-1 text-[12px] mono px-2 py-0.5 border transition-all"
            style={{
              borderColor: saved ? _T.accentGreen : _BORDER,
              color: saved ? _T.accentGreen : _T.textFaint,
            }}
            title="이 결과를 히스토리에 저장"
          >
            {saved ? <><Check size={9} /><span>저장됨</span></> : <><Clock size={9} /><span>저장</span></>}
          </button>
        )}
      </div>
      <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-2" style={{ color: _T.textPrimary }}>{title}</h2>
      <p className="text-sm" style={{ color: _T.textMuted }}>{desc}</p>
    </div>
  );
}

function CalcNote({ lines, how, example, tip }: any) {
  // 기존 호환성: lines 배열만 전달된 경우
  if (lines && !how && !example && !tip) {
    return (
      <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t" style={{ borderColor: _BORDER }}>
        <div className="text-[12px] mono uppercase tracking-[0.2em] mb-3" style={{ color: _T.textFaint }}>Notes</div>
        {lines.map((line, i) => (
          <div key={i} className="text-xs leading-relaxed" style={{ color: _T.textMuted }}>— {line}</div>
        ))}
      </div>
    );
  }
  // 새 구조: how(사용법), example(예시), tip(팁)
  return (
    <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t space-y-5" style={{ borderColor: _BORDER }}>
      {how && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-3" style={{ background: _T.accent }}></span>
            <div className="text-[12px] mono uppercase tracking-[0.2em]" style={{ color: _T.textFaint }}>How to Use · 사용법</div>
          </div>
          <div className="space-y-1.5">
            {how.map((line, i) => (
              <div key={i} className="text-xs md:text-sm leading-relaxed" style={{ color: _T.textSecondary }}>
                <span className="mono mr-2" style={{ color: _T.textFooter }}>{String(i + 1).padStart(2, '0')}.</span>{line}
              </div>
            ))}
          </div>
        </div>
      )}
      {example && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-3" style={{ background: '#A63D33' }}></span>
            <div className="text-[12px] mono uppercase tracking-[0.2em]" style={{ color: _T.textFaint }}>Example · 예시</div>
          </div>
          <div className="text-xs md:text-sm leading-relaxed p-3 md:p-4 border-l-2" style={{ borderColor: '#A63D33', background: _T.bgCard, color: _T.textSecondary }}>
            {typeof example === 'string' ? example : example.map((line, i) => (
              <div key={i} className={i > 0 ? 'mt-1' : ''}>{line}</div>
            ))}
          </div>
        </div>
      )}
      {tip && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-3" style={{ background: _T.accentGreen }}></span>
            <div className="text-[12px] mono uppercase tracking-[0.2em]" style={{ color: _T.textFaint }}>Tips · 해석 가이드</div>
          </div>
          <div className="space-y-1.5">
            {tip.map((line, i) => (
              <div key={i} className="text-xs md:text-sm leading-relaxed" style={{ color: _T.textMuted }}>— {line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function fmt(n, d = 2) {
  if (!isFinite(n) || isNaN(n)) return '—';
  return Number(n).toLocaleString('ko-KR', { maximumFractionDigits: d });
}

// ─────────────────────────────────────────────
// 계산기들 (기존 + 신규)
// ─────────────────────────────────────────────
function PERCalc() {
  const [price, setPrice] = useSessionState('calc_per_price', '');
  const [netIncome, setNetIncome] = useSessionState('calc_per_netIncome', '');
  const [shares, setShares] = useSessionState('calc_per_shares', '');
  const eps = netIncome && shares ? Number(netIncome) / Number(shares) : 0;
  const per = price && eps ? Number(price) / eps : 0;
  return (
    <div>
      <CalcHeader num="01" title="PER · EPS 계산" desc="주가수익비율과 주당순이익을 산출합니다." />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="현재 주가" value={price} onChange={setPrice} unit="원" placeholder="50,000" />
        <NumInput label="당기순이익 (연간)" value={netIncome} onChange={setNetIncome} unit="원" placeholder="100,000,000,000" hint="연간 총 순이익" />
        <NumInput label="발행주식수" value={shares} onChange={setShares} unit="주" placeholder="10,000,000" hint="자기주식 제외" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="EPS · 주당순이익" value={fmt(eps)} unit="원" /></div>
        <ResultBox label="PER · 주가수익비율" value={fmt(per)} unit="배" highlight bands={[10, 25]} interpret={(n, isLow, isHigh) => isLow ? `PER ${n.toFixed(1)}배 — 저평가 구간. 업종·성장성 함께 확인하세요.` : isHigh ? `PER ${n.toFixed(1)}배 — 고평가 구간. 성장 프리미엄이 반영된 수준.` : `PER ${n.toFixed(1)}배 — 업종 평균 수준.`} />
      </div>
      <CalcNote
        how={[
          '현재 주가: 네이버 금융·증권사 앱에서 실시간 확인',
          '당기순이익: 분기·반기·사업보고서의 "당기순이익" 항목 (연간 기준)',
          '발행주식수: 공시된 "유통주식수" 또는 "보통주 발행주식총수"',
        ]}
        example={[
          '삼성전자 주가 70,000원, 연간 순이익 26조, 발행주식수 59억주일 때',
          'EPS = 26조 ÷ 59억 = 4,400원',
          'PER = 70,000 ÷ 4,400 = 약 15.9배',
          '→ "1원 벌기 위해 투자자가 15.9원을 지불하고 있다"는 의미',
        ]}
        tip={[
          'PER이 낮을수록 이익 대비 저평가 상태입니다. 단, 성장성과 업종 차이를 함께 고려해야 합니다.',
          '업종 평균 PER과 비교: 반도체 12배, 은행 5배, 바이오 30배 등 업종마다 다름',
          'PER이 마이너스면 적자 기업으로 해석이 불가합니다. PSR로 대체 평가하세요.',
          '미래 이익 기준 Forward PER이 더 중요합니다. 이익 성장률도 함께 확인하세요.',
        ]}
      />
    </div>
  );
}

function PSRCalc() {
  const [price, setPrice] = useSessionState('calc_psr_price', '');
  const [sales, setSales] = useSessionState('calc_psr_sales', '');
  const [shares, setShares] = useSessionState('calc_psr_shares', '');
  const sps = sales && shares ? Number(sales) / Number(shares) : 0;
  const psr = price && sps ? Number(price) / sps : 0;
  const marketCap = price && shares ? Number(price) * Number(shares) : 0;
  return (
    <div>
      <CalcHeader num="03" title="PSR · 주가매출비율" desc="적자·성장 기업 평가에 유용한 매출 기반 밸류에이션." />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="현재 주가" value={price} onChange={setPrice} unit="원" placeholder="50,000" />
        <NumInput label="연간 매출액" value={sales} onChange={setSales} unit="원" placeholder="500,000,000,000" hint="최근 4분기 합산" />
        <NumInput label="발행주식수" value={shares} onChange={setShares} unit="주" placeholder="10,000,000" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="SPS · 주당매출액" value={fmt(sps, 0)} unit="원" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="시가총액" value={fmt(marketCap, 0)} unit="원" /></div>
        <ResultBox label="PSR · 주가매출비율" value={fmt(psr, 2)} unit="배" highlight />
      </div>
      <CalcNote
        how={[
          '현재 주가: 실시간 주가',
          '연간 매출액: 최근 4개 분기 매출 합계 (TTM · Trailing Twelve Months)',
          '발행주식수: 공시 기준 유통주식수',
        ]}
        example={[
          '쿠팡: 주가 25달러, 매출 260억 달러, 발행주식수 18억주',
          'SPS = 260억 ÷ 18억 = 약 14.4달러',
          'PSR = 25 ÷ 14.4 ≈ 1.7배',
          '→ "매출 1달러당 시가총액 1.7달러" → 성장 기대가 반영된 수준',
        ]}
        tip={[
          '적자 기업·초기 성장주 평가에 PER보다 유용 (분모가 이익 아닌 매출)',
          '업종별 정상 범위: 유통·리테일 0.3~1배, 제조 1~3배, SaaS·테크 5~15배',
          'PSR 0.5배 미만 = 극저평가 의심 구간 (위기 또는 산업 구조 쇠퇴)',
          '마진이 낮은 기업에서 PSR이 낮다고 무조건 저평가는 아닙니다. 영업이익률을 함께 확인하세요.',
          'PSR × 순이익률 ≈ PER 관계 있음 (마진 3%면 PSR 1배 = PER 33배)',
        ]}
      />
    </div>
  );
}

function PBRCalc() {
  const [price, setPrice] = useSessionState('calc_pbr_price', '');
  const [equity, setEquity] = useSessionState('calc_pbr_equity', '');
  const [shares, setShares] = useSessionState('calc_pbr_shares', '');
  const bps = equity && shares ? Number(equity) / Number(shares) : 0;
  const pbr = price && bps ? Number(price) / bps : 0;
  return (
    <div>
      <CalcHeader num="02" title="PBR · BPS 계산" desc="주가순자산비율과 주당순자산을 산출합니다." />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="현재 주가" value={price} onChange={setPrice} unit="원" placeholder="30,000" />
        <NumInput label="자본총계" value={equity} onChange={setEquity} unit="원" placeholder="500,000,000,000" hint="재무상태표의 자본총계" />
        <NumInput label="발행주식수" value={shares} onChange={setShares} unit="주" placeholder="10,000,000" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="BPS · 주당순자산" value={fmt(bps)} unit="원" /></div>
        <ResultBox label="PBR · 주가순자산비율" value={fmt(pbr)} unit="배" highlight bands={[0.5, 2.0]} interpret={(n, isLow, isHigh) => isLow ? `PBR ${n.toFixed(2)}배 — 순자산 대비 저평가.` : isHigh ? `PBR ${n.toFixed(2)}배 — 순자산 대비 고평가.` : `PBR ${n.toFixed(2)}배 — 통상적 범위.`} />
      </div>
      <CalcNote
        how={[
          '현재 주가: 실시간 주가',
          '자본총계: 재무상태표 맨 아래 "자본총계" 항목 (= 자산 − 부채)',
          '발행주식수: 유통주식수',
        ]}
        example={[
          'KB금융 주가 60,000원, 자본총계 42조, 발행주식수 4억주일 때',
          'BPS = 42조 ÷ 4억 = 105,000원',
          'PBR = 60,000 ÷ 105,000 = 0.57배',
          '→ "장부가치보다 43% 할인된 가격" → 전통적으로 저평가 구간',
        ]}
        tip={[
          'PBR 1배 미만 = 청산가치 이하 (극단적 저평가 또는 구조적 문제 의심)',
          '은행주·보험주·지주사는 구조적으로 PBR 낮음 (0.3~0.8배 범위)',
          '테크·플랫폼은 무형자산 중심이라 PBR 높아도 정상 (5~20배)',
          'PBR × ROE ≈ 적정 PER 공식. ROE가 높고 PBR이 낮을수록 매력적입니다.',
          '자본총계에 영업권·무형자산 많이 포함된 경우 실질가치 재평가 필요',
        ]}
      />
    </div>
  );
}

function TargetPriceCalc() {
  const [eps, setEps] = useState('');
  const [targetPer, setTargetPer] = useState('');
  const [current, setCurrent] = useState('');
  const target = eps && targetPer ? Number(eps) * Number(targetPer) : 0;
  const upside = current && target ? ((target - Number(current)) / Number(current)) * 100 : 0;
  return (
    <div>
      <CalcHeader num="04" title="목표주가 계산" desc="EPS와 적정 PER로 목표주가를 산출합니다." />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="예상 EPS" value={eps} onChange={setEps} unit="원" placeholder="5,000" />
        <NumInput label="목표 PER" value={targetPer} onChange={setTargetPer} unit="배" placeholder="12" />
        <NumInput label="현재 주가" value={current} onChange={setCurrent} unit="원" placeholder="45,000" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="목표주가" value={fmt(target, 0)} unit="원" highlight /></div>
        <ResultBox label="상승여력" value={fmt(upside)} unit="%" />
      </div>
      <CalcNote
        how={[
          '예상 EPS: 애널리스트 컨센서스 또는 최근 4분기 EPS × 성장률',
          '목표 PER: 업종 평균 PER, 과거 5년 평균 PER, 또는 Peer 기업 PER 활용',
          '현재 주가와 비교해 상승여력(%) 확인',
        ]}
        example={[
          '반도체 기업 예상 EPS 5,000원, 업종 평균 PER 12배, 현재 주가 45,000원',
          '목표주가 = 5,000 × 12 = 60,000원',
          '상승여력 = (60,000 − 45,000) ÷ 45,000 = +33%',
          '→ 매수 관점에서 매력적',
        ]}
        tip={[
          '목표 PER 선정이 가장 중요합니다. 보수적으로 과거 평균 하단을 사용하는 것을 권장합니다.',
          '상승여력 20% 이상: 매수 매력 / 10% 미만: 유지 / 음수: 비중 축소',
          '성장률 반영: PEG < 1 (성장 대비 저평가)',
          '증권사 목표주가는 대부분 낙관적입니다. 직접 산정하는 습관을 들이세요.',
        ]}
      />
    </div>
  );
}

function DCFCalc() {
  const [fcf, setFcf] = useState('');
  const [growth, setGrowth] = useState('5');
  const [discount, setDiscount] = useState('10');
  const [terminal, setTerminal] = useState('2.5');
  const [years] = useState(5);

  const r = Number(discount) / 100;
  const g = Number(growth) / 100;
  const tg = Number(terminal) / 100;
  let pv = 0;
  let lastFcf = Number(fcf) || 0;
  for (let t = 1; t <= years; t++) {
    const ft = lastFcf * Math.pow(1 + g, t);
    pv += ft / Math.pow(1 + r, t);
  }
  const terminalValue = lastFcf * Math.pow(1 + g, years) * (1 + tg) / (r - tg);
  const pvTerminal = isFinite(terminalValue) ? terminalValue / Math.pow(1 + r, years) : 0;
  const enterpriseValue = pv + pvTerminal;

  return (
    <div>
      <CalcHeader num="05" title="DCF 간이 평가" desc="향후 5년 FCF와 영구성장률로 기업가치를 추정합니다." />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="현재 FCF (연간)" value={fcf} onChange={setFcf} unit="원" placeholder="10,000,000,000" />
        <NumInput label="FCF 성장률 (5년)" value={growth} onChange={setGrowth} unit="%" placeholder="5" />
        <NumInput label="할인율 (WACC)" value={discount} onChange={setDiscount} unit="%" placeholder="10" hint="보통 8~12%" />
        <NumInput label="영구성장률" value={terminal} onChange={setTerminal} unit="%" placeholder="2.5" hint="GDP 성장률 수준" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="5년 PV 합계" value={fmt(pv, 0)} unit="원" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="터미널 PV" value={fmt(pvTerminal, 0)} unit="원" /></div>
        <ResultBox label="기업가치 (EV)" value={fmt(enterpriseValue, 0)} unit="원" highlight />
      </div>
      <CalcNote
        how={[
          '현재 FCF: 직전 사업연도 또는 최근 4분기 잉여현금흐름(Free Cash Flow)',
          'FCF 성장률: 향후 5년간 연평균 FCF 성장 기대치 (보수적으로 과거 3~5년 평균 사용)',
          '할인율(WACC): 회사의 가중평균자본비용. 대형 우량주 8~10%, 성장주 12~15%',
          '영구성장률: 5년 이후의 연간 성장률. GDP 성장률(2~3%)이 일반적',
        ]}
        example={[
          '테크 기업: 현재 FCF 1조원, 성장률 8%, 할인율 10%, 영구성장률 2.5%',
          '5년간 예상 FCF 현재가치 합계 ≈ 약 4.7조원',
          '터미널 밸류 현재가치 ≈ 약 14.3조원',
          '총 기업가치(EV) ≈ 19조원',
          '→ 시가총액보다 크면 저평가, 작으면 고평가',
        ]}
        tip={[
          'DCF는 입력값에 매우 민감합니다. 할인율 1% 차이만으로도 결과가 20% 이상 달라질 수 있습니다.',
          '보수적 접근: 성장률 낮게, 할인율 높게 잡아 안전마진 확보',
          '결과는 절대적 숫자가 아닌 "매수 의사결정 참고용"으로 활용',
          '주당 가치 = (EV − 순차입금) ÷ 발행주식수',
          '버핏도 DCF를 "간단한 산수지만 매우 중요하다"고 언급',
        ]}
      />
    </div>
  );
}

function WACCCalc() {
  const [mktcap, setMktcap] = useState('');
  const [debt, setDebt] = useState('');
  const [re, setRe] = useState('');
  const [rd, setRd] = useState('');
  const [taxrate, setTaxrate] = useState('22');
  const V = (Number(mktcap) || 0) + (Number(debt) || 0);
  const wE = V ? Number(mktcap) / V : 0;
  const wD = V ? Number(debt) / V : 0;
  const wacc = (wE * Number(re || 0) + wD * Number(rd || 0) * (1 - Number(taxrate) / 100));
  return (
    <div>
      <CalcHeader num="06" title="WACC 계산" desc="가중평균자본비용을 산출합니다." />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="자기자본 (시가총액)" value={mktcap} onChange={setMktcap} unit="원" placeholder="500,000,000,000" />
        <NumInput label="부채 (시장가치)" value={debt} onChange={setDebt} unit="원" placeholder="200,000,000,000" />
        <NumInput label="자기자본비용 (Re)" value={re} onChange={setRe} unit="%" placeholder="10" hint="CAPM으로 산출" />
        <NumInput label="타인자본비용 (Rd)" value={rd} onChange={setRd} unit="%" placeholder="4.5" hint="회사채 금리 수준" />
        <NumInput label="법인세율" value={taxrate} onChange={setTaxrate} unit="%" placeholder="22" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="자기자본 비중" value={fmt(wE * 100)} unit="%" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="부채 비중" value={fmt(wD * 100)} unit="%" /></div>
        <ResultBox label="WACC" value={fmt(wacc)} unit="%" highlight />
      </div>
      <CalcNote
        how={[
          '자기자본(E): 시가총액 = 주가 × 발행주식수',
          '부채(D): 이자부 부채의 시장가치 (회사채 + 은행차입 등)',
          '자기자본비용(Re): CAPM으로 계산 = 무위험금리 + 베타 × 시장 리스크 프리미엄 (보통 8~12%)',
          '타인자본비용(Rd): 회사채 금리 또는 은행대출 금리 (보통 3~6%)',
          '법인세율: 한국 22% (대기업 24%), 미국 21%',
        ]}
        example={[
          '자기자본 5,000억, 부채 2,000억, Re 10%, Rd 4.5%, 세율 22%',
          '총자본 V = 5,000 + 2,000 = 7,000억',
          'WACC = (5,000/7,000) × 10% + (2,000/7,000) × 4.5% × (1-0.22)',
          'WACC = 7.14% + 1.00% = 8.14%',
          '→ 연 8.14% 이상 수익을 내야 자본비용 초과',
        ]}
        tip={[
          '부채 적정 활용 시 WACC 낮아짐 (세금 절감 효과)',
          'WACC는 DCF의 할인율로 직접 사용',
          'ROIC > WACC 이면 기업이 가치를 창출하는 중',
          '업종 평균: 테크 9~12%, 은행 10%, 유틸리티 6~8%',
        ]}
      />
    </div>
  );
}

function ROECalc() {
  const [ni, setNi] = useState('');
  const [equity, setEquity] = useState('');
  const [assets, setAssets] = useState('');
  const roe = ni && equity ? (Number(ni) / Number(equity)) * 100 : 0;
  const roa = ni && assets ? (Number(ni) / Number(assets)) * 100 : 0;
  return (
    <div>
      <CalcHeader num="07" title="ROE · ROA 계산" desc="자기자본이익률과 총자산이익률을 산출합니다." color="#A63D33" />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="당기순이익" value={ni} onChange={setNi} unit="원" placeholder="50,000,000,000" />
        <NumInput label="자기자본" value={equity} onChange={setEquity} unit="원" placeholder="500,000,000,000" />
        <NumInput label="총자산" value={assets} onChange={setAssets} unit="원" placeholder="1,000,000,000,000" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="ROE" value={fmt(roe)} unit="%" highlight color="#A63D33" /></div>
        <ResultBox label="ROA" value={fmt(roa)} unit="%" />
      </div>
      <CalcNote
        how={[
          '당기순이익: 연간 순이익 (손익계산서 맨 아래 항목)',
          '자기자본: 재무상태표의 "자본총계"',
          '총자산: 재무상태표의 "자산총계"',
          'ROE는 "주주 돈으로 얼마 벌었는가", ROA는 "전체 자산으로 얼마 벌었는가"',
        ]}
        example={[
          '순이익 500억, 자기자본 3,000억, 총자산 8,000억',
          'ROE = 500 ÷ 3,000 × 100 = 16.7% (우수)',
          'ROA = 500 ÷ 8,000 × 100 = 6.25%',
          'ROE/ROA = 2.67 → 레버리지 2.67배 활용 중',
        ]}
        tip={[
          'ROE 기준선: 10% 보통, 15% 우수, 20% 이상 최상위',
          '한국 대기업 평균 ROE 약 8~12%, 미국 S&P500 약 15~18%',
          'ROE가 높아도 부채가 많으면 위험할 수 있습니다. ROA와 함께 확인하세요.',
          'ROE가 갑자기 상승하면 자사주 매입·배당 영향일 수 있음',
          '지속 가능한 성장률 ≈ ROE × (1 − 배당성향)',
        ]}
      />
    </div>
  );
}

function DuPontCalc() {
  const [ni, setNi] = useState('');
  const [sales, setSales] = useState('');
  const [assets, setAssets] = useState('');
  const [equity, setEquity] = useState('');
  const margin = ni && sales ? Number(ni) / Number(sales) : 0;
  const turnover = sales && assets ? Number(sales) / Number(assets) : 0;
  const leverage = assets && equity ? Number(assets) / Number(equity) : 0;
  const roe = margin * turnover * leverage * 100;
  return (
    <div>
      <CalcHeader num="08" title="듀퐁 분해" desc="ROE를 순이익률 · 자산회전율 · 재무레버리지로 분해합니다." color="#A63D33" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="당기순이익" value={ni} onChange={setNi} unit="원" placeholder="50,000,000,000" />
        <NumInput label="매출액" value={sales} onChange={setSales} unit="원" placeholder="1,000,000,000,000" />
        <NumInput label="총자산" value={assets} onChange={setAssets} unit="원" placeholder="1,500,000,000,000" />
        <NumInput label="자기자본" value={equity} onChange={setEquity} unit="원" placeholder="600,000,000,000" />
      </div>
      <div className="grid md:grid-cols-4 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="순이익률" value={fmt(margin * 100)} unit="%" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="자산회전율" value={fmt(turnover, 3)} unit="회" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="재무레버리지" value={fmt(leverage, 3)} unit="배" /></div>
        <ResultBox label="ROE" value={fmt(roe)} unit="%" highlight color="#A63D33" />
      </div>
      <CalcNote
        how={[
          '순이익률: 매출 대비 남는 이익의 비율 (사업의 수익성)',
          '자산회전율: 자산을 얼마나 효율적으로 돌리는가 (사업의 효율성)',
          '재무레버리지: 부채를 얼마나 활용하는가 (사업의 레버리지)',
          '세 요소의 곱이 ROE',
        ]}
        example={[
          '순이익 100억, 매출 1,000억, 자산 1,500억, 자본 600억',
          '순이익률 = 10%, 자산회전율 = 0.67회, 레버리지 = 2.5배',
          'ROE = 10% × 0.67 × 2.5 = 16.7%',
          '→ 레버리지 기여도가 높음 → 부채 의존 주의',
        ]}
        tip={[
          '순이익률 상승 = 질적 성장 (브랜드·경쟁력)',
          '자산회전율 상승 = 운영 효율화',
          '레버리지 상승 = 위험도 증가 (금리 환경에 취약)',
          '같은 ROE라도 "이익률 × 회전율" 조합이 "레버리지 기반"보다 건전',
          '업종 특성 고려: 유통업은 회전율↑이익률↓, 반도체는 반대',
        ]}
      />
    </div>
  );
}

function MarginCalc() {
  const [sales, setSales] = useState('');
  const [cogs, setCogs] = useState('');
  const [sga, setSga] = useState('');
  const [ni, setNi] = useState('');
  const gross = sales && cogs ? ((Number(sales) - Number(cogs)) / Number(sales)) * 100 : 0;
  const op = sales && cogs && sga ? ((Number(sales) - Number(cogs) - Number(sga)) / Number(sales)) * 100 : 0;
  const net = sales && ni ? (Number(ni) / Number(sales)) * 100 : 0;
  return (
    <div>
      <CalcHeader num="09" title="마진 분석" desc="매출총이익률 · 영업이익률 · 순이익률을 함께 계산합니다." color="#A63D33" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="매출액" value={sales} onChange={setSales} unit="원" placeholder="1,000,000,000,000" />
        <NumInput label="매출원가" value={cogs} onChange={setCogs} unit="원" placeholder="600,000,000,000" />
        <NumInput label="판관비" value={sga} onChange={setSga} unit="원" placeholder="200,000,000,000" />
        <NumInput label="당기순이익" value={ni} onChange={setNi} unit="원" placeholder="120,000,000,000" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="매출총이익률" value={fmt(gross)} unit="%" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="영업이익률" value={fmt(op)} unit="%" highlight color="#A63D33" /></div>
        <ResultBox label="순이익률" value={fmt(net)} unit="%" />
      </div>
      <CalcNote
        how={[
          '매출액: 손익계산서 맨 위 "매출액"',
          '매출원가: 재료비·인건비·감가상각 등 직접 원가',
          '판관비: 판매비+관리비 (인건비·마케팅·임차료 등)',
          '당기순이익: 세후 최종 이익',
        ]}
        example={[
          '매출 1조, 원가 6,000억, 판관비 2,000억, 순이익 1,200억',
          '매출총이익률 = 40% (제품 자체 경쟁력)',
          '영업이익률 = 20% (본업 수익성)',
          '순이익률 = 12% (세금·금융비 차감 후)',
        ]}
        tip={[
          '매출총이익률 높다 = 브랜드·기술력 강함 (Apple 40%+)',
          '영업이익률 20%+ = 매우 우수 (카카오 초기, 삼성전자 호황기)',
          '순이익률은 비경상적 손익이 포함되어 변동이 큽니다. 본질적인 수익성은 영업이익률로 확인하세요.',
          '업종별 정상 영업이익률: 유통 3~5%, 반도체 15~30%, 소프트웨어 20~40%',
          '이익률 하락 추세 = 경쟁 격화 또는 비용 구조 악화 신호',
        ]}
      />
    </div>
  );
}

function BEPCalc() {
  const [fixed, setFixed] = useState('');
  const [price, setPrice] = useState('');
  const [varcost, setVarcost] = useState('');
  const unit = price && varcost ? Number(fixed) / (Number(price) - Number(varcost)) : 0;
  const sales = price ? unit * Number(price) : 0;
  const cm = price && varcost ? ((Number(price) - Number(varcost)) / Number(price)) * 100 : 0;
  return (
    <div>
      <CalcHeader num="10" title="손익분기점 (BEP)" desc="손익분기 판매수량과 매출액을 산출합니다." color="#A63D33" />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="고정비 (연간)" value={fixed} onChange={setFixed} unit="원" placeholder="100,000,000" />
        <NumInput label="단위당 판매가" value={price} onChange={setPrice} unit="원" placeholder="10,000" />
        <NumInput label="단위당 변동비" value={varcost} onChange={setVarcost} unit="원" placeholder="6,000" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="BEP 수량" value={fmt(unit, 0)} unit="개" highlight color="#A63D33" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="BEP 매출액" value={fmt(sales, 0)} unit="원" /></div>
        <ResultBox label="한계이익률" value={fmt(cm)} unit="%" />
      </div>
      <CalcNote
        how={[
          '고정비: 판매량과 무관하게 발생하는 비용 (임차료·인건비·감가상각)',
          '판매가: 단위당 판매 가격',
          '변동비: 판매량에 비례해 발생하는 원가 (재료비·수수료)',
          '차이(공헌이익)로 고정비 회수 → 이후부터 이익',
        ]}
        example={[
          '음식점 월 고정비 1,000만원, 객단가 15,000원, 변동비 6,000원',
          'BEP 수량 = 1,000만 ÷ (15,000 − 6,000) = 약 1,112명',
          'BEP 매출 = 1,112 × 15,000 ≈ 1,667만원',
          '한계이익률 = 60% → BEP 이후 매출 1원 당 0.6원 이익',
        ]}
        tip={[
          'BEP 돌파 후 매출 증가분의 한계이익률만큼 이익 증가',
          '고정비 많은 사업(호텔·항공)은 BEP 높지만 초과 시 레버리지 큼',
          '변동비 높은 사업(유통)은 BEP 낮지만 마진 얇음',
          '안전마진율 = (현재 매출 − BEP) ÷ 현재 매출 × 100 → 30%+ 안정',
        ]}
      />
    </div>
  );
}

function DividendCalc() {
  const [price, setPrice] = useState('');
  const [dps, setDps] = useState('');
  const [shares, setShares] = useState('');
  const yld = price && dps ? (Number(dps) / Number(price)) * 100 : 0;
  const annualDiv = dps && shares ? Number(dps) * Number(shares) : 0;
  const afterTax = annualDiv * (1 - 0.154);
  return (
    <div>
      <CalcHeader num="11" title="배당수익률 계산" desc="배당수익률과 세후 실수령액을 산출합니다." color="#C08E6A" />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="현재 주가" value={price} onChange={setPrice} unit="원" placeholder="50,000" />
        <NumInput label="주당배당금 (DPS)" value={dps} onChange={setDps} unit="원" placeholder="2,000" />
        <NumInput label="보유주식수" value={shares} onChange={setShares} unit="주" placeholder="100" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="배당수익률" value={fmt(yld)} unit="%" highlight color="#C08E6A" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="세전 배당금" value={fmt(annualDiv, 0)} unit="원" /></div>
        <ResultBox label="세후 수령액" value={fmt(afterTax, 0)} unit="원" />
      </div>
      <CalcNote
        how={[
          '주가: 매수 시점의 주가',
          'DPS: 1주당 현금 배당금 (전자공시 "현금·현물배당결정" 공시 확인)',
          '보유주식수: 본인 보유 수량',
          '한국 배당소득세 15.4% 자동 원천징수',
        ]}
        example={[
          '삼성전자 주가 70,000원, DPS 연 1,444원, 100주 보유',
          '배당수익률 = 1,444 ÷ 70,000 = 약 2.06%',
          '세전 배당 = 1,444 × 100 = 144,400원',
          '세후 수령 = 144,400 × (1 − 0.154) = 약 122,164원',
        ]}
        tip={[
          '배당수익률은 매수가 기준이면 "내 수익률", 현재가 기준이면 "시장 수익률"',
          '배당성향 30~60%가 건전 (너무 높으면 성장 여력 없음)',
          '금융소득 연 2,000만원 초과 시 종합과세(15.4% → 최대 49.5%)',
          '배당락일 이전에 매수해야 배당 권리가 발생합니다. 거래일 기준 2일 전까지 매수하세요.',
          '고배당주 주의: 배당수익률만 쫓으면 주가 하락 + 배당컷 리스크',
        ]}
      />
    </div>
  );
}

function CompoundCalc() {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [years, setYears] = useState('');
  const [monthly, setMonthly] = useState('');
  const r = Number(rate) / 100;
  const n = Number(years);
  const p = Number(principal) || 0;
  const m = Number(monthly) || 0;
  const lumpSum = p * Math.pow(1 + r, n);
  const monthlyFV = m > 0 && r > 0 ? m * ((Math.pow(1 + r / 12, n * 12) - 1) / (r / 12)) : m * n * 12;
  const total = lumpSum + monthlyFV;
  const totalInvested = p + m * n * 12;
  const profit = total - totalInvested;
  return (
    <div>
      <CalcHeader num="12" title="복리 계산" desc="원금과 월 적립금의 복리 수익을 산출합니다." color="#C08E6A" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="초기 원금" value={principal} onChange={setPrincipal} unit="원" placeholder="10,000,000" />
        <NumInput label="매월 추가 투자" value={monthly} onChange={setMonthly} unit="원" placeholder="500,000" />
        <NumInput label="연 수익률" value={rate} onChange={setRate} unit="%" placeholder="8" />
        <NumInput label="투자 기간" value={years} onChange={setYears} unit="년" placeholder="20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="최종 평가액" value={fmt(total, 0)} unit="원" highlight color="#C08E6A" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="총 투자원금" value={fmt(totalInvested, 0)} unit="원" /></div>
        <ResultBox label="순수익" value={fmt(profit, 0)} unit="원" />
      </div>
      <CalcNote
        how={[
          '초기 원금: 시작 시 투자하는 일시금',
          '매월 추가 투자: 매월 납입하는 적립금 (0이면 일시 투자만)',
          '연 수익률: 기대 연평균 복리 수익률',
          '투자 기간: 총 투자 기간 (년 단위)',
        ]}
        example={[
          '20대가 월 50만원씩 S&P500 ETF 40년간 적립, 연 10% 가정',
          '총 투자원금 = 월 50만 × 480개월 = 2억 4,000만원',
          '최종 평가액 ≈ 약 31억원',
          '순수익 ≈ 28억 6천만원 (원금의 12배 이상)',
        ]}
        tip={[
          '복리의 힘은 시간과 수익률의 곱입니다. 일찍 시작할수록 결과의 차이가 극적으로 벌어집니다.',
          '연 10%는 역사적 S&P500 수익률, 한국 주식은 장기 연 7~8%',
          '세금·인플레 감안 시 실질 수익률은 명목의 70% 수준',
          '수익률 변동성은 고려되지 않습니다. 실제 결과는 투자 경로에 따라 달라질 수 있습니다.',
          '적립식 투자는 평균단가 분산 효과로 변동성 완화',
        ]}
      />
    </div>
  );
}

function CAGRCalc() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [years, setYears] = useState('');
  const cagr = start && end && years ? (Math.pow(Number(end) / Number(start), 1 / Number(years)) - 1) * 100 : 0;
  const totalReturn = start && end ? ((Number(end) - Number(start)) / Number(start)) * 100 : 0;
  return (
    <div>
      <CalcHeader num="13" title="CAGR 연평균 복리수익률" desc="시작값과 종료값으로 연평균 성장률을 계산합니다." color="#C08E6A" />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="시작 값" value={start} onChange={setStart} unit="" placeholder="10,000,000" />
        <NumInput label="종료 값" value={end} onChange={setEnd} unit="" placeholder="25,000,000" />
        <NumInput label="기간" value={years} onChange={setYears} unit="년" placeholder="10" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="CAGR" value={fmt(cagr)} unit="%" highlight color="#C08E6A" /></div>
        <ResultBox label="총 수익률" value={fmt(totalReturn)} unit="%" />
      </div>
      <CalcNote
        how={[
          '시작 값: 투자 시작 시점의 금액 또는 지표',
          '종료 값: 측정 시점의 금액 또는 지표',
          '기간: 경과 연수 (일수 × 365 필요 없음, 그냥 연도 수)',
          'CAGR은 매년 동일한 성장률로 환산한 값',
        ]}
        example={[
          '10년 전 1,000만원 투자한 것이 현재 3,500만원',
          '총수익률 = 250% (오해하기 쉬움)',
          'CAGR = (3,500/1,000)^(1/10) − 1 = 약 13.3%',
          '→ "연평균 13.3% 복리로 성장"이 정확한 표현',
        ]}
        tip={[
          'CAGR은 변동성을 "평활화"해서 장기 성과를 한 숫자로 요약',
          '같은 총수익률이라도 기간에 따라 CAGR 다름 (기간 길수록 CAGR↓)',
          '펀드·ETF 장기 성과 비교의 표준',
          '중간 변동성 정보가 손실된다는 한계가 있습니다. MDD, 샤프지수와 함께 보면 더 완전한 분석이 됩니다.',
          'S&P500 장기 CAGR ≈ 10%, 한국 KOSPI ≈ 6~8%',
        ]}
      />
    </div>
  );
}

function Rule72Calc() {
  const [rate, setRate] = useState('');
  const [years, setYears] = useState('');
  const yearsToDouble = rate ? 72 / Number(rate) : 0;
  const rateFromYears = years ? 72 / Number(years) : 0;
  return (
    <div>
      <CalcHeader num="14" title="72의 법칙" desc="원금이 2배가 되는 기간 또는 필요 수익률을 추정합니다." color="#C08E6A" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <div>
          <NumInput label="연 수익률로 계산" value={rate} onChange={setRate} unit="%" placeholder="8" />
          <div className="mt-4">
            <ResultBox label="2배 되는 기간" value={fmt(yearsToDouble, 1)} unit="년" highlight color="#C08E6A" />
          </div>
        </div>
        <div>
          <NumInput label="기간으로 계산" value={years} onChange={setYears} unit="년" placeholder="10" />
          <div className="mt-4">
            <ResultBox label="필요 수익률" value={fmt(rateFromYears, 2)} unit="%" />
          </div>
        </div>
      </div>
      <CalcNote
        how={[
          '2배 기간 계산: 72 ÷ 연 수익률(%) = 몇 년 뒤 원금 2배',
          '필요 수익률 계산: 72 ÷ 목표 년수 = 필요한 연 수익률',
          '근사식이지만 수익률 6~12% 범위에서 매우 정확',
        ]}
        example={[
          '연 8% 수익률이면 → 72 ÷ 8 = 9년 뒤 원금 2배',
          '10년 안에 원금 2배 원하면 → 72 ÷ 10 = 연 7.2% 수익률 필요',
          '연 6%면 12년, 연 12%면 6년',
        ]}
        tip={[
          '수익률 변동 체감: 연 3% → 24년, 연 6% → 12년, 연 12% → 6년',
          '4배 되는 기간: 72 × 2 ÷ 수익률',
          '인플레이션에도 적용할 수 있습니다. 물가가 2배 되는 기간 = 72 ÷ 인플레율',
          '은행 예금 3%에 머물면 화폐가치 반토막은 24년 걸리지만 2배는 24년 필요',
          '아인슈타인이 "복리는 세계 8대 불가사의"라 한 이유',
        ]}
      />
    </div>
  );
}

function AvgPriceCalc() {
  const [p1, setP1] = useState('');
  const [q1, setQ1] = useState('');
  const [p2, setP2] = useState('');
  const [q2, setQ2] = useState('');
  const [current, setCurrent] = useState('');
  const totalCost = (Number(p1) * Number(q1) || 0) + (Number(p2) * Number(q2) || 0);
  const totalQty = (Number(q1) || 0) + (Number(q2) || 0);
  const avg = totalQty ? totalCost / totalQty : 0;
  const currentValue = current && totalQty ? Number(current) * totalQty : 0;
  const pnl = currentValue - totalCost;
  const pnlRate = totalCost ? (pnl / totalCost) * 100 : 0;
  return (
    <div>
      <CalcHeader num="15" title="평균단가 · 물타기 계산" desc="추가매수 후 평균단가와 평가손익을 산출합니다." color="#8A8A8A" />
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <NumInput label="① 매수가" value={p1} onChange={setP1} unit="원" placeholder="50,000" />
        <NumInput label="① 수량" value={q1} onChange={setQ1} unit="주" placeholder="100" />
        <NumInput label="② 추가매수가" value={p2} onChange={setP2} unit="원" placeholder="40,000" />
        <NumInput label="② 수량" value={q2} onChange={setQ2} unit="주" placeholder="100" />
      </div>
      <div className="mb-8">
        <NumInput label="현재가 (손익 계산용)" value={current} onChange={setCurrent} unit="원" placeholder="45,000" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: _BORDER }}>
        <div className="border-r border-b" style={{ borderColor: _BORDER }}><ResultBox label="평균 매수단가" value={fmt(avg, 0)} unit="원" highlight color="#8A8A8A" /></div>
        <div className="border-b" style={{ borderColor: _BORDER }}><ResultBox label="총 보유수량" value={fmt(totalQty, 0)} unit="주" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="평가손익" value={fmt(pnl, 0)} unit="원" /></div>
        <ResultBox label="수익률" value={fmt(pnlRate)} unit="%" />
      </div>
      <CalcNote
        how={[
          '① 첫 매수가와 수량 입력',
          '② 추가 매수가와 수량 입력 (물타기 또는 추가 매수)',
          '현재가 입력 시 평가손익 자동 계산',
        ]}
        example={[
          '50,000원에 100주 매수 후 40,000원에 100주 추가 매수',
          '총 투자 = 5,000,000 + 4,000,000 = 9,000,000원',
          '평균단가 = 9,000,000 ÷ 200 = 45,000원',
          '현재가 47,000원이면 평가손익 = +400,000원 (+4.4%)',
        ]}
        tip={[
          '물타기는 본전 회복에 유용하나 "추세 확인 없이" 하면 위험',
          '하락 중인 종목에 물타기 = 손실 확대 위험 (나락행)',
          '물타기 전 체크: 펀더멘털 변화 없었는지, 단순 시장 조정인지',
          '분할 매수 전략: 3~4차례 나눠서 목표 비중까지 단계적 매수',
          '손절 라인 재설정: 평균단가 기준 −10~15% 재손절',
        ]}
      />
    </div>
  );
}

function CommissionCalc() {
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [feeRate, setFeeRate] = useState('0.015');
  const [type, setType] = useState('sell');
  const amount = price && qty ? Number(price) * Number(qty) : 0;
  const fee = amount * Number(feeRate) / 100;
  const tax = type === 'sell' ? amount * 0.18 / 100 : 0;
  const total = type === 'buy' ? amount + fee : amount - fee - tax;
  return (
    <div>
      <CalcHeader num="16" title="수수료 · 세금 계산" desc="주식 거래 수수료와 증권거래세를 산출합니다." color="#8A8A8A" />
      <div className="flex mb-5 border" style={{ borderColor: _BORDER }}>
        <button onClick={() => setType('buy')} className="flex-1 py-3 text-sm font-medium transition-all border-r"
          style={{ borderColor: _BORDER, background: type === 'buy' ? '#4A7045' : 'transparent', color: type === 'buy' ? _T.textPrimary : _T.textMuted }}>매수</button>
        <button onClick={() => setType('sell')} className="flex-1 py-3 text-sm font-medium transition-all"
          style={{ background: type === 'sell' ? '#A63D33' : 'transparent', color: type === 'sell' ? _T.textPrimary : _T.textMuted }}>매도</button>
      </div>
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="주가" value={price} onChange={setPrice} unit="원" placeholder="50,000" />
        <NumInput label="수량" value={qty} onChange={setQty} unit="주" placeholder="100" />
        <NumInput label="수수료율" value={feeRate} onChange={setFeeRate} unit="%" placeholder="0.015" />
      </div>
      <div className={`grid ${type === 'sell' ? 'md:grid-cols-4' : 'md:grid-cols-3'} border`} style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="거래금액" value={fmt(amount, 0)} unit="원" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="수수료" value={fmt(fee, 0)} unit="원" /></div>
        {type === 'sell' && <div className="border-r" style={{ borderColor: _BORDER }}><ResultBox label="증권거래세" value={fmt(tax, 0)} unit="원" /></div>}
        <ResultBox label={type === 'buy' ? '총 매수대금' : '실수령액'} value={fmt(total, 0)} unit="원" highlight color="#8A8A8A" />
      </div>
      <CalcNote
        how={[
          '매수/매도 선택에 유의하세요. 세금은 매도할 때만 발생합니다.',
          '주가 × 수량 = 거래금액',
          '수수료율 (증권사별 상이, 일반 0.015% 전후)',
          '매도 시 추가로 증권거래세 0.18% 발생',
        ]}
        example={[
          '삼성전자 70,000원 × 100주 = 700만원 매도, 수수료 0.015%',
          '수수료 = 700만 × 0.015% = 1,050원',
          '거래세 = 700만 × 0.18% = 12,600원',
          '실수령액 = 7,000,000 − 1,050 − 12,600 = 6,986,350원',
        ]}
        tip={[
          '왕복 수수료 + 거래세 약 0.21~0.25% → 단타는 불리',
          '세금 계산: 코스피·코스닥 0.18%, 미국주식은 SEC fee 0.00229% (매도 시만)',
          '증권사 수수료 비교는 필수입니다. 비대면 개설 시 평생 무료 혜택을 제공하는 증권사가 많습니다.',
          '대형증권사 전화주문 0.5% → 반드시 HTS/MTS 사용',
          'ISA 계좌 활용 시 세금 일부 절감 가능',
        ]}
      />
    </div>
  );
}

function BreakevenCalc() {
  const [buyPrice, setBuyPrice] = useState('');
  const [feeRate, setFeeRate] = useState('0.015');
  const taxRate = 0.18;
  const bp = Number(buyPrice) || 0;
  const buyFee = bp * Number(feeRate) / 100;
  const totalCost = bp + buyFee;
  const breakeven = totalCost / (1 - Number(feeRate) / 100 - taxRate / 100);
  const pctUp = bp ? ((breakeven - bp) / bp) * 100 : 0;
  return (
    <div>
      <CalcHeader num="17" title="손익분기 주가" desc="수수료·세금 반영한 실제 손익분기 매도가를 계산합니다." color="#8A8A8A" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="매수가" value={buyPrice} onChange={setBuyPrice} unit="원" placeholder="50,000" />
        <NumInput label="수수료율 (편도)" value={feeRate} onChange={setFeeRate} unit="%" placeholder="0.015" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="손익분기 매도가" value={fmt(breakeven, 0)} unit="원" highlight color="#8A8A8A" /></div>
        <ResultBox label="필요 상승률" value={fmt(pctUp)} unit="%" />
      </div>
      <CalcNote
        how={[
          '매수가 입력',
          '수수료율 (편도 기준)',
          '자동으로 매수·매도 수수료 + 거래세 반영된 실제 손익분기 매도가 계산',
        ]}
        example={[
          '50,000원 매수, 수수료 0.015%',
          '손익분기 매도가 ≈ 50,107원',
          '필요 상승률 ≈ +0.21%',
          '→ 단순 "본전" = 매수가 같은 가격 아님',
        ]}
        tip={[
          '스캘핑·단타 시 최소 0.3% 이상 먹어야 실수익',
          '초단타는 거래세만으로도 수익의 1/3 이상 사라짐',
          '장기투자는 수수료 영향 미미하나 단타는 누적 손실 거대',
          '거래 빈도 줄이기 = 가장 효과적인 수익률 개선 전략',
        ]}
      />
    </div>
  );
}

function PositionSizeCalc() {
  const [capital, setCapital] = useState('');
  const [riskPct, setRiskPct] = useState('2');
  const [entry, setEntry] = useState('');
  const [stop, setStop] = useState('');
  const riskAmt = Number(capital) * Number(riskPct) / 100;
  const perShareLoss = entry && stop ? Math.abs(Number(entry) - Number(stop)) : 0;
  const shares = perShareLoss ? Math.floor(riskAmt / perShareLoss) : 0;
  const posValue = shares * Number(entry || 0);
  const posPct = capital ? (posValue / Number(capital)) * 100 : 0;
  return (
    <div>
      <CalcHeader num="18" title="포지션 사이징" desc="리스크 한도 기준으로 적정 매수 수량을 계산합니다." color="#8A8A8A" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="총 투자금" value={capital} onChange={setCapital} unit="원" placeholder="100,000,000" />
        <NumInput label="1회 허용 리스크" value={riskPct} onChange={setRiskPct} unit="%" placeholder="2" hint="보통 1~2%" />
        <NumInput label="진입가" value={entry} onChange={setEntry} unit="원" placeholder="50,000" />
        <NumInput label="손절가" value={stop} onChange={setStop} unit="원" placeholder="47,000" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="허용 손실액" value={fmt(riskAmt, 0)} unit="원" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="매수 수량" value={fmt(shares, 0)} unit="주" highlight color="#8A8A8A" /></div>
        <ResultBox label="포지션 비중" value={fmt(posPct)} unit="%" />
      </div>
      <CalcNote
        how={[
          '총 투자금: 주식에 투자한 총 자본',
          '1회 허용 리스크: 한 번 매매에서 감당 가능한 손실 비율 (1~2% 권장)',
          '진입가: 매수할 가격',
          '손절가: 반드시 손절할 가격 (기술적 지지선 활용)',
          '→ 자동으로 적정 수량 계산',
        ]}
        example={[
          '총자본 1억, 1회 리스크 2%, 진입가 50,000원, 손절가 47,000원',
          '허용 손실액 = 1억 × 2% = 200만원',
          '수량 = 200만 ÷ (50,000 − 47,000) = 666주',
          '포지션 비중 = 666 × 50,000 = 3,330만원 (33%)',
        ]}
        tip={[
          '2% 룰은 월가의 기본 원칙입니다. 50번 연속으로 틀려도 파산하지 않습니다.',
          '손절가 없는 매매는 포지션 크기 결정 불가능',
          '손실 후 본전 회복의 비대칭성: 20% 손실 = 25% 수익 필요, 50% 손실 = 100% 필요',
          '리스크 관리가 수익률보다 중요합니다. Ray Dalio "Don\'t lose money"',
          '초보 트레이더: 0.5~1% 룰로 더 보수적으로 시작',
        ]}
      />
    </div>
  );
}

function FuturesCalc() {
  const [entry, setEntry] = useState('');
  const [exit, setExit] = useState('');
  const [contracts, setContracts] = useState('');
  const [multiplier, setMultiplier] = useState('250000');
  const [side, setSide] = useState('long');
  const diff = exit && entry ? Number(exit) - Number(entry) : 0;
  const directedDiff = side === 'long' ? diff : -diff;
  const pnl = directedDiff * Number(contracts || 0) * Number(multiplier || 0);
  return (
    <div>
      <CalcHeader num="22" title="선물 손익 계산" desc="KOSPI200 선물 기준 손익을 산출합니다." color="#6B6B6B" />
      <div className="flex mb-5 border" style={{ borderColor: _BORDER }}>
        <button onClick={() => setSide('long')} className="flex-1 py-3 text-sm font-medium transition-all border-r"
          style={{ borderColor: _BORDER, background: side === 'long' ? '#4A7045' : 'transparent', color: side === 'long' ? _T.textPrimary : _T.textMuted }}>LONG · 매수</button>
        <button onClick={() => setSide('short')} className="flex-1 py-3 text-sm font-medium transition-all"
          style={{ background: side === 'short' ? '#A63D33' : 'transparent', color: side === 'short' ? _T.textPrimary : _T.textMuted }}>SHORT · 매도</button>
      </div>
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="진입가 (포인트)" value={entry} onChange={setEntry} unit="pt" placeholder="350.00" />
        <NumInput label="청산가 (포인트)" value={exit} onChange={setExit} unit="pt" placeholder="355.00" />
        <NumInput label="계약수" value={contracts} onChange={setContracts} unit="계약" placeholder="1" />
        <NumInput label="승수" value={multiplier} onChange={setMultiplier} unit="원" placeholder="250,000" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="포인트 손익" value={fmt(directedDiff, 2)} unit="pt" /></div>
        <ResultBox label="손익금액" value={fmt(pnl, 0)} unit="원" highlight color={pnl >= 0 ? '#C89650' : '#A63D33'} />
      </div>
      <CalcNote
        how={[
          'LONG/SHORT 선택 후 진입가·청산가 입력 (포인트 단위)',
          '계약수는 매매한 계약의 수량',
          '승수는 1포인트 당 원화 환산 금액',
          'KOSPI200 선물 승수: 250,000원 (메이저)',
          '미니 KOSPI200 선물 승수: 50,000원',
        ]}
        example={[
          'KOSPI200 선물 350pt에 LONG 1계약 매수 → 355pt에 청산',
          '→ 포인트 차이: +5pt',
          '→ 손익 = 5 × 250,000 × 1 = 1,250,000원 이익',
          '반대로 SHORT로 345pt 청산 시 5pt 손실 = -1,250,000원',
          '수수료·세금 별도 차감 (일반적으로 왕복 3~5천원 수준)',
        ]}
        tip={[
          'LONG = 상승 베팅 (싸게 사서 비싸게 팔기)',
          'SHORT = 하락 베팅 (비싸게 팔고 싸게 되사기)',
          '선물은 증거금의 10배 이상 레버리지 → 손익 확대',
          '일일정산으로 매일 실현손익 현금 결제',
          '만기일 롤오버 시 추가 비용·슬리피지 발생',
        ]}
      />
    </div>
  );
}

function LeverageCalc() {
  const [notional, setNotional] = useState('');
  const [marginRate, setMarginRate] = useState('10');
  const [capital, setCapital] = useState('');
  const margin = notional && marginRate ? Number(notional) * Number(marginRate) / 100 : 0;
  const leverage = margin && capital ? Number(notional) / Number(capital) : 0;
  const maxLoss = capital && marginRate ? Number(capital) / (Number(marginRate) / 100) : 0;
  return (
    <div>
      <CalcHeader num="23" title="레버리지 · 증거금" desc="필요 증거금과 실질 레버리지를 산출합니다." color="#6B6B6B" />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="계약 명목금액" value={notional} onChange={setNotional} unit="원" placeholder="100,000,000" />
        <NumInput label="증거금률" value={marginRate} onChange={setMarginRate} unit="%" placeholder="10" />
        <NumInput label="투자 가용 자본" value={capital} onChange={setCapital} unit="원" placeholder="10,000,000" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="필요 증거금" value={fmt(margin, 0)} unit="원" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="실질 레버리지" value={fmt(leverage)} unit="배" highlight color="#6B6B6B" /></div>
        <ResultBox label="최대 명목포지션" value={fmt(maxLoss, 0)} unit="원" />
      </div>
      <CalcNote
        how={[
          '계약 명목금액: 포지션 규모 (선물가격 × 승수 × 계약수)',
          '증거금률: 개시증거금률 입력 (거래소/증권사마다 다름)',
          '투자 가용 자본: 실제 내 계좌에 있는 돈',
        ]}
        example={[
          '명목 1억원 포지션, 증거금률 10%, 가용자본 1천만원',
          '→ 필요 증거금 = 1,000만원',
          '→ 실질 레버리지 = 10배',
          '즉, 1천만원으로 1억원 움직이는 효과',
          '시장 5% 하락 시 500만원 손실 = 자본의 50% 소멸',
        ]}
        tip={[
          'KOSPI200 선물 위탁증거금률 약 7.5% (상황별 변동)',
          '유지증거금률 미달 시 마진콜 → 추가 입금 or 강제청산',
          '레버리지 3배 이하 보수적 · 5배 이상 공격적',
          '10배 이상은 초단타 스켈핑 외 추천 X',
          '실전에서는 변동성 높아질 때 증거금률도 상향 조정됨',
        ]}
      />
    </div>
  );
}

// 누적정규분포
function N(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

function blackScholes(S, K, T, r, sigma, type) {
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  if (type === 'call') {
    return { price: S * N(d1) - K * Math.exp(-r * T) * N(d2), d1, d2 };
  } else {
    return { price: K * Math.exp(-r * T) * N(-d2) - S * N(-d1), d1, d2 };
  }
}

function BlackScholesCalc() {
  const [S, setS] = useState('');
  const [K, setK] = useState('');
  const [T, setT] = useState('');
  const [r, setR] = useState('3.5');
  const [sigma, setSigma] = useState('');
  const [type, setType] = useState('call');

  const inputs = [S, K, T, sigma].map(Number);
  const valid = inputs.every(v => v > 0);
  const result = valid ? blackScholes(Number(S), Number(K), Number(T) / 365, Number(r) / 100, Number(sigma) / 100, type) : null;

  return (
    <div>
      <CalcHeader num="24" title="블랙-숄즈 옵션가" desc="유럽형 옵션의 이론가를 계산합니다." color="#6B6B6B" />
      <div className="flex mb-5 border" style={{ borderColor: _BORDER }}>
        <button onClick={() => setType('call')} className="flex-1 py-3 text-sm font-medium transition-all border-r"
          style={{ borderColor: _BORDER, background: type === 'call' ? '#4A7045' : 'transparent', color: type === 'call' ? _T.textPrimary : _T.textMuted }}>CALL · 콜옵션</button>
        <button onClick={() => setType('put')} className="flex-1 py-3 text-sm font-medium transition-all"
          style={{ background: type === 'put' ? '#A63D33' : 'transparent', color: type === 'put' ? _T.textPrimary : _T.textMuted }}>PUT · 풋옵션</button>
      </div>
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="기초자산 가격 (S)" value={S} onChange={setS} unit="원" placeholder="350" />
        <NumInput label="행사가 (K)" value={K} onChange={setK} unit="원" placeholder="355" />
        <NumInput label="만기까지 일수 (T)" value={T} onChange={setT} unit="일" placeholder="30" />
        <NumInput label="무위험금리 (r)" value={r} onChange={setR} unit="%" placeholder="3.5" />
        <NumInput label="변동성 (σ)" value={sigma} onChange={setSigma} unit="%" placeholder="20" hint="내재변동성 또는 역사적변동성" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="d₁" value={result ? fmt(result.d1, 4) : '—'} unit="" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="d₂" value={result ? fmt(result.d2, 4) : '—'} unit="" /></div>
        <ResultBox label={type === 'call' ? '콜 이론가' : '풋 이론가'} value={result ? fmt(result.price, 2) : '—'} unit="원" highlight color="#6B6B6B" />
      </div>
      <CalcNote
        how={[
          'S (기초자산): 현재 주식/지수의 가격',
          'K (행사가): 옵션 행사가격',
          'T (만기일수): 오늘부터 만기까지 남은 일수',
          'r (무위험금리): 국고채 3년물 금리 (보통 3~4%)',
          'σ (변동성): 기초자산의 연환산 변동성 (역사적 or 내재변동성)',
        ]}
        example={[
          'KOSPI200 지수 350pt, 행사가 355pt, 만기 30일',
          '무위험금리 3.5%, 변동성 20% 가정',
          '→ 콜 이론가 ≈ 3.05pt',
          '→ 풋 이론가 ≈ 7.96pt (풋-콜 패리티)',
          '행사가가 기초자산보다 높은 OTM 콜은 이론가 낮음',
          '만기가 길어지거나 변동성 커지면 프리미엄 상승',
        ]}
        tip={[
          '실제 시장가와 이론가 차이 = 내재변동성 시그널',
          '시장가 > 이론가 → 내재변동성 과대 평가 → 매도 전략',
          '시장가 < 이론가 → 내재변동성 과소 평가 → 매수 전략',
          '배당 미반영 · 유럽형 옵션 기준 · 한국 옵션은 유럽형',
          '실전 매매 전에 실제 호가창과 비교 필수',
        ]}
      />
    </div>
  );
}

function GreeksCalc() {
  const [S, setS] = useState('');
  const [K, setK] = useState('');
  const [T, setT] = useState('');
  const [r, setR] = useState('3.5');
  const [sigma, setSigma] = useState('');
  const [type, setType] = useState('call');

  const valid = [S, K, T, sigma].every(v => Number(v) > 0);
  let greeks = null;
  if (valid) {
    const s = Number(S), k = Number(K), t = Number(T) / 365;
    const rr = Number(r) / 100, vol = Number(sigma) / 100;
    const d1 = (Math.log(s / k) + (rr + 0.5 * vol * vol) * t) / (vol * Math.sqrt(t));
    const d2 = d1 - vol * Math.sqrt(t);
    const nd1 = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-d1 * d1 / 2);
    const delta = type === 'call' ? N(d1) : N(d1) - 1;
    const gamma = nd1 / (s * vol * Math.sqrt(t));
    const theta = type === 'call'
      ? (-s * nd1 * vol / (2 * Math.sqrt(t)) - rr * k * Math.exp(-rr * t) * N(d2)) / 365
      : (-s * nd1 * vol / (2 * Math.sqrt(t)) + rr * k * Math.exp(-rr * t) * N(-d2)) / 365;
    const vega = s * nd1 * Math.sqrt(t) / 100;
    const rho = type === 'call' ? k * t * Math.exp(-rr * t) * N(d2) / 100 : -k * t * Math.exp(-rr * t) * N(-d2) / 100;
    greeks = { delta, gamma, theta, vega, rho };
  }

  return (
    <div>
      <CalcHeader num="25" title="옵션 Greeks" desc="델타·감마·세타·베가·로를 동시에 산출합니다." color="#6B6B6B" />
      <div className="flex mb-5 border" style={{ borderColor: _BORDER }}>
        <button onClick={() => setType('call')} className="flex-1 py-3 text-sm font-medium border-r"
          style={{ borderColor: _BORDER, background: type === 'call' ? '#4A7045' : 'transparent', color: type === 'call' ? _T.textPrimary : _T.textMuted }}>CALL</button>
        <button onClick={() => setType('put')} className="flex-1 py-3 text-sm font-medium"
          style={{ background: type === 'put' ? '#A63D33' : 'transparent', color: type === 'put' ? _T.textPrimary : _T.textMuted }}>PUT</button>
      </div>
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="기초자산 (S)" value={S} onChange={setS} unit="원" placeholder="350" />
        <NumInput label="행사가 (K)" value={K} onChange={setK} unit="원" placeholder="355" />
        <NumInput label="만기일수 (T)" value={T} onChange={setT} unit="일" placeholder="30" />
        <NumInput label="무위험금리" value={r} onChange={setR} unit="%" placeholder="3.5" />
        <NumInput label="변동성" value={sigma} onChange={setSigma} unit="%" placeholder="20" />
      </div>
      <div className="grid md:grid-cols-5 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="Delta Δ" value={greeks ? fmt(greeks.delta, 4) : '—'} unit="" highlight color="#6B6B6B" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="Gamma Γ" value={greeks ? fmt(greeks.gamma, 5) : '—'} unit="" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="Theta Θ" value={greeks ? fmt(greeks.theta, 4) : '—'} unit="/일" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="Vega ν" value={greeks ? fmt(greeks.vega, 4) : '—'} unit="" /></div>
        <ResultBox label="Rho ρ" value={greeks ? fmt(greeks.rho, 4) : '—'} unit="" />
      </div>
      <CalcNote
        how={[
          '블랙숄즈와 같은 입력값 사용 (S, K, T, r, σ)',
          '콜/풋 선택 후 각 그리스 값 확인',
          'Greeks는 "옵션가격이 어떤 변수에 얼마나 민감한지" 측정',
        ]}
        example={[
          'KOSPI200 350pt, 행사가 355pt, 만기 30일, 변동성 20%의 콜',
          '→ Delta 0.42: 기초자산 1pt 오르면 옵션가 0.42pt 상승',
          '→ Gamma 0.018: 기초자산 1pt 오르면 델타가 0.018 증가',
          '→ Theta -0.08/일: 하루 지날 때마다 0.08pt씩 시간가치 감소',
          '→ Vega 0.35: 변동성 1%p 오르면 옵션가 0.35pt 상승',
        ]}
        tip={[
          'Delta: ATM은 0.5 · ITM은 1에 가까움 · OTM은 0에 가까움',
          'Gamma: ATM에서 최대 · 만기 임박할수록 폭증',
          'Theta: 모든 옵션 매수자의 적 · 매도자의 친구',
          'Vega: 만기 길수록 큼 · 변동성 예상 시 매매의 핵심',
          'Gamma·Theta는 반대 부호 → 감마 롱이면 세타 숏 불가피',
          'Delta-neutral 헤지: 델타 합을 0으로 만들어 방향성 제거',
        ]}
      />
    </div>
  );
}

function SharpeCalc() {
  const [rp, setRp] = useState('');
  const [rf, setRf] = useState('3.5');
  const [sigma, setSigma] = useState('');
  const [downside, setDownside] = useState('');
  const sharpe = rp && sigma ? (Number(rp) - Number(rf)) / Number(sigma) : 0;
  const sortino = rp && downside ? (Number(rp) - Number(rf)) / Number(downside) : 0;
  return (
    <div>
      <CalcHeader num="28" title="샤프 · 소티노지수" desc="위험조정수익률을 두 가지 지표로 비교합니다." color="#4F7E7C" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="포트폴리오 수익률" value={rp} onChange={setRp} unit="%" placeholder="15" />
        <NumInput label="무위험수익률" value={rf} onChange={setRf} unit="%" placeholder="3.5" />
        <NumInput label="표준편차 (전체)" value={sigma} onChange={setSigma} unit="%" placeholder="12" />
        <NumInput label="하방편차" value={downside} onChange={setDownside} unit="%" placeholder="8" hint="손실 구간의 표준편차" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="샤프지수" value={fmt(sharpe, 3)} unit="" highlight color="#4F7E7C" /></div>
        <ResultBox label="소티노지수" value={fmt(sortino, 3)} unit="" />
      </div>
      <CalcNote
        how={[
          '포트폴리오의 연간 수익률을 입력 (예: 15%)',
          '무위험수익률은 국고채 3년물 금리를 사용 (2025년 기준 약 3.5%)',
          '표준편차는 수익률의 변동성 (전체 변동성)',
          '하방편차는 음(-)수익일 때만의 변동성 (하락 위험만 측정)',
        ]}
        example={[
          '연 수익률 15%, 변동성 12%, 하방편차 8%인 포트폴리오',
          '→ 샤프 = (15-3.5)/12 = 0.958 · 양호',
          '→ 소티노 = (15-3.5)/8 = 1.438 · 하락 리스크만 보면 더 우수',
          '즉, 상방 변동은 많지만 하락은 제한적인 "좋은 변동성"을 가진 포트폴리오',
        ]}
        tip={[
          '샤프지수: 1 이상 양호 · 2 이상 우수 · 3 이상 탁월',
          '소티노가 샤프보다 높으면 상승변동이 많다는 의미 (좋은 신호)',
          '서로 다른 전략·ETF 비교 시 같은 기간으로 측정해야 공정',
          '벤치마크 대비 성과 측정에도 활용 (Rf 대신 벤치마크 수익률)',
        ]}
      />
    </div>
  );
}

function KellyCalc() {
  const [winRate, setWinRate] = useState('');
  const [winAmt, setWinAmt] = useState('');
  const [lossAmt, setLossAmt] = useState('');
  const p = Number(winRate) / 100;
  const q = 1 - p;
  const b = winAmt && lossAmt ? Number(winAmt) / Number(lossAmt) : 0;
  const f = b > 0 ? (b * p - q) / b : 0;
  const halfKelly = f / 2;
  return (
    <div>
      <CalcHeader num="29" title="켈리 공식" desc="장기 기대수익률 극대화를 위한 최적 베팅 비율을 산출합니다." color="#4F7E7C" />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="승률" value={winRate} onChange={setWinRate} unit="%" placeholder="55" />
        <NumInput label="평균 수익금" value={winAmt} onChange={setWinAmt} unit="원" placeholder="200,000" />
        <NumInput label="평균 손실금" value={lossAmt} onChange={setLossAmt} unit="원" placeholder="100,000" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="Full Kelly" value={fmt(f * 100)} unit="%" highlight color="#4F7E7C" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="Half Kelly (권장)" value={fmt(halfKelly * 100)} unit="%" /></div>
        <ResultBox label="손익비 (b)" value={fmt(b)} unit=":1" />
      </div>
      <CalcNote
        how={[
          '최근 100회 거래 기록에서 승률과 평균 손익을 계산해 입력',
          '평균 수익금 = 수익 거래의 수익금 평균',
          '평균 손실금 = 손실 거래의 손실금 평균 (손절 후 실제 손실)',
          '결과 f가 총자본 대비 1회 최적 베팅 비율',
        ]}
        example={[
          '승률 55%, 평균 수익 20만원, 평균 손실 10만원 (손익비 2:1)',
          '→ Full Kelly f = (2×0.55 - 0.45) / 2 = 32.5%',
          '→ Half Kelly = 16.25% (실전 권장)',
          '자본 1억이면 1회 거래에 1,625만원까지 투입 가능',
        ]}
        tip={[
          'Full Kelly는 이론적 최대값 · 실전에선 변동이 너무 커서 위험',
          'Half Kelly(f/2) 또는 Quarter Kelly(f/4)가 안전',
          'f가 음수 나오면 기대값 마이너스 전략 → 절대 베팅 금지',
          '승률·손익비 추정에 오차가 크면 Kelly도 부정확 → 보수적으로',
        ]}
      />
    </div>
  );
}

function MDDCalc() {
  const [peak, setPeak] = useState('');
  const [trough, setTrough] = useState('');
  const mdd = peak && trough ? ((Number(trough) - Number(peak)) / Number(peak)) * 100 : 0;
  const recovery = peak && trough ? ((Number(peak) - Number(trough)) / Number(trough)) * 100 : 0;
  return (
    <div>
      <CalcHeader num="30" title="최대낙폭 (MDD)" desc="고점 대비 최대 하락률과 원금 회복에 필요한 수익률을 계산합니다." color="#4F7E7C" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="고점 (Peak)" value={peak} onChange={setPeak} unit="원" placeholder="100,000,000" />
        <NumInput label="저점 (Trough)" value={trough} onChange={setTrough} unit="원" placeholder="70,000,000" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="MDD" value={fmt(mdd)} unit="%" highlight color="#A63D33" /></div>
        <ResultBox label="회복 필요 수익률" value={fmt(recovery)} unit="%" />
      </div>
      <CalcNote
        how={[
          '계좌의 역대 최고 평가금액(고점)과 그 이후 최저 평가금액(저점) 입력',
          '계좌 내역에서 계좌 자산 그래프를 보고 확인 가능',
          'MDD는 음수(-)로 표시 · 회복 필요 수익률은 양수(+)',
        ]}
        example={[
          '고점 1억 원 → 저점 7,000만 원으로 하락 시',
          '→ MDD = -30%',
          '→ 원금 회복에 필요한 수익률 = +42.86%',
          '즉, 30% 잃으면 43% 벌어야 본전. 손실이 클수록 불리',
        ]}
        tip={[
          '-10% → +11% 회복 · -20% → +25% · -50% → +100% (비대칭)',
          '일반 개인투자자 감내 한계는 보통 -20% 수준',
          '-30% 넘으면 심리적 붕괴로 원칙 무너질 확률 급증',
          '포지션 사이징·손절선 설정으로 MDD를 사전에 제한해야 함',
          '역사적 MDD는 미래를 보장하지 않습니다. 이번엔 더 클 수 있다는 점을 항상 염두에 두세요.',
        ]}
      />
    </div>
  );
}

function VaRCalc() {
  const [value, setValue] = useState('');
  const [sigma, setSigma] = useState('');
  const [confidence, setConfidence] = useState('95');
  const [days, setDays] = useState('1');
  const zMap = { '90': 1.282, '95': 1.645, '99': 2.326 };
  const z = zMap[confidence] || 1.645;
  const dailyVar = Number(value) * Number(sigma) / 100 * z;
  const multiDayVar = dailyVar * Math.sqrt(Number(days));
  return (
    <div>
      <CalcHeader num="31" title="VaR 추정" desc="주어진 신뢰수준에서 예상 최대 손실을 추정합니다." color="#4F7E7C" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="포트폴리오 가치" value={value} onChange={setValue} unit="원" placeholder="100,000,000" />
        <NumInput label="일일 변동성" value={sigma} onChange={setSigma} unit="%" placeholder="1.5" />
        <div>
          <label className="block text-[12px] mono uppercase tracking-[0.2em] mb-2" style={{ color: _T.textFaint }}>신뢰수준</label>
          <div className="flex border" style={{ borderColor: _BORDER }}>
            {['90', '95', '99'].map(c => (
              <button key={c} onClick={() => setConfidence(c)} className="flex-1 py-3 text-sm border-r last:border-r-0"
                style={{ borderColor: _BORDER, background: confidence === c ? '#4F7E7C' : 'transparent', color: confidence === c ? _T.textPrimary : _T.textMuted }}>{c}%</button>
            ))}
          </div>
        </div>
        <NumInput label="기간" value={days} onChange={setDays} unit="일" placeholder="1" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="1일 VaR" value={fmt(dailyVar, 0)} unit="원" /></div>
        <ResultBox label={`${days}일 VaR`} value={fmt(multiDayVar, 0)} unit="원" highlight color="#A63D33" />
      </div>
      <CalcNote
        how={[
          '포트폴리오 현재 평가금액 입력',
          '일일 변동성(σ)은 일간 수익률의 표준편차 (보통 1~2%)',
          '신뢰수준 선택 · 95%가 가장 일반적',
          '기간은 측정하려는 일수 (1일/5일/10일)',
        ]}
        example={[
          '포트폴리오 1억 원, 일일 변동성 1.5%, 95% 신뢰수준',
          '→ 1일 VaR = 1억 × 0.015 × 1.645 = 약 247만 원',
          '→ 10일 VaR = 247만 × √10 = 약 780만 원',
          '해석: "95% 확률로 내일 하루 손실이 247만 원을 넘지 않는다"',
          '즉, 20일 중 1일은 247만 원 이상 손실 가능',
        ]}
        tip={[
          '정규분포 가정을 기반으로 합니다. 극단적 하락(꼬리 위험)은 과소평가되는 경향이 있습니다.',
          '실제 금융위기 시 VaR의 3~5배 손실이 종종 발생',
          '신뢰수준이 높을수록 더 보수적 (99% > 95% > 90%)',
          '은행·헤지펀드 리스크 관리의 기본 지표 (바젤 규제)',
          '역사적 VaR, 몬테카를로 VaR 등 다른 방식도 존재',
        ]}
      />
    </div>
  );
}

function FXCalc() {
  const [amount, setAmount] = useState('');
  const [buyRate, setBuyRate] = useState('');
  const [sellRate, setSellRate] = useState('');
  const krwSpent = amount && buyRate ? Number(amount) * Number(buyRate) : 0;
  const krwReceived = amount && sellRate ? Number(amount) * Number(sellRate) : 0;
  const pnl = krwReceived - krwSpent;
  const pnlPct = krwSpent ? (pnl / krwSpent) * 100 : 0;
  return (
    <div>
      <CalcHeader num="32" title="환차손익 계산" desc="외화 매수·매도 시 원화 기준 손익을 산출합니다." color="#7C6A9B" />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="외화 금액" value={amount} onChange={setAmount} unit="USD" placeholder="10,000" />
        <NumInput label="매수 환율" value={buyRate} onChange={setBuyRate} unit="KRW" placeholder="1,300" />
        <NumInput label="매도 환율" value={sellRate} onChange={setSellRate} unit="KRW" placeholder="1,380" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="매수 시 원화" value={fmt(krwSpent, 0)} unit="원" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="매도 시 원화" value={fmt(krwReceived, 0)} unit="원" /></div>
        <ResultBox label={`환차${pnl >= 0 ? '익' : '손'}`} value={fmt(pnl, 0)} unit={`원 (${fmt(pnlPct)}%)`} highlight color={pnl >= 0 ? '#C89650' : '#A63D33'} />
      </div>
      <CalcNote
        how={[
          '외화 금액: 매수했던 외화 금액 (예: 미국주식 매수에 쓴 USD)',
          '매수 환율: 외화 살 때의 환율 (매수 시점 기준)',
          '매도 환율: 외화를 원화로 다시 바꿀 때의 환율',
          '환전 수수료는 별도로 차감해서 고려',
        ]}
        example={[
          '10,000달러로 미국주식 투자',
          '매수 시 환율: 1,300원 → 1,300만원 투입',
          '매도 시 환율: 1,380원 → 1,380만원 회수',
          '→ 환차익 +80만원 (주식 수익과 별개로 환율만으로 6.15% 수익)',
          '만약 환율이 1,250원으로 내렸다면 환차손 -50만원',
        ]}
        tip={[
          '해외주식 수익 = 주가 수익률 + 환율 변동',
          '원화 강세(달러 약세) = 해외주식 수익 감소',
          '원화 약세(달러 강세) = 해외주식 수익 증가',
          '환헤지 상품(H형 ETF)은 환율 영향을 제거하나 헤지비용 있음',
          '장기 투자자는 환율 변동이 평균화되어 영향 감소',
        ]}
      />
    </div>
  );
}

function RealRateCalc() {
  const [nominal, setNominal] = useState('');
  const [inflation, setInflation] = useState('');
  const real = nominal && inflation
    ? ((1 + Number(nominal) / 100) / (1 + Number(inflation) / 100) - 1) * 100
    : 0;
  const simpleReal = nominal && inflation ? Number(nominal) - Number(inflation) : 0;
  return (
    <div>
      <CalcHeader num="33" title="실질금리 계산" desc="명목금리에서 인플레이션을 차감한 실질 구매력을 계산합니다." color="#7C6A9B" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="명목금리" value={nominal} onChange={setNominal} unit="%" placeholder="5" />
        <NumInput label="인플레이션 (CPI)" value={inflation} onChange={setInflation} unit="%" placeholder="3" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="실질금리 (Fisher)" value={fmt(real, 3)} unit="%" highlight color="#7C6A9B" /></div>
        <ResultBox label="간이 계산" value={fmt(simpleReal)} unit="%" />
      </div>
      <CalcNote
        how={[
          '명목금리: 실제 받는 금리 (예: 예적금 금리, 국채 수익률)',
          '인플레이션: 소비자물가지수(CPI) 전년동기 대비 상승률',
          '결과가 음수면 은행에 돈 맡겨도 실질 구매력은 감소',
        ]}
        example={[
          '예금 금리 5%, 인플레이션 3%인 경우',
          '→ 실질금리(Fisher) = ((1.05/1.03) - 1) × 100 = 1.94%',
          '→ 간이계산 = 5 - 3 = 2%',
          '즉, 1억 예금 시 명목 이자는 500만원이지만 구매력 기준 약 194만원',
          '물가 오른 만큼 300만원 이상은 "그냥 유지"에 해당',
        ]}
        tip={[
          '실질금리 양수(+): 돈이 실제로 불어남 → 저축·채권 매력',
          '실질금리 음수(-): 돈의 구매력 감소 → 주식·부동산·금으로 이동',
          '연준이 실질금리 양수로 돌려놓아야 인플레 잡혔다고 판단',
          'TIPS(물가연동채권) 수익률이 시장 실질금리의 대용',
          '실질금리 상승 = 달러 강세, 금 약세 경향',
        ]}
      />
    </div>
  );
}

function BondPriceCalc() {
  const [face, setFace] = useState('');
  const [coupon, setCoupon] = useState('');
  const [ytm, setYtm] = useState('');
  const [years, setYears] = useState('');

  const F = Number(face) || 0;
  const c = Number(coupon) / 100;
  const y = Number(ytm) / 100;
  const n = Number(years) || 0;
  const annualCoupon = F * c;
  let pv = 0;
  for (let t = 1; t <= n; t++) pv += annualCoupon / Math.pow(1 + y, t);
  pv += F / Math.pow(1 + y, n);
  const premium = F ? ((pv - F) / F) * 100 : 0;

  return (
    <div>
      <CalcHeader num="34" title="채권 가격 계산" desc="액면가 · 쿠폰 · YTM으로 채권의 현재가격을 계산합니다." color="#7C6A9B" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="액면가" value={face} onChange={setFace} unit="원" placeholder="1,000,000" />
        <NumInput label="쿠폰금리 (연)" value={coupon} onChange={setCoupon} unit="%" placeholder="4" />
        <NumInput label="만기수익률 (YTM)" value={ytm} onChange={setYtm} unit="%" placeholder="5" />
        <NumInput label="잔존만기" value={years} onChange={setYears} unit="년" placeholder="5" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="채권 가격 (PV)" value={fmt(pv, 0)} unit="원" highlight color="#7C6A9B" /></div>
        <ResultBox label="액면 대비" value={fmt(premium, 2)} unit="%" />
      </div>
      <CalcNote
        how={[
          '액면가: 만기에 받을 원금 (일반적으로 100만원 또는 1만원)',
          '쿠폰금리: 채권 발행 시 정해진 연간 이자율',
          'YTM (만기수익률): 시장에서 현재 거래되는 수익률 (시장금리)',
          '잔존만기: 지금부터 만기까지 남은 햇수',
        ]}
        example={[
          '액면 100만원, 쿠폰 4%, YTM 5%, 잔존 5년 국고채',
          '→ 매년 쿠폰 4만원 × 5년 + 만기 상환 100만원을 5%로 할인',
          '→ 채권가격 ≈ 956,705원 (액면 대비 -4.33%)',
          'YTM이 쿠폰보다 높으므로 할인채입니다. 시장금리가 올라 채권 가격 매력이 낮아진 상태입니다.',
          '반대로 YTM이 3%로 내리면 채권가격은 104만원대로 상승',
        ]}
        tip={[
          'YTM > 쿠폰 → 할인채 (가격 < 액면가)',
          'YTM < 쿠폰 → 할증채 (가격 > 액면가)',
          'YTM = 쿠폰 → 액면가 그대로 (par bond)',
          '금리 하락 시 채권가격이 상승하는 역관계입니다. 채권 투자자에게는 호재입니다.',
          '듀레이션 길수록 금리민감도 큼 · 장기채가 단기채보다 변동성 큼',
          '한국 국고채·미국 국채가 대표적 안전자산',
        ]}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 세금 · 절세 계산기 (2024~2025년 한국 현행 세법)
// ─────────────────────────────────────────────

function CapitalGainCalc() {
  const [type, setType] = useState('domestic');
  const [buyPrice, setBuyPrice] = useState('');
  const [qty, setQty] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [tradeCost, setTradeCost] = useState('');

  const bp = Number(buyPrice) || 0;
  const sp = Number(sellPrice) || 0;
  const q = Number(qty) || 0;
  const tc = Number(tradeCost) || 0;
  const purchaseAmount = bp * q;
  const saleAmount = sp * q;
  const gain = saleAmount - purchaseAmount - tc;

  let taxAmount = 0;
  let taxRate = 0;
  let taxableIncome = 0;

  if (type === 'domestic') {
    taxableIncome = Math.max(0, gain);
    if (taxableIncome <= 30000000) {
      taxRate = 20;
      taxAmount = taxableIncome * 0.20;
    } else {
      taxRate = 25;
      taxAmount = 30000000 * 0.20 + (taxableIncome - 30000000) * 0.25;
    }
    taxAmount += taxAmount * 0.1;
  } else if (type === 'foreign') {
    const basedGain = Math.max(0, gain - 2500000);
    taxableIncome = basedGain;
    taxRate = 22;
    taxAmount = basedGain * 0.22;
  } else {
    taxableIncome = Math.max(0, gain);
    taxRate = 20;
    taxAmount = taxableIncome * 0.20;
  }

  const netProceeds = saleAmount - purchaseAmount - taxAmount;

  return (
    <div>
      <CalcHeader num="38" title="양도소득세" desc="국내·해외·비상장주식 양도소득세를 계산합니다. 2024년 기준." color="#5B8DB8" />
      <div className="flex mb-5 border" style={{ borderColor: _BORDER }}>
        <button onClick={() => setType('domestic')} className="flex-1 py-3 text-sm font-medium transition-all border-r" style={{ borderColor: _BORDER, background: type === 'domestic' ? '#4A7045' : 'transparent', color: type === 'domestic' ? _T.textPrimary : _T.textMuted }}>국내대주주</button>
        <button onClick={() => setType('foreign')} className="flex-1 py-3 text-sm font-medium transition-all border-r" style={{ borderColor: _BORDER, background: type === 'foreign' ? '#5B8DB8' : 'transparent', color: type === 'foreign' ? _T.textPrimary : _T.textMuted }}>해외주식</button>
        <button onClick={() => setType('unlisted')} className="flex-1 py-3 text-sm font-medium transition-all" style={{ background: type === 'unlisted' ? '#C89650' : 'transparent', color: type === 'unlisted' ? _T.textPrimary : _T.textMuted }}>비상장</button>
      </div>
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="매수가" value={buyPrice} onChange={setBuyPrice} unit="원" placeholder="50,000" />
        <NumInput label="수량" value={qty} onChange={setQty} unit="주" placeholder="100" />
        <NumInput label="매도가" value={sellPrice} onChange={setSellPrice} unit="원" placeholder="70,000" />
        <NumInput label="취득비용 (수수료 등)" value={tradeCost} onChange={setTradeCost} unit="원" placeholder="50,000" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="양도차익" value={fmt(gain, 0)} unit="원" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="세율" value={fmt(taxRate)} unit="%" /></div>
        <ResultBox label="산출세액" value={fmt(taxAmount, 0)} unit="원" highlight color="#5B8DB8" />
      </div>
      <CalcNote
        how={[
          '국내대주주: 총가액 10억 이상 또는 지분율 기준 (코스피 1%, 코스닥 2%)',
          '해외주식: 연간 250만원 기본공제 후 22% (지방소득세 포함)',
          '비상장주식: 중소기업 10%, 일반 20%, 대주호 20~25%',
          '양도차익 = (매도가 - 취득비용) - (매수가 + 거래비용)',
        ]}
        example={[
          '국내대주주: 삼성전자 5만원 × 100주 = 500만원 구매 → 7만원 × 100주 = 700만원 판매',
          '양도차익 = 700만 - 500만 = 200만원',
          '세금 = 200만 × 20% × 1.1 (지방소득세) = 440만원',
          '해외주식: 50만원 이익 → (50만 - 25만) × 22% = 5.5만원',
        ]}
        tip={[
          '비상장주식은 중소기업 여부, 거래 사유에 따라 세율 다름',
          '손실 통산: 2년 이내 다른 양도소득으로 손실 상쇄 가능',
          '기본공제 (해외): 연간 250만원 (부부 합산시 500만원)',
          '국내 상장주식 소액주주는 일반적으로 비과세 (대주주 제외)',
          '※ 세법은 변경될 수 있으며, 정확한 납세액은 세무사 확인을 권장합니다.',
        ]}
      />
    </div>
  );
}

function HealthInsuranceCalc() {
  const [financialIncome, setFinancialIncome] = useState('');
  const [otherIncome, setOtherIncome] = useState('');
  const [dependentStatus, setDependentStatus] = useState('independent');

  const fi = Number(financialIncome) || 0;
  const oi = Number(otherIncome) || 0;
  const totalIncome = fi + oi;

  const isGrossIncome = fi > 20000000;
  const isDependentLost = totalIncome > 20000000;

  const monthlyIncome = totalIncome / 12;
  const insurancePremium = monthlyIncome * 0.0709;
  const longTermCareRate = 0.1295;
  const totalMonthlyPremium = insurancePremium * (1 + longTermCareRate);

  return (
    <div>
      <CalcHeader num="39" title="건강보험료 (금융소득 피부양자)" desc="금융소득 2천만원 초과 시 피부양자 탈락. 2024년 기준." color="#5B8DB8" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="금융소득 (이자+배당)" value={financialIncome} onChange={setFinancialIncome} unit="원" placeholder="30,000,000" />
        <NumInput label="기타소득 (근로·사업·기타)" value={otherIncome} onChange={setOtherIncome} unit="원" placeholder="0" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}>
          <ResultBox label="종합과세 여부" value={isGrossIncome ? '과세' : '비과세'} unit="" />
        </div>
        <ResultBox label="피부양자 탈락" value={isDependentLost ? '예' : '아니오'} unit="" />
      </div>
      <div className="mt-5 border" style={{ borderColor: _BORDER }}>
        <ResultBox label="예상 월 보험료 (건강+장기요양)" value={fmt(totalMonthlyPremium, 0)} unit="원" highlight color="#5B8DB8" />
      </div>
      <CalcNote
        how={[
          '금융소득(이자+배당) 2,000만원 초과 시 종합과세 대상',
          '금융소득 포함 연 합산소득 2,000만원 초과 시 피부양자 탈락',
          '건강보험료 = 소득월액 × 7.09% (2024년)',
          '장기요양보험료 = 건강보험료 × 12.95%',
        ]}
        example={[
          '금융소득 3,000만원, 근로소득 0원 → 종합과세, 피부양자 탈락',
          '월소득 = 3,000만 ÷ 12 = 250만원',
          '건강보험료 = 250만 × 7.09% ≈ 17.7만원',
          '장기요양료 = 17.7만 × 12.95% ≈ 2.3만원',
          '총 월보험료 ≈ 20만원',
        ]}
        tip={[
          '피부양자 탈락 시 자영업자 기준으로 지역가입자 보험료 전액 부담',
          '부부합산소득: 배우자 소득도 함께 계산 (기본공제 후)',
          'ISA 계좌 이자·배당은 피부양자 판정에서 제외됨',
          '건강보험료 산정 시 최소금액(약 12만원)이 적용될 수 있음',
          '※ 세법은 변경될 수 있으며, 정확한 납세액은 세무사 확인을 권장합니다.',
        ]}
      />
    </div>
  );
}

function IncomeTaxCalc() {
  const [incomeType, setIncomeType] = useState('employment');
  const [annualIncome, setAnnualIncome] = useState('');
  const [dependents, setDependents] = useState('0');
  const [otherDeductions, setOtherDeductions] = useState('');

  const income = Number(annualIncome) || 0;
  const deps = Number(dependents) || 0;
  const otherDed = Number(otherDeductions) || 0;

  let laborDeduction = 0;
  if (incomeType === 'employment') {
    if (income <= 15000000) laborDeduction = income * 0.5;
    else if (income <= 45000000) laborDeduction = 7500000 + (income - 15000000) * 0.3;
    else if (income <= 100000000) laborDeduction = 16500000 + (income - 45000000) * 0.15;
    else laborDeduction = 24750000 + (income - 100000000) * 0.05;
  }

  const basicDeduction = 1500000 * deps;
  const taxableIncome = Math.max(0, income - laborDeduction - basicDeduction - otherDed);

  let tax = 0;
  let bracket = 0;
  if (taxableIncome <= 14000000) {
    tax = taxableIncome * 0.06;
    bracket = 6;
  } else if (taxableIncome <= 50000000) {
    tax = 14000000 * 0.06 + (taxableIncome - 14000000) * 0.15 - 1260000;
    bracket = 15;
  } else if (taxableIncome <= 88000000) {
    tax = 14000000 * 0.06 + 36000000 * 0.15 + (taxableIncome - 50000000) * 0.24 - 5760000;
    bracket = 24;
  } else if (taxableIncome <= 150000000) {
    tax = 14000000 * 0.06 + 36000000 * 0.15 + 38000000 * 0.24 + (taxableIncome - 88000000) * 0.35 - 15440000;
    bracket = 35;
  } else if (taxableIncome <= 300000000) {
    tax = 14000000 * 0.06 + 36000000 * 0.15 + 38000000 * 0.24 + 62000000 * 0.35 + (taxableIncome - 150000000) * 0.38 - 19940000;
    bracket = 38;
  } else if (taxableIncome <= 500000000) {
    tax = 14000000 * 0.06 + 36000000 * 0.15 + 38000000 * 0.24 + 62000000 * 0.35 + 150000000 * 0.38 + (taxableIncome - 300000000) * 0.4 - 25940000;
    bracket = 40;
  } else if (taxableIncome <= 1000000000) {
    tax = 14000000 * 0.06 + 36000000 * 0.15 + 38000000 * 0.24 + 62000000 * 0.35 + 150000000 * 0.38 + 200000000 * 0.4 + (taxableIncome - 500000000) * 0.42 - 35940000;
    bracket = 42;
  } else {
    tax = 14000000 * 0.06 + 36000000 * 0.15 + 38000000 * 0.24 + 62000000 * 0.35 + 150000000 * 0.38 + 200000000 * 0.4 + 500000000 * 0.42 + (taxableIncome - 1000000000) * 0.45 - 65940000;
    bracket = 45;
  }

  const localTax = tax * 0.1;
  const totalTax = tax + localTax;
  const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;

  return (
    <div>
      <CalcHeader num="40" title="종합소득세 간이" desc="근로소득 기준 연간 소득세를 추정합니다. 2024년 기준." color="#5B8DB8" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="연소득" value={annualIncome} onChange={setAnnualIncome} unit="원" placeholder="50,000,000" />
        <NumInput label="부양가족 수 (본인제외)" value={dependents} onChange={setDependents} unit="명" placeholder="2" />
        <NumInput label="기타공제액" value={otherDeductions} onChange={setOtherDeductions} unit="원" placeholder="0" />
      </div>
      <div className={`grid ${incomeType === 'employment' ? 'md:grid-cols-3' : 'md:grid-cols-2'} border`} style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="과세표준" value={fmt(taxableIncome, 0)} unit="원" /></div>
        <div className={incomeType === 'employment' ? 'border-r' : ''} style={{ borderColor: _BORDER }}><ResultBox label="산출세액" value={fmt(tax, 0)} unit="원" /></div>
        {incomeType === 'employment' && <div className="border-r" style={{ borderColor: _BORDER }}><ResultBox label="지방소득세" value={fmt(localTax, 0)} unit="원" /></div>}
        <ResultBox label="세율" value={fmt(bracket)} unit="%" highlight color="#5B8DB8" />
      </div>
      <div className="mt-5 border" style={{ borderColor: _BORDER }}>
        <ResultBox label="실효세율" value={fmt(effectiveRate, 2)} unit="%" />
      </div>
      <CalcNote
        how={[
          '근로소득공제: 소득 구간별로 차등 적용 (최대 25,000만원)',
          '기본공제: 본인 기본, 부양가족 150만원 × 명수',
          '과세표준 = 소득 - 근로공제 - 기본공제 - 기타공제',
          '2024년 8단계 누진세율 적용 (6% ~ 45%)',
          '지방소득세 10% 추가 (국세 기준)',
        ]}
        example={[
          '연소득 5,000만원, 부양가족 2명',
          '근로공제 = 2,250만원 (5,000 - 1,500 × 0.3)',
          '기본공제 = 2,250만원 (150 × 15)',
          '과세표준 = 5,000 - 2,250 - 2,250 = 500만원',
          '산출세액 = 500만 × 6% = 30만원, 지방소득세 3만원',
        ]}
        tip={[
          '2024년 8구간: 1,400/5,000/8,800/15,000/30,000/50,000/100,000만원',
          '근로소득은 원천징수로 대부분 미리 떼어감',
          '부양가족 추가 시 기본공제로 세금 크게 감소',
          '연말정산으로 초과납부분 환급 또는 추가 납부',
          '※ 세법은 변경될 수 있으며, 정확한 납세액은 세무사 확인을 권장합니다.',
        ]}
      />
    </div>
  );
}

function GiftTaxCalc() {
  const [giftAmount, setGiftAmount] = useState('');
  const [relationship, setRelationship] = useState('spouse');
  const [isMinor, setIsMinor] = useState(false);
  const [priorGifts, setPriorGifts] = useState('');

  const gift = Number(giftAmount) || 0;
  const prior = Number(priorGifts) || 0;

  let deduction = 0;
  if (relationship === 'spouse') deduction = 600000000;
  else if (relationship === 'parents') deduction = isMinor ? 20000000 : 50000000;
  else if (relationship === 'children') deduction = 50000000;
  else deduction = 10000000;

  const taxableGift = Math.max(0, gift + prior - deduction);

  let taxRate = 0;
  let tax = 0;
  if (taxableGift <= 100000000) {
    taxRate = 10;
    tax = taxableGift * 0.10;
  } else if (taxableGift <= 500000000) {
    taxRate = 20;
    tax = 100000000 * 0.10 + (taxableGift - 100000000) * 0.20 - 10000000;
  } else if (taxableGift <= 1000000000) {
    taxRate = 30;
    tax = 100000000 * 0.10 + 400000000 * 0.20 + (taxableGift - 500000000) * 0.30 - 60000000;
  } else if (taxableGift <= 3000000000) {
    taxRate = 40;
    tax = 100000000 * 0.10 + 400000000 * 0.20 + 500000000 * 0.30 + (taxableGift - 1000000000) * 0.40 - 160000000;
  } else {
    taxRate = 50;
    tax = 100000000 * 0.10 + 400000000 * 0.20 + 500000000 * 0.30 + 2000000000 * 0.40 + (taxableGift - 3000000000) * 0.50 - 460000000;
  }

  const creditTax = Math.floor(tax * 0.03);
  const payableTax = Math.max(0, tax - creditTax);

  return (
    <div>
      <CalcHeader num="41" title="증여세" desc="배우자·직계존속·직계비속별 공제 및 세율을 적용합니다. 2024년 기준." color="#5B8DB8" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="증여재산가액" value={giftAmount} onChange={setGiftAmount} unit="원" placeholder="200,000,000" />
        <NumInput label="10년 내 기증여액" value={priorGifts} onChange={setPriorGifts} unit="원" placeholder="0" />
      </div>
      <div className="flex mb-5 gap-2 border" style={{ borderColor: _BORDER }}>
        {['spouse', 'parents', 'children', 'other'].map((rel) => {
          const labels = { spouse: '배우자', parents: '직계존속', children: '직계비속', other: '기타친족' };
          return (
            <button key={rel} onClick={() => setRelationship(rel)} className="flex-1 py-2.5 text-xs font-medium transition-all border-r" style={{ borderColor: _BORDER, background: relationship === rel ? '#5B8DB8' : 'transparent', color: relationship === rel ? _T.textPrimary : _T.textMuted }} >
              {labels[rel as keyof typeof labels]}
            </button>
          );
        })}
      </div>
      {relationship === 'parents' && (
        <div className="mb-5 flex items-center gap-3 p-3 border" style={{ borderColor: _BORDER }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isMinor} onChange={(e) => setIsMinor(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm" style={{ color: _T.textSecondary }}>미성년자</span>
          </label>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="공제후 과세표준" value={fmt(taxableGift, 0)} unit="원" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="세율" value={fmt(taxRate)} unit="%" /></div>
        <ResultBox label="산출세액" value={fmt(tax, 0)} unit="원" highlight color="#5B8DB8" />
      </div>
      <div className="mt-5 border" style={{ borderColor: _BORDER }}>
        <ResultBox label="납부세액 (신고공제 3% 적용)" value={fmt(payableTax, 0)} unit="원" />
      </div>
      <CalcNote
        how={[
          '증여공제 (10년 합산): 배우자 6억, 직계존속→자녀 5,000만, 직계비속→부모 5,000만, 기타친족 1,000만',
          '미성년자 직계존속: 2,000만원만 공제',
          '5단계 누진세율: 10%, 20%, 30%, 40%, 50%',
          '신고공제: 자진 신고 시 산출세액의 3% 감면',
        ]}
        example={[
          '자녀에게 10억원 증여, 직계존속',
          '공제 = 5,000만, 과세표준 = 10억 - 5,000만 = 9,500만',
          '세금 = 9,500만 × 10% = 950만원',
          '신고공제 3% = 28.5만, 납부액 = 921.5만원',
        ]}
        tip={[
          '증여공제는 10년 롤링(매년 초기화 아님)',
          '부부 간 증여는 공제가 크므로 절세 수단',
          '생명보험 사망보험금은 증여세 대상 (과세 기준)',
          '주택·금융자산 증여 시 별도 조정지표 적용',
          '※ 세법은 변경될 수 있으며, 정확한 납세액은 세무사 확인을 권장합니다.',
        ]}
      />
    </div>
  );
}

function PensionCalc() {
  const [pensionType, setPensionType] = useState('national');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [yearsContributed, setYearsContributed] = useState('');
  const [withdrawalAge, setWithdrawalAge] = useState('65');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('3');
  const [withdrawalYears, setWithdrawalYears] = useState('20');

  let monthlyPension = 0;
  let totalAmount = 0;

  if (pensionType === 'national') {
    const mi = Number(monthlyIncome) || 0;
    const yc = Number(yearsContributed) || 0;
    const aValue = 2989237;
    const baseAmount = 1.2 * (aValue + mi) * (1 + (Math.max(0, yc * 12 - 240) / 12) * 0.05 / 12);
    if (yc >= 20) {
      monthlyPension = baseAmount;
    } else {
      monthlyPension = baseAmount * (yc * 12 / 240);
    }
    totalAmount = monthlyPension * 12;
  } else {
    const principal = Number(principalAmount) || 0;
    const rate = Number(expectedReturn) / 100;
    const years = Number(withdrawalYears) || 1;
    const monthlyRate = Math.pow(1 + rate, 1 / 12) - 1;
    const months = years * 12;
    const futureValue = principal * Math.pow(1 + rate, years);
    monthlyPension = futureValue / months;
    totalAmount = futureValue;
  }

  return (
    <div>
      <CalcHeader num="42" title="연금 수령액" desc="국민연금 또는 퇴직·개인연금의 예상 월 수령액을 계산합니다." color="#5B8DB8" />
      <div className="flex mb-5 border" style={{ borderColor: _BORDER }}>
        <button onClick={() => setPensionType('national')} className="flex-1 py-3 text-sm font-medium transition-all border-r" style={{ borderColor: _BORDER, background: pensionType === 'national' ? '#5B8DB8' : 'transparent', color: pensionType === 'national' ? _T.textPrimary : _T.textMuted }}>국민연금</button>
        <button onClick={() => setPensionType('retirement')} className="flex-1 py-3 text-sm font-medium transition-all" style={{ background: pensionType === 'retirement' ? '#C89650' : 'transparent', color: pensionType === 'retirement' ? _T.textPrimary : _T.textMuted }}>퇴직·개인연금</button>
      </div>
      {pensionType === 'national' ? (
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          <NumInput label="현재 월소득" value={monthlyIncome} onChange={setMonthlyIncome} unit="원" placeholder="3,000,000" />
          <NumInput label="가입기간" value={yearsContributed} onChange={setYearsContributed} unit="년" placeholder="30" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          <NumInput label="납입총액" value={principalAmount} onChange={setPrincipalAmount} unit="원" placeholder="300,000,000" />
          <NumInput label="예상수익률" value={expectedReturn} onChange={setExpectedReturn} unit="%" placeholder="3" />
          <NumInput label="수령기간" value={withdrawalYears} onChange={setWithdrawalYears} unit="년" placeholder="20" />
        </div>
      )}
      <div className="grid md:grid-cols-2 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="예상 월 연금액" value={fmt(monthlyPension, 0)} unit="원" highlight color="#5B8DB8" /></div>
        <ResultBox label="연간 수령액" value={fmt(monthlyPension * 12, 0)} unit="원" />
      </div>
      <CalcNote
        how={[
          '국민연금: 기본연금액 = 1.2 × (A값 + 본인 평균소득) × 가산금리',
          '2024년 A값 = 2,989,237원',
          '20년 초과 가입 시: 기본연금액 × (1 + 0.05 × 초과월수/12)',
          '20년 미만 시: 기본연금액 × (가입월수 / 240)',
          '퇴직연금: 납입원금과 수익률로 단순 계산',
        ]}
        example={[
          '국민연금: 월소득 300만, 30년 가입',
          'A값 299만 + 본인 300만 = 599만 기준',
          '기본연금액 = 1.2 × 599만 × 1.05 ≈ 755만원',
          '월 약 62.9만원, 연 754.8만원',
        ]}
        tip={[
          '국민연금은 20년 이상 가입해야 노령연금 수급 가능',
          '연금 수령은 65세부터 가능 (조기 60세 가능하나 감액)',
          '부부 모두 수급 시 합산으로 큰 생활비 확보',
          'IRP나 연금저축으로 추가 수령 가능',
          '※ 세법은 변경될 수 있으며, 정확한 납세액은 세무사 확인을 권장합니다.',
        ]}
      />
    </div>
  );
}

function TaxSavingCalc() {
  const [savingType, setSavingType] = useState('isa');
  const [expectedProfit, setExpectedProfit] = useState('');
  const [accountType, setAccountType] = useState('general');
  const [annualIncome, setAnnualIncome] = useState('');
  const [irpContribution, setIrpContribution] = useState('');
  const [pensionContribution, setPensionContribution] = useState('');

  let taxSavings = 0;
  let effectiveReturn = 0;

  if (savingType === 'isa') {
    const profit = Number(expectedProfit) || 0;
    const nonTaxLimit = accountType === 'general' ? 2000000 : 4000000;
    const taxablePortion = Math.max(0, profit - nonTaxLimit);
    const taxOnExcess = taxablePortion * 0.099;
    const generalTax = profit * 0.154;
    taxSavings = Math.max(0, generalTax - taxOnExcess);
    effectiveReturn = profit > 0 ? ((profit - taxOnExcess) / profit) * 100 : 0;
  } else {
    const income = Number(annualIncome) || 0;
    const irp = Number(irpContribution) || 0;
    const pension = Number(pensionContribution) || 0;
    const totalContribution = irp + pension;
    const rate = income <= 55000000 ? 0.165 : 0.132;
    taxSavings = totalContribution * rate;
    effectiveReturn = 100;
  }

  return (
    <div>
      <CalcHeader num="43" title="ISA · IRP · 연금저축 절세" desc="2024년 기준 절세 효과와 실제 수익률을 비교합니다." color="#5B8DB8" />
      <div className="flex mb-5 border" style={{ borderColor: _BORDER }}>
        <button onClick={() => setSavingType('isa')} className="flex-1 py-3 text-sm font-medium transition-all border-r" style={{ borderColor: _BORDER, background: savingType === 'isa' ? '#5B8DB8' : 'transparent', color: savingType === 'isa' ? _T.textPrimary : _T.textMuted }}>ISA</button>
        <button onClick={() => setSavingType('irp')} className="flex-1 py-3 text-sm font-medium transition-all" style={{ background: savingType === 'irp' ? '#C89650' : 'transparent', color: savingType === 'irp' ? _T.textPrimary : _T.textMuted }}>IRP + 연금저축</button>
      </div>
      {savingType === 'isa' ? (
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          <NumInput label="예상 수익" value={expectedProfit} onChange={setExpectedProfit} unit="원" placeholder="10,000,000" />
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-sm mb-2" style={{ color: _T.textSecondary }}>계좌 유형</label>
              <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="w-full px-3 py-2 border" style={{ borderColor: _BORDER, background: _T.bgCard, color: _T.textSecondary }}>
                <option value="general">일반형 (200만 비과세)</option>
                <option value="common">서민형 (400만 비과세)</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          <NumInput label="연소득" value={annualIncome} onChange={setAnnualIncome} unit="원" placeholder="50,000,000" />
          <NumInput label="IRP 납입" value={irpContribution} onChange={setIrpContribution} unit="원" placeholder="5,000,000" />
          <NumInput label="연금저축 납입" value={pensionContribution} onChange={setPensionContribution} unit="원" placeholder="4,000,000" />
        </div>
      )}
      <div className={`grid ${savingType === 'isa' ? 'md:grid-cols-2' : 'md:grid-cols-3'} border`} style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="절세액" value={fmt(taxSavings, 0)} unit="원" /></div>
        {savingType === 'isa' && <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="일반계좌 대비 절약" value={fmt((Number(expectedProfit)||0) > 0 ? ((Number(expectedProfit)||0) * 0.154 - (Number(expectedProfit)||0) * 0.099) : 0, 0)} unit="원" /></div>}
        <ResultBox label={savingType === 'isa' ? '실효수익률' : '세액공제율'} value={fmt(effectiveReturn, 2)} unit="%" highlight color="#5B8DB8" />
      </div>
      <CalcNote
        how={[
          'ISA: 연 2,000만원 납입 한도, 비과세 200만~400만원 한도',
          '초과분 9.9% 분리과세 (일반세율 15.4% 대비)',
          'IRP + 연금저축: 합산 900만원 세액공제',
          '공제율: 5,500만 이하 16.5%, 초과 13.2%',
        ]}
        example={[
          'ISA 일반형: 1,000만 수익',
          '비과세 200만, 과세 800만',
          '세금 = 800만 × 9.9% = 79.2만원',
          '일반계좌: 1,000만 × 15.4% = 154만 → 절약 74.8만원',
        ]}
        tip={[
          'ISA는 5년 단위 계약, 중도 해지 시 세제 혜택 상실',
          'IRP는 원금 공제 + 수익 과세 (연금 수령 시 과세)',
          'FIRE족이나 고배당 포트폴리오에 ISA 최적화',
          '연금저축은 부부 각각 600만원 한도 (별도)',
          '※ 세법은 변경될 수 있으며, 정확한 납세액은 세무사 확인을 권장합니다.',
        ]}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 환전 수수료
// ─────────────────────────────────────────────
function FxConvertCalc() {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [spread, setSpread] = useState('1.75');
  const [dir, setDir] = useState<'buy'|'sell'>('buy');
  const amt = Number(amount) || 0;
  const baseRate = Number(rate) || 0;
  const sp = Number(spread) / 100;
  const appliedRate = dir === 'buy' ? baseRate * (1 + sp) : baseRate * (1 - sp);
  const krwResult = dir === 'buy' ? amt * appliedRate : amt / baseRate * (1 - sp) * baseRate;
  const usdResult = dir === 'buy' ? amt / appliedRate : amt / baseRate;
  const spreadCost = dir === 'buy'
    ? amt * appliedRate - amt * baseRate
    : amt - amt * (1 - sp);
  return (
    <div>
      <CalcHeader num="19" title="환전 수수료 계산" desc="기준환율 대비 실제 환전 비용을 계산합니다." color="#8A8A8A" />
      <div className="flex mb-5 border" style={{ borderColor: _BORDER }}>
        <button onClick={() => setDir('buy')} className="flex-1 py-3 text-sm font-medium transition-all border-r"
          style={{ borderColor: _BORDER, background: dir === 'buy' ? '#4A7045' : 'transparent', color: dir === 'buy' ? _T.textPrimary : _T.textMuted }}>
          달러 매수 (원→달러)
        </button>
        <button onClick={() => setDir('sell')} className="flex-1 py-3 text-sm font-medium transition-all"
          style={{ background: dir === 'sell' ? '#A63D33' : 'transparent', color: dir === 'sell' ? _T.textPrimary : _T.textMuted }}>
          달러 매도 (달러→원)
        </button>
      </div>
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label={dir === 'buy' ? '환전할 원화' : '환전할 달러'} value={amount} onChange={setAmount} unit={dir === 'buy' ? '원' : '$'} placeholder={dir === 'buy' ? '1,000,000' : '1,000'} />
        <NumInput label="기준환율 (매매기준율)" value={rate} onChange={setRate} unit="원/$" placeholder="1,350" />
        <NumInput label="스프레드 (환전 우대 전)" value={spread} onChange={setSpread} unit="%" hint="일반 1.75%, 우대 시 더 낮음" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="적용 환율" value={fmt(appliedRate, 2)} unit="원/$" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="스프레드 비용" value={fmt(spreadCost, 0)} unit={dir === 'buy' ? '원' : '$'} /></div>
        <ResultBox label={dir === 'buy' ? '수령 달러' : '수령 원화'} value={dir === 'buy' ? fmt(usdResult, 2) : fmt(krwResult, 0)} unit={dir === 'buy' ? '$' : '원'} highlight color="#8A8A8A" />
      </div>
      <CalcNote
        how={['기준환율(매매기준율) 입력', '스프레드: 은행/증권사별 상이, 우대 쿠폰 적용 시 0.1~0.3%까지 낮출 수 있음', '적용 환율 = 기준환율 × (1 ± 스프레드%)']}
        example={['100만원 → 달러 환전, 기준환율 1,350원, 스프레드 1.75%', '적용 환율 = 1,350 × 1.0175 = 1,373.6원', '수령 달러 = 1,000,000 / 1,373.6 ≈ $728', '스프레드 비용 ≈ 12,741원']}
        tip={['은행 앱 우대 쿠폰 활용 시 스프레드 0.3% 이하 가능', '미국 주식 투자 시 증권사 환전 스프레드가 은행보다 낮은 경우 많음', '달러 MMF/RP 활용 시 원화 대기 대비 환차익+이자 동시 노릴 수 있음', 'FX 매매(외환거래)와 일반 환전은 다름 — 환전 수수료는 항상 발생']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 공매도 손익
// ─────────────────────────────────────────────
function ShortSellCalc() {
  const [entry, setEntry] = useState('');
  const [exit, setExit] = useState('');
  const [qty, setQty] = useState('');
  const [days, setDays] = useState('');
  const [borrowRate, setBorrowRate] = useState('2.0');
  const ep = Number(entry) || 0;
  const xp = Number(exit) || 0;
  const q = Number(qty) || 0;
  const d = Number(days) || 0;
  const br = Number(borrowRate) / 100;
  const pnl = (ep - xp) * q;                          // 공매도: 하락 시 이익
  const borrowCost = ep * q * br * (d / 365);          // 대차료
  const sellTax = ep * q * 0.0018;                     // 증권거래세 0.18%
  const netPnl = pnl - borrowCost - sellTax;
  const retPct = ep * q ? (netPnl / (ep * q)) * 100 : 0;
  return (
    <div>
      <CalcHeader num="20" title="공매도 손익 계산" desc="대차료·거래세 반영 후 실제 공매도 순손익을 계산합니다." color="#8A8A8A" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="진입가 (숏 진입)" value={entry} onChange={setEntry} unit="원" placeholder="50,000" />
        <NumInput label="청산가 (숏 청산)" value={exit} onChange={setExit} unit="원" placeholder="45,000" hint="낮을수록 이익" />
        <NumInput label="수량" value={qty} onChange={setQty} unit="주" placeholder="100" />
        <NumInput label="보유 일수" value={days} onChange={setDays} unit="일" placeholder="10" />
        <NumInput label="대차금리 (연)" value={borrowRate} onChange={setBorrowRate} unit="%" hint="종목별 상이, 일반 1~5%" />
      </div>
      <div className="grid md:grid-cols-4 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="주가차익" value={fmt(pnl, 0)} unit="원" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="대차료" value={fmt(-borrowCost, 0)} unit="원" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="증권거래세" value={fmt(-sellTax, 0)} unit="원" /></div>
        <ResultBox label="순손익" value={fmt(netPnl, 0)} unit="원" highlight color="#8A8A8A" />
      </div>
      <div className="border border-t-0" style={{ borderColor: _BORDER }}>
        <ResultBox label="수익률 (진입금액 대비)" value={fmt(retPct)} unit="%" />
      </div>
      <CalcNote
        how={['진입가(숏 진입)와 청산가 입력', '대차금리는 증권사/종목별 상이 — 대차 잔고 많을수록 높아짐', '순손익 = 주가차익 − 대차료 − 증권거래세']}
        example={['50,000원 숏 100주, 45,000원 청산, 10일 보유, 대차금리 2%', '주가차익 = (50,000−45,000) × 100 = 50만원', '대차료 = 5,000,000 × 2% × 10/365 ≈ 2,740원', '거래세 = 5,000,000 × 0.18% = 9,000원', '순손익 ≈ 488,260원']}
        tip={['대차금리가 높은 종목(숏스퀴즈 위험) 주의', '공매도는 이론적으로 손실 무한 — 손절 기준 반드시 설정', '개인 공매도 가능 종목 확인 후 거래 (2025년 전면 재개 이후)', '대주 물량 부족 시 강제 청산(콜백) 가능성 유의']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 분할매수 · 분할매도
// ─────────────────────────────────────────────
function SplitOrderCalc() {
  const [mode, setMode] = useState<'buy'|'sell'>('buy');
  const [basePrice, setBasePrice] = useState('');
  const [totalAmt, setTotalAmt] = useState('');
  const [steps, setSteps] = useState('3');
  const [interval, setInterval] = useState('5');

  const bp = Number(basePrice) || 0;
  const ta = Number(totalAmt) || 0;
  const n = Math.min(Math.max(Number(steps) || 3, 2), 5);
  const intv = Number(interval) || 5;

  const splitAmt = ta / n;
  const rows = Array.from({ length: n }, (_, i) => {
    const pct = mode === 'buy' ? -(i * intv) : (i * intv);
    const price = bp * (1 + pct / 100);
    const qty = price ? Math.floor(splitAmt / price) : 0;
    const actual = qty * price;
    return { step: i + 1, pct, price, qty, actual };
  });
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const totalSpent = rows.reduce((s, r) => s + r.actual, 0);
  const avgPrice = totalQty ? totalSpent / totalQty : 0;

  return (
    <div>
      <CalcHeader num="21" title="분할매수 · 분할매도 전략" desc="단계별 진입/청산 가격과 수량을 자동으로 계산합니다." color="#8A8A8A" />
      <div className="flex mb-5 border" style={{ borderColor: _BORDER }}>
        <button onClick={() => setMode('buy')} className="flex-1 py-3 text-sm font-medium transition-all border-r"
          style={{ borderColor: _BORDER, background: mode === 'buy' ? '#4A7045' : 'transparent', color: mode === 'buy' ? _T.textPrimary : _T.textMuted }}>
          분할매수
        </button>
        <button onClick={() => setMode('sell')} className="flex-1 py-3 text-sm font-medium transition-all"
          style={{ background: mode === 'sell' ? '#A63D33' : 'transparent', color: mode === 'sell' ? _T.textPrimary : _T.textMuted }}>
          분할매도
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label={mode === 'buy' ? '1차 매수가' : '1차 매도가'} value={basePrice} onChange={setBasePrice} unit="원" placeholder="50,000" />
        <NumInput label="총 투자금액" value={totalAmt} onChange={setTotalAmt} unit="원" placeholder="10,000,000" />
        <NumInput label="분할 횟수" value={steps} onChange={setSteps} unit="회" hint="최대 5회" placeholder="3" />
        <NumInput label={mode === 'buy' ? '추가 매수 간격' : '추가 매도 간격'} value={interval} onChange={setInterval} unit="%" hint={mode === 'buy' ? '하락 시 추가 매수' : '상승 시 추가 매도'} placeholder="5" />
      </div>
      <div className="border mb-4" style={{ borderColor: _BORDER }}>
        <div className="grid grid-cols-4 px-4 py-2 border-b text-[12px] mono uppercase tracking-[0.15em]" style={{ borderColor: _BORDER, color: _T.textFaint, background: _T.bgCard }}>
          <span>단계</span><span>가격</span><span>수량</span><span>금액</span>
        </div>
        {rows.map(r => (
          <div key={r.step} className="grid grid-cols-4 px-4 py-3 border-b text-sm" style={{ borderColor: _BORDER }}>
            <span className="mono" style={{ color: _T.textFaint }}>{r.step}차</span>
            <span style={{ color: _T.textPrimary }}>{fmt(r.price, 0)}원</span>
            <span style={{ color: _T.textPrimary }}>{fmt(r.qty, 0)}주</span>
            <span style={{ color: _T.textMuted }}>{fmt(r.actual, 0)}원</span>
          </div>
        ))}
        <div className="grid grid-cols-4 px-4 py-3 text-sm font-medium" style={{ background: _T.bgCard }}>
          <span className="mono" style={{ color: _T.accent }}>합계</span>
          <span style={{ color: _T.accent }}>평균 {fmt(avgPrice, 0)}원</span>
          <span style={{ color: _T.textPrimary }}>{fmt(totalQty, 0)}주</span>
          <span style={{ color: _T.textPrimary }}>{fmt(totalSpent, 0)}원</span>
        </div>
      </div>
      <CalcNote
        how={['매수/매도 모드 선택', '1차 진입가, 총 투자금, 분할 횟수, 간격 입력', '각 단계 진입가 = 1차가 × (1 ∓ 간격% × n)']}
        example={['1차 매수 50,000원, 1,000만원, 3회 분할, 5% 간격', '1차: 50,000원, 2차: 47,500원, 3차: 45,000원', '각 333만원씩 균등 투자', '평균단가 ≈ 47,400원']}
        tip={['균등 분할이 기본 — 하락 확신 시 역피라미딩(후반부 비중 증가) 고려', '분할 간격이 너무 좁으면 전체 물량 소화 전 반등 가능성', '분할 횟수 3~5회가 현실적, 10회 이상은 관리 복잡', '매도 분할은 목표가까지 전량 미도달 리스크 방어에 유효']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 롤오버 비용
// ─────────────────────────────────────────────
function RolloverCalc() {
  const [nearPrice, setNearPrice] = useState('');
  const [farPrice, setFarPrice] = useState('');
  const [contracts, setContracts] = useState('');
  const [multiplier, setMultiplier] = useState('250000');
  const near = Number(nearPrice) || 0;
  const far = Number(farPrice) || 0;
  const c = Number(contracts) || 0;
  const m = Number(multiplier) || 250000;
  const basis = far - near;                     // 베이시스 (원/포인트)
  const rollCost = basis * c * m;               // 롤오버 비용 (원)
  const rollPct = near ? (basis / near) * 100 : 0;
  return (
    <div>
      <CalcHeader num="26" title="롤오버 비용 계산" desc="선물 월물 교체(롤오버) 시 베이시스 비용을 계산합니다." color="#6B6B6B" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="근월물 가격" value={nearPrice} onChange={setNearPrice} unit="pt" placeholder="350.50" />
        <NumInput label="원월물 가격" value={farPrice} onChange={setFarPrice} unit="pt" placeholder="352.20" hint="원월물이 높으면 콘탱고 (비용 발생)" />
        <NumInput label="계약 수" value={contracts} onChange={setContracts} unit="계약" placeholder="5" />
        <NumInput label="계약 승수" value={multiplier} onChange={setMultiplier} unit="원/pt" hint="코스피200선물 250,000원/pt" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="베이시스" value={fmt(basis, 2)} unit="pt" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="롤오버 비용" value={fmt(rollCost, 0)} unit="원" highlight color="#6B6B6B" /></div>
        <ResultBox label="베이시스율" value={fmt(rollPct, 3)} unit="%" />
      </div>
      <CalcNote
        how={['근월물·원월물 가격 입력', '베이시스 = 원월물 − 근월물', '롤오버 비용 = 베이시스 × 계약수 × 승수']}
        example={['코스피200 근월물 350.00, 원월물 352.00, 5계약', '베이시스 = 2.00pt', '롤오버 비용 = 2.00 × 5 × 250,000 = 250만원']}
        tip={['콘탱고(원월물 > 근월물): 롤오버 시 비용 발생 — 장기 보유 시 누적 손실', '백워데이션(원월물 < 근월물): 롤오버 시 이익', '코스피200 선물 승수: 250,000원/pt', '미니선물 승수: 50,000원/pt', '롤오버 시기는 만기 1~2주 전 거래량 이동 시점 참고']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 옵션 손익분기
// ─────────────────────────────────────────────
function OptionBEPCalc() {
  const [type, setType] = useState<'call'|'put'>('call');
  const [strike, setStrike] = useState('');
  const [premium, setPremium] = useState('');
  const [multiplier, setMultiplier] = useState('250000');
  const K = Number(strike) || 0;
  const prem = Number(premium) || 0;
  const m = Number(multiplier) || 250000;
  const bep = type === 'call' ? K + prem : K - prem;
  const maxLoss = prem * m;
  const maxProfit = type === 'call' ? Infinity : (K - prem) * m;

  return (
    <div>
      <CalcHeader num="27" title="옵션 손익분기 계산" desc="프리미엄 반영 실제 BEP와 최대손실을 계산합니다." color="#6B6B6B" />
      <div className="flex mb-5 border" style={{ borderColor: _BORDER }}>
        <button onClick={() => setType('call')} className="flex-1 py-3 text-sm font-medium transition-all border-r"
          style={{ borderColor: _BORDER, background: type === 'call' ? '#4A7045' : 'transparent', color: type === 'call' ? _T.textPrimary : _T.textMuted }}>
          콜 옵션 매수
        </button>
        <button onClick={() => setType('put')} className="flex-1 py-3 text-sm font-medium transition-all"
          style={{ background: type === 'put' ? '#A63D33' : 'transparent', color: type === 'put' ? _T.textPrimary : _T.textMuted }}>
          풋 옵션 매수
        </button>
      </div>
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="행사가 (Strike)" value={strike} onChange={setStrike} unit="pt" placeholder="350.00" />
        <NumInput label="프리미엄 (옵션가)" value={premium} onChange={setPremium} unit="pt" placeholder="2.50" />
        <NumInput label="계약 승수" value={multiplier} onChange={setMultiplier} unit="원/pt" hint="코스피200 250,000원" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="손익분기 (BEP)" value={fmt(bep, 2)} unit="pt" highlight color="#6B6B6B" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="최대 손실" value={fmt(-maxLoss, 0)} unit="원" /></div>
        <ResultBox label={type === 'call' ? '최대 이익' : `최대 이익 (지수 0 시)`} value={type === 'call' ? '이론상 무한' : fmt(maxProfit, 0)} unit={type === 'call' ? '' : '원'} />
      </div>
      <CalcNote
        how={['콜/풋 선택', '행사가와 프리미엄(옵션가) 입력', 'BEP = 행사가 ± 프리미엄 (콜: +, 풋: −)']}
        example={['코스피200 350 콜 매수, 프리미엄 2.50pt', 'BEP = 350 + 2.50 = 352.50pt', '최대 손실 = 2.50 × 250,000 = 625,000원', '만기 시 지수가 352.50 초과해야 이익']}
        tip={['옵션 매수자의 최대 손실 = 프리미엄 전액', '만기 전 시간가치 감소(세타) 매우 빠름 — 보유 기간 짧게', '내가격(ITM) 옵션은 BEP 달성 더 쉽지만 프리미엄 높음', '외가격(OTM) 옵션은 레버리지 크지만 손실 확률도 높음']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 섹터별 비중
// ─────────────────────────────────────────────
function SectorWeightCalc() {
  const SECTORS = ['반도체', 'IT/플랫폼', '금융', '에너지', '소비재', '헬스케어', '산업재', '기타'];
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(SECTORS.map(s => [s, '']))
  );
  const nums = Object.entries(values).map(([s, v]) => ({ sector: s, val: Number(v) || 0 }));
  const total = nums.reduce((s, r) => s + r.val, 0);
  const rows = nums.map(r => ({ ...r, pct: total ? (r.val / total) * 100 : 0 })).filter(r => r.val > 0);

  return (
    <div>
      <CalcHeader num="35" title="섹터별 비중" desc="보유 종목의 섹터별 금액과 비중을 한눈에 확인합니다." color="#6B9B6B" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {SECTORS.map(s => (
          <NumInput key={s} label={s} value={values[s]} onChange={v => setValues(prev => ({ ...prev, [s]: v }))} unit="원" placeholder="0" />
        ))}
      </div>
      {total > 0 && (
        <div className="border mb-4" style={{ borderColor: _BORDER }}>
          <div className="grid grid-cols-3 px-4 py-2 border-b text-[12px] mono uppercase tracking-[0.15em]" style={{ borderColor: _BORDER, color: _T.textFaint, background: _T.bgCard }}>
            <span>섹터</span><span>금액</span><span>비중</span>
          </div>
          {rows.sort((a, b) => b.pct - a.pct).map(r => (
            <div key={r.sector} className="border-b" style={{ borderColor: _BORDER }}>
              <div className="grid grid-cols-3 px-4 py-2.5 text-sm">
                <span style={{ color: _T.textPrimary }}>{r.sector}</span>
                <span style={{ color: _T.textMuted }}>{fmt(r.val, 0)}원</span>
                <span style={{ color: _T.accent }} className="font-medium">{fmt(r.pct, 1)}%</span>
              </div>
              <div className="mx-4 mb-2.5 h-1 rounded-sm overflow-hidden" style={{ background: _T.bgCard }}>
                <div className="h-full rounded-sm" style={{ width: `${r.pct}%`, background: '#6B9B6B' }} />
              </div>
            </div>
          ))}
          <div className="grid grid-cols-3 px-4 py-3 text-sm font-medium" style={{ background: _T.bgCard }}>
            <span style={{ color: _T.accent }}>합계</span>
            <span style={{ color: _T.textPrimary }}>{fmt(total, 0)}원</span>
            <span style={{ color: _T.accent }}>100%</span>
          </div>
        </div>
      )}
      <CalcNote
        how={['각 섹터에 보유 금액(시가 기준) 입력', '비중 = 섹터금액 / 총자산 × 100', '입력한 섹터만 표시됨']}
        example={['반도체 5,000만, IT 2,000만, 금융 1,500만, 에너지 1,000만', '총 9,500만원', '반도체 52.6%, IT 21.1%, 금융 15.8%, 에너지 10.5%']}
        tip={['특정 섹터 30% 초과 시 집중 리스크 — 분산 여부 재검토', '지수(코스피200) 섹터 비중과 비교해 오버웨이트/언더웨이트 파악', '반도체 편중은 한국 시장 특성상 흔하나, 글로벌 충격 시 변동성 확대']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 환헷지 비율
// ─────────────────────────────────────────────
function FxHedgeCalc() {
  const [foreignAmt, setForeignAmt] = useState('');
  const [fxRate, setFxRate] = useState('');
  const [hedgeRatio, setHedgeRatio] = useState('50');
  const [fwdPremium, setFwdPremium] = useState('1.5');
  const fa = Number(foreignAmt) || 0;
  const rate = Number(fxRate) || 0;
  const hr = Number(hedgeRatio) / 100;
  const fp = Number(fwdPremium) / 100;
  const krwValue = fa * rate;
  const hedgeAmt = krwValue * hr;
  const unhedgedAmt = krwValue * (1 - hr);
  const hedgeCost = hedgeAmt * fp;

  return (
    <div>
      <CalcHeader num="36" title="환헷지 비율 계산" desc="해외 투자 포지션의 환헷지 규모와 비용을 계산합니다." color="#6B9B6B" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="해외 투자금액" value={foreignAmt} onChange={setForeignAmt} unit="$" placeholder="100,000" />
        <NumInput label="현재 환율" value={fxRate} onChange={setFxRate} unit="원/$" placeholder="1,350" />
        <NumInput label="헷지 비율" value={hedgeRatio} onChange={setHedgeRatio} unit="%" hint="0%=무헷지, 100%=완전헷지" />
        <NumInput label="선물환 프리미엄 (연)" value={fwdPremium} onChange={setFwdPremium} unit="%" hint="한미 금리차 반영, 약 1~2% 수준" />
      </div>
      <div className="grid md:grid-cols-4 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="원화 환산 총액" value={fmt(krwValue, 0)} unit="원" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="헷지 금액" value={fmt(hedgeAmt, 0)} unit="원" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="비헷지 금액" value={fmt(unhedgedAmt, 0)} unit="원" /></div>
        <ResultBox label="연간 헷지 비용" value={fmt(hedgeCost, 0)} unit="원" highlight color="#6B9B6B" />
      </div>
      <CalcNote
        how={['해외 투자금액(달러), 환율 입력', '헷지 비율: 전액 헷지(100%) or 부분 헷지 선택', '선물환 프리미엄: 한미 금리차 반영, 헷지 비용']}
        example={['$100,000 투자, 환율 1,350원, 헷지 50%, 선물환 프리미엄 1.5%', '원화 환산 = 1억 3,500만원', '헷지 금액 = 6,750만원', '연간 헷지 비용 = 6,750만 × 1.5% = 101.25만원']}
        tip={['한국 금리 > 미국 금리 시: 선물환 프리미엄 축소 or 음수(헷지가 이익)', '한국 금리 < 미국 금리 시: 선물환 프리미엄 확대(헷지 비용 증가)', '국내 ETF(환헷지형 H) 활용 시 내부적으로 선물환 헷지 자동 진행', '헷지 여부는 환율 방향 전망보다 변동성 리스크 허용 수준으로 결정']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 리밸런싱 계산기
// ─────────────────────────────────────────────
function RebalanceCalc() {
  const [totalAsset, setTotalAsset] = useState('');
  const [rows, setRows] = useState([
    { name: '국내주식', current: '', target: '30' },
    { name: '해외주식', current: '', target: '30' },
    { name: '채권', current: '', target: '20' },
    { name: '현금', current: '', target: '20' },
  ]);

  const total = Number(totalAsset) || 0;
  const computed = rows.map(r => {
    const cur = Number(r.current) || 0;
    const tgt = Number(r.target) || 0;
    const curPct = total ? (cur / total) * 100 : 0;
    const targetAmt = total * tgt / 100;
    const diff = targetAmt - cur;
    return { ...r, cur, tgt, curPct, targetAmt, diff };
  });
  const targetSum = rows.reduce((s, r) => s + (Number(r.target) || 0), 0);

  const updateRow = (i: number, field: 'name'|'current'|'target', val: string) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  };
  const addRow = () => setRows(prev => [...prev, { name: '', current: '', target: '0' }]);
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div>
      <CalcHeader num="37" title="리밸런싱 계산기" desc="목표 비중과 현재 비중 차이를 계산해 매수/매도 금액을 안내합니다." color="#6B9B6B" />
      <div className="mb-6">
        <NumInput label="총 포트폴리오 금액" value={totalAsset} onChange={setTotalAsset} unit="원" placeholder="100,000,000" />
      </div>
      <div className="border mb-2" style={{ borderColor: _BORDER }}>
        <div className="grid grid-cols-5 px-3 py-2 border-b text-[11px] mono uppercase tracking-[0.1em]" style={{ borderColor: _BORDER, color: _T.textFaint, background: _T.bgCard }}>
          <span>자산명</span><span>현재 금액</span><span>현재 %</span><span>목표 %</span><span>매수/매도</span>
        </div>
        {computed.map((r, i) => (
          <div key={i} className="grid grid-cols-5 items-center px-3 py-2 border-b gap-1 text-sm" style={{ borderColor: _BORDER }}>
            <input value={r.name} onChange={e => updateRow(i, 'name', e.target.value)}
              className="bg-transparent border-b text-sm outline-none" style={{ borderColor: _BORDER, color: _T.textPrimary }} />
            <input value={r.current} onChange={e => updateRow(i, 'current', e.target.value)}
              className="bg-transparent border-b text-sm outline-none mono" style={{ borderColor: _BORDER, color: _T.textPrimary }} placeholder="0" />
            <span className="mono text-xs" style={{ color: _T.textMuted }}>{fmt(r.curPct, 1)}%</span>
            <input value={r.target} onChange={e => updateRow(i, 'target', e.target.value)}
              className="bg-transparent border-b text-sm outline-none mono" style={{ borderColor: _BORDER, color: _T.accent }} />
            <span className={`mono text-xs font-medium`} style={{ color: r.diff > 0 ? '#4A7045' : r.diff < 0 ? '#A63D33' : _T.textDimmer }}>
              {r.diff > 0 ? '+' : ''}{fmt(r.diff, 0)}원
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-6">
        <button onClick={addRow} className="text-[12px] mono px-3 py-1.5 border" style={{ borderColor: _BORDER, color: _T.textFaint }}>+ 행 추가</button>
        {rows.length > 1 && <button onClick={() => removeRow(rows.length - 1)} className="text-[12px] mono px-3 py-1.5 border" style={{ borderColor: _BORDER, color: _T.textFaint }}>− 행 삭제</button>}
        <span className={`ml-auto text-[12px] mono py-1.5`} style={{ color: targetSum === 100 ? '#4A7045' : '#A63D33' }}>목표 합계: {targetSum}%</span>
      </div>
      <CalcNote
        how={['총 자산 입력 → 각 자산 현재 금액과 목표 비중(%) 입력', '매수/매도 = 목표금액 − 현재금액', '녹색(+): 매수 필요, 빨간색(−): 매도 필요']}
        example={['총 1억, 국내주식 현재 4,000만 (목표 30%)', '목표금액 = 1억 × 30% = 3,000만원', '→ 1,000만원 매도 필요']}
        tip={['리밸런싱 주기: 반기 or 연 1회, 또는 비중 5% 초과 이탈 시', '소액 자산은 추가 매수로만 리밸런싱 → 매도세 절감', '리밸런싱 자체가 고평가 자산 매도 + 저평가 자산 매수 효과']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 금융소득 종합과세 시뮬레이터
// ─────────────────────────────────────────────
function FinIncomeTaxCalc() {
  const [interest, setInterest] = useState('');
  const [dividend, setDividend] = useState('');
  const [otherIncome, setOtherIncome] = useState('');
  const fin = (Number(interest) || 0) + (Number(dividend) || 0);
  const other = Number(otherIncome) || 0;
  const totalIncome = fin + other;
  const threshold = 20000000; // 2,000만원

  // 분리과세(2,000만 이하) 세금
  const separateTax = Math.min(fin, threshold) * 0.154; // 15.4% (지방소득세 포함)

  // 종합과세(2,000만 초과) 세금
  const isComprehensive = fin > threshold;
  const comprehensiveBase = isComprehensive ? totalIncome : 0;
  const deduction = 1500000; // 기본공제 150만 (간이)

  const taxableBase = Math.max(comprehensiveBase - deduction, 0);
  const calcIncomeTax = (base: number) => {
    if (base <= 14000000) return base * 0.06;
    if (base <= 50000000) return base * 0.15 - 1260000;
    if (base <= 88000000) return base * 0.24 - 5760000;
    if (base <= 150000000) return base * 0.35 - 15440000;
    if (base <= 300000000) return base * 0.38 - 19940000;
    if (base <= 500000000) return base * 0.40 - 25940000;
    if (base <= 1000000000) return base * 0.42 - 35940000;
    return base * 0.45 - 65940000;
  };
  const comprehensiveTax = isComprehensive ? calcIncomeTax(taxableBase) * 1.1 : 0;
  const separateTaxOnExcess = isComprehensive ? Math.min(fin, threshold) * 0.154 : separateTax;
  const additionalTax = isComprehensive ? comprehensiveTax - separateTaxOnExcess : 0;
  const effectiveRate = totalIncome ? ((isComprehensive ? comprehensiveTax : separateTax) / totalIncome) * 100 : 0;

  return (
    <div>
      <CalcHeader num="44" title="금융소득 종합과세 시뮬레이터" desc="금융소득 2,000만원 초과 시 추가 세금 부담을 시뮬레이션합니다." color="#5B8DB8" />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="이자소득 (연)" value={interest} onChange={setInterest} unit="원" placeholder="10,000,000" />
        <NumInput label="배당소득 (연)" value={dividend} onChange={setDividend} unit="원" placeholder="15,000,000" />
        <NumInput label="기타 종합소득 (근로·사업 등)" value={otherIncome} onChange={setOtherIncome} unit="원" placeholder="50,000,000" />
      </div>
      <div className="mb-4 px-4 py-3 border text-sm" style={{ borderColor: isComprehensive ? '#A63D33' : '#4A7045', color: isComprehensive ? '#A63D33' : '#4A7045' }}>
        {isComprehensive
          ? `⚠ 금융소득 ${fmt(fin/10000, 0)}만원 — 2,000만원 초과로 종합과세 대상입니다.`
          : `✓ 금융소득 ${fmt(fin/10000, 0)}만원 — 2,000만원 이하로 분리과세(15.4%) 적용됩니다.`}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="금융소득 합계" value={fmt(fin, 0)} unit="원" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}>
          <ResultBox label={isComprehensive ? '종합과세 세액' : '분리과세 세액'} value={fmt(isComprehensive ? comprehensiveTax : separateTax, 0)} unit="원" highlight color="#5B8DB8" />
        </div>
        <ResultBox label="실효세율" value={fmt(effectiveRate, 1)} unit="%" />
      </div>
      {isComprehensive && (
        <div className="border border-t-0" style={{ borderColor: _BORDER }}>
          <ResultBox label="분리과세 대비 추가 세부담" value={fmt(additionalTax, 0)} unit="원" />
        </div>
      )}
      <CalcNote
        how={['이자·배당소득 입력 → 합산 2,000만원 초과 여부 자동 판정', '초과 시 다른 종합소득과 합산해 누진세율 적용', '기타소득은 종합과세 시 합산 기준']}
        example={['이자 1,000만 + 배당 1,500만 = 2,500만 → 종합과세', '기타소득(근로) 5,000만 포함 시 총 7,500만원 종합과세', '세율 24% 구간 적용 → 분리과세 대비 세부담 증가']}
        tip={['배당소득: 국내 상장주식 배당은 Gross-up 적용 (배당세액공제)', 'ISA 계좌 활용 시 배당·이자 비과세 한도 내 종합과세 회피 가능', '금융소득 2,000만 근접 시 연말 배당 수령 시기 조정 고려', '※ 간이 추정치이며, 정확한 납세액은 세무사 확인을 권장합니다.']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 절세 계좌 우선순위 추천기
// ─────────────────────────────────────────────
function TaxAccountCalc() {
  const [income, setIncome] = useState('');
  const [hasIsa, setHasIsa] = useState(true);
  const [hasIrp, setHasIrp] = useState(true);
  const [hasPension, setHasPension] = useState(true);
  const [investStyle, setInvestStyle] = useState<'dividend'|'growth'|'both'>('both');

  const inc = Number(income) || 0;
  const isLowIncome = inc <= 55000000;  // 5,500만 이하
  const creditRate = isLowIncome ? 0.165 : 0.132;

  // IRP+연금저축 최대 세액공제
  const irpPensionLimit = 9000000;
  const pensionOnlyLimit = 6000000;
  const maxCredit = irpPensionLimit * creditRate;

  // ISA 절세 효과 (일반형 기준, 연 1,000만 수익 가정)
  const isaAssumedReturn = 10000000;
  const isaExempt = 2000000;
  const isaTax = (isaAssumedReturn - isaExempt) * 0.099;
  const generalTax = isaAssumedReturn * 0.154;
  const isaSaving = generalTax - isaTax;

  const priorities: { rank: number; name: string; reason: string; limit: string; effect: string }[] = [];

  if (hasIrp || hasPension) {
    priorities.push({
      rank: 1,
      name: 'IRP + 연금저축',
      reason: `세액공제 ${(creditRate * 100).toFixed(1)}% — 연말정산 시 최대 ${fmt(maxCredit / 10000, 0)}만원 환급`,
      limit: `연 최대 900만원 (연금저축 단독 600만)`,
      effect: `최대 세액공제 ${fmt(maxCredit, 0)}원/년`,
    });
  }
  if (hasIsa) {
    priorities.push({
      rank: 2,
      name: 'ISA',
      reason: '이자·배당 비과세 + 초과분 9.9% 분리과세 (일반 15.4% 대비)',
      limit: '연 2,000만원, 5년 총 1억',
      effect: `일반 200만 비과세, 수익 1,000만 기준 절약 약 ${fmt(isaSaving, 0)}원`,
    });
  }
  priorities.push({
    rank: priorities.length + 1,
    name: '일반 계좌',
    reason: '절세 혜택 없음, 한도 제한 없음',
    limit: '한도 없음',
    effect: '배당·이자 15.4% 과세, 국내주식 매매차익 비과세(소액주주)',
  });

  const styleAdvice: Record<string, string> = {
    dividend: 'ISA에 고배당 ETF/리츠 집중 → 배당소득세 절감 극대화. IRP는 안정적 채권형으로 운용.',
    growth: 'IRP/연금저축에 성장주 ETF 담기. 과세이연 효과로 장기 복리 극대화.',
    both: 'IRP에 해외 ETF(S&P500 등), ISA에 국내 배당주로 분리 운용하면 세금·수익 균형.',
  };

  return (
    <div>
      <CalcHeader num="45" title="절세 계좌 우선순위 추천기" desc="소득 수준과 투자 성향에 맞는 절세 계좌 활용 순서를 안내합니다." color="#5B8DB8" />
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <NumInput label="연간 총소득 (근로+사업+금융)" value={income} onChange={setIncome} unit="원" placeholder="60,000,000" />
        <div>
          <div className="text-[13px] mono uppercase tracking-[0.15em] mb-3" style={{ color: _T.textFaint }}>투자 성향</div>
          <div className="flex gap-2">
            {(['dividend', 'growth', 'both'] as const).map(s => (
              <button key={s} onClick={() => setInvestStyle(s)}
                className="flex-1 py-2 text-xs border transition-all"
                style={{ borderColor: investStyle === s ? _T.accent : _BORDER, color: investStyle === s ? _T.accent : _T.textMuted, background: investStyle === s ? `${_T.accent}15` : 'transparent' }}>
                {s === 'dividend' ? '배당형' : s === 'growth' ? '성장형' : '혼합형'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 mb-8 flex-wrap">
        {[
          { label: 'IRP/연금저축', val: hasIrp, set: setHasIrp },
          { label: 'ISA', val: hasIsa, set: setHasIsa },
        ].map(({ label, val, set }) => (
          <button key={label} onClick={() => set(!val)}
            className="flex items-center gap-2 px-3 py-1.5 border text-sm"
            style={{ borderColor: val ? _T.accent : _BORDER, color: val ? _T.accent : _T.textMuted }}>
            <span className="w-3 h-3 border flex items-center justify-center" style={{ borderColor: 'currentColor' }}>
              {val && <span className="w-1.5 h-1.5" style={{ background: 'currentColor' }} />}
            </span>
            {label} 가입 가능
          </button>
        ))}
      </div>
      <div className="space-y-3 mb-6">
        {priorities.map(p => (
          <div key={p.rank} className="border p-4" style={{ borderColor: p.rank === 1 ? _T.accent : _BORDER }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 flex items-center justify-center text-[12px] mono font-bold"
                style={{ background: p.rank === 1 ? _T.accent : _T.bgCard, color: p.rank === 1 ? '#0a0a0a' : _T.textFaint }}>
                {p.rank}
              </span>
              <span className="font-medium" style={{ color: _T.textPrimary }}>{p.name}</span>
              <span className="ml-auto text-[12px] mono" style={{ color: _T.accent }}>{p.effect}</span>
            </div>
            <div className="text-sm mb-1" style={{ color: _T.textMuted }}>{p.reason}</div>
            <div className="text-[12px] mono" style={{ color: _T.textDimmer }}>한도: {p.limit}</div>
          </div>
        ))}
      </div>
      <div className="border p-4 mb-6" style={{ borderColor: _BORDER }}>
        <div className="text-[12px] mono uppercase tracking-[0.15em] mb-2" style={{ color: _T.textFaint }}>성향별 운용 전략</div>
        <p className="text-sm leading-relaxed" style={{ color: _T.textMuted }}>{styleAdvice[investStyle]}</p>
      </div>
      {/* 유의 문구 */}
      <div className="border-l-2 px-4 py-3 mb-4 text-[13px] leading-relaxed space-y-2" style={{ borderColor: _T.accent, background: `${_T.accent}10`, color: _T.textMuted }}>
        <span className="mono text-[11px] uppercase tracking-[0.2em] block mb-2" style={{ color: _T.accent }}>유의사항</span>
        <p>① <strong style={{ color: _T.textSecondary }}>환급 시점:</strong> 세액공제 환급은 납입 연도 다음 해 연말정산(2~3월) 또는 종합소득세 신고(5월) 시점에 반영됩니다. 납입 즉시 현금 환급이 아닙니다.</p>
        <p>② <strong style={{ color: _T.textSecondary }}>IRP 위험자산 한도:</strong> IRP 단독으로 연 900만원 세액공제가 가능하나, 위험자산(주식형 ETF 등) 편입 비율이 70%로 제한됩니다. ETF 100% 운용을 원한다면 <strong style={{ color: _T.textSecondary }}>연금저축펀드(증권사 개설)</strong>와 병행하는 것이 유리합니다. 연금저축보험(보험사)은 ETF 운용 불가.</p>
        <p>③ <strong style={{ color: _T.textSecondary }}>IRP 중도 인출:</strong> 본인이 직접 납입한 개인부담금은 55세 이후에만 연금 수령 가능하며, 55세 이전 해지 시 기타소득세 16.5% 추징됩니다. 단, <strong style={{ color: _T.textSecondary }}>퇴직급여가 IRP로 이전된 경우</strong>에는 55세 미만이어도 퇴직 후 연금 수령 신청이 가능합니다. 이 경우 퇴직급여를 일시금으로 받으면 퇴직소득세 전액 납부이나, <strong style={{ color: _T.textSecondary }}>연금으로 수령하면 퇴직소득세의 30% 감면</strong>(10년 초과 수령 시 40% 감면)을 받을 수 있어 퇴직급여가 클수록 절세 효과가 큽니다.</p>
        <p>④ <strong style={{ color: _T.textSecondary }}>연금 수령 시 과세:</strong> IRP·연금저축을 연금으로 수령할 때는 연금소득세가 부과됩니다. 수령 나이에 따라 <strong style={{ color: _T.textSecondary }}>55~69세 5.5%, 70~79세 4.4%, 80세 이상 3.3%</strong> 적용됩니다(분리과세 선택 가능, 연 1,500만원 초과 시 종합과세 또는 16.5% 분리과세 선택).</p>
        <p>⑤ 개인 소득·자산 상황에 따라 최적 전략이 달라질 수 있습니다. 정확한 절세 계획은 <strong style={{ color: _T.textSecondary }}>세무사 또는 금융기관 전문가</strong>에게 문의하시기 바랍니다.</p>
      </div>
      <CalcNote
        how={['연소득 입력 → 세액공제율 자동 판정 (5,500만 이하 16.5%, 초과 13.2%)', '가입 가능 계좌 선택 → 우선순위 자동 생성', '투자 성향 선택 → 맞춤 운용 전략 제공']}
        example={['연소득 6,000만, IRP+연금저축+ISA 모두 가능, 혼합형', '1순위: IRP+연금저축 (세액공제 13.2%, 최대 118.8만원 — 다음 해 연말정산 시 환급)', '2순위: ISA (배당·이자 비과세)', '3순위: 일반계좌 (잔여 투자금)']}
        tip={['IRP 개인납입분은 55세 이전 중도해지 시 기타소득세 16.5% 추징 — 확실한 장기 자금만', '단, 퇴직급여가 IRP로 이전 후 연금 수령 시 퇴직소득세 30% 감면 (10년 초과 수령 시 40%) — 일시금 수령 대비 핵심 절세', '연금 수령 시 연금소득세 부과: 55~69세 5.5% / 70~79세 4.4% / 80세 이상 3.3%', '연 연금소득 1,500만원 초과 시 종합과세 또는 16.5% 분리과세 중 선택', 'ISA는 3년 의무 가입, 중도 해지 시 세제 혜택 반납', '연금저축펀드(증권사)는 ETF 100% 운용 가능 / 연금저축보험(보험사)은 ETF 불가', 'IRP 단독 900만원도 가능하나 위험자산 70% 한도 — ETF 비중 높이려면 연금저축펀드 병행', '배당소득이 많다면 ISA 활용 우선, 근로소득이 크다면 IRP/연금저축 우선', '※ 세법은 변경될 수 있으며, 정확한 절세 계획은 세무사 또는 금융기관 전문가에게 문의하세요.']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// GuideDrawer — 데스크탑: 우측 슬라이드, 모바일: 하단 모달
// ─────────────────────────────────────────────
const GUIDE_SECTIONS = [
  {
    id: 'about',
    icon: Info,
    title: '소개',
    color: '#C89650',
    items: [
      {
        label: '만든 이유',
        desc: '유튜브나 강의, 재무제표를 보다 보면 처음 보는 용어가 툭 튀어나와 흐름이 끊기는 순간이 있습니다. 그럴 때마다 검색창을 열고, 여러 사이트를 돌아다니며 파편화된 정보를 찾아야 하는 게 불편했습니다. StockWiki는 그 불편함에서 출발했습니다. 투자·경제 관련 용어, 계산기, 일정 정보를 한 곳에 모아 흐름을 끊지 않고 바로 찾고, 바로 이해할 수 있도록 만들었습니다.',
      },
      {
        label: '어떤 분께 유용한가요',
        desc: '주식이나 경제 공부를 막 시작한 분, 재무제표를 처음 접하는 분, 유튜브나 뉴스에서 낯선 용어가 나올 때마다 매번 따로 검색하는 분들에게 특히 도움이 됩니다. 전문 투자자보다는 "공부하는 투자자"를 위한 사전입니다.',
      },
      {
        label: '수록 범위',
        desc: '주식 기본 용어부터 파생상품, 채권, 거시경제 지표, 회계·재무제표 용어까지 약 500종 이상을 수록하고 있으며 계속 추가됩니다. 미국·한국 시장 모두를 커버합니다.',
      },
      {
        label: '정보 활용 안내',
        desc: '이 사이트의 모든 정보는 학습과 이해를 돕기 위한 것입니다. 특정 종목이나 상품에 대한 투자를 권유하지 않으며, 투자 결정과 그에 따른 책임은 전적으로 이용자 본인에게 있습니다.',
      },
    ],
  },
  {
    id: 'glossary',
    icon: BookOpen,
    title: '금융 사전',
    color: '#7B9FDF',
    items: [
      {
        label: '용어 찾기',
        desc: '화면 위 검색창에 찾고 싶은 단어를 입력하면 됩니다. 한글로 입력해도 되고, 영문 약어 (예: PER, ROE)로 입력해도 됩니다. 입력하는 즉시 결과가 바뀝니다.',
      },
      {
        label: '카테고리로 탐색',
        desc: '왼쪽 (데스크탑) 또는 상단 탭 (모바일) 에서 주식 기초 · 재무제표 · 파생상품 등 주제별로 묶인 용어를 볼 수 있습니다. "지금 공부하는 분야"의 용어를 한눈에 훑기 좋습니다.',
      },
      {
        label: '즐겨찾기 (★)',
        desc: '용어를 클릭해 상세 내용을 열면 오른쪽 위에 ★ 버튼이 있습니다. 누르면 즐겨찾기에 저장되고, 카테고리 탭에서 "★ 즐겨찾기" 항목을 누르면 저장한 용어만 모아 볼 수 있습니다. 자주 헷갈리는 용어를 따로 모아두기 좋습니다.',
      },
      {
        label: '나만의 메모 남기기',
        desc: '즐겨찾기한 용어에는 짧은 메모를 직접 달 수 있습니다. 예를 들어 "이 용어 처음 나온 강의: OO강의 3편" 같이 나만의 문맥을 적어두면, 나중에 다시 찾을 때 훨씬 빠르게 떠오릅니다.',
      },
      {
        label: '두 용어 나란히 비교',
        desc: '비슷해 보이는 두 용어 (예: 영업이익 vs 순이익) 가 헷갈릴 때 유용합니다. 용어 상세 화면에서 "비교" 버튼을 누르면 두 화면이 나란히 열려 차이를 한눈에 확인할 수 있습니다.',
      },
      {
        label: '이 용어 링크 공유',
        desc: '용어 상세 화면의 공유 아이콘을 누르면 해당 용어로 바로 연결되는 링크가 복사됩니다. 스터디 모임이나 단체방에서 특정 용어를 빠르게 공유할 때 사용하세요.',
      },
    ],
  },
  {
    id: 'calculator',
    icon: Calculator,
    title: '계산기',
    color: '#5FA8A0',
    items: [
      {
        label: '어떤 계산기가 있나요',
        desc: '주가 관련 (PER, PBR, ROE 등), 배당 수익률, 기업 가치 추정 (DCF), 연평균 성장률 (CAGR), 손익분기점, 채권 수익률, 레버리지 효과, 연금·복리 계산 등 총 29종 이상이 있습니다. 왼쪽 목록 (데스크탑) 또는 상단 드롭다운 (모바일) 에서 원하는 항목을 고르면 됩니다.',
      },
      {
        label: '"만약 이랬다면?" 비교 모드',
        desc: '화면 오른쪽 위의 "비교 모드" 버튼을 켜면 두 개의 계산기가 나란히 열립니다. "지금 조건"과 "다른 조건"을 동시에 넣고 결과를 비교할 수 있어서, 이율이 1% 달라지면 최종 금액이 얼마나 차이 나는지 같은 상황에 유용합니다.',
      },
      {
        label: '계산 기록 저장',
        desc: '계산을 실행할 때마다 자동으로 기록이 쌓입니다. 화면 아래쪽 히스토리 패널을 열면 직전 계산 결과들을 다시 확인할 수 있습니다. 새로 고침해도 기록은 남아 있습니다.',
      },
    ],
  },
  {
    id: 'events',
    icon: CalendarDays,
    title: '이벤트 캘린더',
    color: '#9B7FD4',
    items: [
      {
        label: '캘린더에 표시되는 것',
        desc: '두 가지 정보가 날짜에 표시됩니다. 하나는 미국 주요 기업들의 실적 발표일 (어닝), 다른 하나는 CPI·고용·금리 결정 같은 주요 경제 지표 발표일 (지표) 입니다. 위쪽 "어닝" / "지표" 버튼으로 각각 켜고 끌 수 있습니다.',
      },
      {
        label: '실적 발표 (어닝) 필터',
        desc: '"어닝"을 켜면 애플, 엔비디아 같은 미국 주요 기업의 실적 발표 예정일이 캘린더에 표시됩니다. 기술 · 금융 · 소비재 등 업종별로 추려볼 수도 있습니다.',
      },
      {
        label: '경제 지표 필터',
        desc: '"지표"를 켜면 물가 (CPI, PPI), 고용 (비농업 고용, 실업률), 성장 (GDP), 금리 결정 (FOMC), 에너지 재고 (EIA) 등 시장에 영향을 주는 주요 발표일이 표시됩니다. 카테고리 버튼으로 관심 있는 항목만 골라볼 수 있습니다.',
      },
      {
        label: '날짜를 누르면',
        desc: '날짜 칸을 클릭하면 화면 아래에 그날의 상세 일정이 펼쳐집니다. 지표 발표의 경우 발표 이후라면 실제 수치가, 아직 발표 전이라면 시장 예상치가 함께 표시됩니다.',
      },
      {
        label: '데이터 출처',
        desc: '경제 지표 일정은 Finnhub 금융 데이터 서비스를 통해 가져옵니다. 실적 발표 일정도 외부 API와 연동되어 있어, 별도 업데이트 없이 항상 최신 정보를 반영합니다.',
      },
    ],
  },
  {
    id: 'shortcuts',
    icon: Keyboard,
    title: '단축키 · 기타',
    color: '#8A9A7A',
    items: [
      {
        label: '빠른 검색 (⌘K)',
        desc: '키보드에서 Command + K (Mac) 또는 Ctrl + K (Windows) 를 누르면 검색창이 화면 중앙에 뜹니다. 마우스 없이 키보드만으로 바로 용어를 검색할 수 있습니다.',
      },
      {
        label: '/ 키로 검색창 포커스',
        desc: '화면 어디서든 키보드의 / (슬래시) 키를 누르면 금융 사전 검색창으로 커서가 이동합니다.',
      },
      {
        label: 'Esc 키로 닫기',
        desc: '열려 있는 용어 창, 가이드, 검색 팔레트 등을 모두 Esc 키로 닫을 수 있습니다.',
      },
      {
        label: '다크 / 라이트 모드',
        desc: '헤더 오른쪽의 달 / 해 아이콘을 누르면 화면 색상 테마가 바뀝니다. 선택한 테마는 다음 방문 때도 유지됩니다.',
      },
      {
        label: '모바일에서 사용하기',
        desc: '모바일에서는 화면 오른쪽 위 메뉴 버튼 (☰) 을 누르면 카테고리 탐색, 최근 본 용어, 검색 등을 빠르게 접근할 수 있습니다.',
      },
    ],
  },
];

// ─────────────────────────────────────────────
// 갭 상하한가 계산기
// ─────────────────────────────────────────────
function GapCalc() {
  const [prevClose, setPrevClose] = useState('');
  const [market, setMarket] = useState<'kospi'|'kosdaq'>('kospi');
  const prev = Number(prevClose) || 0;
  const limitPct = 30;
  const upperLimit = Math.floor(prev * (1 + limitPct / 100));
  const lowerLimit = Math.ceil(prev * (1 - limitPct / 100));
  const gaps = [1, 2, 3, 5, 10, 15, 20].map(pct => ({
    pct,
    up: Math.round(prev * (1 + pct / 100)),
    down: Math.round(prev * (1 - pct / 100)),
  }));

  return (
    <div>
      <CalcHeader num="46" title="갭 상하한가 계산" desc="전일 종가 기준 상하한가 및 구간별 갭 가격을 계산합니다." color="#8A8A8A" />
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <NumInput label="전일 종가" value={prevClose} onChange={setPrevClose} unit="원" placeholder="50,000" />
        <div>
          <div className="text-[11px] mono uppercase tracking-[0.15em] mb-2" style={{ color: _T.textFaint }}>시장</div>
          <div className="flex border" style={{ borderColor: _BORDER }}>
            {(['kospi', 'kosdaq'] as const).map(m => (
              <button key={m} onClick={() => setMarket(m)} className="flex-1 py-2.5 text-xs font-medium transition-all border-r last:border-r-0" style={{ borderColor: _BORDER, background: market === m ? '#8A8A8A' : 'transparent', color: market === m ? '#fff' : _T.textMuted }}>
                {m === 'kospi' ? 'KOSPI' : 'KOSDAQ'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 border mb-6" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label={`상한가 (+${limitPct}%)`} value={fmt(upperLimit, 0)} unit="원" highlight color="#A63D33" /></div>
        <ResultBox label={`하한가 (−${limitPct}%)`} value={fmt(lowerLimit, 0)} unit="원" highlight color="#4F7E7C" />
      </div>
      {prev > 0 && (
        <div className="border" style={{ borderColor: _BORDER }}>
          <div className="grid grid-cols-3 px-3 py-2 border-b text-[11px] mono uppercase tracking-[0.1em]" style={{ borderColor: _BORDER, color: _T.textFaint, background: _T.bgCard }}>
            <span>갭 %</span><span className="text-center" style={{ color: '#A63D33' }}>상승가</span><span className="text-right" style={{ color: '#4F7E7C' }}>하락가</span>
          </div>
          {gaps.map(g => (
            <div key={g.pct} className="grid grid-cols-3 px-3 py-2 border-b last:border-b-0 text-sm" style={{ borderColor: _BORDER }}>
              <span className="mono" style={{ color: _T.textMuted }}>±{g.pct}%</span>
              <span className="mono text-center" style={{ color: '#A63D33' }}>{fmt(g.up, 0)}</span>
              <span className="mono text-right" style={{ color: '#4F7E7C' }}>{fmt(g.down, 0)}</span>
            </div>
          ))}
        </div>
      )}
      <CalcNote
        how={['전일 종가 입력 → 상하한가(±30%) 자동 계산', '구간별 갭(1~20%) 상승/하락 가격 테이블 제공']}
        example={['전일 종가 50,000원', '상한가 = 65,000원, 하한가 = 35,000원', '5% 상승 시 52,500원 / 5% 하락 시 47,500원']}
        tip={['한국 주식 상하한가: ±30% (2015년 6월 확대)', '선물은 상하한가 없음 (서킷브레이커 별도)', '갭업/갭다운 발생 시 전일 종가 기준으로 계산']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 반대매매 가격 계산기
// ─────────────────────────────────────────────
function MarginLiquidCalc() {
  const [buyPrice, setBuyPrice] = useState('');
  const [qty, setQty] = useState('');
  const [marginRate, setMarginRate] = useState('40');
  const [maintRate, setMaintRate] = useState('20');

  const bp = Number(buyPrice) || 0;
  const q = Number(qty) || 0;
  const mr = Number(marginRate) / 100;
  const maintR = Number(maintRate) / 100;

  const totalValue = bp * q;
  const initialMargin = totalValue * mr;
  const loan = totalValue - initialMargin;
  // 반대매매 가격: (loan) / (qty * (1 - maintR)) 이 아니라
  // 평가금액 × maintR = loan → 평가금액 = loan / maintR → 주당 = loan / (maintR * qty)
  const liquidPrice = q > 0 && maintR > 0 ? loan / (q * (1 - maintR)) : 0;
  const drawdown = bp > 0 ? ((liquidPrice - bp) / bp) * 100 : 0;

  const scenarios = [10, 20, 30, 40, 50].map(mr2 => ({
    mr2,
    liq: q > 0 ? loan / (q * (1 - mr2 / 100)) : 0,
  }));

  return (
    <div>
      <CalcHeader num="47" title="반대매매 가격" desc="신용·미수 거래 시 반대매매(강제청산) 발생 가격을 계산합니다." color="#8A8A8A" />
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <NumInput label="매수 단가" value={buyPrice} onChange={setBuyPrice} unit="원" placeholder="50,000" />
        <NumInput label="수량" value={qty} onChange={setQty} unit="주" placeholder="100" />
      </div>
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <NumInput label="개시 증거금률" value={marginRate} onChange={setMarginRate} unit="%" placeholder="40" />
        <NumInput label="유지 증거금률" value={maintRate} onChange={setMaintRate} unit="%" placeholder="20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border mb-6" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="총 매수금액" value={fmt(totalValue, 0)} unit="원" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="대출금 (융자)" value={fmt(loan, 0)} unit="원" /></div>
        <ResultBox label="반대매매 가격" value={fmt(liquidPrice, 0)} unit="원" highlight color="#A63D33" />
      </div>
      <div className="border mb-4" style={{ borderColor: _BORDER }}>
        <ResultBox label={`매수가 대비 하락폭 (${fmt(drawdown, 1)}%)`} value={fmt(liquidPrice - bp, 0)} unit="원" />
      </div>
      <CalcNote
        how={['매수단가 × 수량 = 총 매수금액', '대출금 = 총금액 × (1 - 개시증거금률)', '반대매매가 = 대출금 ÷ (수량 × (1 - 유지증거금률))']}
        example={['50,000원 × 100주 = 500만원, 증거금 40%', '대출금 = 300만원', '유지율 20% 시 반대매매가 = 300만 ÷ (100 × 0.8) = 37,500원']}
        tip={['증권사마다 유지증거금률 상이 (보통 20~140%)', '신용거래: 유지율 140% 이하 → 반대매매', '미수거래: D+2일까지 미결제 시 강제청산', '하한가 근접 시 반대매매 리스크 급증']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 선물 이론가 · 괴리율
// ─────────────────────────────────────────────
function FuturesFairCalc() {
  const [spotIndex, setSpotIndex] = useState('');
  const [futuresPrice, setFuturesPrice] = useState('');
  const [riskFreeRate, setRiskFreeRate] = useState('3.5');
  const [dividendYield, setDividendYield] = useState('1.5');
  const [daysToExp, setDaysToExp] = useState('');

  const S = Number(spotIndex) || 0;
  const F = Number(futuresPrice) || 0;
  const r = Number(riskFreeRate) / 100;
  const d = Number(dividendYield) / 100;
  const T = (Number(daysToExp) || 0) / 365;

  // Cost of Carry 모델: F* = S × e^((r-d)×T)
  const fairValue = S > 0 && T > 0 ? S * Math.exp((r - d) * T) : 0;
  const basis = F - S;
  const basisRate = S > 0 ? (basis / S) * 100 : 0;
  const mispricing = fairValue > 0 ? F - fairValue : 0;
  const mispricingPct = fairValue > 0 ? (mispricing / fairValue) * 100 : 0;

  // 차익거래 판단
  const arbitrage = Math.abs(mispricingPct) > 0.1
    ? mispricingPct > 0 ? '매도차익 가능 (선물 고평가)' : '매수차익 가능 (선물 저평가)'
    : '차익거래 기회 없음';

  return (
    <div>
      <CalcHeader num="48" title="선물 이론가 · 괴리율" desc="Cost of Carry 모델로 KOSPI200 선물 이론가와 괴리율을 계산합니다." color="#6B6B6B" />
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <NumInput label="현물지수 (KOSPI200)" value={spotIndex} onChange={setSpotIndex} unit="pt" placeholder="350.00" />
        <NumInput label="선물 현재가" value={futuresPrice} onChange={setFuturesPrice} unit="pt" placeholder="351.50" />
      </div>
      <div className="grid md:grid-cols-3 gap-5 mb-6">
        <NumInput label="무위험이자율" value={riskFreeRate} onChange={setRiskFreeRate} unit="%" placeholder="3.5" />
        <NumInput label="배당수익률" value={dividendYield} onChange={setDividendYield} unit="%" placeholder="1.5" />
        <NumInput label="만기까지 잔존일수" value={daysToExp} onChange={setDaysToExp} unit="일" placeholder="30" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border mb-4" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="선물 이론가 (F*)" value={fairValue > 0 ? fmt(fairValue, 2) : '—'} unit="pt" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="베이시스 (F−S)" value={S > 0 ? fmt(basis, 2) : '—'} unit={`pt (${fmt(basisRate, 2)}%)`} /></div>
        <ResultBox label="괴리율 (F−F*)" value={fairValue > 0 ? fmt(mispricingPct, 3) : '—'} unit="%" highlight color="#6B6B6B" />
      </div>
      <div className="border mb-6 px-4 py-3 text-sm" style={{ borderColor: Math.abs(mispricingPct) > 0.1 ? '#C89650' : _BORDER, color: Math.abs(mispricingPct) > 0.1 ? '#C89650' : _T.textMuted }}>
        {fairValue > 0 ? arbitrage : '현물지수·선물가·잔존일수를 모두 입력하세요'}
      </div>
      <CalcNote
        how={['이론가 F* = S × e^((r−d)×T)', 'r: 무위험이자율, d: 배당수익률, T: 잔존기간(연)', '괴리율 = (실제 선물가 − 이론가) / 이론가 × 100']}
        example={['S=350, r=3.5%, d=1.5%, T=30일(0.082년)', 'F* = 350 × e^(0.02×0.082) = 350.57pt', '실제 F=351.50 → 괴리율 = +0.26%']}
        tip={['KOSPI200 선물 1계약 = 지수 × 250,000원', '배당수익률: 분기 결산 전후 크게 변동', '괴리율 ±0.3~0.5% 초과 시 프로그램 차익거래 발동', '콘탱고(F>F*): 보유비용 시장, 백워데이션(F<F*): 희귀']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 옵션 스프레드 전략 손익
// ─────────────────────────────────────────────
function OptionSpreadCalc() {
  const [strategy, setStrategy] = useState<'straddle'|'strangle'|'bullcall'|'bearcall'>('straddle');
  const [spot, setSpot] = useState('');
  const [strike1, setStrike1] = useState('');
  const [strike2, setStrike2] = useState('');
  const [prem1, setPrem1] = useState('');
  const [prem2, setPrem2] = useState('');

  const S = Number(spot) || 0;
  const K1 = Number(strike1) || 0;
  const K2 = Number(strike2) || 0;
  const P1 = Number(prem1) || 0;
  const P2 = Number(prem2) || 0;
  const mult = 250000; // KOSPI200 옵션 승수

  let bep1 = 0, bep2 = 0, maxLoss = 0, maxProfit = 0, label1 = '', label2 = '';

  if (strategy === 'straddle') {
    // 매수 스트래들: 콜+풋 동일 행사가 매수
    const totalPrem = P1 + P2;
    bep1 = K1 - totalPrem;
    bep2 = K1 + totalPrem;
    maxLoss = -totalPrem * mult;
    maxProfit = Infinity;
    label1 = `하방 BEP (${fmt(bep1, 2)}pt)`;
    label2 = `상방 BEP (${fmt(bep2, 2)}pt)`;
  } else if (strategy === 'strangle') {
    // 매수 스트랭글: 풋(K1) + 콜(K2) 매수, K1 < K2
    const totalPrem = P1 + P2;
    bep1 = K1 - totalPrem;
    bep2 = K2 + totalPrem;
    maxLoss = -totalPrem * mult;
    maxProfit = Infinity;
    label1 = `하방 BEP (${fmt(bep1, 2)}pt)`;
    label2 = `상방 BEP (${fmt(bep2, 2)}pt)`;
  } else if (strategy === 'bullcall') {
    // 강세 콜 스프레드: K1 콜 매수, K2 콜 매도
    const netPrem = P1 - P2;
    bep1 = K1 + netPrem;
    maxLoss = -netPrem * mult;
    maxProfit = (K2 - K1 - netPrem) * mult;
    label1 = `BEP (${fmt(bep1, 2)}pt)`;
    label2 = '';
  } else if (strategy === 'bearcall') {
    // 약세 콜 스프레드: K1 콜 매도, K2 콜 매수
    const netPrem = P2 - P1;
    bep1 = K1 + netPrem;
    maxLoss = -(K2 - K1 - netPrem) * mult;
    maxProfit = netPrem * mult;
    label1 = `BEP (${fmt(bep1, 2)}pt)`;
    label2 = '';
  }

  const strategies = [
    { id: 'straddle', label: '스트래들' },
    { id: 'strangle', label: '스트랭글' },
    { id: 'bullcall', label: '강세 콜 스프레드' },
    { id: 'bearcall', label: '약세 콜 스프레드' },
  ] as const;

  const needsK2 = strategy !== 'straddle';
  const prem1Label = strategy === 'strangle' ? '풋 프리미엄 (K1)' : strategy === 'straddle' ? '콜 프리미엄' : 'K1 콜 프리미엄';
  const prem2Label = strategy === 'straddle' ? '풋 프리미엄' : strategy === 'strangle' ? '콜 프리미엄 (K2)' : 'K2 콜 프리미엄';

  return (
    <div>
      <CalcHeader num="49" title="옵션 스프레드 전략" desc="스트래들·스트랭글·콜 스프레드의 BEP와 최대손익을 계산합니다." color="#6B6B6B" />
      <div className="flex flex-wrap gap-1 mb-5">
        {strategies.map(s => (
          <button key={s.id} onClick={() => setStrategy(s.id)} className="px-3 py-2 text-xs font-medium border transition-all" style={{ borderColor: _BORDER, background: strategy === s.id ? '#6B6B6B' : 'transparent', color: strategy === s.id ? '#fff' : _T.textMuted }}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <NumInput label="행사가 K1" value={strike1} onChange={setStrike1} unit="pt" placeholder="350.00" />
        {needsK2 && <NumInput label="행사가 K2" value={strike2} onChange={setStrike2} unit="pt" placeholder="360.00" />}
      </div>
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <NumInput label={prem1Label} value={prem1} onChange={setPrem1} unit="pt" placeholder="3.50" />
        <NumInput label={prem2Label} value={prem2} onChange={setPrem2} unit="pt" placeholder="3.50" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border mb-4" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label={label1 || 'BEP'} value={bep1 > 0 ? fmt(bep1, 2) : '—'} unit="pt" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="최대 손실" value={isFinite(maxLoss) ? fmt(maxLoss, 0) : '—'} unit="원" highlight color="#A63D33" /></div>
        <ResultBox label="최대 이익" value={isFinite(maxProfit) ? fmt(maxProfit, 0) : '무제한'} unit={isFinite(maxProfit) ? '원' : ''} highlight color="#4A7045" />
      </div>
      {label2 && <div className="border border-t-0 mb-4" style={{ borderColor: _BORDER }}><ResultBox label={label2} value={bep2 > 0 ? fmt(bep2, 2) : '—'} unit="pt" /></div>}
      <CalcNote
        how={['전략 선택 → 행사가·프리미엄 입력', 'KOSPI200 옵션 승수 250,000원 적용', '스트래들: 동일 행사가 콜+풋 매수 (변동성 베팅)', '스트랭글: 다른 행사가 콜+풋 매수 (더 큰 변동성 필요)']}
        example={['스트래들: K=350, 콜 3.5pt + 풋 3.0pt = 총 6.5pt', '상방 BEP = 356.5, 하방 BEP = 343.5', '최대 손실 = 6.5 × 250,000 = 162.5만원']}
        tip={['만기 근처 변동성 급등 예상 시 스트래들 유효', '프리미엄이 클수록 BEP 폭 넓어짐 → 진입 타이밍 중요', '수직 스프레드: 방향성 있지만 리스크 제한 원할 때', 'KOSPI200 옵션은 유럽형 — 만기에만 행사 가능']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 승률 · 기대값 계산기
// ─────────────────────────────────────────────
function WinRateCalc() {
  const [winRate, setWinRate] = useState('');
  const [avgWin, setAvgWin] = useState('');
  const [avgLoss, setAvgLoss] = useState('');
  const [trades, setTrades] = useState('');

  const w = (Number(winRate) || 0) / 100;
  const W = Number(avgWin) || 0;
  const L = Number(avgLoss) || 0;
  const n = Number(trades) || 0;

  const expectedValue = w * W - (1 - w) * L;
  const profitFactor = L > 0 ? (w * W) / ((1 - w) * L) : 0;
  const bepWinRate = L > 0 && W > 0 ? (L / (W + L)) * 100 : 0;
  const totalExpected = n > 0 ? expectedValue * n : 0;

  // 손익비
  const rr = L > 0 ? W / L : 0;

  // 연속 손실 확률 (최대 10연패)
  const consecLoss = [3, 5, 7, 10].map(k => ({
    k,
    prob: Math.pow(1 - w, k) * 100,
  }));

  return (
    <div>
      <CalcHeader num="50" title="승률 · 기대값 계산기" desc="매매 승률과 손익비로 기대값·손익비·연속 손실 확률을 계산합니다." color="#4F7E7C" />
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <NumInput label="승률" value={winRate} onChange={setWinRate} unit="%" placeholder="45" />
        <NumInput label="평균 수익 (1회)" value={avgWin} onChange={setAvgWin} unit="원" placeholder="150,000" />
      </div>
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <NumInput label="평균 손실 (1회)" value={avgLoss} onChange={setAvgLoss} unit="원" placeholder="100,000" />
        <NumInput label="총 거래 횟수 (선택)" value={trades} onChange={setTrades} unit="회" placeholder="100" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border mb-4" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="1회 기대값" value={fmt(expectedValue, 0)} unit="원" highlight color={expectedValue >= 0 ? '#4F7E7C' : '#A63D33'} /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="손익비 (R:R)" value={fmt(rr, 2)} unit=":1" /></div>
        <ResultBox label="손익분기 최소 승률" value={fmt(bepWinRate, 1)} unit="%" />
      </div>
      {n > 0 && (
        <div className="border border-t-0 mb-4" style={{ borderColor: _BORDER }}>
          <ResultBox label={`${n}회 거래 후 기대 수익`} value={fmt(totalExpected, 0)} unit="원" highlight color={totalExpected >= 0 ? '#4F7E7C' : '#A63D33'} />
        </div>
      )}
      {w > 0 && (
        <div className="border mb-4" style={{ borderColor: _BORDER }}>
          <div className="px-3 py-2 border-b text-[11px] mono uppercase tracking-[0.1em]" style={{ borderColor: _BORDER, color: _T.textFaint, background: _T.bgCard }}>연속 손실 확률</div>
          <div className="grid grid-cols-4">
            {consecLoss.map(c => (
              <div key={c.k} className="p-3 border-r last:border-r-0 text-center" style={{ borderColor: _BORDER }}>
                <div className="text-[11px] mono" style={{ color: _T.textFaint }}>{c.k}연패</div>
                <div className="text-lg mono font-light mt-1" style={{ color: c.prob > 10 ? '#A63D33' : _T.textPrimary }}>{fmt(c.prob, 2)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <CalcNote
        how={['기대값 = 승률 × 평균수익 − (1−승률) × 평균손실', '손익비 = 평균수익 ÷ 평균손실', '손익분기 승률 = 손실 ÷ (수익 + 손실)']}
        example={['승률 45%, 수익 15만원, 손실 10만원', '기대값 = 0.45 × 15 − 0.55 × 10 = 6,750 − 5,500 = 1,250원', '손익비 = 1.5:1, 손익분기 승률 = 40%']}
        tip={['기대값 > 0이면 장기적으로 수익 구조', '승률 낮아도 손익비 크면 충분히 수익 가능', '예: 승률 30% + 손익비 3:1 → 기대값 양수', '연속 손실 대비 자금관리가 핵심 (켈리 공식 참고)']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 선물 증거금 유지율 체크
// ─────────────────────────────────────────────
function MarginCheckCalc() {
  const [positions, setPositions] = useState([
    { name: 'KOSPI200 선물', qty: '', entryPrice: '', currentPrice: '', marginPer: '1250000' },
  ]);

  const updatePos = (i: number, field: string, val: string) => {
    setPositions(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  };
  const addPos = () => setPositions(prev => [...prev, { name: '', qty: '', entryPrice: '', currentPrice: '', marginPer: '1250000' }]);
  const removePos = (i: number) => setPositions(prev => prev.filter((_, idx) => idx !== i));

  const computed = positions.map(p => {
    const qty = Number(p.qty) || 0;
    const entry = Number(p.entryPrice) || 0;
    const cur = Number(p.currentPrice) || 0;
    const marginPer = Number(p.marginPer) || 0;
    const mult = 250000;
    const pnl = (cur - entry) * qty * mult;
    const totalMargin = marginPer * Math.abs(qty);
    const maintMargin = totalMargin * 0.5; // 유지증거금 = 개시의 50%
    return { ...p, qty, entry, cur, pnl, totalMargin, maintMargin };
  });

  const totalPnl = computed.reduce((s, p) => s + p.pnl, 0);
  const totalMargin = computed.reduce((s, p) => s + p.totalMargin, 0);
  const totalMaint = computed.reduce((s, p) => s + p.maintMargin, 0);
  const maintRatio = totalMargin > 0 ? ((totalMargin + totalPnl) / totalMaint) * 100 : 0;
  const isMarginCall = maintRatio < 100 && totalMargin > 0;

  return (
    <div>
      <CalcHeader num="51" title="선물 증거금 유지율" desc="KOSPI200 선물 포지션의 증거금 유지율과 마진콜 여부를 확인합니다." color="#4F7E7C" />
      <div className="border mb-4" style={{ borderColor: _BORDER }}>
        <div className="grid grid-cols-5 px-3 py-2 border-b text-[11px] mono uppercase tracking-[0.1em]" style={{ borderColor: _BORDER, color: _T.textFaint, background: _T.bgCard }}>
          <span>종목</span><span>계약수</span><span>진입가</span><span>현재가</span><span>개시증거금/계약</span>
        </div>
        {computed.map((p, i) => (
          <div key={i} className="grid grid-cols-5 items-center px-3 py-2 border-b last:border-b-0 gap-1" style={{ borderColor: _BORDER }}>
            <input value={p.name} onChange={e => updatePos(i, 'name', e.target.value)} className="bg-transparent border-b text-sm outline-none" style={{ borderColor: _BORDER, color: _T.textPrimary }} placeholder="종목명" />
            <input value={p.qty} onChange={e => updatePos(i, 'qty', e.target.value)} className="bg-transparent border-b text-sm mono outline-none" style={{ borderColor: _BORDER, color: _T.textPrimary }} placeholder="1" />
            <input value={p.entryPrice} onChange={e => updatePos(i, 'entryPrice', e.target.value)} className="bg-transparent border-b text-sm mono outline-none" style={{ borderColor: _BORDER, color: _T.textPrimary }} placeholder="350.00" />
            <input value={p.currentPrice} onChange={e => updatePos(i, 'currentPrice', e.target.value)} className="bg-transparent border-b text-sm mono outline-none" style={{ borderColor: _BORDER, color: p.pnl >= 0 ? '#4A7045' : '#A63D33' }} placeholder="348.00" />
            <input value={p.marginPer} onChange={e => updatePos(i, 'marginPer', e.target.value)} className="bg-transparent border-b text-sm mono outline-none" style={{ borderColor: _BORDER, color: _T.textMuted }} placeholder="1,250,000" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-5">
        <button onClick={addPos} className="text-[12px] mono px-3 py-1.5 border" style={{ borderColor: _BORDER, color: _T.textFaint }}>+ 포지션 추가</button>
        {positions.length > 1 && <button onClick={() => removePos(positions.length - 1)} className="text-[12px] mono px-3 py-1.5 border" style={{ borderColor: _BORDER, color: _T.textFaint }}>− 삭제</button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border mb-4" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="총 평가손익" value={fmt(totalPnl, 0)} unit="원" highlight color={totalPnl >= 0 ? '#4A7045' : '#A63D33'} /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="증거금 유지율" value={totalMargin > 0 ? fmt(maintRatio, 1) : '—'} unit="%" /></div>
        <ResultBox label="마진콜 여부" value={totalMargin > 0 ? (isMarginCall ? '⚠ 마진콜' : '✓ 정상') : '—'} unit="" highlight color={isMarginCall ? '#A63D33' : '#4A7045'} />
      </div>
      <CalcNote
        how={['계약수 × (현재가 − 진입가) × 250,000 = 평가손익', '유지증거금 = 개시증거금 × 50%', '유지율 = (개시증거금 + 평가손익) ÷ 유지증거금 × 100']}
        example={['KOSPI200 선물 1계약, 진입 350.00, 현재 347.00', '손익 = (347−350) × 1 × 250,000 = −75만원', '개시 125만, 유지 62.5만 → 유지율 = 50만/62.5만 = 80% (마진콜)']}
        tip={['KOSPI200 선물 개시증거금: 계약당 약 125만원 (시장 변동 시 변경)', '유지율 100% 이하 시 마진콜 → 추가 납부 또는 포지션 청산', '미니 선물(MINI): 승수 50,000원, 증거금 약 25만원', '증거금은 KRX 고시 기준이며 증권사마다 상이할 수 있음']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 파생상품 양도소득세
// ─────────────────────────────────────────────
function DerivTaxCalc() {
  const [totalProfit, setTotalProfit] = useState('');
  const [totalLoss, setTotalLoss] = useState('');
  const [prevCarryover, setPrevCarryover] = useState('');

  const profit = Number(totalProfit) || 0;
  const loss = Number(totalLoss) || 0;
  const carryover = Number(prevCarryover) || 0;

  const netGain = profit - loss;
  const deduction = 2500000; // 250만원 기본공제
  const afterCarryover = netGain - carryover;
  const taxableGain = Math.max(0, afterCarryover - deduction);
  const taxRate = 20; // 파생상품 20%
  const localTaxRate = 2; // 지방소득세 10% of 20%
  const tax = taxableGain * (taxRate / 100);
  const localTax = taxableGain * (localTaxRate / 100);
  const totalTax = tax + localTax;
  const effectiveRate = netGain > 0 ? (totalTax / netGain) * 100 : 0;

  return (
    <div>
      <CalcHeader num="52" title="파생상품 양도소득세" desc="선물·옵션 연간 손익 합산 후 250만원 공제를 적용한 양도세를 계산합니다." color="#5B8DB8" />
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <NumInput label="연간 총 이익 합계" value={totalProfit} onChange={setTotalProfit} unit="원" placeholder="10,000,000" />
        <NumInput label="연간 총 손실 합계" value={totalLoss} onChange={setTotalLoss} unit="원" placeholder="3,000,000" />
      </div>
      <div className="mb-6">
        <NumInput label="전년도 이월결손금 (있는 경우)" value={prevCarryover} onChange={setPrevCarryover} unit="원" placeholder="0" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border mb-4" style={{ borderColor: _BORDER }}>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="순손익 (이익−손실)" value={fmt(netGain, 0)} unit="원" /></div>
        <div className="md:border-r border-b md:border-b-0" style={{ borderColor: _BORDER }}><ResultBox label="과세표준 (공제 후)" value={fmt(taxableGain, 0)} unit="원" /></div>
        <ResultBox label="납부세액 (국세+지방)" value={fmt(totalTax, 0)} unit="원" highlight color="#5B8DB8" />
      </div>
      {taxableGain > 0 && (
        <div className="border border-t-0 mb-4" style={{ borderColor: _BORDER }}>
          <ResultBox label={`실효세율 (순이익 대비)`} value={fmt(effectiveRate, 2)} unit="%" />
        </div>
      )}
      <CalcNote
        how={['순손익 = 총이익 − 총손실 (연간 합산)', '이월결손금 차감 후 250만원 기본공제', '과세표준 × 20% + 지방소득세 2% (합계 22%)']}
        example={['총이익 1,000만, 총손실 300만, 이월결손 0', '순손익 700만 − 250만(공제) = 과세표준 450만원', '세금 = 450만 × 22% = 99만원']}
        tip={['파생상품(선물·옵션): 세율 20% + 지방세 2% = 22%', '기본공제 250만원: 매년 리셋', '손실 이월: 5년간 이월공제 가능 (법정 요건 충족 시)', '해외선물도 동일 세율 적용, 환산 손익으로 계산', '5월 종합소득세 신고 시 함께 신고', '※ 정확한 납세액은 세무사 확인을 권장합니다.']}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Home View — 대시보드 탭
// ─────────────────────────────────────────────
function HomeView({ T, isDark, totalTerms, recent, favorites, categoryColors, setActiveTab, setSelectedTerm, setSelectedCalc, setSearchQuery, searchRef }: any) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Seoul' });
  const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', timeZone: 'Asia/Seoul' });
  const kstH = parseInt(now.toLocaleTimeString('ko-KR', { hour: '2-digit', hour12: false, timeZone: 'Asia/Seoul' }));
  const kstM = parseInt(now.toLocaleTimeString('ko-KR', { minute: '2-digit', timeZone: 'Asia/Seoul' }));
  const kstD = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' })).getDay();
  // isOpen: 하위 호환용 (EventsView 등에서 사용할 수 있음)
  const isOpen = kstD >= 1 && kstD <= 5 && (kstH > 9 || (kstH === 9 && kstM >= 0)) && (kstH < 15 || (kstH === 15 && kstM <= 30));

  const FAMILY_LIST = [
    { id: 'fundamental', name: '펀더멘털',    en: 'FUNDAMENTAL', color: HUE_FAMILIES.fundamental.base, cats: ['밸류에이션','수익성','기업재무','회계심화','배당','재무안정성'] },
    { id: 'market',      name: '시장',        en: 'MARKET',      color: HUE_FAMILIES.market.base,      cats: ['한국시장','해외시장·지수','ETF·상장상품','시장거래'] },
    { id: 'macro',       name: '경제',        en: 'ECON',        color: HUE_FAMILIES.macro.base,       cats: ['통화정책·금리','물가·인플레이션','성장·경기순환','고용·소비·생산','환율·대외수지','금융위기·신용','재정·국가경제','미시경제'] },
    { id: 'risk',        name: '리스크·퀀트', en: 'RISK',        color: HUE_FAMILIES.risk.base,        cats: ['포트폴리오','퀀트통계'] },
    { id: 'derivatives', name: '파생',        en: 'DERIV',       color: HUE_FAMILIES.derivatives.base, cats: ['선물옵션','파생헤지'] },
    { id: 'trading',     name: '매매실전',    en: 'TRADING',     color: HUE_FAMILIES.trading.base,     cats: ['기술적지표','차트패턴·가격행동','투자심리·행동편향'] },
  ];

  const QUICK_CALCS = [
    { id: 'per',    name: 'PER 계산기',    desc: '주가수익비율' },
    { id: 'pbr',    name: 'PBR 계산기',    desc: '주가순자산비율' },
    { id: 'roe',    name: 'ROE 계산기',    desc: '자기자본이익률' },
    { id: 'dcf',    name: 'DCF 계산기',    desc: '내재가치 산출' },
    { id: 'kelly',  name: '켈리 기준',     desc: '최적 베팅 비율' },
    { id: 'var',    name: 'VaR 계산기',    desc: '포트폴리오 위험' },
  ];

  return (
    <div>
      {/* ── 에디토리얼 히어로 ── */}
      <div className="border mb-8 relative overflow-hidden" style={{ borderColor: T.border, background: T.bgCard }}>
        {/* 그리드 배경 */}
        <div className="absolute inset-0 pointer-events-none" style={{
          opacity: 0.03,
          backgroundImage: `repeating-linear-gradient(0deg, ${T.textPrimary} 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, ${T.textPrimary} 0 1px, transparent 1px 40px)`
        }} />
        {/* ball joint 코너 */}
        {['top-0 left-0 -translate-x-1/2 -translate-y-1/2','top-0 right-0 translate-x-1/2 -translate-y-1/2','bottom-0 left-0 -translate-x-1/2 translate-y-1/2','bottom-0 right-0 translate-x-1/2 translate-y-1/2'].map((pos, i) => (
          <span key={i} className={`absolute w-3 h-3 rounded-full border-2 z-10 ${pos}`}
            style={{ borderColor: T.borderMid, background: T.bgPage }} />
        ))}
        <div className="relative px-6 md:px-10 py-8 md:py-10">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1 min-w-0">
              <div className="mono text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: T.textFaint }}>
                § stockwiki · kr
              </div>
              <h1 className="font-light leading-tight tracking-tight mb-4"
                style={{ fontSize: 'clamp(22px, 2.8vw, 36px)', color: T.textPrimary }}>
                사전 · 계산기 ·{' '}
                <span style={{ color: T.accent }}>한 벌의 책상.</span>
              </h1>
              <p className="text-sm leading-relaxed mb-6 max-w-sm" style={{ color: T.textMuted }}>
                재무지표 {totalTerms}개 용어, 52개 계산기, 어닝·거시 이벤트 캘린더를 한 곳에.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => { setActiveTab('glossary'); setTimeout(() => searchRef.current?.focus(), 100); }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm border transition-all hover:opacity-80"
                  style={{ borderColor: T.accent, background: T.accent, color: '#0a0a0a' }}>
                  <Search size={13} />
                  <span className="font-medium">용어 검색</span>
                  <span className="mono text-[11px] opacity-60 ml-1">⌘K</span>
                </button>
                <button onClick={() => setActiveTab('calculator')}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm border transition-all hover:opacity-80"
                  style={{ borderColor: T.border, color: T.textSecondary }}>
                  <Calculator size={13} />
                  <span>계산기</span>
                </button>
                <button onClick={() => setActiveTab('events')}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm border transition-all hover:opacity-80"
                  style={{ borderColor: T.border, color: T.textSecondary }}>
                  <CalendarDays size={13} />
                  <span>이벤트 캘린더</span>
                </button>
              </div>
            </div>
            {/* 시계 + 시장 상태 3개 */}
            <div className="shrink-0 hidden md:flex flex-col items-end gap-3">
              <div className="text-right">
                <div className="mono text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: T.textFaint }}>KST</div>
                <div className="mono font-medium" style={{ fontSize: 32, letterSpacing: '-0.02em', color: T.textPrimary }}>{timeStr}</div>
                <div className="mono text-[11px] mt-1" style={{ color: T.textDimmer }}>{dateStr}</div>
              </div>
              {/* 시장 상태 5개 세로 */}
              <div className="flex flex-col gap-1.5 items-end">
                {(() => {
                  // ── 한국 KOSPI: KST 평일 09:00–15:30
                  const krOpen = kstD >= 1 && kstD <= 5
                    && (kstH > 9 || (kstH === 9 && kstM >= 0))
                    && (kstH < 15 || (kstH === 15 && kstM <= 30));

                  // ── 한국 NXT (야간 주식): KST 평일 18:00–22:00
                  // 금요일(5) 18:00–22:00 포함, 토·일 제외
                  const nxtOpen = kstD >= 1 && kstD <= 5
                    && kstH >= 18 && kstH < 22;

                  // ── 한국 야간선물: KST 평일 18:00–익일 06:00
                  // 당일 18:00~23:59 (월~금) OR 익일 00:00~06:00 (화~토, 전날이 월~금)
                  const nightFutOpen = (() => {
                    if (kstD === 0) return false; // 일요일 제외 (토→일 새벽은 토 야간 연장이므로 허용 안 함)
                    // 당일 18:00~23:59: 월~금
                    if (kstD >= 1 && kstD <= 5 && kstH >= 18) return true;
                    // 익일 00:00~05:59: 화~토 (전날이 월~금)
                    if (kstD >= 2 && kstD <= 6 && kstH < 6) return true;
                    return false;
                  })();

                  // ── 미국 NYSE: America/New_York 평일 09:30–16:00 (서머타임 자동)
                  const etParts = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'America/New_York',
                    hour: 'numeric', minute: 'numeric', weekday: 'short', hour12: false,
                  }).formatToParts(now);
                  const etH = parseInt(etParts.find(p => p.type === 'hour')?.value ?? '0');
                  const etM = parseInt(etParts.find(p => p.type === 'minute')?.value ?? '0');
                  const etWd = etParts.find(p => p.type === 'weekday')?.value ?? '';
                  const etWeekday = ['Mon','Tue','Wed','Thu','Fri'].includes(etWd);
                  const usOpen = etWeekday && (etH > 9 || (etH === 9 && etM >= 30)) && etH < 16;

                  // ── 크립토: 24/7
                  const markets = [
                    { label: 'KOSPI',    sub: '한국 정규',    open: krOpen,       color: HUE_FAMILIES.fundamental.base,   night: false },
                    { label: 'NXT',      sub: '한국 야간주식', open: nxtOpen,      color: HUE_FAMILIES.fundamental.tones[2], night: true },
                    { label: '야간선물', sub: 'KRX 야간',     open: nightFutOpen, color: HUE_FAMILIES.derivatives.base,   night: true },
                    { label: 'NYSE',     sub: '미국',         open: usOpen,       color: HUE_FAMILIES.market.base,        night: false },
                    { label: 'Crypto',   sub: '24/7',         open: true,         color: HUE_FAMILIES.trading.base,       night: false },
                  ];
                  return markets.map(m => {
                    // 다크모드: 장중 → 초록 glow, 야간세션 장중 → 흰색 테두리
                    const dotColor  = m.open ? (isDark ? '#22c55e' : m.color) : T.textDimmer;
                    const dotGlow   = m.open ? (isDark ? '0 0 6px #22c55e, 0 0 14px #22c55e80' : `0 0 5px ${m.color}`) : 'none';
                    const boxBorder = m.open
                      ? (isDark && m.night ? 'rgba(255,255,255,0.55)' : `${m.color}60`)
                      : T.border;
                    const textColor = m.open ? m.color : T.textDimmer;
                    return (
                    <div key={m.label} className="flex items-center gap-2 border px-3 py-1"
                      style={{ borderColor: boxBorder }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: dotColor, boxShadow: dotGlow }} />
                      <span className="mono text-[10px] tracking-[0.08em] w-16 shrink-0"
                        style={{ color: textColor }}>{m.label}</span>
                      <span className="mono text-[9px] opacity-50 w-14 shrink-0 hidden lg:block"
                        style={{ color: textColor }}>{m.sub}</span>
                      <span className="mono text-[10px] uppercase tracking-[0.15em]"
                        style={{ color: textColor }}>
                        {m.open ? '장중' : '장외'}
                      </span>
                    </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* stats rail */}
        <div className="grid border-t" style={{ gridTemplateColumns: 'repeat(4,1fr)', borderColor: T.border }}>
          {[
            { k: 'Terms',   v: String(totalTerms).padStart(3,'0'), u: '개 용어',    color: HUE_FAMILIES.fundamental.base },
            { k: 'Calcs',   v: '052',                              u: '개 계산기',  color: HUE_FAMILIES.market.base },
            { k: 'Families',v: '006',                              u: 'hue family', color: HUE_FAMILIES.macro.base },
            { k: 'Fav',     v: String(favorites?.size ?? 0).padStart(3,'0'), u: '즐겨찾기', color: T.accent },
          ].map((s, i, arr) => (
            <div key={s.k} className="flex flex-col gap-1 px-4 md:px-6 py-3 border-r"
              style={{ borderColor: i < arr.length - 1 ? T.border : 'transparent' }}>
              <span className="mono text-[10px] tracking-[0.28em] uppercase" style={{ color: T.textFaint }}>{s.k}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="mono font-medium" style={{ fontSize: 22, color: s.color, letterSpacing: '-0.02em' }}>{s.v}</span>
                <span className="mono text-[10px]" style={{ color: T.textDimmer }}>{s.u}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 대시보드 2단 그리드 ── */}
      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        {/* 왼쪽: 카테고리 패밀리 맵 + 최근 본 용어 */}
        <div className="flex flex-col gap-6">

          {/* 6 hue family 맵 */}
          <div className="border" style={{ borderColor: T.border }}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: T.border }}>
              <span className="mono text-[11px] uppercase tracking-[0.25em]" style={{ color: T.textFaint }}>§ 카테고리 · 6 Groups</span>
              <button onClick={() => setActiveTab('glossary')} className="mono text-[11px] uppercase tracking-[0.15em] flex items-center gap-1" style={{ color: T.textDimmer }}>
                전체 사전 <ArrowUpRight size={11} />
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: T.border }}>
              {FAMILY_LIST.map(fam => (
                <div key={fam.id} className="flex items-center gap-0 group"
                  style={{ borderColor: T.border }}>
                  <div className="w-1 self-stretch shrink-0" style={{ background: fam.color }} />
                  <div className="px-4 py-3 flex-1 flex items-center gap-4 min-w-0">
                    <div className="flex flex-col gap-0.5 w-20 shrink-0">
                      <span className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: fam.color }}>
                        {fam.en}
                      </span>
                      <span className="text-sm font-medium whitespace-nowrap" style={{ color: T.textPrimary }}>{fam.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 min-w-0">
                      {fam.cats.map(cat => (
                        <button key={cat}
                          onClick={() => setActiveTab('glossary')}
                          className="mono text-[10px] px-2 py-0.5 border transition-all hover:opacity-80"
                          style={{ borderColor: `${fam.color}50`, color: T.textMuted, background: `${fam.color}10` }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 최근 본 용어 */}
          {recent?.length > 0 && (
            <div className="border" style={{ borderColor: T.border }}>
              <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: T.border }}>
                <Clock size={12} style={{ color: T.textFaint }} />
                <span className="mono text-[11px] uppercase tracking-[0.25em]" style={{ color: T.textFaint }}>최근 본 용어</span>
              </div>
              <div className="flex flex-col divide-y" style={{ borderColor: T.border }}>
                {recent.slice(0, 5).map(t => {
                  const color = categoryColors?.[t.category];
                  return (
                    <button key={t.id}
                      onClick={() => { setActiveTab('glossary'); setTimeout(() => setSelectedTerm(t), 50); }}
                      className="flex items-center gap-3 px-5 py-3 text-left hover:opacity-80 transition-opacity">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color?.bg }} />
                      <span className="font-medium text-sm" style={{ color: T.textPrimary }}>{t.name}</span>
                      <span className="text-xs" style={{ color: T.textFaint }}>{t.fullName}</span>
                      <span className="ml-auto mono text-[10px] px-1.5 py-0.5" style={{ background: `${color?.bg}20`, color: color?.bg }}>{t.category}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 빠른 계산기 */}
        <div className="border self-start" style={{ borderColor: T.border }}>
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: T.border }}>
            <span className="mono text-[11px] uppercase tracking-[0.25em]" style={{ color: T.textFaint }}>§ 빠른 계산기</span>
            <button onClick={() => setActiveTab('calculator')} className="mono text-[11px] uppercase tracking-[0.15em] flex items-center gap-1" style={{ color: T.textDimmer }}>
              전체 <ArrowUpRight size={11} />
            </button>
          </div>
          <div className="flex flex-col divide-y" style={{ borderColor: T.border }}>
            {QUICK_CALCS.map((c, i) => (
              <button key={c.id}
                onClick={() => { setSelectedCalc(c.id); setActiveTab('calculator'); }}
                className="flex items-center gap-3 px-5 py-3.5 text-left transition-all hover:opacity-80">
                <span className="mono text-[10px] w-5 shrink-0" style={{ color: T.textDimmer }}>
                  {String(i + 1).padStart(2,'0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: T.textPrimary }}>{c.name}</div>
                  <div className="mono text-[10px]" style={{ color: T.textFaint }}>{c.desc}</div>
                </div>
                <ChevronRight size={13} style={{ color: T.textDimmer }} />
              </button>
            ))}
          </div>
          {/* 이벤트 캘린더 쇼트컷 */}
          <button onClick={() => setActiveTab('events')}
            className="w-full flex items-center justify-between px-5 py-4 border-t transition-all hover:opacity-80"
            style={{ borderColor: T.border, background: T.bgSurface }}>
            <div className="flex items-center gap-3">
              <CalendarDays size={14} style={{ color: HUE_FAMILIES.macro.base }} />
              <div>
                <div className="text-sm font-medium" style={{ color: T.textPrimary }}>이벤트 캘린더</div>
                <div className="mono text-[10px]" style={{ color: T.textFaint }}>FOMC · CPI · 어닝시즌</div>
              </div>
            </div>
            <ArrowUpRight size={13} style={{ color: T.textDimmer }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Market Pulse Rail — editorial hero + info rail
// ─────────────────────────────────────────────
function MarketPulseRail({ T, totalTerms }: { T: any; totalTerms: number }) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Seoul' });
  const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', timeZone: 'Asia/Seoul' });

  // 거래 시간 판별 (KST 09:00-15:30 평일)
  const kstHour = parseInt(now.toLocaleTimeString('ko-KR', { hour: '2-digit', hour12: false, timeZone: 'Asia/Seoul' }));
  const kstMin  = parseInt(now.toLocaleTimeString('ko-KR', { minute: '2-digit', timeZone: 'Asia/Seoul' }));
  const kstDay  = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' })).getDay();
  const isMarketOpen = kstDay >= 1 && kstDay <= 5 && (kstHour > 9 || (kstHour === 9 && kstMin >= 0)) && (kstHour < 15 || (kstHour === 15 && kstMin <= 30));

  const stats = [
    { k: 'Terms',  v: String(totalTerms).padStart(3, '0'), u: '개 용어' },
    { k: 'Calcs',  v: '052',                               u: '개 계산기' },
    { k: 'Events', v: '008',                               u: '이번달 이벤트' },
  ];

  return null;
}

function GuideDrawer({ onClose, T, isDark }: { onClose: () => void; T: any; isDark: boolean }) {
  const [activeSection, setActiveSection] = useState('about');
  const drawerRef = useRef<HTMLDivElement>(null);
  const mobileSheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    drawerRef.current?.focus();
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const section = GUIDE_SECTIONS.find(s => s.id === activeSection) ?? GUIDE_SECTIONS[0];

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      {/* ── 데스크탑: 우측 드로어 ── */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        className="hidden md:flex ml-auto h-full flex-col outline-none"
        style={{
          width: '560px',
          background: T.bgSurface,
          borderLeft: `1px solid ${T.border}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-7 py-5 border-b shrink-0" style={{ borderColor: T.border }}>
          <div>
            <div className="text-[11px] mono uppercase tracking-[0.3em] mb-1.5" style={{ color: T.textFaint }}>§ HOW TO USE</div>
            <div className="text-xl font-light tracking-tight" style={{ color: T.textPrimary }}>
              사이트 사용 가이드
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 border transition-all hover:opacity-70"
            style={{ borderColor: T.border, color: T.textFaint }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 섹션 탭 */}
        <div className="flex border-b shrink-0 overflow-x-auto scroll-hide" style={{ borderColor: T.border }}>
          {GUIDE_SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="flex items-center gap-2 px-5 py-3.5 text-[12px] whitespace-nowrap transition-all border-b-2"
              style={{
                borderBottomColor: activeSection === s.id ? s.color : 'transparent',
                color: activeSection === s.id ? s.color : T.textMuted,
                background: 'transparent',
              }}
            >
              {React.createElement(s.icon, { size: 14 })}
              <span className="font-medium">{s.title}</span>
            </button>
          ))}
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto px-7 py-6 scroll-hide">
          {/* 섹션 타이틀 */}
          <div className="flex items-center gap-2.5 mb-6">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: section.color }}></span>
            <span className="text-[15px] font-medium" style={{ color: section.color }}>{section.title}</span>
          </div>

          <div className="flex flex-col gap-0">
            {section.items.map((item, i) => (
              <div
                key={i}
                className="py-5"
                style={{ borderBottom: i < section.items.length - 1 ? `1px solid ${T.borderSoft}` : 'none' }}
              >
                <div className="mb-2.5">
                  <span
                    className="text-[11px] mono px-2.5 py-1 inline-block"
                    style={{
                      background: section.color + '18',
                      color: section.color,
                      border: `1px solid ${section.color}40`,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
                <p className="text-[14px] leading-[1.8] pl-0.5" style={{ color: T.textMuted }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* 하단 노트 */}
          <div className="mt-8 p-5 border" style={{ borderColor: T.border, background: T.bgCard }}>
            <div className="text-[11px] mono uppercase tracking-[0.25em] mb-3" style={{ color: T.textFaint }}>DISCLAIMER</div>
            <p className="text-[13px] leading-[1.8]" style={{ color: T.textMuted }}>
              이 사이트의 모든 정보는 학습과 이해를 돕기 위한 것으로, 특정 종목이나 상품에 대한 투자 권유가 아닙니다. 투자 결정과 그에 따른 결과의 책임은 전적으로 이용자 본인에게 있습니다.
            </p>
          </div>
          <div className="h-6"></div>
        </div>

        {/* 하단 바 */}
        <div className="shrink-0 px-7 py-4 border-t flex items-center justify-between" style={{ borderColor: T.border }}>
          <span className="text-[13px] mono" style={{ color: T.textMuted }}>
            Stock<span style={{ color: T.accent }}>WiKi</span><span style={{ color: T.textFaint }}>.kr</span>
          </span>
          <span className="text-[11px] mono uppercase tracking-wider" style={{ color: T.textDimmer }}>
            ESC to close
          </span>
        </div>
      </div>

      {/* ── 모바일: 하단 모달 ── */}
      <div
        ref={mobileSheetRef}
        className="md:hidden absolute inset-x-0 bottom-0 flex flex-col outline-none"
        style={{
          maxHeight: '90vh',
          background: T.bgSurface,
          borderTop: `1px solid ${T.border}`,
          borderRadius: '16px 16px 0 0',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 핸들 — 이 영역에서만 드래그로 닫기 */}
        <div
          className="flex justify-center pt-3 pb-3 shrink-0 cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
          onTouchStart={e => {
            const sheet = mobileSheetRef.current;
            if (!sheet) return;
            (sheet as any)._dragStartY = e.touches[0].clientY;
          }}
          onTouchMove={e => {
            const sheet = mobileSheetRef.current;
            if (!sheet || (sheet as any)._dragStartY == null) return;
            const dy = e.touches[0].clientY - (sheet as any)._dragStartY;
            if (dy > 0) {
              sheet.style.transform = `translateY(${Math.min(dy, 300)}px)`;
              sheet.style.transition = 'none';
            }
          }}
          onTouchEnd={e => {
            const sheet = mobileSheetRef.current;
            if (!sheet) return;
            const dy = e.changedTouches[0].clientY - ((sheet as any)._dragStartY ?? 0);
            (sheet as any)._dragStartY = null;
            if (dy > 100) {
              sheet.style.transform = 'translateY(100%)';
              sheet.style.transition = 'transform 0.25s ease';
              setTimeout(() => onClose(), 220);
            } else {
              sheet.style.transform = '';
              sheet.style.transition = 'transform 0.2s ease';
            }
          }}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: T.borderMid }}></div>
        </div>

        {/* 모바일 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: T.border }}>
          <div>
            <div className="text-[10px] mono uppercase tracking-[0.3em] mb-0.5" style={{ color: T.textFaint }}>HOW TO USE</div>
            <div className="text-base font-light tracking-tight" style={{ color: T.textPrimary }}>사용 가이드</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center" style={{ color: T.textFaint }}>
            <X size={18} />
          </button>
        </div>

        {/* 섹션 탭 */}
        <div className="flex border-b shrink-0 overflow-x-auto scroll-hide" style={{ borderColor: T.border }}>
          {GUIDE_SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="flex items-center gap-1.5 px-4 py-3 text-[12px] whitespace-nowrap transition-all border-b-2"
              style={{
                borderBottomColor: activeSection === s.id ? s.color : 'transparent',
                color: activeSection === s.id ? s.color : T.textMuted,
                background: 'transparent',
              }}
            >
              {React.createElement(s.icon, { size: 13 })}
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* 모바일 내용 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scroll-hide">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: section.color }}></span>
            <span className="text-[13px] font-medium" style={{ color: section.color }}>{section.title}</span>
          </div>
          <div className="flex flex-col gap-0">
            {section.items.map((item, i) => (
              <div
                key={i}
                className="py-4"
                style={{ borderBottom: i < section.items.length - 1 ? `1px solid ${T.borderSoft}` : 'none' }}
              >
                <div className="mb-2">
                  <span
                    className="text-[11px] mono px-2 py-0.5 inline-block"
                    style={{ background: section.color + '18', color: section.color, border: `1px solid ${section.color}40` }}
                  >
                    {item.label}
                  </span>
                </div>
                <p className="text-[13px] leading-[1.8]" style={{ color: T.textMuted }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 border" style={{ borderColor: T.border, background: T.bgCard }}>
            <div className="text-[10px] mono uppercase tracking-[0.2em] mb-2" style={{ color: T.textFaint }}>DISCLAIMER</div>
            <p className="text-[13px] leading-[1.8]" style={{ color: T.textMuted }}>
              이 사이트의 모든 정보는 학습과 이해를 돕기 위한 것으로, 투자 권유가 아닙니다. 투자 결정과 그에 따른 책임은 이용자 본인에게 있습니다.
            </p>
          </div>
          <div className="h-8"></div>
        </div>
      </div>
    </div>
  );
}
