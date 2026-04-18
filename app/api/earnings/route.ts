import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── 타입 ───────────────────────────────────────────────
// ─── 시가총액 맵 ($B 단위, 2025년 기준 근사치) ─────────────
// 같은 날짜 내 시총 높은 순 정렬용. 맵에 없으면 0 → 후순위
export const MARKET_CAP: Record<string, number> = {
  // Mega-cap
  'AAPL':3200,'NVDA':2900,'MSFT':2800,'AMZN':2000,'GOOGL':1900,'GOOG':1850,
  'META':1500,'TSLA':800,'BRK-B':980,'LLY':700,'AVGO':700,'WMT':760,
  // $300B+
  'JPM':680,'V':580,'UNH':550,'XOM':540,'MA':480,'COST':420,'HD':390,
  'PG':380,'NFLX':380,'JNJ':370,'ORCL':360,'BAC':350,'ABBV':340,
  'CVX':320,'MRK':310,'KO':290,'ASML':260,'TSM':500,'PDD':180,
  // $100-300B
  'ADBE':220,'CRM':220,'AMD':220,'BABA':220,'ARM':120,'CRWD':200,
  'PLTR':150,'PEP':210,'TMO':200,'CSCO':200,'ACN':200,'LIN':195,
  'INTU':185,'WFC':185,'ABT':180,'GE':180,'IBM':175,'NOW':175,'MS':175,
  'ISRG':170,'GS':170,'VZ':160,'RTX':165,'QCOM':165,'CAT':160,'TXN':160,
  'BKNG':155,'SPGI':155,'AXP':155,'PM':155,'C':145,'BLK':145,'UBER':145,
  'DHR':145,'T':140,'TMUS':200,'BA':135,'HON':130,'AMGN':130,'PFE':125,
  'AMAT':125,'ETN':125,'NEE':120,'UNP':120,'MCD':120,'TJX':120,
  'DE':115,'VRTX':115,'UPS':115,'LRCX':110,'LOW':110,'KLAC':110,'REGN':110,
  'LMT':110,'SHOP':100,'SYK':105,'ADI':105,'PANW':105,'BMY':105,
  'MU':100,'INTC':100,'GILD':100,'SBUX':100,'NKE':95,'TGT':95,'SO':95,
  'MMC':95,'CVS':90,'CB':90,'SNPS':90,'CDNS':90,'ITW':90,'BSX':88,
  'CME':88,'ICE':87,'DUK':85,'PLD':85,'MCO':85,'AMT':85,'MRVL':80,
  'EOG':82,'AON':82,'HCA':82,'MO':80,'WM':80,'ECL':80,'SPOT':80,
  'ZTS':80,'MELI':80,'APP':150,'ELV':78,'GD':78,'NOC':78,'CTAS':78,
  'MDLZ':75,'SHW':75,'MAR':75,'FTNT':75,'WDAY':70,'EQIX':70,'CMG':70,
  'PYPL':65,'USB':60,'PNC':65,'COIN':60,'SLB':60,'FDX':60,'PH':60,
  'COP':55,'ORLY':65,'NSC':55,'SRE':45,'MDT':55,'LULU':45,'TFC':55,
  'EW':55,'APD':55,'FCX':55,'PSX':55,'OXY':55,'SPG':55,'WELL':50,
  'BK':50,'MMM':50,'GM':50,'F':45,'DDOG':45,'NXPI':45,'AZO':45,
  'COF':60,'DFS':45,'ROST':45,'PSA':45,'NEM':45,'EXPE':45,'SQ':45,
  'DLR':45,'TEAM':55,'VEEV':45,'BIIB':35,'NU':60,'MRNA':20,'DIS':165,
  'CMCSA':145,'CHTR':40,'CI':80,'HUM':45,'CNC':30,'MOH':20,
  'VLO':45,'MPC':65,'HAL':30,'BKR':28,'DVN':20,'FANG':25,
  'D':40,'AEP':45,'EXC':40,'YUM':35,'KMB':40,'CL':55,'EL':35,
  'GIS':30,'HSY':28,'DPZ':15,'BURL':25,'TSCO':25,
  'EBAY':25,'ETSY':10,'PINS':20,'SNAP':15,'RBLX':20,'MTCH':10,
  'NET':35,'ZS':35,'OKTA':18,'MDB':25,'SNOW':50,'TTD':35,
  'SMCI':30,'MPWR':25,'ON':35,'WDC':18,'STX':25,
  'HOOD':25,'SOFI':12,'AFRM':15,'SE':25,'BIDU':30,'JD':25,
  'NIO':10,'RIVN':12,'LCID':5,'LYFT':8,'ABNB':80,
  'CSX':60,'DAL':30,'UAL':25,'AAL':10,'LUV':15,
  'CCI':40,'O':45,'EQR':25,'SBAC':25,'IRM':25,'CBRE':30,
  'LYB':15,'DOW':25,'DD':30,'ALB':12,'NUE':18,'PPG':30,
  'EMR':55,'ROK':25,'GWW':45,'LHX':45,'TXT':20,'HII':15,
  'IDXX':35,'IQV':35,'VRSK':25,'MSCI':45,'TROW':18,'CBOE':20,
  'NDAQ':35,'SYF':20,'MTB':30,'CFG':20,'FITB':25,'RF':20,
  'KEY':18,'HBAN':20,'STT':25,'BEN':12,'MKTX':8,
};

