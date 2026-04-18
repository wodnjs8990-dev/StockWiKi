import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { get } from '@vercel/edge-config';

export const dynamic = 'force-dynamic';

export type LoginRecord = {
  at: string;       // ISO
  ip: string;
  ua: string;       // user-agent 짧게
  success: boolean;
};

const MAX_RECORDS = 50;

async function getHistory(): Promise<LoginRecord[]> {
  try {
    return (await get<LoginRecord[]>('loginHistory')) ?? [];
  } catch {
    return [];
  }
}

export async function saveLoginRecord(record: LoginRecord): Promise<void> {
  try {
    const edgeConfigId = process.env.EDGE_CONFIG_ID;
    const token = process.env.VERCEL_API_TOKEN;
    if (!edgeConfigId || !token) return;

    const history = await getHistory();
    const updated = [record, ...history].slice(0, MAX_RECORDS);

    await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ operation: 'upsert', key: 'loginHistory', value: updated }] }),
    });
  } catch { /* silent */ }
}

export async function GET(req: NextRequest) {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const history = await getHistory();
  return NextResponse.json(history);
}
