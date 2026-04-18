export type CalcItem = { id: string; name: string; num: string };
export type CalcCategory = { name: string; color: string; calcs: CalcItem[] };

export const CALC_CATEGORIES: CalcCategory[] = [
  {
    name: '밸류에이션', color: '#C89650',
    calcs: [
      { id: 'per', name: 'PER · EPS', num: '01' },
      { id: 'pbr', name: 'PBR · BPS', num: '02' },
      { id: 'psr', name: 'PSR · 매출배수', num: '03' },
      { id: 'target', name: '목표주가', num: '04' },
      { id: 'dcf', name: 'DCF 간이 평가', num: '05' },
      { id: 'wacc', name: 'WACC 계산', num: '06' },
    ],
  },
  {
    name: '수익성', color: '#A63D33',
    calcs: [
      { id: 'roe', name: 'ROE · ROA', num: '07' },
      { id: 'dupont', name: '듀퐁 분해', num: '08' },
      { id: 'margin', name: '마진 분석', num: '09' },
      { id: 'bep', name: '손익분기점', num: '10' },
    ],
  },
  {
    name: '배당 · 적립', color: '#C08E6A',
    calcs: [
      { id: 'dividend', name: '배당수익률', num: '11' },
      { id: 'compound', name: '복리 계산', num: '12' },
      { id: 'cagr', name: 'CAGR 연평균수익률', num: '13' },
      { id: 'rule72', name: '72의 법칙', num: '14' },
    ],
  },
  {
    name: '매매 실전', color: '#8A8A8A',
    calcs: [
      { id: 'avgprice', name: '평균단가 · 물타기', num: '15' },
      { id: 'commission', name: '수수료 · 세금', num: '16' },
      { id: 'breakeven', name: '손익분기 주가', num: '17' },
      { id: 'positionsize', name: '포지션 사이징', num: '18' },
    ],
  },
  {
    name: '선물 · 옵션', color: '#6B6B6B',
    calcs: [
      { id: 'futures', name: '선물 손익', num: '19' },
      { id: 'leverage', name: '레버리지 · 증거금', num: '20' },
      { id: 'bs', name: '블랙-숄즈 옵션가', num: '21' },
      { id: 'greeks', name: '옵션 Greeks', num: '22' },
    ],
  },
  {
    name: '리스크 관리', color: '#4F7E7C',
    calcs: [
      { id: 'sharpe', name: '샤프 · 소티노', num: '23' },
      { id: 'kelly', name: '켈리 공식', num: '24' },
      { id: 'mdd', name: '최대낙폭', num: '25' },
      { id: 'var', name: 'VaR 추정', num: '26' },
    ],
  },
  {
    name: '거시 · 환율', color: '#7C6A9B',
    calcs: [
      { id: 'fx', name: '환차손익', num: '27' },
      { id: 'realrate', name: '실질금리', num: '28' },
      { id: 'bondprice', name: '채권 가격', num: '29' },
    ],
  },
  {
    name: '세금 · 절세', color: '#5B8DB8',
    calcs: [
      { id: 'capitalgain', name: '양도소득세', num: '30' },
      { id: 'healthinsurance', name: '건강보험료 (금융소득)', num: '31' },
      { id: 'incometax', name: '종합소득세 간이', num: '32' },
      { id: 'gifttax', name: '증여세', num: '33' },
      { id: 'pension', name: '연금 수령액', num: '34' },
      { id: 'taxsaving', name: 'ISA · IRP · 연금저축 절세', num: '35' },
    ],
  },
];
