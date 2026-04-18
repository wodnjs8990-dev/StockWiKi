import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { revalidatePath, revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

const CACHE_TARGETS = [
  { id: 'macro-calendar', label: '거시경제 캘린더', path: '/api/macro-calendar' },
  { id: 'events',         label: '이벤트 캘린더',   path: '/api/events' },
  { id: 'earnings',       label: '어닝 캘린더',      path: '/api/earnings' },
  { id: 'home',           label: '메인 페이지',       path: '/' },
  { id: 'all',            label: '전체 캐시',         path: null },
] as const;

export type CacheTarget = typeof CACHE_TARGETS[number]['id'];

export async function GET() {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ targets: CACHE_TARGETS });
}

export async function POST(req: NextRequest) {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { targetId } = await req.json();
  const revalidatedAt = new Date().toISOString();

  try {
    if (targetId === 'all') {
      revalidatePath('/', 'layout');
      return NextResponse.json({ ok: true, revalidatedAt, message: '전체 캐시 무효화 완료' });
    }

    const target = CACHE_TARGETS.find(t => t.id === targetId);
    if (!target) return NextResponse.json({ error: '알 수 없는 대상' }, { status: 400 });

    if (target.path) revalidatePath(target.path);
    return NextResponse.json({ ok: true, revalidatedAt, message: `${target.label} 캐시 무효화 완료` });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
