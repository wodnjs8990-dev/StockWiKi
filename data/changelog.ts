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
    version: '1.70.0',
    date: '2026-04-20',
    title: '금융 사전 12,136개 산업군 초대규모 확장',
    titlePublic: '금융 용어 12,136개로 대폭 확장',
    type: 'major',
    items: [
      '용어 수 9,632 → 12,136개 (+2,504) — 산업군 특화 용어 초대규모 추가',
      'terms-industry-a.ts: +1,279개 (AI·반도체 / 소비재·리테일·자동차 / 소프트웨어·인터넷 / AI인프라·클라우드 / SaaS·플랫폼)',
      'terms-industry-b.ts: +974개 (에너지·전력·인프라 / 산업재·방산·물류 / 반도체 공급망 심화)',
      'terms-industry-c.ts: +249개 (헬스케어·바이오 심화 / 은행·보험 심화)',
      'TERMS_TOTAL 상수 9632 → 12136 업데이트',
      '카테고리 90 → 91개 (신규: 반도체 공급망 심화 등)',
    ],
    itemsPublic: [
      '금융 용어가 12,136개로 늘어났어요 (+2,504개) — 역대 최대 규모 업데이트',
      'AI·반도체, 산업재·방산·물류, 에너지·전력, 헬스케어·바이오, 은행·보험 등 산업군 특화 용어 대폭 강화',
      '반도체 공급망 심화, SaaS·플랫폼 지표, AI 인프라·클라우드 등 신규 카테고리 추가',
    ],
  },
  {
    version: '1.64.0',
    date: '2026-04-20',
    title: 'API Route 마이그레이션 & 성능 최적화 & DashboardHome 신규',
    titlePublic: '속도 개선 & 홈 화면 개편',
    type: 'major',
    items: [
      '용어 데이터를 클라이언트 번들에서 완전 제거 → API Route(/api/terms)로 서버 이전 (12,136개 전체 번들 → 50개씩 on-demand)',
      '검색·카테고리·패밀리 필터 모두 /api/terms?q=&cat=&family=&page= 기반 전환',
      'CommandK 빠른 검색 API 연동 (기존 클라이언트 useMemo 방식 → fetch)',
      '폰트 교체: Pretendard Std(본문) + GmarketSans(히어로 타이틀) 자체 호스팅 — Google Fonts 의존 완전 제거',
      'DashboardHome.tsx 신규 작성 — Market Strip(KOSPI/NXT/K200F 주간야간/NDX 실시간), Widget Row(날짜·장상태·KST시계·최근용어·즐겨찾기·계산기록), Feature Cards(4), 5 Hue Family 지도, Quick Calc 7종',
      'StockWiki.tsx: About 탭 추가 — 기존 HomeView(스크롤재킹 랜딩) About으로 이동, home 탭 → DashboardHome 렌더링',
      'AdminDashboard Changelog 탭 추가 — title/items(기술용) vs titlePublic/itemsPublic(사용자용) 이중 구조',
      '/patch-notes 공개 패치노트 페이지 추가 — 타임라인 UI, 모바일 반응형, itemsPublic 기반',
      '모바일 사이드바 패치노트 링크 추가 + v{CURRENT_VERSION} 뱃지',
      'CURRENT_VERSION import from @/data/changelog — single source of truth',
      'DashboardHome Market Strip KST 시계 → 날짜 위젯으로 이동 (중복 제거)',
      'DashboardHome 모바일 overflow-x: hidden 처리 — 좌우 스크롤 방지',
    ],
    itemsPublic: [
      '금융 사전 로딩이 훨씬 빨라졌어요 — 필요한 용어만 불러오도록 개선했습니다',
      '홈 화면이 새로워졌어요 — 오늘의 장 상태·시간, 최근 본 용어, 즐겨찾기를 한눈에 확인하세요',
      '상단에서 KOSPI·K200 선물(주간·야간)·나스닥 개장 여부를 실시간으로 확인할 수 있어요',
      '패치노트 페이지 오픈 — 앞으로의 변경사항을 투명하게 공개합니다',
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
