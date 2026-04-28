/** @type {import('next').NextConfig} */
const { version } = require('./package.json');

// CSP 정책 — Google Fonts / Analytics / Vercel Insights 허용
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com;
  connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://vitals.vercel-insights.com https://edge-config.vercel.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\n/g, ' ').trim();

const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  // Force fresh build ID to bypass Vercel's stale CSS cache
  generateBuildId: async () => {
    return `build-v2-${Date.now()}`;
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  compress: true,
  // 소스맵 배포 — Lighthouse 진단 개선, 프로덕션 디버깅 용이
  productionBrowserSourceMaps: true,
  // 번들 최적화
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // ① XSS 공격 방지 CSP
          { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
          // ② HSTS — 1년 + subdomains + preload
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          // ③ COOP — 출처 분리 보장
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          // ④ DOM 기반 XSS 완화 (Trusted Types)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // 정적 자산 1년 캐싱
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
