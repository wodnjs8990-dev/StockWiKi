export type CalcItem = { id: string; name: string; num: string };
export type CalcCategory = { name: string; color: string; calcs: CalcItem[] };

export const CALC_CATEGORIES: CalcCategory[] = [
  {
    name: '밸류에이션', color: '#C89650',
    calcs: [
      { id: 'per', name: 'PER · EPS', num: '01' },
      { id: 'pbr', name: 'PBR · BPS', num: '02' },
      { id: 'target', name: '목표주가', num: '03' },
      { id: 'dcf', name: 'DCF 간이 평가', num: '04' },
      { id: 'wacc', name: 'WACC 계산', num: '05' },
    ],
  },
  {
    name: '수익성', color: '#A63D33',
    calcs: [
      { id: 'roe', name: 'ROE · ROA', num: '06' },
      { id: 'dupont', name: '듀퐁 분해', num: '07' },
      { id: 'margin', name: '마진 분석', num: '08' },
      { id: 'bep', name: '손익분기점', num: '09' },
    ],
  },
  {
    name: '배당 · 적립', color: '#C08E6A',
    calcs: [
      { id: 'dividend', name: '배당수익률', num: '10' },
      { id: 'compound', name: '복리 계산', num: '11' },
      { id: 'cagr', name: 'CAGR 연평균수익률', num: '12' },
      { id: 'rule72', name: '72의 법칙', num: '13' },
    ],
  },
  {
    name: '매매 실전', color: '#8A8A8A',
    calcs: [
      { id: 'avgprice', name: '평균단가 · 물타기', num: '14' },
      { id: 'commission', name: '수수료 · 세금', num: '15' },
      { id: 'breakeven', name: '손익분기 주가', num: '16' },
      { id: 'positionsize', name: '포지션 사이징', num: '17' },
    ],
  },
  {
    name: '선물 · 옵션', color: '#6B6B6B',
    calcs: [
      { id: 'futures', name: '선물 손익', num: '18' },
      { id: 'leverage', name: '레버리지 · 증거금', num: '19' },
      { id: 'bs', name: '블랙-숄즈 옵션가', num: '20' },
      { id: 'greeks', name: '옵션 Greeks', num: '21' },
    ],
  },
  {
    name: '리스크 관리', color: '#4F7E7C',
    calcs: [
      { id: 'sharpe', name: '샤프 · 소티노', num: '22' },
      { id: 'kelly', name: '켈리 공식', num: '23' },
      { id: 'mdd', name: '최대낙폭', num: '24' },
      { id: 'var', name: 'VaR 추정', num: '25' },
    ],
  },
  {
    name: '거시 · 환율', color: '#7C6A9B',
    calcs: [
      { id: 'fx', name: '환차손익', num: '26' },
      { id: 'realrate', name: '실질금리', num: '27' },
      { id: 'bondprice', name: '채권 가격', num: '28' },
    ],
  },
];
