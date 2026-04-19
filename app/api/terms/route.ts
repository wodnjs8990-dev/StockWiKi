import { NextRequest, NextResponse } from 'next/server';
import { TERMS, CATEGORY_FAMILY } from '@/data/terms';

// 서버 레벨 캐시 — 모듈 로드 시 1회만 생성
const TERMS_MAP = new Map(TERMS.map(t => [t.id, t]));
const SEARCH_CACHE = TERMS.map(t => ({
  id: t.id,
  n: t.name.toLowerCase(),
  f: t.fullName.toLowerCase(),
  e: t.en.toLowerCase(),
  c: t.category.toLowerCase(),
  family: CATEGORY_FAMILY[t.category]?.family ?? '',
}));

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // 단일 ID 조회
  const singleId = searchParams.get('id');
  if (singleId) {
    const term = TERMS_MAP.get(singleId);
    return NextResponse.json({ items: term ? [term] : [] });
  }

  const q = (searchParams.get('q') || '').toLowerCase().trim();
  const cat = searchParams.get('cat') || '전체';
  const family = searchParams.get('family') || '';
  const favIds = (searchParams.get('favs') || '').split(',').filter(Boolean);
  const page = parseInt(searchParams.get('page') || '0');
  const PAGE_SIZE = 50;

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
  const ids = pageItems.map(c => c.id);
  const items = ids.map(id => TERMS_MAP.get(id)).filter(Boolean);

  return NextResponse.json(
    { items, total, page, hasMore: (page + 1) * PAGE_SIZE < total },
    {
      headers: {
        'Cache-Control': 'no-store',
      }
    }
  );
}