export type Sector =
  | 'Tech'        // 기술
  | 'Finance'     // 금융
  | 'Healthcare'  // 헬스케어
  | 'Consumer'    // 소비재
  | 'Energy'      // 에너지
  | 'Industrial'  // 산업재
  | 'Telecom'     // 통신
  | 'Utility'     // 유틸리티
  | 'Material'    // 소재
  | 'RealEstate'  // 부동산
  | 'Other';      // 기타

export type EarningItem = {
  symbol: string;
  nameKo: string;
  date: string;
  market: 'US' | 'KR';
  timing?: 'BMO' | 'AMC' | 'unknown';
  epsEstimate?: number | null;
  epsActual?: number | null;
  revenueEstimate?: number | null;
  revenueActual?: number | null;
  surprise?: number | null;
  isSP500?: boolean;
  isNDX100?: boolean;
  sector?: Sector;
  marketCap?: number;  // $B 단위
};

// ─── 미국 종목 한글명 (S&P500 + 나스닥100 주요 종목) ────
// Alpha Vantage CSV에 없는 종목도 있으므로 맵으로 보조
const US_NAME_MAP: Record<string, string> = {
  'AAPL':'애플','MSFT':'마이크로소프트','NVDA':'엔비디아','AMZN':'아마존',
  'GOOGL':'구글','GOOG':'구글C','META':'메타','TSLA':'테슬라',
  'AVGO':'브로드컴','ORCL':'오라클','CRM':'세일즈포스','ADBE':'어도비',
  'AMD':'AMD','INTC':'인텔','QCOM':'퀄컴','TXN':'텍사스인스트루먼트',
  'MU':'마이크론','AMAT':'어플라이드머티리얼즈','LRCX':'램리서치',
  'KLAC':'KLA','MRVL':'마벨테크','SNPS':'시놉시스','CDNS':'케이던스',
  'MCHP':'마이크로칩','ON':'온세미','STX':'씨게이트','WDC':'웨스턴디지털',
  'HPQ':'HP','HPE':'HPE','DELL':'델','IBM':'IBM','CSCO':'시스코',
  'PANW':'팔로알토','CRWD':'크라우드스트라이크','FTNT':'포티넷',
  'NOW':'서비스나우','SNOW':'스노우플레이크','PLTR':'팔란티어',
  'NET':'클라우드플레어','DDOG':'데이터독','ZS':'지스케일러',
  'OKTA':'옥타','MDB':'몽고DB','TEAM':'아틀라시안','ZM':'줌',
  'WDAY':'워크데이','VEEV':'비바시스템즈','INTU':'인튜이트',
  'HUBS':'허브스팟','ANSS':'안시스','UBER':'우버','ABNB':'에어비앤비',
  'LYFT':'리프트','NFLX':'넷플릭스','DIS':'디즈니','CMCSA':'컴캐스트',
  'T':'AT&T','VZ':'버라이즌','TMUS':'T모바일','CHTR':'차터커뮤니케이션',
  'EBAY':'이베이','ETSY':'엣시','SHOP':'쇼피파이','PINS':'핀터레스트',
  'SNAP':'스냅','RBLX':'로블록스','SPOT':'스포티파이','MTCH':'매치그룹',
  'JPM':'JP모건','BAC':'뱅크오브아메리카','WFC':'웰스파고',
  'GS':'골드만삭스','MS':'모건스탠리','C':'씨티그룹','BLK':'블랙록',
  'SCHW':'찰스슈왑','AXP':'아메리칸익스프레스','V':'비자','MA':'마스터카드',
  'PYPL':'페이팔','BRK-B':'버크셔해서웨이','CB':'CB보험','PGR':'프로그레시브',
  'MET':'메트라이프','PRU':'푸르덴셜','AFL':'애플랙','TRV':'트래블러스',
  'ALL':'올스테이트','AIG':'AIG','COF':'캐피탈원','DFS':'디스커버',
  'USB':'US뱅코프','PNC':'PNC파이낸셜','TFC':'트루이스트',
  'FITB':'피프스서드','RF':'리전스','KEY':'키코프',
  'BK':'뉴욕멜론','STT':'스테이트스트리트',
  'ICE':'인터콘티넨탈익스체인지','CME':'CME그룹',
  'SPGI':'S&P글로벌','MCO':'무디스','MSCI':'MSCI',
  'FIS':'피델리티인포','FISV':'피서브','GPN':'글로벌페이먼츠',
  'UNH':'유나이티드헬스','JNJ':'존슨앤존슨','LLY':'일라이릴리',
  'ABBV':'애브비','MRK':'머크','PFE':'화이자','TMO':'써모피셔',
  'ABT':'애보트','DHR':'다나허','BMY':'브리스톨마이어스',
  'AMGN':'암젠','GILD':'길리어드','ISRG':'인튜이티브서지컬',
  'VRTX':'버텍스파마','REGN':'리제네론','CVS':'CVS헬스',
  'CI':'시그나','HUM':'휴마나','ELV':'엘레반스','CNC':'센텐',
  'ZBH':'짐머바이오멧','SYK':'스트라이커','BSX':'보스턴사이언티픽',
  'MDT':'메드트로닉','BDX':'BD','ZTS':'조에티스','IDXX':'아이덱스',
  'IQV':'IQVIA','HCA':'HCA헬스케어','A':'에질런트','BAX':'박스터',
  'WMT':'월마트','COST':'코스트코','HD':'홈디포','LOW':'로우스',
  'TGT':'타겟','MCD':'맥도날드','SBUX':'스타벅스','NKE':'나이키',
  'TJX':'TJX컴퍼니','PG':'P&G','KO':'코카콜라','PEP':'펩시코',
  'PM':'필립모리스','MO':'알트리아','CL':'콜게이트','EL':'에스티로더',
  'KMB':'킴벌리클라크','GIS':'제너럴밀스','MDLZ':'몬델리즈',
  'HSY':'허쉬','MKC':'맥코믹','YUM':'얌브랜즈','CMG':'치폴레',
  'DPZ':'도미노피자','DRI':'다든레스토랑','ROST':'로스스토어즈',
  'BURL':'벌링턴','AZO':'오토존','ORLY':'오라일리','TSCO':'트랙터서플라이',
  'DG':'달러제너럴','DLTR':'달러트리','LULU':'룰루레몬',
  'XOM':'엑슨모빌','CVX':'쉐브론','COP':'코노코필립스','EOG':'EOG리소시스',
  'SLB':'슐럼버거','OXY':'옥시덴탈','MPC':'마라톤페트롤리엄',
  'VLO':'발레로에너지','PSX':'필립스66','HES':'헤스','DVN':'데본에너지',
  'FANG':'다이아몬드백','HAL':'할리버튼','BKR':'베이커휴즈',
  'KMI':'킨더모건','WMB':'윌리엄스','OKE':'ONEOK',
  'CAT':'캐터필러','DE':'존디어','HON':'허니웰','RTX':'레이시온',
  'LMT':'록히드마틴','GE':'GE에어로스페이스','BA':'보잉',
  'UPS':'UPS','FDX':'페덱스','MMM':'3M','EMR':'에머슨',
  'ETN':'이튼','PH':'파커해니핀','ROK':'로크웰오토메이션',
  'ITW':'일리노이툴웍스','GWW':'W.W.그레인저','FAST':'파스널',
  'NOC':'노스럽그루먼','GD':'제너럴다이나믹스','LHX':'L3해리스',
  'CARR':'캐리어','OTIS':'오티스','DAL':'델타항공','UAL':'유나이티드항공',
  'AAL':'아메리칸항공','LUV':'사우스웨스트','CSX':'CSX',
  'NSC':'노포크서던','UNP':'유니온퍼시픽',
  'LIN':'린데','APD':'에어프로덕츠','ECL':'에코랩',
  'SHW':'셔윈윌리엄스','PPG':'PPG','NUE':'뉴코','FCX':'프리포트맥모란',
  'NEM':'뉴몬트','AA':'알코아',
  'AMT':'아메리칸타워','PLD':'프로로지스','EQIX':'에퀴닉스',
  'CCI':'크라운캐슬','SPG':'사이먼프로퍼티','O':'리얼티인컴',
  'NEE':'넥스트에라에너지','DUK':'듀크에너지','SO':'서던컴퍼니',
  'D':'도미니언에너지','AEP':'아메리칸일렉트릭파워','EXC':'엑셀론',
  // 추가 성장주
  'COIN':'코인베이스','HOOD':'로빈후드','SQ':'블록','AFRM':'어펌',
  'UPST':'업스타트','SOFI':'소파이','NU':'누뱅크','MELI':'메르카도리브레',
  'SE':'씨리미티드','GRAB':'그랩','BIDU':'바이두','JD':'징동',
  'PDD':'핀둬둬','BABA':'알리바바','NIO':'니오','XPEV':'샤오펑',
  'LI':'리오토','RIVN':'리비안','LCID':'루시드','F':'포드','GM':'GM',
  'STLA':'스텔란티스','TM':'토요타','HMC':'혼다','RACE':'페라리',
  'ARM':'ARM홀딩스','SMCI':'슈퍼마이크로','ASML':'ASML',
  'TSM':'TSMC','NXPI':'NXP세미컨덕터','STM':'ST마이크로',
  'MPWR':'모노리식파워','WOLF':'울프스피드',
  'APP':'앱러빈','TTD':'트레이드데스크','MGNI':'매그나이트',
  'RDFN':'레드핀','OPEN':'오픈도어','Z':'질로우',
  'EXPE':'익스피디아','BKNG':'부킹홀딩스',
  'MAR':'메리어트','HLT':'힐튼','H':'하얏트','IHG':'IHG',
  'CCL':'카니발','RCL':'로열캐리비안','NCLH':'노르웨지안크루즈',
  'MGM':'MGM리조트','WYNN':'윈리조트','LVS':'라스베이거스샌즈',
  'CZR':'시저스엔터테인먼트',
};

