export type CalcItem = { id: string; name: string; num: string };
export type CalcCategory = { name: string; color: string; calcs: CalcItem[] };

export const CALC_CATEGORIES: CalcCategory[] = [
  {
    name: '밸류에이션', color: '#C89650',
    calcs: [
      { id: 'per',    name: 'PER · EPS',       num: '01' },
      { id: 'pbr',    name: 'PBR · BPS',       num: '02' },
      { id: 'psr',    name: 'PSR · 매출배수',  num: '03' },
      { id: 'target', name: '목표주가',         num: '04' },
      { id: 'dcf',    name: 'DCF 간이 평가',   num: '05' },
      { id: 'wacc',   name: 'WACC 계산',       num: '06' },
    ],
  },
  {
    name: '수익성', color: '#A63D33',
    calcs: [
      { id: 'roe',    name: 'ROE · ROA',   num: '01' },
      { id: 'dupont', name: '듀퐁 분해',   num: '02' },
      { id: 'margin', name: '마진 분석',   num: '03' },
      { id: 'bep',    name: '손익분기점',  num: '04' },
    ],
  },
  {
    name: '배당 · 적립', color: '#C08E6A',
    calcs: [
      { id: 'dividend', name: '배당수익률',       num: '01' },
      { id: 'compound', name: '복리 계산',        num: '02' },
      { id: 'cagr',     name: 'CAGR 연평균수익률', num: '03' },
      { id: 'rule72',   name: '72의 법칙',        num: '04' },
    ],
  },
  {
    name: '매매 실전', color: '#8A8A8A',
    calcs: [
      { id: 'avgprice',    name: '평균단가 · 물타기',   num: '01' },
      { id: 'commission',  name: '수수료 · 세금',       num: '02' },
      { id: 'breakeven',   name: '손익분기 주가',       num: '03' },
      { id: 'positionsize',name: '포지션 사이징',       num: '04' },
      { id: 'fxconvert',   name: '환전 수수료',         num: '05' },
      { id: 'shortsell',   name: '공매도 손익',         num: '06' },
      { id: 'splitorder',  name: '분할매수 · 분할매도', num: '07' },
      { id: 'gapcalc',     name: '갭 상하한가',         num: '08' },
      { id: 'marginliquid',name: '반대매매 가격',       num: '09' },
      { id: 'stockpnl',    name: '주식 총손익',         num: '10' },
      { id: 'rrmultiple',  name: 'R-멀티플',            num: '11' },
      { id: 'stopprice',   name: '손절가 역산',         num: '12' },
    ],
  },
  {
    name: '선물 · 옵션', color: '#6B6B6B',
    calcs: [
      { id: 'futures',     name: '선물 손익',           num: '01' },
      { id: 'leverage',    name: '레버리지 · 증거금',   num: '02' },
      { id: 'bs',          name: '블랙-숄즈 옵션가',    num: '03' },
      { id: 'greeks',      name: '옵션 Greeks',         num: '04' },
      { id: 'rollover',    name: '롤오버 비용',         num: '05' },
      { id: 'optionbep',   name: '옵션 손익분기',       num: '06' },
      { id: 'futuresfair', name: '선물 이론가 · 괴리율',num: '07' },
      { id: 'optionspread',name: '옵션 스프레드 전략',  num: '08' },
      { id: 'tickvalue',   name: '틱가치 · 틱손익',     num: '09' },
      { id: 'optionpayoff',name: '옵션 만기손익표',     num: '10' },
    ],
  },
  {
    name: '리스크 관리', color: '#4F7E7C',
    calcs: [
      { id: 'sharpe',      name: '샤프 · 소티노',      num: '01' },
      { id: 'kelly',       name: '켈리 공식',          num: '02' },
      { id: 'mdd',         name: '최대낙폭',           num: '03' },
      { id: 'var',         name: 'VaR 추정',           num: '04' },
      { id: 'winrate',     name: '승률 · 기대값',      num: '05' },
      { id: 'margincheck', name: '증거금 유지율',      num: '06' },
      { id: 'atrsize',     name: 'ATR 포지션 사이징',  num: '07' },
      { id: 'losestreak',  name: '연속손실 한도',      num: '08' },
    ],
  },
  {
    name: '거시 · 환율', color: '#7C6A9B',
    calcs: [
      { id: 'fx',              name: '환차손익',              num: '01' },
      { id: 'realrate',        name: '실질금리',              num: '02' },
      { id: 'bondprice',       name: '채권 가격',             num: '03' },
      { id: 'foreignstockpnl', name: '해외주식 원화 총손익',  num: '04' },
      { id: 'durationimpact',  name: '채권 듀레이션 민감도',  num: '05' },
    ],
  },
  {
    name: '시장 · ETF', color: '#6B9B6B',
    calcs: [
      { id: 'sectorweight', name: '섹터별 비중',  num: '01' },
      { id: 'fxhedge',      name: '환헷지 비율',  num: '02' },
      { id: 'rebalance',    name: '리밸런싱',     num: '03' },
      { id: 'etfpremium',   name: 'ETF 괴리율',   num: '04' },
      { id: 'trackingdiff', name: 'ETF 추적차이', num: '05' },
    ],
  },
  {
    name: '세금 · 절세', color: '#5B8DB8',
    calcs: [
      { id: 'capitalgain',        name: '양도소득세',                    num: '01' },
      { id: 'healthinsurance',    name: '건강보험료 (금융소득)',          num: '02' },
      { id: 'incometax',          name: '종합소득세 간이',               num: '03' },
      { id: 'gifttax',            name: '증여세',                        num: '04' },
      { id: 'pension',            name: '연금 수령액',                   num: '05' },
      { id: 'taxsaving',          name: 'ISA · IRP · 연금저축 절세',     num: '06' },
      { id: 'finincometax',       name: '금융소득 종합과세 시뮬레이터',  num: '07' },
      { id: 'taxaccount',         name: '절세 계좌 우선순위',            num: '08' },
      { id: 'derivtax',           name: '파생상품 양도소득세',           num: '09' },
      { id: 'isa_tax',            name: 'ISA 절세효과',                  num: '10' },
      { id: 'isa_pension',        name: 'ISA 만기 연금전환',             num: '11' },
      { id: 'oversea_cg_tax',     name: '해외주식 양도소득세',           num: '12' },
      { id: 'dividend_tax',       name: '배당소득세',                    num: '13' },
      { id: 'private_pension_tax',name: '사적연금 세후수령액',           num: '14' },
      { id: 'highdiv_tax',        name: '고배당 분리과세 시뮬레이터',    num: '15' },
    ],
  },
];
