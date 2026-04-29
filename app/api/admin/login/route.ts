import { NextResponse } from 'next/server';
import { verifyPassword, createSessionToken, setSessionCookie, getAdminAuthStatus } from '@/lib/auth';
import { saveLoginRecord } from '@/app/api/admin/login-history/route';

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
  const authStatus = getAdminAuthStatus();

  if (!authStatus.configured) {
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === 'production'
          ? '관리자 인증 환경변수가 설정되지 않았습니다'
          : '로컬 관리자 비밀번호가 설정되지 않았습니다. .env.local에 ADMIN_DEV_PASSWORD를 추가하거나 ADMIN_PASSWORD_HASH를 설정하세요.',
      },
      { status: 503 }
    );
  }

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

    const ua = req.headers.get('user-agent') ?? 'unknown';
    const uaShort = ua.slice(0, 80);

    const ok = await verifyPassword(password);
    if (!ok) {
      // 실패 기록
      const next = record && now < record.resetAt
        ? { count: record.count + 1, resetAt: record.resetAt }
        : { count: 1, resetAt: now + WINDOW_MS };
      failedAttempts.set(ip, next);

      // 로그인 이력 기록 (실패)
      saveLoginRecord({ at: new Date().toISOString(), ip, ua: uaShort, success: false }).catch(() => {});

      // 타이밍 공격 방어: 일정 지연
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
      return NextResponse.json({ error: '비밀번호가 올바르지 않습니다' }, { status: 401 });
    }

    // 성공 시 실패 기록 리셋
    failedAttempts.delete(ip);

    // 로그인 이력 기록 (성공)
    saveLoginRecord({ at: new Date().toISOString(), ip, ua: uaShort, success: true }).catch(() => {});

    // JWT 발급 & 쿠키 저장
    const token = await createSessionToken();
    await setSessionCookie(token);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
