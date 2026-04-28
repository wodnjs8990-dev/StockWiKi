import type { HueFamily, FamilyToken } from './types';

export const HUE_FAMILIES: Record<HueFamily, FamilyToken> = {
  fundamental: { base: '#c8a96e', bg: '#c8a96e22', text: '#0a0a0a', tones: ['#c8a96e', '#b8956a', '#a87f5a', '#987050'] },
  market:      { base: '#6ea8c8', bg: '#6ea8c822', text: '#0a0a0a', tones: ['#6ea8c8', '#5a95b8', '#4a82a8', '#3a6f98'] },
  macro:       { base: '#8bc87a', bg: '#8bc87a22', text: '#0a0a0a', tones: ['#8bc87a', '#78b568', '#65a256', '#528f44'] },
  risk:        { base: '#c87a8b', bg: '#c87a8b22', text: '#0a0a0a', tones: ['#c87a8b', '#b56878', '#a25665', '#8f4452'] },
  derivatives: { base: '#9a7ac8', bg: '#9a7ac822', text: '#0a0a0a', tones: ['#9a7ac8', '#8868b5', '#7656a2', '#64448f'] },
  trading:     { base: '#c8b47a', bg: '#c8b47a22', text: '#0a0a0a', tones: ['#c8b47a', '#b5a168', '#a28e56', '#8f7b44'] },
  industry:    { base: '#7ac8c0', bg: '#7ac8c022', text: '#0a0a0a', tones: ['#7ac8c0', '#68b5ad', '#56a29a', '#448f87'] },
  digital:     { base: '#c87ab4', bg: '#c87ab422', text: '#0a0a0a', tones: ['#c87ab4', '#b568a1', '#a2568e', '#8f447b'] },
  tax:         { base: '#a8c87a', bg: '#a8c87a22', text: '#0a0a0a', tones: ['#a8c87a', '#95b568', '#82a256', '#6f8f44'] },
};

