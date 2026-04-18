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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0f0f0f' }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-[10px] mono uppercase tracking-[0.3em] mb-2" style={{ color: '#7a7a7a' }}>§ Restricted</div>
          <h1 className="text-2xl font-light tracking-tight" style={{ color: '#e8e4d6' }}>
            Admin <span style={{ color: '#C89650', fontWeight: 500 }}>Access</span>
          </h1>
          <div className="text-[11px] mt-2" style={{ color: '#5a5a5a' }}>
            인증된 관리자만 접근 가능합니다
          </div>
        </div>

        <form onSubmit={handleSubmit} className="border p-6" style={{ borderColor: '#2a2a2a', background: '#141414' }}>
          <label className="block mb-4">
            <div className="text-[10px] mono uppercase tracking-[0.2em] mb-2" style={{ color: '#7a7a7a' }}>
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
              className="w-full bg-transparent border px-3 py-2 text-sm outline-none"
              style={{ borderColor: '#2a2a2a', color: '#e8e4d6' }}
            />
          </label>

          {error && (
            <div className="text-xs mb-4 px-3 py-2 border-l-2" style={{ borderColor: '#A63D33', background: '#1a0f0f', color: '#E87965' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 text-sm mono uppercase tracking-[0.2em] transition-all"
            style={{
              background: loading || !password ? '#2a2a2a' : '#C89650',
              color: loading || !password ? '#6a6a6a' : '#0a0a0a',
              cursor: loading || !password ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Authenticating...' : 'Enter'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-[10px] mono uppercase tracking-[0.2em]" style={{ color: '#5a5a5a' }}>
            ← Back to Site
          </Link>
        </div>
      </div>
    </div>
  );
}
