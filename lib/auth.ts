import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'stk_admin_session';
const SESSION_DURATION = 60 * 60 * 24; // 24 hours
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DEV_JWT_SECRET = 'stockwiki-local-development-secret';

function getSecretKey() {
  const secret = process.env.ADMIN_JWT_SECRET || (!IS_PRODUCTION ? DEV_JWT_SECRET : '');
  if (!secret) throw new Error('ADMIN_JWT_SECRET not set');
  return new TextEncoder().encode(secret);
}

export function getAdminAuthStatus() {
  const hasPasswordHash = Boolean(process.env.ADMIN_PASSWORD_HASH);
  const hasDevPassword = !IS_PRODUCTION && Boolean(process.env.ADMIN_DEV_PASSWORD);
  const hasJwtSecret = Boolean(process.env.ADMIN_JWT_SECRET) || !IS_PRODUCTION;

  return {
    configured: (hasPasswordHash || hasDevPassword) && hasJwtSecret,
    hasPasswordHash,
    hasDevPassword,
    hasJwtSecret,
  };
}

// 비밀번호 검증: 사용자가 입력한 비밀번호와 해시 비교
export async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
  const devPassword = !IS_PRODUCTION ? process.env.ADMIN_DEV_PASSWORD : undefined;
  if (!hash && !devPassword) {
    console.error('Admin password not configured');
    return false;
  }
  try {
    if (hash) return await bcrypt.compare(password, hash);
    return password === devPassword;
  } catch (e) {
    console.error('Password verify failed:', e);
    return false;
  }
}

// JWT 토큰 생성
export async function createSessionToken(): Promise<string> {
  return await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecretKey());
}

// JWT 토큰 검증
export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

// 쿠키에 세션 저장
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'strict',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

// 쿠키에서 세션 확인
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return await verifySessionToken(token);
}

// 로그아웃
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE };
