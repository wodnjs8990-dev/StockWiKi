'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin-stk-2026/dashboard');
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || '인증 실패');
      }
    } catch {
      setError('네트워크 오류');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ position: 'relative', zIndex: 1 }}>
      <div className="w-full max-w-sm">

        {/* 헤더 */}
        <div className="mb-8 text-center">
          <div className="text-[10px] mono uppercase tracking-[0.3em] mb-3" style={{ color: 'rgba(255,255,255,.3)', letterSpacing: '.35em' }}>
            § Restricted Access
          </div>
          <h1 className="text-3xl font-light tracking-tight" style={{ color: '#e8e4dc', fontFamily: 'var(--font-mono, monospace)' }}>
            Stock<span style={{ color: '#C89650', fontWeight: 500 }}>WiKi</span>
          </h1>
          <div className="text-[11px] mt-2 mono" style={{ color: 'rgba(255,255,255,.25)', letterSpacing: '.1em' }}>
            인증된 관리자만 접근 가능합니다
          </div>
        </div>

        {/* 로그인 카드 */}
        <div
          className="admin-card p-6"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid transparent',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.09) inset, 0 24px 60px rgba(0,0,0,0.6)',
          } as React.CSSProperties}
        >
          {/* 상단 골드 accent 라인 */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #C89650, transparent)', marginBottom: 24, opacity: 0.7 }} />

          <form onSubmit={handleSubmit}>
            <label className="block mb-5">
              <div className="text-[10px] mono uppercase tracking-[0.25em] mb-2" style={{ color: 'rgba(255,255,255,.35)' }}>
                Password
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                autoFocus
                required
                disabled={loading}
                className="w-full border px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.09)',
                  color: '#e8e4dc',
                  borderRadius: 8,
                  fontFamily: 'var(--font-mono, monospace)',
                } as React.CSSProperties}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(200,150,80,0.55)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(200,150,80,0.12), 0 0 20px rgba(200,150,80,0.10)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </label>

            {error && (
              <div
                className="text-xs mb-5 px-3 py-2.5 mono"
                style={{
                  borderLeft: '2px solid #A63D33',
                  background: 'rgba(166,61,51,0.08)',
                  color: '#E87965',
                  borderRadius: '0 6px 6px 0',
                }}
              >
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-2.5 text-sm mono uppercase tracking-[0.2em] transition-all"
              style={{
                background: loading || !password
                  ? 'rgba(255,255,255,0.05)'
                  : 'linear-gradient(135deg, #d4a255 0%, #C89650 50%, #b8823a 100%)',
                color: loading || !password ? 'rgba(255,255,255,0.2)' : '#0a0a0a',
                cursor: loading || !password ? 'not-allowed' : 'pointer',
                borderRadius: 8,
                fontWeight: 500,
                boxShadow: loading || !password ? 'none' : '0 0 24px rgba(200,150,80,0.35), 0 4px 16px rgba(200,150,80,0.18)',
                border: 'none',
              } as React.CSSProperties}
            >
              {loading ? 'Authenticating...' : 'Enter →'}
            </button>
          </form>
        </div>

        <div className="mt-5 text-center">
          <Link href="/" className="text-[10px] mono uppercase tracking-[0.2em] transition-opacity hover:opacity-100" style={{ color: 'rgba(255,255,255,.2)' }}>
            ← Back to Site
          </Link>
        </div>
      </div>
    </div>
  );
}