// ─── 섹터 맵 ────────────────────────────────────────────
export const SECTOR_MAP: Record<string, Sector> = {
  // ── Tech ──
  'AAPL':'Tech','MSFT':'Tech','NVDA':'Tech','AMD':'Tech','INTC':'Tech','QCOM':'Tech',
  'AVGO':'Tech','TXN':'Tech','MU':'Tech','AMAT':'Tech','LRCX':'Tech','KLAC':'Tech',
  'MRVL':'Tech','SNPS':'Tech','CDNS':'Tech','MCHP':'Tech','ON':'Tech','STX':'Tech',
  'WDC':'Tech','HPQ':'Tech','HPE':'Tech','DELL':'Tech','IBM':'Tech','CSCO':'Tech',
  'ORCL':'Tech','CRM':'Tech','ADBE':'Tech','NOW':'Tech','SNOW':'Tech','PLTR':'Tech',
  'NET':'Tech','DDOG':'Tech','ZS':'Tech','OKTA':'Tech','MDB':'Tech','TEAM':'Tech',
  'WDAY':'Tech','VEEV':'Tech','INTU':'Tech','HUBS':'Tech','ANSS':'Tech','ADSK':'Tech',
  'FTNT':'Tech','PANW':'Tech','CRWD':'Tech','CTSH':'Tech','ACN':'Tech','ANET':'Tech',
  'KEYS':'Tech','CDW':'Tech','JNPR':'Tech','GLW':'Tech','TEL':'Tech','APH':'Tech',
  'FFIV':'Tech','NTAP':'Tech','SMCI':'Tech','APP':'Tech','TTD':'Tech','ARM':'Tech',
  'ASML':'Tech','TSM':'Tech','NXPI':'Tech','MPWR':'Tech',
  // ── Finance ──
  'JPM':'Finance','BAC':'Finance','WFC':'Finance','C':'Finance','GS':'Finance',
  'MS':'Finance','BLK':'Finance','SCHW':'Finance','AXP':'Finance','V':'Finance',
  'MA':'Finance','PYPL':'Finance','COF':'Finance','DFS':'Finance','USB':'Finance',
  'PNC':'Finance','TFC':'Finance','FITB':'Finance','RF':'Finance','KEY':'Finance',
  'BK':'Finance','STT':'Finance','ICE':'Finance','CME':'Finance','SPGI':'Finance',
  'MCO':'Finance','MSCI':'Finance','FIS':'Finance','FISV':'Finance','GPN':'Finance',
  'CB':'Finance','PGR':'Finance','MET':'Finance','PRU':'Finance','AFL':'Finance',
  'TRV':'Finance','ALL':'Finance','AIG':'Finance','BRK-B':'Finance','HBAN':'Finance',
  'MTB':'Finance','CFG':'Finance','SYF':'Finance','AMP':'Finance','RJF':'Finance',
  'TROW':'Finance','BEN':'Finance','IVZ':'Finance','MKTX':'Finance','CBOE':'Finance',
  'NDAQ':'Finance','COIN':'Finance','HOOD':'Finance','SQ':'Finance','AFRM':'Finance',
  'SOFI':'Finance','NU':'Finance',
  // ── Healthcare ──
  'UNH':'Healthcare','JNJ':'Healthcare','LLY':'Healthcare','ABBV':'Healthcare',
  'MRK':'Healthcare','PFE':'Healthcare','TMO':'Healthcare','ABT':'Healthcare',
  'DHR':'Healthcare','BMY':'Healthcare','AMGN':'Healthcare','GILD':'Healthcare',
  'ISRG':'Healthcare','VRTX':'Healthcare','REGN':'Healthcare','CVS':'Healthcare',
  'CI':'Healthcare','HUM':'Healthcare','ELV':'Healthcare','CNC':'Healthcare',
  'ZBH':'Healthcare','SYK':'Healthcare','BSX':'Healthcare','MDT':'Healthcare',
  'BDX':'Healthcare','ZTS':'Healthcare','IDXX':'Healthcare','IQV':'Healthcare',
  'HCA':'Healthcare','A':'Healthcare','BAX':'Healthcare','BIIB':'Healthcare',
  'MRNA':'Healthcare','HOLX':'Healthcare','DXCM':'Healthcare','PODD':'Healthcare',
  'INCY':'Healthcare','TECH':'Healthcare','MOH':'Healthcare','DVA':'Healthcare',
  'HSIC':'Healthcare','RVTY':'Healthcare','MTD':'Healthcare','WAT':'Healthcare',
  'PKI':'Healthcare','ALGN':'Healthcare','EW':'Healthcare','RMD':'Healthcare',
  'STE':'Healthcare','COO':'Healthcare',
  // ── Consumer (소비재/임의·필수) ──
  'AMZN':'Consumer','TSLA':'Consumer','MCD':'Consumer','SBUX':'Consumer',
  'NKE':'Consumer','TJX':'Consumer','PG':'Consumer','KO':'Consumer','PEP':'Consumer',
  'PM':'Consumer','MO':'Consumer','CL':'Consumer','EL':'Consumer','KMB':'Consumer',
  'GIS':'Consumer','MDLZ':'Consumer','HSY':'Consumer','MKC':'Consumer','YUM':'Consumer',
  'CMG':'Consumer','DPZ':'Consumer','DRI':'Consumer','ROST':'Consumer','BURL':'Consumer',
  'AZO':'Consumer','ORLY':'Consumer','TSCO':'Consumer','DG':'Consumer','DLTR':'Consumer',
  'LULU':'Consumer','WMT':'Consumer','COST':'Consumer','HD':'Consumer','LOW':'Consumer',
  'TGT':'Consumer','EBAY':'Consumer','ETSY':'Consumer','SHOP':'Consumer','PINS':'Consumer',
  'SNAP':'Consumer','RBLX':'Consumer','SPOT':'Consumer','MTCH':'Consumer','NFLX':'Consumer',
  'DIS':'Consumer','CMCSA':'Consumer','EA':'Consumer','TTWO':'Consumer','ATVI':'Consumer',
  'BKNG':'Consumer','EXPE':'Consumer','MAR':'Consumer','HLT':'Consumer','CCL':'Consumer',
  'RCL':'Consumer','NCLH':'Consumer','MGM':'Consumer','WYNN':'Consumer','LVS':'Consumer',
  'F':'Consumer','GM':'Consumer','KMX':'Consumer','APTV':'Consumer',
  'GRMN':'Consumer','PHM':'Consumer','LEN':'Consumer','TOL':'Consumer',
  'TPR':'Consumer','RL':'Consumer','ULTA':'Consumer','BBWI':'Consumer',
  'KHC':'Consumer','TAP':'Consumer','CPB':'Consumer','CAG':'Consumer','SJM':'Consumer',
  'HRL':'Consumer','LW':'Consumer','K':'Consumer','KVUE':'Consumer','KDP':'Consumer',
  'MNST':'Consumer','BG':'Consumer',
  // ── Energy ──
  'XOM':'Energy','CVX':'Energy','COP':'Energy','EOG':'Energy','SLB':'Energy',
  'OXY':'Energy','MPC':'Energy','VLO':'Energy','PSX':'Energy','HES':'Energy',
  'DVN':'Energy','FANG':'Energy','HAL':'Energy','BKR':'Energy','KMI':'Energy',
  'WMB':'Energy','OKE':'Energy','TRGP':'Energy','APA':'Energy','MRO':'Energy',
  'CTRA':'Energy','EQT':'Energy','NRG':'Energy','VST':'Energy',
  'FSLR':'Energy','ENPH':'Energy','CEG':'Energy','PCG':'Energy',
  // ── Industrial ──
  'CAT':'Industrial','DE':'Industrial','HON':'Industrial','RTX':'Industrial',
  'LMT':'Industrial','GE':'Industrial','BA':'Industrial','UPS':'Industrial',
  'FDX':'Industrial','MMM':'Industrial','EMR':'Industrial','ETN':'Industrial',
  'PH':'Industrial','ROK':'Industrial','ITW':'Industrial','GWW':'Industrial',
  'FAST':'Industrial','NOC':'Industrial','GD':'Industrial','LHX':'Industrial',
  'CARR':'Industrial','OTIS':'Industrial','DAL':'Industrial','UAL':'Industrial',
  'AAL':'Industrial','LUV':'Industrial','CSX':'Industrial','NSC':'Industrial',
  'UNP':'Industrial','JBHT':'Industrial','CHRW':'Industrial','EXPD':'Industrial',
  'XYL':'Industrial','NDSN':'Industrial','IR':'Industrial','TT':'Industrial',
  'TDG':'Industrial','HWM':'Industrial','TXT':'Industrial','L':'Industrial',
  'LDOS':'Industrial','HII':'Industrial','TDY':'Industrial','TFX':'Industrial',
  'SWK':'Industrial','SNA':'Industrial','ROL':'Industrial','ROP':'Industrial',
  'HUBB':'Industrial','AME':'Industrial','FTV':'Industrial','AXON':'Industrial',
  'PWR':'Industrial','WAB':'Industrial','BLDR':'Industrial',
  // ── Telecom ──
  'T':'Telecom','VZ':'Telecom','TMUS':'Telecom','CHTR':'Telecom',
  'FOXA':'Telecom','FOX':'Telecom','NWSA':'Telecom','NWS':'Telecom',
  'PARA':'Telecom','WBD':'Telecom','LUMN':'Telecom','ERIC':'Telecom',
  // ── Utility ──
  'NEE':'Utility','DUK':'Utility','SO':'Utility','D':'Utility','AEP':'Utility',
  'EXC':'Utility','SRE':'Utility','XEL':'Utility','ED':'Utility','EIX':'Utility',
  'DTE':'Utility','ETR':'Utility','FE':'Utility','PPL':'Utility','AEE':'Utility',
  'CMS':'Utility','CNP':'Utility','NI':'Utility','LNT':'Utility','EVRG':'Utility',
  'PNW':'Utility','AWK':'Utility','ES':'Utility','WEC':'Utility','PEG':'Utility',
  // ── Material ──
  'LIN':'Material','APD':'Material','ECL':'Material','SHW':'Material','PPG':'Material',
  'NUE':'Material','FCX':'Material','NEM':'Material','AA':'Material','ALB':'Material',
  'CF':'Material','MOS':'Material','FMC':'Material','CE':'Material','LYB':'Material',
  'DD':'Material','DOW':'Material','EMN':'Material','IFF':'Material','IP':'Material',
  'PKG':'Material','SEE':'Material','BALL':'Material','AMCR':'Material','AVY':'Material',
  'MLM':'Material','VMC':'Material','STLD':'Material',
  // ── RealEstate ──
  'AMT':'RealEstate','PLD':'RealEstate','EQIX':'RealEstate','CCI':'RealEstate',
  'SPG':'RealEstate','O':'RealEstate','DLR':'RealEstate','PSA':'RealEstate',
  'EQR':'RealEstate','AVB':'RealEstate','WELL':'RealEstate','VTR':'RealEstate',
  'ARE':'RealEstate','MAA':'RealEstate','UDR':'RealEstate','EXR':'RealEstate',
  'INVH':'RealEstate','SBAC':'RealEstate','IRM':'RealEstate','HST':'RealEstate',
  'REG':'RealEstate','FRT':'RealEstate','KIM':'RealEstate','CPT':'RealEstate',
  'ESS':'RealEstate','CBRE':'RealEstate','CSGP':'RealEstate',
  'VNO':'RealEstate','SLG':'RealEstate','DOC':'RealEstate',
};

