// Vercel Edge Config: 전체 사이트 설정 실시간 관리
// 읽기는 get(), 쓰기는 Vercel API 직접 호출

import { get } from '@vercel/edge-config';

// ── 배너 타입
export type BannerConfig = {
  enabled: boolean;
  message: string;
  color: 'gold' | 'red' | 'teal' | 'blue' | 'green';
  expiresAt?: string;
  link?: string;
  linkText?: string;
};

// ── 커스텀 이벤트 타입
export type CustomEvent = {
  id: string;
  date: string;
  label: string;
  desc: string;
  color: string;
  createdAt: string;
};

// ── 배너 읽기
export async function getBanner(): Promise<BannerConfig | null> {
  if (!process.env.EDGE_CONFIG) return null;
  try {
    const banner = await get<BannerConfig>('banner');
    if (!banner || !banner.enabled) return null;
    // 만료 시각 체크
    if (banner.expiresAt && new Date(banner.expiresAt) < new Date()) return null;
    return banner;
  } catch {
    return null;
  }
}

// ── 커스텀 이벤트 읽기
export async function getCustomEvents(): Promise<CustomEvent[]> {
  if (!process.env.EDGE_CONFIG) return [];
  try {
    return (await get<CustomEvent[]>('customEvents')) ?? [];
  } catch {
    return [];
  }
}

export type SiteConfig = {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  maintenanceEndTime?: string; // ISO string
  features: {
    glossary: boolean;
    calculator: boolean;
    commandK: boolean;
    events: boolean;
  };
};

const DEFAULT_CONFIG: SiteConfig = {
  maintenanceMode: false,
  maintenanceMessage: '더 나은 서비스 제공을 위해 시스템을 점검하고 있습니다.',
  features: {
    glossary: true,
    calculator: true,
    commandK: true,
    events: true,
  },
};

// 읽기: 전 세계 엣지에서 5ms 이내
export async function getSiteConfig(): Promise<SiteConfig> {
  if (!process.env.EDGE_CONFIG) return DEFAULT_CONFIG;
  try {
    const config = await get<SiteConfig>('siteConfig');
    if (!config) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...config };
  } catch {
    return DEFAULT_CONFIG;
  }
}

// 쓰기: Vercel API 직접 호출 (관리자 페이지에서만)
export async function updateSiteConfig(patch: Partial<SiteConfig>): Promise<boolean> {
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const token = process.env.VERCEL_API_TOKEN;
  if (!edgeConfigId || !token) {
    console.error('Edge Config not configured');
    return false;
  }

  try {
    const current = await getSiteConfig();
    const next = { ...current, ...patch };

    const res = await fetch(
      `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'upsert',
              key: 'siteConfig',
              value: next,
            },
          ],
        }),
      }
    );

    return res.ok;
  } catch (e) {
    console.error('Edge Config update failed:', e);
    return false;
  }
}
