'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Calculator, BookOpen, ChevronRight, X, ArrowUpRight, Star, Clock, Menu, Link as LinkIcon } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TERMS, CATEGORIES, CATEGORY_COLORS } from '@/data/terms';
import { CALC_CATEGORIES } from '@/data/calcs';

export default function StockWiki() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams?.get('tab') === 'calculator' ? 'calculator' : 'glossary';
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
        setShowCommandK(true);
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
  }, []);

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
            <button
              onClick={() => setShowCommandK(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 border text-xs"
              style={{ borderColor: '#2a2a2a', color: '#7a7a7a' }}
            >
              <Search size={12} />
              <span>빠른 검색</span>
              <span className="mono text-[10px] px-1.5 py-0.5 border" style={{ borderColor: '#2a2a2a' }}>⌘K</span>
            </button>
            <div className="hidden lg:flex items-center gap-4 text-[11px] mono uppercase tracking-wider" style={{ color: '#7a7a7a' }}>
              <span>{new Date().toLocaleDateString('ko-KR')}</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex border-t overflow-x-auto scroll-hide" style={{ borderColor: '#2a2a2a' }}>
          {[
            { id: 'glossary', label: '금융 사전', icon: BookOpen, idx: '01', count: TERMS.length },
            { id: 'calculator', label: '계산기', icon: Calculator, idx: '02', count: CALC_CATEGORIES.reduce((s, c) => s + c.calcs.length, 0) },
          ].map(tab => {
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
        {activeTab === 'glossary' && (
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
        {activeTab === 'calculator' && (
          <CalculatorView
            selectedCalc={selectedCalc}
            setSelectedCalc={setSelectedCalc}
          />
        )}
      </main>

      {showCommandK && (
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
      <div className="flex flex-wrap mb-8 md:mb-10 border-y overflow-x-auto scroll-hide" style={{ borderColor: border }}>
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          const isFav = cat === '★ 즐겨찾기';
          const color = categoryColors[cat];
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm transition-all border-r flex items-center gap-2 whitespace-nowrap"
              style={{
                borderColor: border,
                background: active ? (isFav ? '#C89650' : (color?.bg || '#e8e4d6')) : 'transparent',
                color: active ? (isFav ? '#0a0a0a' : (color?.text || '#1a1a1a')) : '#a8a49a',
              }}
            >
              {!isFav && cat !== '전체' && (
                <span className="w-2 h-2 rounded-full" style={{ background: active ? (color?.text || '#1a1a1a') : (color?.bg || '#8a8a8a') }}></span>
              )}
              <span>{cat}</span>
            </button>
          );
        })}
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
            <Link
              href={`/terms/${term.id}`}
              className="text-[10px] mono uppercase tracking-wider px-2 py-1 border transition-all hover:bg-black/10"
              style={{ borderColor: 'currentColor', color: 'inherit' }}
              title="전용 페이지로 이동"
            >
              전용 페이지 ↗
            </Link>
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
function CalculatorView({ selectedCalc, setSelectedCalc, sidebarOpen, setSidebarOpen }) {
  const border = '#2a2a2a';
  const allCalcs = CALC_CATEGORIES.flatMap(cat => cat.calcs.map(c => ({ ...c, category: cat.name, color: cat.color })));
  const currentCalc = allCalcs.find(c => c.id === selectedCalc);

  return (
    <div>
      <div className="mb-6 border-y" style={{ borderColor: border }}>
        <div className="flex items-center justify-end gap-3 py-2 border-b mono text-[10px] uppercase tracking-[0.2em] whitespace-nowrap" style={{ borderColor: border, color: '#7a7a7a' }}>
          <span>§ Calculator</span>
          <span className="w-4 h-px" style={{ background: '#3a3a3a' }}></span>
          <span>Index / 002</span>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-6 py-2 mono text-[10px] uppercase tracking-[0.2em]">
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: '#5a5a5a' }}>Groups</span><span style={{ color: '#e8e4d6' }}>{String(CALC_CATEGORIES.length).padStart(3, '0')}</span></div>
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: '#5a5a5a' }}>Modules</span><span style={{ color: '#e8e4d6' }}>{String(allCalcs.length).padStart(3, '0')}</span></div>
          <div className="flex items-baseline gap-1 md:gap-2"><span style={{ color: '#5a5a5a' }}>Active</span><span style={{ color: currentCalc?.color || '#e8e4d6' }}>M—{currentCalc?.num}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-12 border" style={{ borderColor: border }}>
        {/* 사이드바 */}
        <div
          className={`col-span-12 md:col-span-3 border-r md:border-r ${sidebarOpen ? 'block' : 'hidden md:block'}`}
          style={{ borderColor: border, background: '#141414' }}
        >
          {CALC_CATEGORIES.map((cat, ci) => (
            <div key={cat.name} className={ci !== CALC_CATEGORIES.length - 1 ? 'border-b' : ''} style={{ borderColor: border }}>
              <div className="px-4 md:px-5 py-2 md:py-3 flex items-center gap-2" style={{ background: '#0f0f0f' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }}></span>
                <span className="text-[10px] mono uppercase tracking-[0.2em]" style={{ color: '#a8a49a' }}>{cat.name}</span>
                <span className="ml-auto text-[10px] mono" style={{ color: '#5a5a5a' }}>{String(cat.calcs.length).padStart(2, '0')}</span>
              </div>
              {cat.calcs.map((calc) => {
                const active = selectedCalc === calc.id;
                return (
                  <button
                    key={calc.id}
                    onClick={() => { setSelectedCalc(calc.id); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 md:px-5 py-2.5 md:py-3 text-sm border-b transition-all text-left"
                    style={{
                      borderColor: '#1f1f1f',
                      background: active ? '#e8e4d6' : 'transparent',
                      color: active ? '#1a1a1a' : '#a8a49a',
                    }}
                  >
                    <span className="text-[10px] mono opacity-60 w-5">{calc.num}</span>
                    <span className="font-medium">{calc.name}</span>
                    {active && <ChevronRight size={12} className="ml-auto" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* 계산기 본체 */}
        <div className="col-span-12 md:col-span-9 p-6 md:p-12" style={{ background: '#1a1a1a' }}>
          {selectedCalc === 'per' && <PERCalc />}
          {selectedCalc === 'pbr' && <PBRCalc />}
          {selectedCalc === 'target' && <TargetPriceCalc />}
          {selectedCalc === 'dcf' && <DCFCalc />}
          {selectedCalc === 'wacc' && <WACCCalc />}
          {selectedCalc === 'roe' && <ROECalc />}
          {selectedCalc === 'dupont' && <DuPontCalc />}
          {selectedCalc === 'margin' && <MarginCalc />}
          {selectedCalc === 'bep' && <BEPCalc />}
          {selectedCalc === 'dividend' && <DividendCalc />}
          {selectedCalc === 'compound' && <CompoundCalc />}
          {selectedCalc === 'cagr' && <CAGRCalc />}
          {selectedCalc === 'rule72' && <Rule72Calc />}
          {selectedCalc === 'avgprice' && <AvgPriceCalc />}
          {selectedCalc === 'commission' && <CommissionCalc />}
          {selectedCalc === 'breakeven' && <BreakevenCalc />}
          {selectedCalc === 'positionsize' && <PositionSizeCalc />}
          {selectedCalc === 'futures' && <FuturesCalc />}
          {selectedCalc === 'leverage' && <LeverageCalc />}
          {selectedCalc === 'bs' && <BlackScholesCalc />}
          {selectedCalc === 'greeks' && <GreeksCalc />}
          {selectedCalc === 'sharpe' && <SharpeCalc />}
          {selectedCalc === 'kelly' && <KellyCalc />}
          {selectedCalc === 'mdd' && <MDDCalc />}
          {selectedCalc === 'var' && <VaRCalc />}
          {selectedCalc === 'fx' && <FXCalc />}
          {selectedCalc === 'realrate' && <RealRateCalc />}
          {selectedCalc === 'bondprice' && <BondPriceCalc />}
        </div>
      </div>
    </div>
  );
}

const BORDER = '#2a2a2a';

function NumInput({ label, value, onChange, unit, placeholder, hint }) {
  return (
    <div>
      <label className="block text-[10px] mono uppercase tracking-[0.2em] mb-2" style={{ color: '#7a7a7a' }}>{label}</label>
      <div className="relative border" style={{ borderColor: BORDER, background: '#141414' }}>
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 mono text-base bg-transparent"
          style={{ color: '#e8e4d6' }}
        />
        {unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs mono" style={{ color: '#7a7a7a' }}>{unit}</span>}
      </div>
      {hint && <div className="text-[10px] mt-1" style={{ color: '#6a6a6a' }}>{hint}</div>}
    </div>
  );
}

function ResultBox({ label, value, unit, highlight, color = '#C89650' }) {
  return (
    <div className="p-4 md:p-5" style={{
      background: highlight ? color : '#141414',
      color: highlight ? '#0a0a0a' : '#e8e4d6'
    }}>
      <div className="text-[10px] mono uppercase tracking-[0.2em] mb-2" style={{ opacity: 0.7 }}>{label}</div>
      <div className="text-2xl md:text-3xl font-light mono tabular-nums">
        {value} <span className="text-xs md:text-sm" style={{ opacity: 0.6 }}>{unit}</span>
      </div>
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

function CalcNote({ lines }) {
  return (
    <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t" style={{ borderColor: BORDER }}>
      <div className="text-[10px] mono uppercase tracking-[0.2em] mb-3" style={{ color: '#7a7a7a' }}>Notes</div>
      {lines.map((line, i) => (
        <div key={i} className="text-xs leading-relaxed" style={{ color: '#a8a49a' }}>— {line}</div>
      ))}
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
        <NumInput label="당기순이익 (연간)" value={netIncome} onChange={setNetIncome} unit="원" placeholder="100,000,000,000" />
        <NumInput label="발행주식수" value={shares} onChange={setShares} unit="주" placeholder="10,000,000" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="EPS · 주당순이익" value={fmt(eps)} unit="원" /></div>
        <ResultBox label="PER · 주가수익비율" value={fmt(per)} unit="배" highlight />
      </div>
      <CalcNote lines={['EPS = 당기순이익 ÷ 발행주식수', 'PER = 주가 ÷ EPS', '낮을수록 저평가, 업종 평균과 비교 필요']} />
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
        <NumInput label="자본총계" value={equity} onChange={setEquity} unit="원" placeholder="500,000,000,000" />
        <NumInput label="발행주식수" value={shares} onChange={setShares} unit="주" placeholder="10,000,000" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="BPS · 주당순자산" value={fmt(bps)} unit="원" /></div>
        <ResultBox label="PBR · 주가순자산비율" value={fmt(pbr)} unit="배" highlight />
      </div>
      <CalcNote lines={['BPS = 자본총계 ÷ 발행주식수', 'PBR = 주가 ÷ BPS', '1배 미만이면 청산가치 이하']} />
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
      <CalcHeader num="03" title="목표주가 계산" desc="EPS와 적정 PER로 목표주가를 산출합니다." />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="예상 EPS" value={eps} onChange={setEps} unit="원" placeholder="5,000" />
        <NumInput label="목표 PER" value={targetPer} onChange={setTargetPer} unit="배" placeholder="12" />
        <NumInput label="현재 주가" value={current} onChange={setCurrent} unit="원" placeholder="45,000" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="목표주가" value={fmt(target, 0)} unit="원" highlight /></div>
        <ResultBox label="상승여력" value={fmt(upside)} unit="%" />
      </div>
      <CalcNote lines={['목표주가 = 예상 EPS × 적정 PER', '업종 평균 PER 또는 과거 평균 PER 활용']} />
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
      <CalcHeader num="04" title="DCF 간이 평가" desc="향후 5년 FCF와 영구성장률로 기업가치를 추정합니다." />
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
      <CalcNote lines={[
        'V = Σ[FCFₜ/(1+r)ᵗ] + TV/(1+r)ⁿ',
        'TV = FCFₙ×(1+g) / (r - g)',
        '할인율은 일반적으로 WACC 사용, 안정기업 8~10% / 성장기업 12~15%',
        'EV에서 순차입금 차감 후 발행주식수로 나누면 적정주가',
      ]} />
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
      <CalcHeader num="05" title="WACC 계산" desc="가중평균자본비용을 산출합니다." />
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
      <CalcNote lines={['WACC = (E/V)×Re + (D/V)×Rd×(1-t)', '법인세 효과로 부채비용이 낮아짐', 'DCF 평가의 할인율로 사용']} />
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
      <CalcHeader num="06" title="ROE · ROA 계산" desc="자기자본이익률과 총자산이익률을 산출합니다." color="#A63D33" />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="당기순이익" value={ni} onChange={setNi} unit="원" placeholder="50,000,000,000" />
        <NumInput label="자기자본" value={equity} onChange={setEquity} unit="원" placeholder="500,000,000,000" />
        <NumInput label="총자산" value={assets} onChange={setAssets} unit="원" placeholder="1,000,000,000,000" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="ROE" value={fmt(roe)} unit="%" highlight color="#A63D33" /></div>
        <ResultBox label="ROA" value={fmt(roa)} unit="%" />
      </div>
      <CalcNote lines={['ROE = 순이익 ÷ 자기자본 × 100', '워런 버핏 기준: 지속적 15% 이상', 'ROA는 레버리지 효과 배제한 순수 자산 효율성']} />
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
      <CalcHeader num="07" title="듀퐁 분해" desc="ROE를 순이익률 · 자산회전율 · 재무레버리지로 분해합니다." color="#A63D33" />
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
      <CalcNote lines={[
        'ROE = 순이익률 × 총자산회전율 × 재무레버리지',
        '= (순이익/매출) × (매출/자산) × (자산/자본)',
        'ROE가 높아도 레버리지 때문인지 본업 수익성인지 구분 가능',
      ]} />
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
      <CalcHeader num="08" title="마진 분석" desc="매출총이익률 · 영업이익률 · 순이익률을 함께 계산합니다." color="#A63D33" />
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
      <CalcNote lines={['매출총이익률 = (매출-원가) ÷ 매출', '영업이익률 = (매출-원가-판관비) ÷ 매출', '순이익률 = 순이익 ÷ 매출']} />
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
      <CalcHeader num="09" title="손익분기점 (BEP)" desc="손익분기 판매수량과 매출액을 산출합니다." color="#A63D33" />
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
      <CalcNote lines={['BEP(수량) = 고정비 ÷ (가격 - 변동비)', 'BEP(매출) = 고정비 ÷ (1 - 변동비율)', 'BEP 돌파 이후부터 한계이익률만큼 이익 발생']} />
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
      <CalcHeader num="10" title="배당수익률 계산" desc="배당수익률과 세후 실수령액을 산출합니다." color="#C08E6A" />
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
      <CalcNote lines={['배당소득세 15.4% (소득세 14% + 지방세 1.4%)', '금융소득 연 2천만원 초과 시 종합과세 대상']} />
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
      <CalcHeader num="11" title="복리 계산" desc="원금과 월 적립금의 복리 수익을 산출합니다." color="#C08E6A" />
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
      <CalcNote lines={['FV = P(1+r)ⁿ + PMT × [((1+r/12)^(12n) - 1) / (r/12)]', '세금 미반영, 명목 수익률 기준']} />
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
      <CalcHeader num="12" title="CAGR 연평균 복리수익률" desc="시작값과 종료값으로 연평균 성장률을 계산합니다." color="#C08E6A" />
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <NumInput label="시작 값" value={start} onChange={setStart} unit="" placeholder="10,000,000" />
        <NumInput label="종료 값" value={end} onChange={setEnd} unit="" placeholder="25,000,000" />
        <NumInput label="기간" value={years} onChange={setYears} unit="년" placeholder="10" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="CAGR" value={fmt(cagr)} unit="%" highlight color="#C08E6A" /></div>
        <ResultBox label="총 수익률" value={fmt(totalReturn)} unit="%" />
      </div>
      <CalcNote lines={['CAGR = (종료값/시작값)^(1/n) - 1', '총수익률보다 정확한 장기 수익률 비교 지표']} />
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
      <CalcHeader num="13" title="72의 법칙" desc="원금이 2배가 되는 기간 또는 필요 수익률을 추정합니다." color="#C08E6A" />
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
      <CalcNote lines={['72 ÷ 수익률(%) ≈ 원금이 2배가 되는 년수', '수익률 6~10% 범위에서 정확도 높음', '복리의 힘을 직관적으로 이해하는 도구']} />
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
      <CalcHeader num="14" title="평균단가 · 물타기 계산" desc="추가매수 후 평균단가와 평가손익을 산출합니다." color="#8A8A8A" />
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
      <CalcHeader num="15" title="수수료 · 세금 계산" desc="주식 거래 수수료와 증권거래세를 산출합니다." color="#8A8A8A" />
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
      <CalcNote lines={['증권거래세: 코스피/코스닥 0.18% (매도 시)', '수수료율은 증권사마다 상이']} />
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
      <CalcHeader num="16" title="손익분기 주가" desc="수수료·세금 반영한 실제 손익분기 매도가를 계산합니다." color="#8A8A8A" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="매수가" value={buyPrice} onChange={setBuyPrice} unit="원" placeholder="50,000" />
        <NumInput label="수수료율 (편도)" value={feeRate} onChange={setFeeRate} unit="%" placeholder="0.015" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="손익분기 매도가" value={fmt(breakeven, 0)} unit="원" highlight color="#8A8A8A" /></div>
        <ResultBox label="필요 상승률" value={fmt(pctUp)} unit="%" />
      </div>
      <CalcNote lines={['매수 수수료 + 매도 수수료 + 거래세 0.18%를 모두 커버해야 본전', '세전 상승률보다 실제 필요한 상승률이 더 큼']} />
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
      <CalcHeader num="17" title="포지션 사이징" desc="리스크 한도 기준으로 적정 매수 수량을 계산합니다." color="#8A8A8A" />
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
      <CalcNote lines={[
        '수량 = (총자본 × 허용리스크%) ÷ (진입가 - 손절가)',
        '1회 리스크는 총자본의 1~2%가 정석 (2% 룰)',
        '손절 없는 매매는 수량 계산 자체가 불가능',
      ]} />
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
      <CalcHeader num="18" title="선물 손익 계산" desc="KOSPI200 선물 기준 손익을 산출합니다." color="#6B6B6B" />
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
      <CalcNote lines={['KOSPI200 선물 승수: 250,000원', '미니 KOSPI200 선물 승수: 50,000원', '수수료/세금 미포함']} />
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
      <CalcHeader num="19" title="레버리지 · 증거금" desc="필요 증거금과 실질 레버리지를 산출합니다." color="#6B6B6B" />
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
      <CalcNote lines={['KOSPI200 선물 위탁증거금률 약 7.5%', '유지증거금률 미달 시 마진콜 발생']} />
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
      <CalcHeader num="20" title="블랙-숄즈 옵션가" desc="유럽형 옵션의 이론가를 계산합니다." color="#6B6B6B" />
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
      <CalcNote lines={[
        'Call = S·N(d₁) - K·e^(-rT)·N(d₂)',
        'Put = K·e^(-rT)·N(-d₂) - S·N(-d₁)',
        'd₁ = [ln(S/K) + (r + σ²/2)T] / (σ√T)',
        '배당 미반영 버전, 유럽형 옵션 기준',
      ]} />
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
      <CalcHeader num="21" title="옵션 Greeks" desc="델타·감마·세타·베가·로를 동시에 산출합니다." color="#6B6B6B" />
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
      <CalcNote lines={[
        'Delta: 기초자산 1원 변화 시 옵션가격 변화',
        'Gamma: 델타의 변화율, ATM에서 최대',
        'Theta: 시간가치 감소 (일당)',
        'Vega: 변동성 1%p 상승 시 옵션가격 변화',
        'Rho: 금리 1%p 상승 시 옵션가격 변화',
      ]} />
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
      <CalcHeader num="22" title="샤프 · 소티노지수" desc="위험조정수익률을 두 가지 지표로 비교합니다." color="#4F7E7C" />
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
      <CalcNote lines={[
        '샤프 = (Rp - Rf) ÷ 전체 표준편차',
        '소티노 = (Rp - Rf) ÷ 하방편차 (상방 변동성 무시)',
        '1.0 이상 양호 · 2.0 이상 탁월',
        '무위험수익률은 보통 국고채 3년물 사용',
      ]} />
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
      <CalcHeader num="23" title="켈리 공식" desc="장기 기대수익률 극대화를 위한 최적 베팅 비율을 산출합니다." color="#4F7E7C" />
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
      <CalcNote lines={[
        'f = (bp - q) ÷ b · p=승률, q=패율, b=손익비',
        '음수면 기대값이 음수 → 베팅하지 말 것',
        '실전에서는 Half Kelly(1/2) 사용이 안전',
      ]} />
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
      <CalcHeader num="24" title="최대낙폭 (MDD)" desc="고점 대비 최대 하락률과 원금 회복에 필요한 수익률을 계산합니다." color="#4F7E7C" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="고점 (Peak)" value={peak} onChange={setPeak} unit="원" placeholder="100,000,000" />
        <NumInput label="저점 (Trough)" value={trough} onChange={setTrough} unit="원" placeholder="70,000,000" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="MDD" value={fmt(mdd)} unit="%" highlight color="#A63D33" /></div>
        <ResultBox label="회복 필요 수익률" value={fmt(recovery)} unit="%" />
      </div>
      <CalcNote lines={[
        'MDD = (저점 - 고점) ÷ 고점 × 100',
        '-20% 하락 → +25% 회복 필요',
        '-50% 하락 → +100% 회복 필요 (비대칭성)',
        '심리적 감내 한계와 직결되는 핵심 리스크 지표',
      ]} />
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
      <CalcHeader num="25" title="VaR 추정" desc="주어진 신뢰수준에서 예상 최대 손실을 추정합니다." color="#4F7E7C" />
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
      <CalcNote lines={[
        'VaR = 가치 × σ × z × √t (정규분포 가정)',
        '95% 신뢰: z=1.645, 99% 신뢰: z=2.326',
        '"95% 확률로 이 금액 이상 잃지 않는다"는 의미',
      ]} />
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
      <CalcHeader num="26" title="환차손익 계산" desc="외화 매수·매도 시 원화 기준 손익을 산출합니다." color="#7C6A9B" />
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
      <CalcNote lines={[
        '해외주식 투자 시 환율 변동이 수익에 직접 영향',
        '원화 강세 = 수익 축소 / 원화 약세 = 수익 확대',
        '환전 수수료는 별도 차감',
      ]} />
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
      <CalcHeader num="27" title="실질금리 계산" desc="명목금리에서 인플레이션을 차감한 실질 구매력을 계산합니다." color="#7C6A9B" />
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <NumInput label="명목금리" value={nominal} onChange={setNominal} unit="%" placeholder="5" />
        <NumInput label="인플레이션 (CPI)" value={inflation} onChange={setInflation} unit="%" placeholder="3" />
      </div>
      <div className="grid md:grid-cols-2 border" style={{ borderColor: BORDER }}>
        <div className="border-r" style={{ borderColor: BORDER }}><ResultBox label="실질금리 (Fisher)" value={fmt(real, 3)} unit="%" highlight color="#7C6A9B" /></div>
        <ResultBox label="간이 계산" value={fmt(simpleReal)} unit="%" />
      </div>
      <CalcNote lines={[
        'Fisher: (1 + r_real) = (1 + r_nominal) / (1 + π)',
        '간이: r_real ≈ r_nominal - π',
        '실질금리가 음수면 예금 보유 시 구매력 손실',
      ]} />
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
      <CalcHeader num="28" title="채권 가격 계산" desc="액면가 · 쿠폰 · YTM으로 채권의 현재가격을 계산합니다." color="#7C6A9B" />
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
      <CalcNote lines={[
        'P = Σ[C/(1+y)ᵗ] + F/(1+y)ⁿ',
        'YTM > 쿠폰 → 할인채 (가격 < 액면)',
        'YTM < 쿠폰 → 할증채 (가격 > 액면)',
        '금리 상승 시 채권 가격 하락 (역관계)',
      ]} />
    </div>
  );
}