const AV_KEY = process.env.ALPHA_VANTAGE_API_KEY ?? '';

// ─── S&P500 심볼 셋 ──────────────────────────────────────
export const SP500_SYMBOLS = new Set([
  'MMM','AOS','ABT','ABBV','ACN','ADBE','AMD','AES','AFL','A','APD','ABNB','AKAM','ALB','ARE',
  'ALGN','ALLE','LNT','ALL','GOOGL','GOOG','MO','AMZN','AMCR','AEE','AAL','AEP','AXP','AIG',
  'AMT','AWK','AMP','AME','AMGN','APH','ADI','ANSS','AON','APA','AAPL','AMAT','APTV','ACGL',
  'ADM','ANET','AJG','AIZ','T','ATO','ADSK','ADP','AZO','AVB','AVY','AXON','BKR','BALL','BAC',
  'BK','BBWI','BAX','BDX','WRB','BRK-B','BBY','TECH','BIIB','BLK','BX','BA','BCR','BMY','AVGO',
  'BR','BRO','BF-B','BLDR','BSX','BG','CHRW','CDNS','CZR','CPT','CPB','COF','CAH','KMX','CCL',
  'CARR','CTLT','CAT','CBOE','CBRE','CDW','CE','COR','CNC','CNP','CF','CHTR','CVX','CMG','CB',
  'CHD','CI','CINF','CTAS','CSCO','C','CFG','CLX','CME','CMS','KO','CTSH','CL','CMCSA','CMA',
  'CAG','COP','ED','STZ','CEG','COO','CPRT','GLW','CTVA','CSGP','COST','CTRA','CCI','CSX','CMI',
  'CVS','DHR','DHI','DRI','DVA','DAY','DECK','DE','DAL','DVN','DXCM','FANG','DLR','DFS','DG',
  'DLTR','D','DPZ','DOV','DOW','DHI','DTE','DUK','DD','EMN','ETN','EBAY','ECL','EIX','EW','EA',
  'ELV','EMR','ENPH','ETR','EOG','EPAM','EQT','EFX','EQIX','EQR','ESS','EL','ETSY','EG','EVRG',
  'ES','EXC','EXPE','EXPD','EXR','XOM','FFIV','FDS','FICO','FAST','FRT','FDX','FIS','FITB',
  'FSLR','FE','FMC','F','FTNT','FTV','FOXA','FOX','BEN','FCX','GRMN','IT','GE','GEHC','GEN',
  'GIS','GM','GPC','GILD','GS','HAL','HIG','HAS','HCA','DOC','HSIC','HSY','HES','HPE','HLT',
  'HOLX','HD','HON','HRL','HST','HWM','HPQ','HUBB','HUM','HBAN','HII','IBM','IEX','IDXX','ITW',
  'INCY','IR','PODD','INTC','ICE','IFF','IP','IPG','INTU','ISRG','IVZ','INVH','IQV','IRM','JBHT',
  'JBL','JKHY','J','JNJ','JCI','JPM','JNPR','K','KVUE','KDP','KEY','KEYS','KMB','KIM','KMI',
  'KLAC','KHC','KR','LHX','LH','LRCX','LW','LVS','LDOS','LEN','LLY','LIN','LYV','LKQ','LMT',
  'L','LOW','LULU','LYB','MTB','MRO','MPC','MKTX','MAR','MMC','MLM','MAS','MA','MTCH','MKC',
  'MCD','MCK','MDT','MET','META','MTD','MGM','MCHP','MU','MSFT','MAA','MRNA','MHK','MOH','TAP',
  'MDLZ','MPWR','MNST','MCO','MS','MOS','MSI','MSCI','NDAQ','NTAP','NFLX','NEM','NWSA','NWS',
  'NEE','NKE','NI','NDSN','NSC','NTRS','NOC','NCLH','NRG','NUE','NVR','NVDA','NVO','OFF','OXY',
  'OKE','ORCL','OTIS','ON','OMC','OKE','ORLY','OGN','OI','PH','PANW','PARA','PTC','PAYX','PAYC',
  'PYPL','PNR','PBCT','PEP','PKI','PFE','PCG','PM','PSX','PNW','PXD','PNC','POOL','PPG','PPL',
  'PFG','PG','PGR','PRU','PLD','PRU','PEG','PSA','PHM','QRVO','PWR','QCOM','DGX','RL','RJF',
  'RTX','O','REG','REGN','RF','RSG','RMD','RVTY','ROK','ROL','ROP','ROST','RCL','SPGI','CRM',
  'SBAC','SLB','STX','SEE','SRE','NOW','SHW','SPG','SWKS','SJM','SNA','SOLV','SO','LUV','SWK',
  'SBUX','STT','STLD','STE','SYK','SMCI','SYF','SNPS','SYY','TMUS','TROW','TTWO','TPR','TRGP',
  'TGT','TEL','TDY','TFX','TER','TSLA','TXN','TXT','TMO','TJX','TT','TOL','TSCO','TDG','TRV',
  'TRMB','TFC','TYL','TSN','USB','UBER','UDR','ULTA','UNP','UAL','UPS','URI','UNH','UHS','VLO',
  'VTR','VRSN','VRSK','VZ','VRTX','VIAV','V','VST','VFC','VLTO','VNO','VMC','WRK','WAB','WMT',
  'WBA','WM','WAT','WEC','WFC','WELL','WST','WDC','WRB','WHR','WMB','WTW','GWW','WYNN','XEL',
  'XYL','YUM','ZBRA','ZBH','ZTS',
]);