export const CATEGORY_FAMILY: Record<string, { family: HueFamily; tone: 0 | 1 | 2 | 3 }> = {
  '기업재무': { family: 'fundamental', tone: 0 },
  '기업재무·자본시장': { family: 'fundamental', tone: 1 },
  '배당': { family: 'fundamental', tone: 2 },
  '밸류에이션': { family: 'fundamental', tone: 3 },
  '밸류에이션 심화': { family: 'fundamental', tone: 0 },
  '손익계산서 심화': { family: 'fundamental', tone: 1 },
  '수익성': { family: 'fundamental', tone: 2 },
  '신용·재무안정성 심화': { family: 'fundamental', tone: 3 },
  '자본배분·주주환원': { family: 'fundamental', tone: 0 },
  '재무안정성': { family: 'fundamental', tone: 1 },
  '재무제표 기본': { family: 'fundamental', tone: 2 },
  '지배구조·주주권': { family: 'fundamental', tone: 3 },
  '현금흐름 심화': { family: 'fundamental', tone: 0 },
  '현금흐름·운전자본': { family: 'fundamental', tone: 1 },
  '회계·재무제표': { family: 'fundamental', tone: 2 },
  '회계·재무제표 심화': { family: 'fundamental', tone: 3 },
  '회계심화': { family: 'fundamental', tone: 0 },
  '효율성·운전자본': { family: 'fundamental', tone: 1 },
  'ETF 구조·상품': { family: 'market', tone: 0 },
  'ETF·상장상품': { family: 'market', tone: 1 },
  'ETF·펀드 심화': { family: 'market', tone: 2 },
  '거래제도·주문유형 심화': { family: 'market', tone: 3 },
  '공시·기업행동 심화': { family: 'market', tone: 0 },
  '기업 이벤트·자본시장': { family: 'market', tone: 1 },
  '시장거래': { family: 'market', tone: 2 },
  '시장거래 기본': { family: 'market', tone: 3 },
  '시장구조·유동성': { family: 'market', tone: 0 },
  '시장미시구조': { family: 'market', tone: 1 },
  '한국시장': { family: 'market', tone: 2 },
  '한국시장 실전·파생': { family: 'market', tone: 3 },
  '해외시장·지수': { family: 'market', tone: 3 },
  '거시지표 심화': { family: 'macro', tone: 0 },
  '경제지표·서베이 심화': { family: 'macro', tone: 1 },
  '고용·소비·생산': { family: 'macro', tone: 2 },
  '국제금융·환율 심화': { family: 'macro', tone: 3 },
  '국채·수익률곡선 심화': { family: 'macro', tone: 0 },
  '금융위기·신용': { family: 'macro', tone: 1 },
  '물가·인플레이션': { family: 'macro', tone: 2 },
  '미시경제': { family: 'macro', tone: 3 },
  '부동산·주택지표': { family: 'macro', tone: 0 },
  '성장·경기순환': { family: 'macro', tone: 1 },
  '신용시장·스프레드': { family: 'macro', tone: 2 },
  '유동성·자금시장': { family: 'macro', tone: 3 },
  '재정·국가경제': { family: 'macro', tone: 0 },
  '중앙은행·통화정책 심화': { family: 'macro', tone: 1 },
  '채권·금리위험': { family: 'macro', tone: 2 },
  '통화정책·금리': { family: 'macro', tone: 3 },
  '환율·대외수지': { family: 'macro', tone: 0 },
  '모델리스크·백테스트 검증': { family: 'risk', tone: 0 },
  '성과·리스크관리': { family: 'risk', tone: 1 },
  '성과평가·트레이딩 통계': { family: 'risk', tone: 2 },
  '위험관리 운영': { family: 'risk', tone: 3 },
  '퀀트통계': { family: 'risk', tone: 0 },
  '퀀트·백테스트·리스크': { family: 'risk', tone: 1 },
  '리스크·포지션관리 심화': { family: 'risk', tone: 2 },
  '포트폴리오': { family: 'risk', tone: 3 },
  '포트폴리오 최적화 심화': { family: 'risk', tone: 0 },
  '금리·크레딧 파생': { family: 'derivatives', tone: 0 },
  '변동성·분산 파생': { family: 'derivatives', tone: 1 },
  '선물·옵션 기초': { family: 'derivatives', tone: 2 },
  '선물옵션': { family: 'derivatives', tone: 3 },
  '옵션·선물 심화': { family: 'derivatives', tone: 0 },
  '옵션전략 심화': { family: 'derivatives', tone: 1 },
  '옵션전략·포지션관리': { family: 'derivatives', tone: 2 },
  '옵션전략·변동성 고급': { family: 'derivatives', tone: 3 },
  '옵션그릭스·민감도': { family: 'derivatives', tone: 0 },
  '옵션 변동성·스큐': { family: 'derivatives', tone: 1 },
  '선물·옵션 실행·증거금': { family: 'derivatives', tone: 2 },
  '선물·파생 실행·청산': { family: 'derivatives', tone: 3 },
  '원자재·외환 파생': { family: 'derivatives', tone: 0 },
  '파생헤지': { family: 'derivatives', tone: 3 },
  '가격행동·시장국면': { family: 'trading', tone: 0 },
  '기술적 지표': { family: 'trading', tone: 1 },
  '기술적지표': { family: 'trading', tone: 2 },
  '기술적지표 심화': { family: 'trading', tone: 3 },
  '기술적지표·오실레이터 고급': { family: 'trading', tone: 0 },
  '매매실전 기본': { family: 'trading', tone: 1 },
  '매크로·금리·채권 트레이딩': { family: 'trading', tone: 2 },
  '실행·오더플로우 심화': { family: 'trading', tone: 3 },
  '오더플로우·실행관리': { family: 'trading', tone: 0 },
  '오더플로우·호가창 심화': { family: 'trading', tone: 1 },
  '오더플로우·시장미시구조': { family: 'trading', tone: 2 },
  '차트패턴·가격행동': { family: 'trading', tone: 3 },
  '차트패턴·가격행동 심화': { family: 'trading', tone: 0 },
  '차트패턴·프라이스액션 고급': { family: 'trading', tone: 1 },
  '투자심리·행동편향': { family: 'trading', tone: 2 },
  '트레이딩 운영·프로세스': { family: 'trading', tone: 3 },
  'AI 인프라·클라우드': { family: 'industry', tone: 0 },
  'AI·반도체': { family: 'industry', tone: 1 },
  'SaaS·플랫폼 지표': { family: 'industry', tone: 2 },
  '금융·에너지·바이오': { family: 'industry', tone: 3 },
  '반도체 공급망 심화': { family: 'industry', tone: 0 },
  '산업재·방산·물류': { family: 'industry', tone: 1 },
  '소비재·리테일·자동차': { family: 'industry', tone: 2 },
  '소프트웨어·인터넷 지표': { family: 'industry', tone: 3 },
  '에너지·전력·인프라': { family: 'industry', tone: 0 },
  '은행·보험 심화': { family: 'industry', tone: 1 },
  '헬스케어·바이오 심화': { family: 'industry', tone: 2 },
  'DeFi·시장구조 심화': { family: 'digital', tone: 0 },
  '디지털자산 리스크·규제': { family: 'digital', tone: 1 },
  '디지털자산·토큰화': { family: 'digital', tone: 2 },
  '블록체인 인프라 심화': { family: 'digital', tone: 3 },
  '암호화폐·디지털자산 파생': { family: 'digital', tone: 0 },
  '데이터·거래인프라': { family: 'digital', tone: 1 },
  '결제·예탁·권리관리': { family: 'tax', tone: 0 },
  '공시·법률·규제 용어': { family: 'tax', tone: 1 },
  '세금·계좌 심화': { family: 'tax', tone: 2 },
  '세금·계좌·제도': { family: 'tax', tone: 3 },
};

export function getCategoryFamily(category: string): FamilyToken {
  const map = CATEGORY_FAMILY[category];
  if (!map) return HUE_FAMILIES.trading;
  return HUE_FAMILIES[map.family];
}

export function getCategoryTone(category: string): string {
  const map = CATEGORY_FAMILY[category];
  if (!map) return HUE_FAMILIES.trading.base;
  return HUE_FAMILIES[map.family].tones[map.tone];
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; family: HueFamily; tone: 0 | 1 | 2 | 3 }> =
  Object.fromEntries(
    Object.entries(CATEGORY_FAMILY).map(([cat, { family, tone }]) => {
      const fam = HUE_FAMILIES[family];
      const bg = fam.tones[tone];
      const text = tone === 0 ? '#0a0a0a' : '#eae7dc';
      return [cat, { bg, text, family, tone }];
    })
  ) as Record<string, { bg: string; text: string; family: HueFamily; tone: 0 | 1 | 2 | 3 }>;
