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
    const patch: any = {};

    if (typeof body.maintenanceMode === 'boolean') {
      patch.maintenanceMode = body.maintenanceMode;
    }
    if (typeof body.maintenanceMessage === 'string') {
      patch.maintenanceMessage = body.maintenanceMessage;
    }
    if (typeof body.maintenanceEndTime === 'string') {
      patch.maintenanceEndTime = body.maintenanceEndTime;
    }

    const ok = await updateSiteConfig(patch);
    if (!ok) {
      return NextResponse.json({ error: 'Config update failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Toggle maintenance error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
