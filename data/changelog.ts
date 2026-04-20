export type PatchEntry = {
  version: string;
  date: string;
  title: string;        // 어드민용 기술 타이틀
  titlePublic: string;  // 사용자용 타이틀
  type: 'major' | 'feature' | 'fix' | 'perf';
  items: string[];       // 어드민용 — 기술 세부사항 포함
  itemsPublic: string[]; // 사용자용 — 기능 중심, 친근한 언어
};

export const CHANGELOG: PatchEntry[] = [
  {
    version: '1.64.0',
    date: '2026-04-20',
    title: 'API Route 마이그레이션 & 성능 최적화',
    titlePublic: '속도 개선 & 홈 화면 개편',
    type: 'major',
    items: [
      '용어 데이터를 클라이언트 번들에서 완전 제거 → API Route(/api/terms)로 서버 이전',
      '금융 사전 초기 로딩 속도 대폭 개선 (9,632개 전체 → 50개씩 on-demand)',
      '검색·카테고리·패밀리 필터 모두 API 기반으로 전환',
      'CommandK 빠른 검색도 API 연동으로 교체',
      '폰트 교체: Pretendard Std(본문) + GmarketSans(히어로 타이틀) 자체 호스팅',
      '홈화면 브랜드 문구 전면 업데이트 (기획서 기반)',
      '홈화면 패밀리 카드 레이아웃 정리 — 줄바꿈 제거, 모바일 3×3 그리드',
      'DashboardHome 신규 — Market Strip, Widget Row, Feature Cards, Family 지도, Quick Calc',
      'About 탭 분리 — 기존 스크롤재킹 랜딩 유지',
      'AdminDashboard Changelog 탭 추가',
      '/changelog 공개 페이지 추가 (타임라인 UI)',
    ],
    itemsPublic: [
      '금융 사전 로딩이 훨씬 빨라졌어요 — 필요한 용어만 불러오도록 개선했습니다',
      '홈 화면이 새로워졌어요 — 오늘의 장 상태, 최근 본 용어, 즐겨찾기를 한눈에 확인하세요',
      '실시간 시장 상태 표시 추가 — KOSPI, K200 선물(주간·야간), 나스닥 개장 여부를 상단에서 바로 확인',
      '업데이트 내역 페이지 오픈 — 앞으로의 변경사항을 투명하게 공개합니다',
    ],
  },
  {
    version: '1.57.0',
    date: '2026-04-19',
    title: '금융 사전 9,632개 대확장',
    titlePublic: '금융 용어 9,632개로 대폭 확장',
    type: 'major',
    items: [
      '용어 수 5,261 → 9,632개 (+4,371) — B+C 파일 병합, 중복 시 긴 설명 우선',
      'terms 데이터 파일 분리: 11개 파일로 분할 — Vercel 빌드 타임 단축',
      '무한스크롤 도입: 초기 50개 렌더링, IntersectionObserver로 추가 로딩',
      '빌드 에러 수정: CATEGORIES/HUE_FAMILIES/CATEGORY_COLORS exports 복구',
    ],
    itemsPublic: [
      '금융 용어가 9,632개로 늘어났어요 (+4,371개) — 더 깊고 넓어진 사전을 만나보세요',
      '스크롤하면 자동으로 더 불러오는 무한스크롤 방식으로 개선됐습니다',
    ],
  },
  {
    version: '1.50.0',
    date: '2026-04-10',
    title: 'HomeView 풀스크린 랜딩 씬 전면 재설계',
    titlePublic: '랜딩 화면 전면 새단장',
    type: 'major',
    items: [
      '홈화면 8개 씬(Hero/Philosophy/Numbers/Families/Glossary/Calculator/Calendar/CTA) 스냅 스크롤',
      '트랙패드 모멘텀 감지 — 1스크롤 = 1씬 이동',
      'S4~S6 앱 UI 목업 2단 레이아웃',
      '모바일 전용 레이아웃 — 목업 숨김, 1단 정렬, dots 숨김',
      'FOUC 완전 방지 — hw-ready 클래스 기반 초기 opacity 제어',
    ],
    itemsPublic: [
      '소개 화면이 영화처럼 바뀌었어요 — 스크롤 한 번에 한 씬씩 부드럽게 전환됩니다',
      '모바일에서도 최적화된 레이아웃으로 깔끔하게 보입니다',
    ],
  },
  {
    version: '1.44.0',
    date: '2026-03-28',
    title: '계산기 & 이벤트 캘린더 대폭 확장',
    titlePublic: '계산기 30종 & 이벤트 캘린더 강화',
    type: 'feature',
    items: [
      '계산기 30종으로 확장 — 세금/절세/파생/갭/선물이론가 등 17개 신규',
      'A/B 시나리오 비교 모드 추가',
      'Finnhub 경제지표 캘린더 API 연동 (CPI/NFP/PCE/GDP 등 30+종)',
      '이벤트 캘린더 MACRO·EARNINGS·OPTIONS EXPIRY 탭 분류',
      'S&P500/NDX100 어닝 필터, 섹터별 필터(11개)',
    ],
    itemsPublic: [
      '계산기가 30종으로 늘어났어요 — 양도세, 선물이론가, 갭 계산기 등 17개 신규 추가',
      'A/B 시나리오 비교 기능 추가 — 두 가지 가정을 동시에 놓고 비교해보세요',
      '이벤트 캘린더에 FOMC·CPI·어닝 등 경제지표 일정이 실시간으로 연동됩니다',
      '섹터별·지수별 어닝 필터로 원하는 기업 이벤트만 골라볼 수 있어요',
    ],
  },
  {
    version: '1.32.0',
    date: '2026-03-10',
    title: '금융 사전 2,112개 & UX 개선',
    titlePublic: '용어 2,112개 & 편의기능 대폭 강화',
    type: 'feature',
    items: [
      '용어 1,078 → 2,112개 (+1,034) — 90개 카테고리 9개 그룹 체계',
      '즐겨찾기 메모 기능 추가',
      '용어 비교 기능 (TermModal 내 비교 패널)',
      '계산기 결과 히스토리',
      'CommandK(⌘K) 빠른 검색',
      'TermModal TOC scrollspy, 좌우 키보드 네비게이션',
    ],
    itemsPublic: [
      '금융 용어가 2,112개로 늘어났어요 (+1,034개)',
      '즐겨찾기에 나만의 메모를 남길 수 있어요',
      '용어 카드에서 다른 용어와 나란히 비교할 수 있습니다',
      '⌘K로 어디서든 용어를 빠르게 검색하세요',
      '계산기 결과 히스토리로 이전 계산을 다시 확인할 수 있어요',
    ],
  },
  {
    version: '1.20.0',
    date: '2026-02-20',
    title: '다크/라이트 모드 & 모바일 UX',
    titlePublic: '다크모드 & 모바일 지원',
    type: 'feature',
    items: [
      '다크/라이트 모드 완전 구현 — FOUC 방지 포함',
      '모바일 사이드바 UI, 스와이프 제스처로 닫기',
      '모바일 하단 탭바 추가',
      'Noto Sans KR + JetBrains Mono 자체 호스팅 (Google Fonts 제거)',
      'OG 이미지, Vercel Analytics, ISR 정적 페이지',
    ],
    itemsPublic: [
      '다크모드와 라이트모드를 선택할 수 있어요 — 설정이 자동으로 유지됩니다',
      '모바일에서 더 편하게 — 하단 탭바와 스와이프 제스처를 지원합니다',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-01-15',
    title: '첫 출시',
    titlePublic: '🚀 StockWiKi.kr 오픈',
    type: 'major',
    items: [
      '금융 용어 사전 — 511개 용어, 6그룹 카테고리',
      '계산기 13종 (PER/PBR/ROE/DCF/WACC 등)',
      '어드민 대시보드 (유지보수 모드, 배너, 커스텀 이벤트)',
      '쿠키 배너, Google Analytics GA4',
    ],
    itemsPublic: [
      '전업투자자를 위한 금융 용어 사전 511개 오픈',
      'PER·PBR·ROE·DCF·WACC 등 핵심 계산기 13종 제공',
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0].version;
