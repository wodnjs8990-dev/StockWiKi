import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export type Deployment = {
  uid: string;
  name: string;
  url: string;
  state: 'READY' | 'ERROR' | 'BUILDING' | 'CANCELED' | 'QUEUED';
  createdAt: number;
  readyAt?: number;
  meta?: {
    githubCommitMessage?: string;
    githubCommitAuthorName?: string;
    githubCommitRef?: string;
    githubCommitSha?: string;
  };
};

export async function GET() {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token) return NextResponse.json({ error: 'VERCEL_API_TOKEN 미설정' }, { status: 500 });

  try {
    const url = projectId
      ? `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=10`
      : `https://api.vercel.com/v6/deployments?limit=10`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      // 프로젝트 ID 없이 팀 전체 조회 → 이름으로 필터
      const data = await res.json();
      return NextResponse.json({ ok: false, error: data.error?.message ?? `HTTP ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    const deployments: Deployment[] = (data.deployments ?? []).slice(0, 10).map((d: any) => ({
      uid: d.uid,
      name: d.name,
      url: d.url,
      state: d.state,
      createdAt: d.createdAt,
      readyAt: d.readyAt,
      meta: d.meta,
    }));

    return NextResponse.json({ ok: true, deployments });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
