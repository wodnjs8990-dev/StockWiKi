export type PatchEntry = {
  version: string;
  date: string;
  title: string;
  type: 'major' | 'feature' | 'fix' | 'perf';
  items: string[];
};

export const CHANGELOG: PatchEntry[] = [
  {
    version: '1.64.0',
    date: '2026-04-20',
    title: 'API Route 마이그레이션 & 성능 최적화',
    type: 'major',
    items: [
      '용어 데이터를 클라이언트 번들에서 완전 제거 → API Route(/api/terms)로 서버 이전',
      '금융 사전 초기 로딩 속도 대폭 개선 (9,632개 전체 → 50개씩 on-demand)',
      '검색·카테고리·패밀리 필터 모두 API 기반으로 전환',
      'CommandK 빠른 검색도 API 연동으로 교체',
      '폰트 교체: Pretendard Std(본문) + GmarketSans(히어로 타이틀) 자체 호스팅',
      '홈화면 브랜드 문구 전면 업데이트 (기획서 기반)',
      '홈화면 패밀리 카드 레이아웃 정리 — 줄바꿈 제거, 모바일 3×3 그리드',
    ],
  },
  {
    version: '1.57.0',
    date: '2026-04-19',
    title: '금융 사전 9,632개 대확장',
    type: 'major',
    items: [
      '용어 수 5,261 → 9,632개 (+4,371) — B+C 파일 병합, 중복 시 긴 설명 우선',
      'terms 데이터 파일 분리: 11개 파일로 분할 — Vercel 빌드 타임 단축',
      '무한스크롤 도입: 초기 50개 렌더링, IntersectionObserver로 추가 로딩',
      '빌드 에러 수정: CATEGORIES/HUE_FAMILIES/CATEGORY_COLORS exports 복구',
    ],
  },
  {
    version: '1.50.0',
    date: '2026-04-10',
    title: 'HomeView 풀스크린 랜딩 씬 전면 재설계',
    type: 'major',
    items: [
      '홈화면 8개 씬(Hero/Philosophy/Numbers/Families/Glossary/Calculator/Calendar/CTA) 스냅 스크롤',
      '트랙패드 모멘텀 감지 — 1스크롤 = 1씬 이동',
      'S4~S6 앱 UI 목업 2단 레이아웃',
      '모바일 전용 레이아웃 — 목업 숨김, 1단 정렬, dots 숨김',
      'FOUC 완전 방지 — hw-ready 클래스 기반 초기 opacity 제어',
    ],
  },
  {
    version: '1.44.0',
    date: '2026-03-28',
    title: '계산기 & 이벤트 캘린더 대폭 확장',
    type: 'feature',
    items: [
      '계산기 30종으로 확장 — 세금/절세/파생/갭/선물이론가 등 17개 신규',
      'A/B 시나리오 비교 모드 추가',
      'Finnhub 경제지표 캘린더 API 연동 (CPI/NFP/PCE/GDP 등 30+종)',
      '이벤트 캘린더 MACRO·EARNINGS·OPTIONS EXPIRY 탭 분류',
      'S&P500/NDX100 어닝 필터, 섹터별 필터(11개)',
    ],
  },
  {
    version: '1.32.0',
    date: '2026-03-10',
    title: '금융 사전 2,112개 & UX 개선',
    type: 'feature',
    items: [
      '용어 1,078 → 2,112개 (+1,034) — 90개 카테고리 9개 그룹 체계',
      '즐겨찾기 메모 기능 추가',
      '용어 비교 기능 (TermModal 내 비교 패널)',
      '계산기 결과 히스토리',
      'CommandK(⌘K) 빠른 검색',
      'TermModal TOC scrollspy, 좌우 키보드 네비게이션',
    ],
  },
  {
    version: '1.20.0',
    date: '2026-02-20',
    title: '다크/라이트 모드 & 모바일 UX',
    type: 'feature',
    items: [
      '다크/라이트 모드 완전 구현 — FOUC 방지 포함',
      '모바일 사이드바 UI, 스와이프 제스처로 닫기',
      '모바일 하단 탭바 추가',
      'Noto Sans KR + JetBrains Mono 자체 호스팅 (Google Fonts 제거)',
      'OG 이미지, Vercel Analytics, ISR 정적 페이지',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-01-15',
    title: '첫 출시',
    type: 'major',
    items: [
      '금융 용어 사전 — 511개 용어, 6그룹 카테고리',
      '계산기 13종 (PER/PBR/ROE/DCF/WACC 등)',
      '어드민 대시보드 (유지보수 모드, 배너, 커스텀 이벤트)',
      '쿠키 배너, Google Analytics GA4',
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0].version;
