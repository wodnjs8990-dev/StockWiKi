import { NextResponse } from 'next/server';
import { verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth';

// 단순 레이트 리미트: IP별 실패 추적 (메모리 기반)
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15분

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const now = Date.now();

  // 레이트 리미트 체크
  const record = failedAttempts.get(ip);
  if (record && now < record.resetAt && record.count >= MAX_ATTEMPTS) {
    const wait = Math.ceil((record.resetAt - now) / 1000 / 60);
    return NextResponse.json(
      { error: `너무 많은 실패 시도. ${wait}분 후 다시 시도하세요.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const password = body?.password;
    if (typeof password !== 'string' || !password) {
      return NextResponse.json({ error: '비밀번호를 입력하세요' }, { status: 400 });
    }

    const ok = await verifyPassword(password);
    if (!ok) {
      // 실패 기록
      const next = record && now < record.resetAt
        ? { count: record.count + 1, resetAt: record.resetAt }
        : { count: 1, resetAt: now + WINDOW_MS };
      failedAttempts.set(ip, next);

      // 타이밍 공격 방어: 일정 지연
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
      return NextResponse.json({ error: '비밀번호가 올바르지 않습니다' }, { status: 401 });
    }

    // 성공 시 실패 기록 리셋
    failedAttempts.delete(ip);

    // JWT 발급 & 쿠키 저장
    const token = await createSessionToken();
    await setSessionCookie(token);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
