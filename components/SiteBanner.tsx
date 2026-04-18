'use client';

import { useState } from 'react';
import type { BannerConfig } from '@/lib/config';
import { X } from 'lucide-react';

const COLOR_MAP = {
  gold:  { bg: '#C8965018', border: '#C8965060', text: '#C89650' },
  red:   { bg: '#A63D3318', border: '#A63D3360', text: '#A63D33' },
  teal:  { bg: '#4F7E7C18', border: '#4F7E7C60', text: '#4F7E7C' },
  blue:  { bg: '#4A6FA518', border: '#4A6FA560', text: '#4A6FA5' },
  green: { bg: '#4A704518', border: '#4A704560', text: '#4A7045' },
};

export default function SiteBanner({ banner }: { banner: BannerConfig }) {
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  const c = COLOR_MAP[banner.color] ?? COLOR_MAP.gold;

  return (
    <div className="w-full border-b px-4 py-2 flex items-center justify-between gap-3 text-sm"
      style={{ background: c.bg, borderColor: c.border }}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: c.text }} />
        <span className="truncate" style={{ color: c.text }}>{banner.message}</span>
        {banner.link && (
          <a href={banner.link} target="_blank" rel="noopener"
            className="shrink-0 underline text-[12px] mono"
            style={{ color: c.text }}>
            {banner.linkText ?? '자세히 보기'}
          </a>
        )}
      </div>
      <button onClick={() => setClosed(true)} className="shrink-0 hover:opacity-70" style={{ color: c.text }}>
        <X size={14} />
      </button>
    </div>
  );
}
