// Vercel Edge Config: 전체 사이트 설정 실시간 관리
// 읽기는 get(), 쓰기는 Vercel API 직접 호출

import { get } from '@vercel/edge-config';

export type SiteConfig = {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  maintenanceEndTime?: string; // ISO string
  features: {
    glossary: boolean;
    calculator: boolean;
    commandK: boolean;
  };
};

const DEFAULT_CONFIG: SiteConfig = {
  maintenanceMode: false,
  maintenanceMessage: '더 나은 서비스 제공을 위해 시스템을 점검하고 있습니다.',
  features: {
    glossary: true,
    calculator: true,
    commandK: true,
  },
};

// 읽기: 전 세계 엣지에서 5ms 이내
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const config = await get<SiteConfig>('siteConfig');
    if (!config) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...config };
  } catch (e) {
    console.error('Edge Config read failed:', e);
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
