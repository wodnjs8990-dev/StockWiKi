import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { get } from '@vercel/edge-config';

export const dynamic = 'force-dynamic';

export type CustomEvent = {
  id: string;
  date: string;       // YYYY-MM-DD
  label: string;      // 짧은 레이블 (최대 6자)
  desc: string;       // 설명
  color: string;      // hex
  createdAt: string;  // ISO
};

async function getEvents(): Promise<CustomEvent[]> {
  try {
    return (await get<CustomEvent[]>('customEvents')) ?? [];
  } catch {
    return [];
  }
}

async function saveEvents(events: CustomEvent[]): Promise<boolean> {
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const token = process.env.VERCEL_API_TOKEN;
  if (!edgeConfigId || !token) return false;

  const res = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ operation: 'upsert', key: 'customEvents', value: events }] }),
  });
  return res.ok;
}

export async function GET() {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await getEvents());
}

export async function POST(req: NextRequest) {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action, event, id } = body;

  const events = await getEvents();

  if (action === 'add') {
    const newEvent: CustomEvent = {
      id: `custom_${Date.now()}`,
      date: event.date,
      label: event.label.slice(0, 8),
      desc: event.desc,
      color: event.color ?? '#C89650',
      createdAt: new Date().toISOString(),
    };
    const ok = await saveEvents([...events, newEvent]);
    return NextResponse.json({ ok, event: newEvent });
  }

  if (action === 'delete') {
    const ok = await saveEvents(events.filter(e => e.id !== id));
    return NextResponse.json({ ok });
  }

  if (action === 'update') {
    const ok = await saveEvents(events.map(e => e.id === id ? { ...e, ...event } : e));
    return NextResponse.json({ ok });
  }

  return NextResponse.json({ error: '알 수 없는 action' }, { status: 400 });
}
