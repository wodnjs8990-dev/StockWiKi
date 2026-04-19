export type { Term, HueFamily, FamilyToken } from './types';

import { TERMS_FUNDAMENTAL } from './terms-fundamental';
import { TERMS_MARKET } from './terms-market';
import { TERMS_ECON } from './terms-econ';
import { TERMS_DERIV } from './terms-deriv';
import { TERMS_INDUSTRY } from './terms-industry';
import { TERMS_TRADING } from './terms-trading';
import { TERMS_RISK } from './terms-risk';
import { TERMS_TAX } from './terms-tax';
import { TERMS_DIGITAL } from './terms-digital';
import { HUE_FAMILIES, CATEGORY_FAMILY } from './colors';

export { HUE_FAMILIES, CATEGORY_FAMILY };
export { getCategoryFamily, getCategoryTone, CATEGORY_COLORS } from './colors';

export const TERMS = [
  ...TERMS_FUNDAMENTAL,
  ...TERMS_MARKET,
  ...TERMS_ECON,
  ...TERMS_DERIV,
  ...TERMS_INDUSTRY,
  ...TERMS_TRADING,
  ...TERMS_RISK,
  ...TERMS_TAX,
  ...TERMS_DIGITAL,
];

export const CATEGORIES = ['전체', '기업재무', '기업재무·자본시장', '배당', '밸류에이션', '밸류에이션 심화', '손익계산서 심화', '수익성', '신용·재무안정성 심화', '자본배분·주주환원', '재무안정성', '재무제표 기본', '지배구조·주주권', '현금흐름 심화', '현금흐름·운전자본', '회계·재무제표', '회계·재무제표 심화', '회계심화', '효율성·운전자본', 'ETF 구조·상품', 'ETF·상장상품', 'ETF·펀드 심화', '거래제도·주문유형 심화', '공시·기업행동 심화', '기업 이벤트·자본시장', '시장거래', '시장거래 기본', '시장구조·유동성', '시장미시구조', '한국시장', '해외시장·지수', '거시지표 심화', '경제지표·서베이 심화', '고용·소비·생산', '국제금융·환율 심화', '국채·수익률곡선 심화', '금융위기·신용', '물가·인플레이션', '미시경제', '부동산·주택지표', '성장·경기순환', '신용시장·스프레드', '유동성·자금시장', '재정·국가경제', '중앙은행·통화정책 심화', '채권·금리위험', '통화정책·금리', '환율·대외수지', '모델리스크·백테스트 검증', '성과·리스크관리', '성과평가·트레이딩 통계', '위험관리 운영', '퀀트통계', '포트폴리오', '포트폴리오 최적화 심화', '금리·크레딧 파생', '변동성·분산 파생', '선물·옵션 기초', '선물옵션', '옵션·선물 심화', '옵션전략 심화', '원자재·외환 파생', '파생헤지', '가격행동·시장국면', '기술적 지표', '기술적지표', '매매실전 기본', '실행·오더플로우 심화', '오더플로우·실행관리', '차트패턴·가격행동', '투자심리·행동편향', '트레이딩 운영·프로세스', 'AI 인프라·클라우드', 'AI·반도체', 'SaaS·플랫폼 지표', '금융·에너지·바이오', '반도체 공급망 심화', '산업재·방산·물류', '소비재·리테일·자동차', '소프트웨어·인터넷 지표', '에너지·전력·인프라', '은행·보험 심화', '헬스케어·바이오 심화', 'DeFi·시장구조 심화', '디지털자산 리스크·규제', '디지털자산·토큰화', '블록체인 인프라 심화', '결제·예탁·권리관리', '공시·법률·규제 용어', '세금·계좌 심화', '세금·계좌·제도'];