// ─── 나스닥100 심볼 셋 ───────────────────────────────────
export const NDX100_SYMBOLS = new Set([
  'ADBE','AMD','ABNB','GOOGL','GOOG','AMZN','AMGN','AEP','ADI','ANSS','AAPL','AMAT','APP',
  'ASML','AZN','TEAM','ADSK','ADP','AXON','BIDU','BIIB','BKNG','AVGO','CDNS','CDW','CHTR',
  'CTAS','CSCO','CTSH','CCEP','CPRT','CSGP','COST','CRWD','CSX','DXCM','FANG','DLTR','DASH',
  'EA','EBAY','EXC','FAST','FTNT','GEHC','GILD','GFS','HON','ILMN','INTC','INTU','ISRG','KDP',
  'KLAC','KHC','LRCX','LIN','LOGI','MAR','MRVL','MTCH','MELI','META','MCHP','MU','MSFT','MRNA',
  'MDB','MNST','NDAQ','NFLX','NVDA','NXPI','ODFL','ON','ORLY','PCAR','PANW','PAYX','PYPL','PDD',
  'PEP','QCOM','REGN','ROP','ROST','SIRI','SBUX','SMCI','SNPS','TTWO','TMUS','TSLA','TXN','TTD',
  'VRSK','VRTX','WDAY','WBD','WSCO','XEL','ZS','ZM',
]);

