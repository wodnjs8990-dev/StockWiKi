'use client';

import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 이미 확인한 경우 표시 안 함
    if (!localStorage.getItem('cookie-consent')) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-5 py-3 border-t"
      style={{
        background: 'rgba(12,12,12,0.97)',
        borderColor: '#2a2a2a',
        backdropFilter: 'blur(8px)',
      }}
    >
      <p className="text-[11px] mono" style={{ color: '#7a7a7a' }}>
        이 사이트는 방문 통계 수집을 위해 쿠키를 사용합니다.{' '}
        <span style={{ color: '#5a5a5a' }}>Google Analytics를 통해 익명으로 수집되며 개인 식별 정보는 포함되지 않습니다.</span>
      </p>
      <button
        onClick={accept}
        className="shrink-0 text-[10px] mono uppercase tracking-[0.2em] px-3 py-1.5 border transition-all hover:bg-white/5"
        style={{ borderColor: '#3a3a3a', color: '#a8a49a' }}
      >
        확인
      </button>
    </div>
  );
}
