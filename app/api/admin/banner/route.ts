import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { get } from '@vercel/edge-config';

export const dynamic = 'force-dynamic';

export type BannerConfig = {
  enabled: boolean;
  message: string;
  color: 'gold' | 'red' | 'teal' | 'blue' | 'green';
  expiresAt?: string; // ISO string
  link?: string;
  linkText?: string;
};

const DEFAULT_BANNER: BannerConfig = {
  enabled: false,
  message: '',
  color: 'gold',
};

export async function GET() {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const banner = await get<BannerConfig>('banner');
    return NextResponse.json(banner ?? DEFAULT_BANNER);
  } catch {
    return NextResponse.json(DEFAULT_BANNER);
  }
}

export async function POST(req: NextRequest) {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const token = process.env.VERCEL_API_TOKEN;
  if (!edgeConfigId || !token) return NextResponse.json({ error: 'Edge Config 미설정' }, { status: 500 });

  const body: BannerConfig = await req.json();

  const res = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ operation: 'upsert', key: 'banner', value: body }] }),
  });

  if (!res.ok) return NextResponse.json({ error: '저장 실패' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