export type IndexFilter = 'ALL' | 'SP500' | 'NDX100';

// ─── Alpha Vantage: 미국 어닝 캘린더 ─────────────────────
async function fetchUSEarnings(): Promise<EarningItem[]> {
  if (!AV_KEY) return [];

  const fetchHorizon = async (horizon: '3month' | '12month'): Promise<EarningItem[]> => {
    try {
      const url = `https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=${horizon}&apikey=${AV_KEY}`;
      const res = await fetch(url, {
        next: { revalidate: horizon === '12month' ? 7 * 24 * 3600 : 3600 },
      });
      if (!res.ok) return [];
      const csv = await res.text();
      const lines = csv.trim().split('\n');
      const results: EarningItem[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length < 3) continue;
        const symbol = cols[0]?.trim();
        const name = cols[1]?.trim();
        const reportDate = cols[2]?.trim();
        const estimate = parseFloat(cols[4]?.trim() ?? '');
        if (!symbol || !reportDate) continue;

        // 한글명: 맵에 있으면 사용, 없으면 영문명 그대로
        const nameKo = US_NAME_MAP[symbol] ?? name ?? symbol;

        results.push({
          symbol,
          nameKo,
          date: reportDate,
          market: 'US',
          timing: 'unknown',
          epsEstimate: isNaN(estimate) ? null : estimate,
          epsActual: null,
          revenueEstimate: null,
          revenueActual: null,
          surprise: null,
        });
      }
      return results;
    } catch {
      return [];
    }
  };

  const [future, full] = await Promise.all([
    fetchHorizon('3month'),
    fetchHorizon('12month'),
  ]);

  // symbol 중복 제거 (future 우선)
  const bySymbol = new Map<string, EarningItem>();
  for (const e of [...full, ...future]) bySymbol.set(e.symbol, e);
  return Array.from(bySymbol.values());
}


// ─── Route Handler ───────────────────────────────────────
export async function GET() {
  try {
    const us = await fetchUSEarnings();

    // 각 종목에 index + sector + marketCap 태그 추가
    const tagged = us.map(e => ({
      ...e,
      isSP500: SP500_SYMBOLS.has(e.symbol),
      isNDX100: NDX100_SYMBOLS.has(e.symbol),
      sector: (SECTOR_MAP[e.symbol] ?? 'Other') as Sector,
      marketCap: MARKET_CAP[e.symbol] ?? 0,
    }));

    const sp500Count = tagged.filter(e => e.isSP500).length;
    const ndx100Count = tagged.filter(e => e.isNDX100).length;

    // 같은 날짜 내에서 시가총액 높은 순, 날짜는 오름차순
    tagged.sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) return dateDiff;
      return (b.marketCap ?? 0) - (a.marketCap ?? 0);
    });

    return NextResponse.json({
      ok: true,
      count: { us: tagged.length, sp500: sp500Count, ndx100: ndx100Count },
      earnings: tagged,
      updatedAt: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=300' },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), earnings: [] }, { status: 500 });
  }
}
