import { NextRequest, NextResponse } from 'next/server';
import { TERMS, CATEGORY_FAMILY } from '@/data/terms';

// ── 서버 레벨 캐시 — 모듈 로드 시 1회만 생성 ──
const TERMS_MAP = new Map(TERMS.map(t => [t.id, t]));

// 검색용 경량 인덱스 (description/formula/example 제외)
const SEARCH_CACHE = TERMS.map(t => ({
  id: t.id,
  n: t.name.toLowerCase(),
  f: (t.fullName || '').toLowerCase(),
  e: (t.en || '').toLowerCase(),
  c: t.category.toLowerCase(),
  family: CATEGORY_FAMILY[t.category]?.family ?? '',
}));

// 리스트 카드용 경량 객체 — description 등 무거운 필드 제외
// (카드에는 name/fullName/en/category/id만 필요, 상세는 단일 ID 조회로)
const LIGHT_MAP = new Map(TERMS.map(t => ({
  id: t.id,
  name: t.name,
  fullName: t.fullName || t.name,
  en: t.en || '',
  category: t.category,
  group: (t as any).group || '',
  related: (t as any).related || [],
})). map(t => [t.id, t]));

const PAGE_SIZE = 40; // 50→40: 초기 로드 속도 개선

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // ── 단일 ID 조회 (상세 모달용) — 전체 필드 반환
  const singleId = searchParams.get('id');
  if (singleId) {
    const term = TERMS_MAP.get(singleId);
    return NextResponse.json(
      { items: term ? [term] : [] },
      { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' } }
    );
  }

  const q = (searchParams.get('q') || '').toLowerCase().trim();
  const cat = searchParams.get('cat') || '전체';
  const family = searchParams.get('family') || '';
  const favIds = (searchParams.get('favs') || '').split(',').filter(Boolean);
  const page = parseInt(searchParams.get('page') || '0');

  const isFavCat = cat === '★ 즐겨찾기';
  const isAll = cat === '전체';
  const catLower = cat.toLowerCase();
  const favSet = new Set(favIds);

  const filtered = SEARCH_CACHE.filter(c => {
    const matchSearch = !q || c.n.includes(q) || c.f.includes(q) || c.e.includes(q) || c.c.includes(q);
    const matchCat = isAll || (isFavCat && favSet.has(c.id)) || c.c === catLower;
    const matchFamily = !family || c.family === family;
    return matchSearch && matchCat && matchFamily;
  });

  const total = filtered.length;
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  // 리스트에선 경량 객체만 반환
  const items = pageItems.map(c => LIGHT_MAP.get(c.id)).filter(Boolean);

  // 검색어 있을 때는 캐싱 짧게, 없을 때는 길게
  const cacheHeader = q
    ? 'public, max-age=60, stale-while-revalidate=300'
    : 'public, max-age=3600, stale-while-revalidate=86400';

  return NextResponse.json(
    { items, total, page, hasMore: (page + 1) * PAGE_SIZE < total },
    { headers: { 'Cache-Control': cacheHeader } }
  );
}
