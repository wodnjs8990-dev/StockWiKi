import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { updateSiteConfig } from '@/lib/config';

export async function POST(req: Request) {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.features || typeof body.features !== 'object') {
      return NextResponse.json({ error: 'Invalid features' }, { status: 400 });
    }

    const ok = await updateSiteConfig({ features: body.features });
    if (!ok) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Feature toggle error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
