'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Calculator, BookOpen, ChevronRight, X, ArrowUpRight, Star, Clock, Menu, Link as LinkIcon, Copy, Check, Share2 } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TERMS, CATEGORIES, CATEGORY_COLORS } from '@/data/terms';
import { CALC_CATEGORIES } from '@/data/calcs';

type Features = {
  glossary: boolean;
  calculator: boolean;
  commandK: boolean;
};

export default function StockWiki({ features }: { features?: Features }) {
  const feat = features ?? { glossary: true, calculator: true, commandK: true };
  const searchParams = useSearchParams();
  const router = useRouter();

  // 접근 가능한 탭 결정 — 활성화된 탭 중 첫 번째를 기본값으로
  const initialTabFromUrl = searchParams?.get('tab') === 'calculator' ? 'calculator' : 'glossary';
  const isRequestedTabAvailable = feat[initialTabFromUrl as 'glossary' | 'calculator'];
  const fallbackTab = feat.glossary ? 'glossary' : feat.calculator ? 'calculator' : 'none';
  const initialTab = isRequestedTabAvailable ? initialTabFromUrl : fallbackTab;
  const initialCalc = searchParams?.get('calc') || 'per';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedCalc, setSelectedCalc] = useState(initialCalc);
  const [selectedTerm, setSelectedTerm] = useState<any>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recent, setRecent] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCommandK, setShowCommandK] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // 키보드 단축키
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (feat.commandK) setShowCommandK(true);
      }
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSelectedTerm(null);
        setShowCommandK(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [feat.commandK]);

  const toggleFav = (id) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openTerm = (term) => {
    setSelectedTerm(term);
    setRecent(prev => {
      const filtered = prev.filter(t => t.id !== term.id);
      return [term, ...filtered].slice(0, 5);
    });
  };

  const filteredTerms = useMemo(() => {
    return TERMS.filter(t => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        t.name.toLowerCase().includes(q) ||
        t.fullName.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.en.toLowerCase().includes(q);
      const matchCat = selectedCategory === '전체' ||
        (selectedCategory === '★ 즐겨찾기' && favorites.has(t.id)) ||
        t.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [searchQuery, selectedCategory, favorites]);

  const categoriesWithFav = favorites.size > 0
    ? ['전체', '★ 즐겨찾기', ...CATEGORIES.slice(1)]
    : CATEGORIES;

  return (
    <div className="min-h-screen" style={{ background: '#1a1a1a', color: '#d4d0c4', fontFamily: "'Inter', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { -webkit-font-smoothing: antialiased; }
        .mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        input, button, select { font-family: inherit; color: inherit; }
        input:focus { outline: none; }
        input::placeholder { color: #5a5a5a; }
        .ball-joint { width: 8px; height: 8px; border-radius: 50%; background: #8a8a8a; display: inline-block; box-shadow: inset 0 1px 0 rgba(255,255,255,0.15); }
        .scroll-hide::-webkit-scrollbar { display: none; }
        .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 헤더 */}
      <header className="border-b sticky top-0 z-30" style={{ borderColor: '#2a2a2a', background: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="flex items-baseline gap-2 md:gap-3 leading-none min-w-0">
              <span className="text-xl md:text-2xl font-light tracking-tight whitespace-nowrap" style={{ color: '#e8e4d6' }}>
                Stock<span style={{ color: '#C89650', fontWeight: 500 }}>WiKi</span>
              </span>
              <span className="text-xs mono" style={{ color: '#7a7a7a' }}>.kr</span>
              <span className="hidden lg:inline-block w-px h-4" style={{ background: '#2a2a2a' }}></span>
              <span className="hidden lg:inline-block text-[10px] tracking-[0.3em] mono uppercase" style={{ color: '#7a7a7a' }}>Terms & Calculators</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {feat.commandK && (
              <button
                onClick={() => setShowCommandK(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 border text-xs"
                style={{ borderColor: '#2a2a2a', color: '#7a7a7a' }}
              >
                <Search size={12} />
                <span>빠른 검색</span>
                <span className="mono text-[10px] px-1.5 py-0.5 border" style={{ borderColor: '#2a2a2a' }}>⌘K</span>
              </button>
            )}
            <div className="hidden lg:flex items-center gap-4 text-[11px] mono uppercase tracking-wider" style={{ color: '#7a7a7a' }}>
              <span>{new Date().toLocaleDateString('ko-KR')}</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex border-t overflow-x-auto scroll-hide" style={{ borderColor: '#2a2a2a' }}>
          {[
            { id: 'glossary', label: '금융 사전', icon: BookOpen, idx: '01', count: TERMS.length },
            { id: 'calculator', label: '계산기', icon: Calculator, idx: '02', count: CALC_CATEGORIES.reduce((s, c) => s + c.calcs.length, 0) },
          ].filter(tab => feat[tab.id as 'glossary' | 'calculator']).map(tab => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 text-sm transition-all whitespace-nowrap"
                style={{
                  background: active ? '#e8e4d6' : 'transparent',
                  color: active ? '#1a1a1a' : '#a8a49a',
                }}
              >
                <span className="text-[10px] mono opacity-60">{tab.idx}</span>
                <Icon size={14} />
                <span className="font-medium">{tab.label}</span>
                <span className="text-[10px] mono opacity-50">{tab.count}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 pt-5 md:pt-6 pb-12 min-h-[calc(100vh-180px)]">
        {activeTab === 'none' && (
          <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
            <div className="text-center max-w-md px-6">
              <div className="text-[10px] mono uppercase tracking-[0.3em] mb-3" style={{ color: '#7a7a7a' }}>
                § Temporarily Disabled
              </div>
              <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-4" style={{ color: '#e8e4d6' }}>
                일시 비활성화<span style={{ color: '#C89650' }}>.</span>
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#a8a49a' }}>
                모든 기능이 일시적으로 비활성화되었습니다.<br />
                관리자가 설정을 업데이트하면 자동으로 사용 가능해집니다.
              </p>
              <div className="inline-flex items-center gap-2 text-[10px] mono uppercase tracking-[0.25em] px-3 py-1.5 border" style={{ borderColor: '#2a2a2a', color: '#7a7a7a' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#C89650' }} />
                <span>Service Standby</span>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'glossary' && feat.glossary && (
          <GlossaryView
            terms={filteredTerms}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchRef={searchRef}
            categories={categoriesWithFav}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedTerm={selectedTerm}
            setSelectedTerm={openTerm}
            closeTerm={() => setSelectedTerm(null)}
            totalCount={TERMS.length}
            categoryColors={CATEGORY_COLORS}
            favorites={favorites}
            toggleFav={toggleFav}
            recent={recent}
          />
        )}
        {activeTab === 'calculator' && feat.calculator && (
          <CalculatorView
            selectedCalc={selectedCalc}
            setSelectedCalc={setSelectedCalc}
          />
        )}
      </main>

      {showCommandK && feat.commandK && (
        <CommandK
          terms={TERMS}
          onClose={() => setShowCommandK(false)}
          onSelect={(term) => {
            openTerm(term);
            setActiveTab('glossary');
            setShowCommandK(false);
          }}
        />
      )}

      <footer className="border-t" style={{ borderColor: '#2a2a2a', background: '#141414' }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row md:justify-between md:items-center gap-3 text-[11px] mono uppercase tracking-wider" style={{ color: '#6a6a6a' }}>
          <div className="flex items-center gap-4 flex-wrap">
            <span style={{ color: '#a8a49a' }}>
              Stock<span style={{ color: '#C89650' }}>WiKi</span>.kr
            </span>
            <span className="w-px h-3 hidden md:inline-block" style={{ background: '#2a2a2a' }}></span>
            <span>© {new Date().getFullYear()} · 정보 제공 목적 · 투자 권유 아님</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Designed by Ones</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────
// CommandK 팔레트
// ─────────────────────────────────────────────
function CommandK({ terms, onClose, onSelect }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (!q) return terms.slice(0, 8);
    const lower = q.toLowerCase();
    return terms.filter(t =>
      t.name.toLowerCase().includes(lower) ||
      t.fullName.toLowerCase().includes(lower) ||
      t.en.toLowerCase().includes(lower)
    ).slice(0, 10);
  }, [q, terms]);

  useEffect(() => setIdx(0), [q]);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[idx]) onSelect(results[idx]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-2xl border" style={{ background: '#141414', borderColor: '#2a2a2a' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: '#2a2a2a' }}>
          <Search size={16} style={{ color: '#7a7a7a' }} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={handleKey}
            placeholder="용어 빠른 검색..."
            className="flex-1 bg-transparent text-base"
            style={{ color: '#e8e4d6' }}
          />
          <span className="text-[10px] mono px-2 py-1 border" style={{ borderColor: '#2a2a2a', color: '#7a7a7a' }}>ESC</span>
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
                style={{ background: i === idx ? '#1f1f1f' : 'transparent' }}
              >
                <span className="text-[10px] mono px-2 py-1" style={{ background: color?.bg, color: color?.text }}>{t.category}</span>
                <span className="font-medium" style={{ color: '#e8e4d6' }}>{t.name}</span>
                <span className="text-sm" style={{ color: '#7a7a7a' }}>{t.fullName}</span>
                <span className="ml-auto text-xs mono italic" style={{ color: '#5a5a5a' }}>{t.en}</span>
              </button>
            );
          })}
          {results.length === 0 && (
            <div className="px-5 py-8 text-center text-sm" style={{ color: '#5a5a5a' }}>결과 없음</div>
          )}
        </div>
        <div className="flex items-center gap-4 px-5 py-3 border-t text-[10px] mono uppercase" style={{ borderColor: '#2a2a2a', color: '#7a7a7a' }}>
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
function GlossaryView({ terms, searchQuery, setSearchQuery, searchRef, categories, selectedCategory, setSelectedCategory, selectedTerm, setSelectedTerm, closeTerm, totalCount, categoryColors, favorites, toggleFav, recent }) {
  const border = '#2a2a2a';
  const borderSoft = '#252525';

  return (
    <div>
      <div className="mb-6 border-y" style={{ borderColor: border }}>
        <div className="flex items-center justify-end gap-3 py-2 border-b mono text-[10px] uppercase tracking-[0.2em] whitespace-nowrap" style={{ borderColor: border, color: '#7a7a7a' }}>
          <span>§ Glossary</span>
          <span className="w-4 h-px" style={{ background: '#3a3a3a' }}></span>
          <span>Index / 001</span>
        </div>
        <div className="grid grid-cols-4 gap-2 md:gap-6 py-2 mono text-[10px] uppercase tracking-[0.2em]">
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: '#5a5a5a' }}>Total</span><span style={{ color: '#e8e4d6' }}>{String(totalCount).padStart(3, '0')}</span></div>
          <div className="flex items-baseline gap-1 md:gap-2 min-w-0"><span style={{ color: '#5a5a5a' }}>Filter</span><span className="truncate" style={{ color: '#e8e4d6' }}>{selectedCategory === '전체' ? 'ALL' : selectedCategory.replace('★ ', '')}</span></div>
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: '#5a5a5a' }}>Shown</span><span style={{ color: '#e8e4d6' }}>{String(terms.length).padStart(3, '0')}</span></div>
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: '#5a5a5a' }}>Fav</span><span style={{ color: '#C89650' }}>{String(favorites.size).padStart(3, '0')}</span></div>
        </div>
      </div>

      {/* 최근 본 용어 */}
      {recent.length > 0 && !searchQuery && selectedCategory === '전체' && (
        <div className="mb-6 border" style={{ borderColor: border, background: '#141414' }}>
          <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: border }}>
            <Clock size={12} style={{ color: '#7a7a7a' }} />
            <span className="text-[10px] mono uppercase tracking-[0.2em]" style={{ color: '#7a7a7a' }}>최근 본 용어</span>
          </div>
          <div className="flex flex-wrap p-2 gap-1">
            {recent.map(t => {
              const color = categoryColors[t.category];
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTerm(t)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs border transition-all hover:bg-white/5"
                  style={{ borderColor: border, color: '#d4d0c4' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: color?.bg }}></span>
                  <span className="font-medium">{t.name}</span>
                  <span style={{ color: '#7a7a7a' }}>{t.fullName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 검색 */}
      <div className="mb-4 md:mb-6 flex border" style={{ borderColor: border }}>
        <div className="px-4 md:px-5 py-3 md:py-4 border-r flex items-center gap-2" style={{ borderColor: border, background: '#e8e4d6', color: '#1a1a1a' }}>
          <Search size={16} />
          <span className="hidden md:inline text-xs mono uppercase tracking-wider">Search</span>
        </div>
        <input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="용어명, 영문, 설명으로 검색 (단축키: /)"
          className="flex-1 px-4 md:px-5 py-3 md:py-4 bg-transparent text-sm md:text-base"
          style={{ color: '#e8e4d6' }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="px-4 md:px-5 border-l" style={{ borderColor: border, color: '#a8a49a' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* 카테고리 */}
      <div className="mb-8 md:mb-10 border-y" style={{ borderColor: border }}>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8" style={{ gridAutoRows: '1fr' }}>
          {categories.map((cat, idx) => {
            const active = selectedCategory === cat;
            const isFav = cat === '★ 즐겨찾기';
            const color = categoryColors[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-2 md:px-3 py-2.5 md:py-3 text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 md:gap-2 border-r border-b"
                style={{
                  borderColor: border,
                  background: active ? (isFav ? '#C89650' : (color?.bg || '#e8e4d6')) : 'transparent',
                  color: active ? (isFav ? '#0a0a0a' : (color?.text || '#1a1a1a')) : '#a8a49a',
                }}
                title={cat}
              >
                {!isFav && cat !== '전체' && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: active ? (color?.text || '#1a1a1a') : (color?.bg || '#8a8a8a') }}></span>
                )}
                <span className="truncate">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 용어 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l" style={{ borderColor: borderSoft }}>
        {terms.map((term) => {
          const color = categoryColors[term.category];
          const isFav = favorites.has(term.id);
          return (
            <div
              key={term.id}
              className="border-r border-b transition-all group relative"
              style={{ borderColor: borderSoft, background: '#1a1a1a' }}
              onMouseEnter={e => e.currentTarget.style.background = '#202020'}
              onMouseLeave={e => e.currentTarget.style.background = '#1a1a1a'}
            >
              <div className="flex items-center justify-between px-5 md:px-6 pt-5 md:pt-6 mb-3">
                <span className="text-[10px] mono uppercase tracking-wider px-2 py-1" style={{ background: color?.bg, color: color?.text }}>
                  {term.category}
                </span>
                <div className="flex items-center gap-2">
                  {term.detailed && (
                    <span className="text-[9px] mono uppercase tracking-wider px-1.5 py-0.5 border" style={{ borderColor: '#3a3a3a', color: '#7a7a7a' }}>
                      심화
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFav(term.id); }}
                    className="p-1"
                    style={{ color: isFav ? '#C89650' : '#5a5a5a' }}
                  >
                    <Star size={14} fill={isFav ? '#C89650' : 'none'} />
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSelectedTerm(term)}
                className="w-full text-left px-5 md:px-6 pb-5 md:pb-6"
              >
                <div className="text-xl md:text-2xl font-medium tracking-tight leading-tight mb-1" style={{ color: '#e8e4d6' }}>{term.name}</div>
                <div className="text-xs mono italic mb-3" style={{ color: '#7a7a7a' }}>{term.en}</div>
                <div className="text-sm leading-relaxed line-clamp-2" style={{ color: '#a8a49a' }}>{term.description}</div>
                <div className="mt-4 flex items-center gap-1 text-[10px] mono uppercase tracking-wider" style={{ color: '#5a5a5a' }}>
                  <span>자세히</span>
                  <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {terms.length === 0 && (
        <div className="text-center py-16 md:py-20 border-x border-b" style={{ borderColor: borderSoft }}>
          <div className="text-xl md:text-2xl font-light italic" style={{ color: '#5a5a5a' }}>검색 결과 없음</div>
          <div className="text-xs mono mt-2 uppercase tracking-wider" style={{ color: '#7a7a7a' }}>No Results Found</div>
        </div>
      )}

      {selectedTerm && (
        <TermModal term={selectedTerm} onClose={closeTerm} categoryColors={categoryColors} favorites={favorites} toggleFav={toggleFav} onNavigate={(id) => {
          const t = TERMS.find(x => x.id === id);
          if (t) setSelectedTerm(t);
        }} />
      )}
    </div>
  );
}

function TermModal({ term, onClose, categoryColors, favorites, toggleFav, onNavigate }) {
  const border = '#2a2a2a';
  const isFav = favorites.has(term.id);
  const relatedTerms = term.related?.map(id => TERMS.find(t => t.id === id)).filter(Boolean) || [];
  const hasDetailed = !!term.detailed;
  const hasRelations = term.relations && Object.keys(term.relations).length > 0;
  const hasImpact = !!term.marketImpact;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div
        className="max-w-4xl w-full border max-h-[92vh] overflow-y-auto"
        style={{ background: '#141414', borderColor: border }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="px-6 md:px-8 py-4 md:py-5 flex items-center justify-between border-b sticky top-0 z-10"
          style={{ background: categoryColors[term.category]?.bg, color: categoryColors[term.category]?.text, borderColor: border }}
        >
          <div className="flex items-center gap-3">
            <span className="ball-joint" style={{ background: categoryColors[term.category]?.text }}></span>
            <span className="text-[10px] mono uppercase tracking-[0.3em]">{term.category}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => toggleFav(term.id)} style={{ color: 'inherit' }}>
              <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
            </button>
            <button onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div className="p-6 md:p-10">
          {/* 타이틀 */}
          <div className="mb-8 pb-6 border-b" style={{ borderColor: border }}>
            <div className="text-4xl md:text-6xl font-light tracking-tight mb-3" style={{ color: '#e8e4d6' }}>{term.name}</div>
            <div className="text-base md:text-lg" style={{ color: '#a8a49a' }}>{term.fullName}</div>
            <div className="text-sm mono italic mt-1" style={{ color: '#7a7a7a' }}>{term.en}</div>
          </div>

          {/* 요약 */}
          <Section label="개요 · Summary" color={categoryColors[term.category]?.bg}>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: '#e8e4d6' }}>{term.description}</p>
          </Section>

          {/* 상세 설명 */}
          {hasDetailed && (
            <Section label="심화 · In-Depth" color={categoryColors[term.category]?.bg}>
              <p className="text-sm md:text-base leading-[1.8]" style={{ color: '#d4d0c4' }}>{term.detailed}</p>
            </Section>
          )}

          {/* 공식 */}
          <Section label="공식 · Formula" color={categoryColors[term.category]?.bg}>
            <div className="mono text-sm md:text-base px-4 md:px-5 py-3 md:py-4 border-l-4" style={{ background: '#0f0f0f', borderColor: categoryColors[term.category]?.bg, color: '#e8e4d6' }}>
              {term.formula}
            </div>
          </Section>

          {/* 예시 */}
          <Section label="예시 · Example" color={categoryColors[term.category]?.bg}>
            <div className="text-sm italic" style={{ color: '#a8a49a' }}>{term.example}</div>
          </Section>

          {/* 관계성 카드 */}
          {hasRelations && (
            <Section label="연결 관계 · Relations" color={categoryColors[term.category]?.bg}>
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
                      style={{ borderColor: border, background: '#0f0f0f' }}
                      onClick={matchTerm ? () => onNavigate(matchTerm.id) : undefined}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {matchColor && <span className="w-1.5 h-1.5 rounded-full" style={{ background: matchColor.bg }}></span>}
                          <span className="text-sm font-medium" style={{ color: '#e8e4d6' }}>{key}</span>
                        </div>
                        {matchTerm && <ArrowUpRight size={12} style={{ color: '#7a7a7a' }} />}
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: '#a8a49a' }}>{value}</p>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* 시장 영향 */}
          {hasImpact && (
            <Section label="시장 영향 · Market Impact" color={categoryColors[term.category]?.bg}>
              <div className="text-sm md:text-base leading-relaxed px-4 py-3 border-l-2" style={{ background: '#0f0f0f', borderColor: '#C89650', color: '#e8e4d6' }}>
                {term.marketImpact}
              </div>
            </Section>
          )}

          {/* 관련 용어 */}
          {relatedTerms.length > 0 && (
            <div className="mt-6 pt-6 border-t" style={{ borderColor: border }}>
              <div className="text-[10px] mono uppercase tracking-[0.2em] mb-3" style={{ color: '#7a7a7a' }}>관련 용어 · Related Terms</div>
              <div className="flex flex-wrap gap-2">
                {relatedTerms.map(rt => {
                  const rc = categoryColors[rt.category];
                  return (
                    <button
                      key={rt.id}
                      onClick={() => onNavigate(rt.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs border transition-all hover:bg-white/5"
                      style={{ borderColor: border, color: '#d4d0c4' }}
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
        </div>
      </div>
    </div>
  );
}

function Section({ label, color, children }) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1 h-3" style={{ background: color || '#C89650' }}></span>
        <div className="text-[10px] mono uppercase tracking-[0.25em]" style={{ color: '#7a7a7a' }}>{label}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 계산기 뷰
// ─────────────────────────────────────────────
function CalculatorView({ selectedCalc, setSelectedCalc }) {
  const border = '#2a2a2a';
  const allCalcs = CALC_CATEGORIES.flatMap(cat => cat.calcs.map(c => ({ ...c, category: cat.name, color: cat.color })));
  const currentCalc = allCalcs.find(c => c.id === selectedCalc);

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
      default: return null;
    }
  };

  return (
    <div>
      <div className="mb-6 border-y" style={{ borderColor: border }}>
        <div className="flex items-center justify-between gap-3 py-2 border-b mono text-[10px] uppercase tracking-[0.2em] whitespace-nowrap" style={{ borderColor: border, color: '#7a7a7a' }}>
          <div className="flex items-center gap-3">
            <span>§ Calculator</span>
            <span className="w-4 h-px hidden md:inline-block" style={{ background: '#3a3a3a' }}></span>
            <span className="hidden md:inline">Index / 002</span>
          </div>
          {/* URL 공유 버튼 — 계산기 선택된 경우에만 */}
          {selectedCalc && (
            <button
              onClick={handleShareUrl}
              className="flex items-center gap-1.5 px-2 py-1 border transition-all hover:bg-white/5"
              style={{ borderColor: border, color: urlCopied ? '#C89650' : '#a8a49a' }}
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
        <div className="grid grid-cols-3 gap-2 md:gap-6 py-2 mono text-[10px] uppercase tracking-[0.2em]">
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: '#5a5a5a' }}>Groups</span><span style={{ color: '#e8e4d6' }}>{String(CALC_CATEGORIES.length).padStart(3, '0')}</span></div>
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: '#5a5a5a' }}>Modules</span><span style={{ color: '#e8e4d6' }}>{String(allCalcs.length).padStart(3, '0')}</span></div>
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: '#5a5a5a' }}>Active</span><span style={{ color: currentCalc?.color || '#e8e4d6' }}>M—{currentCalc?.num || '—'}</span></div>
        </div>
      </div>

      {/* 즐겨찾기 섹션 */}
      {favCalcList.length > 0 && (
        <div className="mb-5 border" style={{ borderColor: border }}>
          <div className="px-4 md:px-6 py-3 flex items-center gap-3 border-b" style={{ background: '#0f0f0f', borderColor: border }}>
            <Star size={12} fill="#C89650" stroke="#C89650" />
            <span className="text-xs md:text-sm mono uppercase tracking-[0.2em]" style={{ color: '#C89650' }}>즐겨찾기</span>
            <span className="ml-auto text-[10px] mono" style={{ color: '#5a5a5a' }}>{String(favCalcList.length).padStart(2, '0')} PINNED</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4">
            {favCalcList.map((calc, i) => {
              const active = selectedCalc === calc.id;
              const isLastRow = Math.floor(i / (window.innerWidth >= 768 ? 4 : 2)) === Math.floor((favCalcList.length - 1) / (window.innerWidth >= 768 ? 4 : 2));
              return (
                <div
                  key={`fav-${calc.id}`}
                  className="relative group flex items-stretch"
                  style={{ borderRight: '1px solid #1f1f1f', borderBottom: isLastRow ? 'none' : '1px solid #1f1f1f' }}
                >
                  <button
                    onClick={() => setSelectedCalc(active ? '' : calc.id)}
                    className="flex-1 flex items-center gap-2 px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm transition-all text-left"
                    style={{
                      background: active ? calc.color : 'transparent',
                      color: active ? '#0a0a0a' : '#d4d0c4',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: active ? '#0a0a0a' : calc.color }}></span>
                    <span className="font-medium truncate">{calc.name}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border" style={{ borderColor: border }}>
        {CALC_CATEGORIES.map((cat, ci) => {
          const hasActiveInCategory = cat.calcs.some(c => c.id === selectedCalc);
          return (
            <div key={cat.name} className={ci !== CALC_CATEGORIES.length - 1 ? 'border-b' : ''} style={{ borderColor: border }}>
              {/* 카테고리 헤더 */}
              <div className="px-4 md:px-6 py-3 flex items-center gap-3" style={{ background: '#0f0f0f' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: cat.color }}></span>
                <span className="text-xs md:text-sm mono uppercase tracking-[0.2em]" style={{ color: '#a8a49a' }}>{cat.name}</span>
                <span className="ml-auto text-[10px] mono" style={{ color: '#5a5a5a' }}>{String(cat.calcs.length).padStart(2, '0')} MODULES</span>
              </div>

              {/* 계산기 버튼 그리드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 border-t" style={{ borderColor: border }}>
                {cat.calcs.map((calc) => {
                  const active = selectedCalc === calc.id;
                  const isFav = favCalcs.has(calc.id);
                  return (
                    <div
                      key={calc.id}
                      className="relative group flex items-stretch border-r border-b"
                      style={{ borderColor: '#1f1f1f' }}
                    >
                      <button
                        onClick={() => setSelectedCalc(active ? '' : calc.id)}
                        className="flex-1 flex items-center gap-2 px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm transition-all text-left"
                        style={{
                          background: active ? cat.color : 'transparent',
                          color: active ? '#0a0a0a' : '#d4d0c4',
                        }}
                      >
                        <span className="text-[10px] mono opacity-60 w-5 shrink-0">{calc.num}</span>
                        <span className="font-medium truncate">{calc.name}</span>
                      </button>
                      {/* 즐겨찾기 별 버튼 — 우측 겹쳐서 */}
                      <button
                        onClick={(e) => toggleFavCalc(calc.id, e)}
                        className="absolute top-1/2 right-1.5 -translate-y-1/2 p-1.5 transition-opacity"
                        style={{
                          opacity: isFav ? 1 : 0,
                          color: active ? '#0a0a0a' : '#C89650',
                        }}
                        title={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                      >
                        <Star size={12} fill={isFav ? 'currentColor' : 'none'} />
                      </button>
                      {/* 비활성 상태에서 hover 시 별 표시 */}
                      {!isFav && (
                        <button
                          onClick={(e) => toggleFavCalc(calc.id, e)}
                          className="absolute top-1/2 right-1.5 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: active ? '#0a0a0a' : '#7a7a7a' }}
                          title="즐겨찾기 추가"
                        >
                          <Star size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 선택된 계산기 인라인 펼침 */}
              {hasActiveInCategory && (
                <div className="border-t p-5 md:p-10" style={{ borderColor: border, background: '#161616' }}>
                  {renderCalcComponent(selectedCalc)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const BORDER = '#2a2a2a';

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

function NumInput({ label, value, onChange, unit, placeholder, hint }) {
  // 표시용: 쉼표 포함된 값
  const displayValue = value === '' || value === null || value === undefined
    ? ''
    : Number(value).toLocaleString('ko-KR');

  // 입력 시: 쉼표 제거하고 숫자만 저장
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d.-]/g, ''); // 숫자·소수점·음수만
    onChange(raw);
  };

  // 한국어 단위
  const koreanUnit = formatKoreanUnit(value);

  return (
    <div>
      <label className="block text-[10px] mono uppercase tracking-[0.2em] mb-2" style={{ color: '#7a7a7a' }}>{label}</label>
      <div className="relative border" style={{ borderColor: BORDER, background: '#141414' }}>
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 mono text-base bg-transparent"
          style={{ color: '#e8e4d6' }}
        />
        {unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs mono" style={{ color: '#7a7a7a' }}>{unit}</span>}
      </div>
      {/* 한국어 단위 표시 (입력값 있을 때만) */}
      {koreanUnit && (
        <div className="text-xs mt-1.5 mono" style={{ color: '#C89650' }}>
          ≈ {koreanUnit}
        </div>
      )}
      {hint && !koreanUnit && <div className="text-[10px] mt-1" style={{ color: '#6a6a6a' }}>{hint}</div>}
      {hint && koreanUnit && <div className="text-[10px] mt-0.5" style={{ color: '#6a6a6a' }}>{hint}</div>}
    </div>
  );
}

function ResultBox({ label, value, unit, highlight, color = '#C89650' }) {
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
    // 복사 형식: "라벨: 값 단위 (한국어단위) · stockwiki.kr"
    const text = koreanUnit
      ? `${label}: ${value} ${unit || ''} (${koreanUnit}) · stockwiki.kr`
      : `${label}: ${value} ${unit || ''} · stockwiki.kr`;
    try {
      await navigator.clipboard.writeText(text.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  // 값이 비어있거나 '—'면 복사 버튼 비활성
  const hasValue = value && value !== '—' && value !== '0';

  return (
    <div className="p-4 md:p-5 relative group" style={{
      background: highlight ? color : '#141414',
      color: highlight ? '#0a0a0a' : '#e8e4d6'
    }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] mono uppercase tracking-[0.2em]" style={{ opacity: 0.7 }}>{label}</div>
        {hasValue && (
          <button
            onClick={handleCopy}
            className="text-[9px] mono uppercase tracking-[0.15em] px-1.5 py-0.5 transition-all flex items-center gap-1"
            style={{
              opacity: copied ? 1 : 0.4,
              color: 'inherit',
            }}
            title="결과 복사"
          >
            {copied ? (
              <><Check size={10} /><span>복사됨</span></>
            ) : (
              <><Copy size={10} /><span>복사</span></>
            )}
          </button>
        )}
      </div>
      <div className="text-2xl md:text-3xl font-light mono tabular-nums">
        {value} <span className="text-xs md:text-sm" style={{ opacity: 0.6 }}>{unit}</span>
      </div>
      {koreanUnit && (
        <div className="text-xs mt-2 mono" style={{ opacity: 0.7 }}>
          ≈ {koreanUnit}
        </div>
      )}
    </div>
  );
}

function CalcHeader({ num, title, desc, color = '#C89650' }) {
  return (
    <div className="mb-6 md:mb-8 pb-5 md:pb-6 border-b" style={{ borderColor: BORDER }}>
      <div className="flex items-baseline gap-4 mb-2">
        <span className="text-xs mono" style={{ color }}>M—{num}</span>
        <span className="h-px flex-1" style={{ background: BORDER }}></span>
      </div>
      <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-2" style={{ color: '#e8e4d6' }}>{title}</h2>
      <p className="text-sm" style={{ color: '#a8a49a' }}>{desc}</p>
    </div>
  );
}

function CalcNote({ lines, how, example, tip }) {
  // 기존 호환성: lines 배열만 전달된 경우
  if (lines && !how && !example && !tip) {
    return (
      <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t" style={{ borderColor: BORDER }}>
        <div className="text-[10px] mono uppercase tracking-[0.2em] mb-3" style={{ color: '#7a7a7a' }}>Notes</div>
        {lines.map((line, i) => (
          <div key={i} className="text-xs leading-relaxed" style={{ color: '#a8a49a' }}>— {line}</div>
        ))}
      </div>
    );
  }
  // 새 구조: how(사용법), example(예시), tip(팁)
  return (
    <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t space-y-5" style={{ borderColor: BORDER }}>
      {how && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-3" style={{ background: '#C89650' }}></span>
            <div className="text-[10px] mono uppercase tracking-[0.2em]" style={{ color: '#7a7a7a' }}>How to Use · 사용법</div>
          </div>
          <div className="space-y-1.5">
            {how.map((line, i) => (
              <div key={i} className="text-xs md:text-sm leading-relaxed" style={{ color: '#d4d0c4' }}>
                <span className="mono mr-2" style={{ color: '#6a6a6a' }}>{String(i + 1).padStart(2, '0')}.</span>{line}
              </div>
            ))}
          </div>
        </div>
      )}
      {example && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-3" style={{ background: '#A63D33' }}></span>
            <div className="text-[10px] mono uppercase tracking-[0.2em]" style={{ color: '#7a7a7a' }}>Example · 예시</div>
          </div>
          <div className="text-xs md:text-sm leading-relaxed p-3 md:p-4 border-l-2" style={{ borderColor: '#A63D33', background: '#0f0f0f', color: '#d4d0c4' }}>
            {typeof example === 'string' ? example : example.map((line, i) => (
              <div key={i} className={i > 0 ? 'mt-1' : ''}>{line}</div>
            ))}
          </div>
        </div>
      )}
      {tip && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-3" style={{ background: '#4A7045' }}></span>
            <div className="text-[10px] mono uppercase tracking-[0.2em]" style={{ color: '#7a7a7a' }}>Tips · 해석 가이드</div>
          </div>
          <div className="space-y-1.5">
            {tip.map((line, i) => (
              <div key={i} className="text-xs md:text-sm leading-relaxed" style={{ color: '#a8a49a' }}>— {line}</div>
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
  const [price, setPrice] = useState('');
  const [netIncome, setNetIncome] = useState('');
  const [shares, setShares] = useState('');
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
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="EPS · 주당순이익" value={fmt(eps)} unit="원" /></div>
        <ResultBox label="PER · 주가수익비율" value={fmt(per)} unit="배" highlight />
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
          'PER이 낮을수록 "이익 대비 저평가" 상태 — 단, 성장성·업종 차이 고려 필수',
          '업종 평균 PER과 비교: 반도체 12배, 은행 5배, 바이오 30배 등 업종마다 다름',
          'PER이 마이너스면 적자 기업 — PER 해석 불가 (PSR로 대체 평가)',
          '미래 이익 기준 Forward PER이 더 중요 — 이익 성장률 함께 확인',
        ]}
      />
    </div>
  );
}

function PSRCalc() {
  const [price, setPrice] = useState('');
  const [sales, setSales] = useState('');
  const [shares, setShares] = useState('');
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
      <div className="grid md:grid-cols-3 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="SPS · 주당매출액" value={fmt(sps, 0)} unit="원" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="시가총액" value={fmt(marketCap, 0)} unit="원" /></div>
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
          '마진 낮은 기업에서 PSR 낮다고 무조건 저평가 아님 — 영업이익률 함께 확인',
          'PSR × 순이익률 ≈ PER 관계 있음 (마진 3%면 PSR 1배 = PER 33배)',
        ]}
      />
    </div>
  );
}

function PBRCalc() {
  const [price, setPrice] = useState('');
  const [equity, setEquity] = useState('');
  const [shares, setShares] = useState('');
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
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="BPS · 주당순자산" value={fmt(bps)} unit="원" /></div>
        <ResultBox label="PBR · 주가순자산비율" value={fmt(pbr)} unit="배" highlight />
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
          'PBR × ROE ≈ 적정 PER 공식 — ROE 높고 PBR 낮으면 매력적',
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
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="목표주가" value={fmt(target, 0)} unit="원" highlight /></div>
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
          '목표 PER 선정이 가장 중요 — 보수적으로 과거 평균 하단 사용 권장',
          '상승여력 20% 이상: 매수 매력 / 10% 미만: 유지 / 음수: 비중 축소',
          '성장률 반영: PEG < 1 (성장 대비 저평가)',
          '증권사 목표주가는 대부분 낙관적 — 자체 산정 필수',
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
      <div className="grid md:grid-cols-3 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="5년 PV 합계" value={fmt(pv, 0)} unit="원" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="터미널 PV" value={fmt(pvTerminal, 0)} unit="원" /></div>
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
          'DCF는 입력값에 매우 민감 — 할인율 1% 차이로 결과 20% 이상 변동',
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
      <div className="grid md:grid-cols-3 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="자기자본 비중" value={fmt(wE * 100)} unit="%" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="부채 비중" value={fmt(wD * 100)} unit="%" /></div>
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
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="ROE" value={fmt(roe)} unit="%" highlight color="#A63D33" /></div>
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
          'ROE 높아도 부채 많으면 위험 — ROA와 함께 확인',
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
      <div className="grid md:grid-cols-4 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="순이익률" value={fmt(margin * 100)} unit="%" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="자산회전율" value={fmt(turnover, 3)} unit="회" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="재무레버리지" value={fmt(leverage, 3)} unit="배" /></div>
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
      <div className="grid md:grid-cols-3 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="매출총이익률" value={fmt(gross)} unit="%" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="영업이익률" value={fmt(op)} unit="%" highlight color="#A63D33" /></div>
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
          '순이익률은 비경상적 손익 포함해 변동 큼 — 영업이익률이 더 본질적',
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
      <div className="grid md:grid-cols-3 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="BEP 수량" value={fmt(unit, 0)} unit="개" highlight color="#A63D33" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="BEP 매출액" value={fmt(sales, 0)} unit="원" /></div>
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
      <div className="grid md:grid-cols-3 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="배당수익률" value={fmt(yld)} unit="%" highlight color="#C08E6A" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="세전 배당금" value={fmt(annualDiv, 0)} unit="원" /></div>
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
          '배당락일 이전에 매수해야 배당 권리 발생 — 거래일 기준 2일 전',
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
      <div className="grid md:grid-cols-3 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="최종 평가액" value={fmt(total, 0)} unit="원" highlight color="#C08E6A" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="총 투자원금" value={fmt(totalInvested, 0)} unit="원" /></div>
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
          '복리의 힘은 시간 × 수익률 — 일찍 시작할수록 극적 차이',
          '연 10%는 역사적 S&P500 수익률, 한국 주식은 장기 연 7~8%',
          '세금·인플레 감안 시 실질 수익률은 명목의 70% 수준',
          '수익률 변동성은 고려되지 않음 — 실제 결과는 경로에 따라 달라짐',
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
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="CAGR" value={fmt(cagr)} unit="%" highlight color="#C08E6A" /></div>
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
          '한계: 중간 변동성 정보 손실 — MDD·샤프지수와 함께 봐야 완전',
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
          '인플레이션에도 적용 가능 — 물가가 2배 되는 기간 = 72 ÷ 인플레율',
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
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r border-b" style={{ borderColor: BORDER }}><ResultBox label="평균 매수단가" value={fmt(avg, 0)} unit="원" highlight color="#8A8A8A" /></div>
        <div className="border-b" style={{ borderColor: BORDER }}><ResultBox label="총 보유수량" value={fmt(totalQty, 0)} unit="주" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="평가손익" value={fmt(pnl, 0)} unit="원" /></div>
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
      <div className="flex mb-5 border" style={{ borderColor: BORDER }}>
        <button onClick={() => setType('buy')} className="flex-1 py-3 text-sm font-medium transition-all border-r"
          style={{ borderColor: BORDER, background: type === 'buy' ? '#4A7045' : 'transparent', color: type === 'buy' ? '#eae7dc' : '#a8a49a' }}>매수</button>
        <button onClick={() => setType('sell')} className="flex-1 py-3 text-sm font-medium transition-all"
          style={{ background: type === 'sell' ? '#A63D33' : 'transparent', color: type === 'sell' ? '#eae7dc' : '#a8a49a' }}>매도</button>
      </div>
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="주가" value={price} onChange={setPrice} unit="원" placeholder="50,000" />
        <NumInput label="수량" value={qty} onChange={setQty} unit="주" placeholder="100" />
        <NumInput label="수수료율" value={feeRate} onChange={setFeeRate} unit="%" placeholder="0.015" />
      </div>
      <div className={`grid ${type === 'sell' ? 'md:grid-cols-4' : 'md:grid-cols-3'} border`} style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="거래금액" value={fmt(amount, 0)} unit="원" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="수수료" value={fmt(fee, 0)} unit="원" /></div>
        {type === 'sell' && <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="증권거래세" value={fmt(tax, 0)} unit="원" /></div>}
        <ResultBox label={type === 'buy' ? '총 매수대금' : '실수령액'} value={fmt(total, 0)} unit="원" highlight color="#8A8A8A" />
      </div>
      <CalcNote
        how={[
          '매수/매도 선택 — 세금은 매도 시에만 발생',
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
          '증권사 수수료 비교 필수 — 비대면 개설 시 평생 무료 증권사 많음',
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
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="손익분기 매도가" value={fmt(breakeven, 0)} unit="원" highlight color="#8A8A8A" /></div>
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
      <div className="grid md:grid-cols-3 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="허용 손실액" value={fmt(riskAmt, 0)} unit="원" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="매수 수량" value={fmt(shares, 0)} unit="주" highlight color="#8A8A8A" /></div>
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
          '2% 룰: 월가의 정석 — 50번 연속 틀려도 파산 안 함',
          '손절가 없는 매매는 포지션 크기 결정 불가능',
          '손실 후 본전 회복의 비대칭성: 20% 손실 = 25% 수익 필요, 50% 손실 = 100% 필요',
          '리스크 관리가 수익률보다 중요 — Ray Dalio "Don\'t lose money"',
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
      <CalcHeader num="19" title="선물 손익 계산" desc="KOSPI200 선물 기준 손익을 산출합니다." color="#6B6B6B" />
      <div className="flex mb-5 border" style={{ borderColor: BORDER }}>
        <button onClick={() => setSide('long')} className="flex-1 py-3 text-sm font-medium transition-all border-r"
          style={{ borderColor: BORDER, background: side === 'long' ? '#4A7045' : 'transparent', color: side === 'long' ? '#eae7dc' : '#a8a49a' }}>LONG · 매수</button>
        <button onClick={() => setSide('short')} className="flex-1 py-3 text-sm font-medium transition-all"
          style={{ background: side === 'short' ? '#A63D33' : 'transparent', color: side === 'short' ? '#eae7dc' : '#a8a49a' }}>SHORT · 매도</button>
      </div>
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="진입가 (포인트)" value={entry} onChange={setEntry} unit="pt" placeholder="350.00" />
        <NumInput label="청산가 (포인트)" value={exit} onChange={setExit} unit="pt" placeholder="355.00" />
        <NumInput label="계약수" value={contracts} onChange={setContracts} unit="계약" placeholder="1" />
        <NumInput label="승수" value={multiplier} onChange={setMultiplier} unit="원" placeholder="250,000" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="포인트 손익" value={fmt(directedDiff, 2)} unit="pt" /></div>
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
      <CalcHeader num="20" title="레버리지 · 증거금" desc="필요 증거금과 실질 레버리지를 산출합니다." color="#6B6B6B" />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="계약 명목금액" value={notional} onChange={setNotional} unit="원" placeholder="100,000,000" />
        <NumInput label="증거금률" value={marginRate} onChange={setMarginRate} unit="%" placeholder="10" />
        <NumInput label="투자 가용 자본" value={capital} onChange={setCapital} unit="원" placeholder="10,000,000" />
      </div>
      <div className="grid md:grid-cols-3 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="필요 증거금" value={fmt(margin, 0)} unit="원" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="실질 레버리지" value={fmt(leverage)} unit="배" highlight color="#6B6B6B" /></div>
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
      <CalcHeader num="21" title="블랙-숄즈 옵션가" desc="유럽형 옵션의 이론가를 계산합니다." color="#6B6B6B" />
      <div className="flex mb-5 border" style={{ borderColor: BORDER }}>
        <button onClick={() => setType('call')} className="flex-1 py-3 text-sm font-medium transition-all border-r"
          style={{ borderColor: BORDER, background: type === 'call' ? '#4A7045' : 'transparent', color: type === 'call' ? '#eae7dc' : '#a8a49a' }}>CALL · 콜옵션</button>
        <button onClick={() => setType('put')} className="flex-1 py-3 text-sm font-medium transition-all"
          style={{ background: type === 'put' ? '#A63D33' : 'transparent', color: type === 'put' ? '#eae7dc' : '#a8a49a' }}>PUT · 풋옵션</button>
      </div>
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="기초자산 가격 (S)" value={S} onChange={setS} unit="원" placeholder="350" />
        <NumInput label="행사가 (K)" value={K} onChange={setK} unit="원" placeholder="355" />
        <NumInput label="만기까지 일수 (T)" value={T} onChange={setT} unit="일" placeholder="30" />
        <NumInput label="무위험금리 (r)" value={r} onChange={setR} unit="%" placeholder="3.5" />
        <NumInput label="변동성 (σ)" value={sigma} onChange={setSigma} unit="%" placeholder="20" hint="내재변동성 또는 역사적변동성" />
      </div>
      <div className="grid md:grid-cols-3 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="d₁" value={result ? fmt(result.d1, 4) : '—'} unit="" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="d₂" value={result ? fmt(result.d2, 4) : '—'} unit="" /></div>
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
      <CalcHeader num="22" title="옵션 Greeks" desc="델타·감마·세타·베가·로를 동시에 산출합니다." color="#6B6B6B" />
      <div className="flex mb-5 border" style={{ borderColor: BORDER }}>
        <button onClick={() => setType('call')} className="flex-1 py-3 text-sm font-medium border-r"
          style={{ borderColor: BORDER, background: type === 'call' ? '#4A7045' : 'transparent', color: type === 'call' ? '#eae7dc' : '#a8a49a' }}>CALL</button>
        <button onClick={() => setType('put')} className="flex-1 py-3 text-sm font-medium"
          style={{ background: type === 'put' ? '#A63D33' : 'transparent', color: type === 'put' ? '#eae7dc' : '#a8a49a' }}>PUT</button>
      </div>
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="기초자산 (S)" value={S} onChange={setS} unit="원" placeholder="350" />
        <NumInput label="행사가 (K)" value={K} onChange={setK} unit="원" placeholder="355" />
        <NumInput label="만기일수 (T)" value={T} onChange={setT} unit="일" placeholder="30" />
        <NumInput label="무위험금리" value={r} onChange={setR} unit="%" placeholder="3.5" />
        <NumInput label="변동성" value={sigma} onChange={setSigma} unit="%" placeholder="20" />
      </div>
      <div className="grid md:grid-cols-5 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="Delta Δ" value={greeks ? fmt(greeks.delta, 4) : '—'} unit="" highlight color="#6B6B6B" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="Gamma Γ" value={greeks ? fmt(greeks.gamma, 5) : '—'} unit="" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="Theta Θ" value={greeks ? fmt(greeks.theta, 4) : '—'} unit="/일" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="Vega ν" value={greeks ? fmt(greeks.vega, 4) : '—'} unit="" /></div>
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
      <CalcHeader num="23" title="샤프 · 소티노지수" desc="위험조정수익률을 두 가지 지표로 비교합니다." color="#4F7E7C" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="포트폴리오 수익률" value={rp} onChange={setRp} unit="%" placeholder="15" />
        <NumInput label="무위험수익률" value={rf} onChange={setRf} unit="%" placeholder="3.5" />
        <NumInput label="표준편차 (전체)" value={sigma} onChange={setSigma} unit="%" placeholder="12" />
        <NumInput label="하방편차" value={downside} onChange={setDownside} unit="%" placeholder="8" hint="손실 구간의 표준편차" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="샤프지수" value={fmt(sharpe, 3)} unit="" highlight color="#4F7E7C" /></div>
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
      <CalcHeader num="24" title="켈리 공식" desc="장기 기대수익률 극대화를 위한 최적 베팅 비율을 산출합니다." color="#4F7E7C" />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="승률" value={winRate} onChange={setWinRate} unit="%" placeholder="55" />
        <NumInput label="평균 수익금" value={winAmt} onChange={setWinAmt} unit="원" placeholder="200,000" />
        <NumInput label="평균 손실금" value={lossAmt} onChange={setLossAmt} unit="원" placeholder="100,000" />
      </div>
      <div className="grid md:grid-cols-3 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="Full Kelly" value={fmt(f * 100)} unit="%" highlight color="#4F7E7C" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="Half Kelly (권장)" value={fmt(halfKelly * 100)} unit="%" /></div>
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
      <CalcHeader num="25" title="최대낙폭 (MDD)" desc="고점 대비 최대 하락률과 원금 회복에 필요한 수익률을 계산합니다." color="#4F7E7C" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="고점 (Peak)" value={peak} onChange={setPeak} unit="원" placeholder="100,000,000" />
        <NumInput label="저점 (Trough)" value={trough} onChange={setTrough} unit="원" placeholder="70,000,000" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="MDD" value={fmt(mdd)} unit="%" highlight color="#A63D33" /></div>
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
          '역사적 MDD는 미래 보장 없음 — "이번엔 더 클 수 있다"',
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
      <CalcHeader num="26" title="VaR 추정" desc="주어진 신뢰수준에서 예상 최대 손실을 추정합니다." color="#4F7E7C" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="포트폴리오 가치" value={value} onChange={setValue} unit="원" placeholder="100,000,000" />
        <NumInput label="일일 변동성" value={sigma} onChange={setSigma} unit="%" placeholder="1.5" />
        <div>
          <label className="block text-[10px] mono uppercase tracking-[0.2em] mb-2" style={{ color: '#7a7a7a' }}>신뢰수준</label>
          <div className="flex border" style={{ borderColor: BORDER }}>
            {['90', '95', '99'].map(c => (
              <button key={c} onClick={() => setConfidence(c)} className="flex-1 py-3 text-sm border-r last:border-r-0"
                style={{ borderColor: BORDER, background: confidence === c ? '#4F7E7C' : 'transparent', color: confidence === c ? '#eae7dc' : '#a8a49a' }}>{c}%</button>
            ))}
          </div>
        </div>
        <NumInput label="기간" value={days} onChange={setDays} unit="일" placeholder="1" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="1일 VaR" value={fmt(dailyVar, 0)} unit="원" /></div>
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
          '정규분포 가정 기반 — 극단적 하락(꼬리 위험)은 과소평가',
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
      <CalcHeader num="27" title="환차손익 계산" desc="외화 매수·매도 시 원화 기준 손익을 산출합니다." color="#7C6A9B" />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="외화 금액" value={amount} onChange={setAmount} unit="USD" placeholder="10,000" />
        <NumInput label="매수 환율" value={buyRate} onChange={setBuyRate} unit="KRW" placeholder="1,300" />
        <NumInput label="매도 환율" value={sellRate} onChange={setSellRate} unit="KRW" placeholder="1,380" />
      </div>
      <div className="grid md:grid-cols-3 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="매수 시 원화" value={fmt(krwSpent, 0)} unit="원" /></div>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="매도 시 원화" value={fmt(krwReceived, 0)} unit="원" /></div>
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
      <CalcHeader num="28" title="실질금리 계산" desc="명목금리에서 인플레이션을 차감한 실질 구매력을 계산합니다." color="#7C6A9B" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="명목금리" value={nominal} onChange={setNominal} unit="%" placeholder="5" />
        <NumInput label="인플레이션 (CPI)" value={inflation} onChange={setInflation} unit="%" placeholder="3" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="실질금리 (Fisher)" value={fmt(real, 3)} unit="%" highlight color="#7C6A9B" /></div>
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
      <CalcHeader num="29" title="채권 가격 계산" desc="액면가 · 쿠폰 · YTM으로 채권의 현재가격을 계산합니다." color="#7C6A9B" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="액면가" value={face} onChange={setFace} unit="원" placeholder="1,000,000" />
        <NumInput label="쿠폰금리 (연)" value={coupon} onChange={setCoupon} unit="%" placeholder="4" />
        <NumInput label="만기수익률 (YTM)" value={ytm} onChange={setYtm} unit="%" placeholder="5" />
        <NumInput label="잔존만기" value={years} onChange={setYears} unit="년" placeholder="5" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="채권 가격 (PV)" value={fmt(pv, 0)} unit="원" highlight color="#7C6A9B" /></div>
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
          'YTM이 쿠폰보다 높으니 할인채 — 시장금리 올랐으니 매력 감소',
          '반대로 YTM이 3%로 내리면 채권가격은 104만원대로 상승',
        ]}
        tip={[
          'YTM > 쿠폰 → 할인채 (가격 < 액면가)',
          'YTM < 쿠폰 → 할증채 (가격 > 액면가)',
          'YTM = 쿠폰 → 액면가 그대로 (par bond)',
          '금리 하락 → 채권가격 상승 (역관계) — 채권 투자자에게 호재',
          '듀레이션 길수록 금리민감도 큼 · 장기채가 단기채보다 변동성 큼',
          '한국 국고채·미국 국채가 대표적 안전자산',
        ]}
      />
    </div>
  );
}
