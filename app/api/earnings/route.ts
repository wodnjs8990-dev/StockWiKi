import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── 타입 ───────────────────────────────────────────────
export type EarningItem = {
  symbol: string;
  nameKo: string;
  date: string;         // YYYY-MM-DD (KST)
  market: 'US' | 'KR';
  timing?: 'BMO' | 'AMC' | 'unknown';
  epsEstimate?: number | null;
  epsActual?: number | null;
  revenueEstimate?: number | null;
  revenueActual?: number | null;
  surprise?: number | null;
  isSP500?: boolean;
  isNDX100?: boolean;
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

// ─── 국내 종목 (코스피200 + 코스닥150 주요 종목) ──────────
const KR_CORPS: { corpCode: string; name: string; symbol: string }[] = [
  // ── 코스피 ──
  { corpCode: '00126380', name: '삼성전자', symbol: '005930' },
  { corpCode: '00164779', name: 'SK하이닉스', symbol: '000660' },
  { corpCode: '00401731', name: 'LG에너지솔루션', symbol: '373220' },
  { corpCode: '00104426', name: '삼성바이오로직스', symbol: '207940' },
  { corpCode: '00113495', name: '현대자동차', symbol: '005380' },
  { corpCode: '00164742', name: '삼성SDI', symbol: '006400' },
  { corpCode: '00126860', name: '기아', symbol: '000270' },
  { corpCode: '00157556', name: 'POSCO홀딩스', symbol: '005490' },
  { corpCode: '00164400', name: 'LG화학', symbol: '051910' },
  { corpCode: '00138345', name: '셀트리온', symbol: '068270' },
  { corpCode: '00105564', name: 'NAVER', symbol: '035420' },
  { corpCode: '00359757', name: '카카오', symbol: '035720' },
  { corpCode: '00113526', name: '현대모비스', symbol: '012330' },
  { corpCode: '00117008', name: 'KB금융', symbol: '105560' },
  { corpCode: '00111722', name: '신한지주', symbol: '055550' },
  { corpCode: '00259454', name: '삼성물산', symbol: '028260' },
  { corpCode: '00164588', name: 'LG전자', symbol: '066570' },
  { corpCode: '00102027', name: '하나금융지주', symbol: '086790' },
  { corpCode: '00164523', name: 'LG', symbol: '003550' },
  { corpCode: '00113028', name: '두산에너빌리티', symbol: '034020' },
  { corpCode: '00143361', name: '한국전력', symbol: '015760' },
  { corpCode: '00102476', name: 'SK텔레콤', symbol: '017670' },
  { corpCode: '00159193', name: 'KT', symbol: '030200' },
  { corpCode: '00113846', name: '삼성생명', symbol: '032830' },
  { corpCode: '00156631', name: '삼성화재', symbol: '000810' },
  { corpCode: '00126929', name: '고려아연', symbol: '010130' },
  { corpCode: '00148064', name: 'S-Oil', symbol: '010950' },
  { corpCode: '00101521', name: '한국조선해양', symbol: '009540' },
  { corpCode: '00115821', name: 'HD현대중공업', symbol: '329180' },
  { corpCode: '00251685', name: '카카오뱅크', symbol: '323410' },
  { corpCode: '00164711', name: 'SK이노베이션', symbol: '096770' },
  { corpCode: '00126186', name: 'SK', symbol: '034730' },
  { corpCode: '00126623', name: '삼성증권', symbol: '016360' },
  { corpCode: '00108921', name: '우리금융지주', symbol: '316140' },
  { corpCode: '00159290', name: 'HD현대', symbol: '267250' },
  { corpCode: '00164530', name: 'LG디스플레이', symbol: '034220' },
  { corpCode: '00164401', name: 'LG이노텍', symbol: '011070' },
  { corpCode: '00160694', name: '현대글로비스', symbol: '086280' },
  { corpCode: '00120182', name: '현대제철', symbol: '004020' },
  { corpCode: '00104216', name: '한화에어로스페이스', symbol: '012450' },
  { corpCode: '00131791', name: '한화솔루션', symbol: '009830' },
  { corpCode: '00113584', name: '삼성엔지니어링', symbol: '028050' },
  { corpCode: '00126953', name: '현대건설', symbol: '000720' },
  { corpCode: '00108532', name: 'GS건설', symbol: '006360' },
  { corpCode: '00140516', name: '메리츠금융지주', symbol: '138040' },
  { corpCode: '00113067', name: '두산밥캣', symbol: '241560' },
  { corpCode: '00126676', name: '삼성중공업', symbol: '010140' },
  { corpCode: '00126215', name: '대한항공', symbol: '003490' },
  { corpCode: '00108398', name: 'GS홀딩스', symbol: '078930' },
  { corpCode: '00114099', name: '롯데케미칼', symbol: '011170' },
  { corpCode: '00126124', name: '롯데쇼핑', symbol: '023530' },
  { corpCode: '00113988', name: '한국가스공사', symbol: '036460' },
  { corpCode: '00155227', name: '미래에셋증권', symbol: '006800' },
  { corpCode: '00128570', name: '한국투자금융지주', symbol: '071050' },
  { corpCode: '00131313', name: 'NH투자증권', symbol: '005940' },
  { corpCode: '00126230', name: '기업은행', symbol: '024110' },
  { corpCode: '00264904', name: 'BNK금융지주', symbol: '138930' },
  { corpCode: '00258801', name: 'DGB금융지주', symbol: '139130' },
  { corpCode: '00257439', name: 'JB금융지주', symbol: '175330' },
  { corpCode: '00113120', name: '현대해상', symbol: '001450' },
  { corpCode: '00126620', name: 'DB손해보험', symbol: '005830' },
  { corpCode: '00104531', name: '한화생명', symbol: '088350' },
  { corpCode: '00101929', name: '롯데지주', symbol: '004990' },
  { corpCode: '00112009', name: 'CJ제일제당', symbol: '097950' },
  { corpCode: '00108377', name: 'CJ', symbol: '001040' },
  { corpCode: '00109080', name: '이마트', symbol: '139480' },
  { corpCode: '00115418', name: 'BGF리테일', symbol: '282330' },
  { corpCode: '00156024', name: 'GS리테일', symbol: '007070' },
  { corpCode: '00115564', name: 'KT&G', symbol: '033780' },
  { corpCode: '00117628', name: '오리온', symbol: '271560' },
  { corpCode: '00113531', name: '아모레퍼시픽', symbol: '090430' },
  { corpCode: '00226413', name: 'LG생활건강', symbol: '051900' },
  { corpCode: '00109708', name: 'HMM', symbol: '011200' },
  { corpCode: '00104062', name: 'SK가스', symbol: '018670' },
  { corpCode: '00122498', name: '두산', symbol: '000150' },
  { corpCode: '00101559', name: 'OCI홀딩스', symbol: '010060' },
  { corpCode: '00166997', name: '효성첨단소재', symbol: '298050' },
  { corpCode: '00155276', name: '코오롱인더', symbol: '120110' },
  { corpCode: '00113097', name: '한진칼', symbol: '180640' },
  { corpCode: '00115145', name: '아시아나항공', symbol: '020560' },
  { corpCode: '00108866', name: '유한양행', symbol: '000100' },
  { corpCode: '00126115', name: '한미약품', symbol: '128940' },
  { corpCode: '00113891', name: '녹십자', symbol: '006280' },
  { corpCode: '00109002', name: 'NCSoft', symbol: '036570' },
  { corpCode: '00102447', name: '넷마블', symbol: '251270' },
  { corpCode: '00163557', name: '크래프톤', symbol: '259960' },
  { corpCode: '00126558', name: '셀트리온제약', symbol: '068760' },
  { corpCode: '00113386', name: '동아에스티', symbol: '170900' },
  { corpCode: '00113171', name: '종근당', symbol: '185750' },
  { corpCode: '00104648', name: '대웅제약', symbol: '069620' },
  { corpCode: '00113649', name: '리노공업', symbol: '058470' },
  { corpCode: '00164835', name: 'SK바이오팜', symbol: '326030' },
  { corpCode: '00164775', name: 'SK바이오사이언스', symbol: '302440' },
  { corpCode: '00179433', name: '카카오페이', symbol: '377300' },
  { corpCode: '00184599', name: '카카오게임즈', symbol: '293490' },
  { corpCode: '00130413', name: '현대위아', symbol: '011210' },
  { corpCode: '00101594', name: '한국타이어앤테크놀로지', symbol: '161390' },
  { corpCode: '00108760', name: '금호석유화학', symbol: '011780' },
  { corpCode: '00126928', name: '영풍', symbol: '000670' },
  { corpCode: '00126512', name: '한진중공업홀딩스', symbol: '003480' },
  { corpCode: '00115384', name: '태광산업', symbol: '003160' },
  { corpCode: '00108374', name: 'CJ대한통운', symbol: '000120' },
  { corpCode: '00155228', name: '미래에셋생명', symbol: '085620' },
  { corpCode: '00101535', name: '대한유화', symbol: '006650' },
  { corpCode: '00101055', name: '한화', symbol: '000880' },
  { corpCode: '00126847', name: '삼성전기', symbol: '009150' },
  { corpCode: '00164534', name: 'LG유플러스', symbol: '032640' },
  { corpCode: '00101246', name: 'SKC', symbol: '011790' },
  { corpCode: '00114814', name: '롯데에너지머티리얼즈', symbol: '020150' },
  { corpCode: '00104635', name: '한국항공우주', symbol: '047810' },
  { corpCode: '00113525', name: '현대오토에버', symbol: '307950' },
  { corpCode: '00126875', name: '삼성SDS', symbol: '018260' },
  { corpCode: '00108396', name: 'GS에너지', symbol: '093050' },
  // ── 코스닥 ──
  { corpCode: '00155872', name: '에코프로비엠', symbol: '247540' },
  { corpCode: '00160984', name: '에코프로', symbol: '086520' },
  { corpCode: '00260374', name: '포스코퓨처엠', symbol: '003670' },
  { corpCode: '00131129', name: '알테오젠', symbol: '196170' },
  { corpCode: '00235225', name: '엘앤에프', symbol: '066970' },
  { corpCode: '00401121', name: 'HLB', symbol: '028300' },
  { corpCode: '00184038', name: 'HPSP', symbol: '403870' },
  { corpCode: '00127639', name: '솔브레인', symbol: '357780' },
  { corpCode: '00145210', name: '펄어비스', symbol: '263750' },
  { corpCode: '00143885', name: '컴투스', symbol: '078340' },
  { corpCode: '00130507', name: '위메이드', symbol: '112040' },
  { corpCode: '00102337', name: '제넥신', symbol: '095700' },
  { corpCode: '00139456', name: '셀트리온헬스케어', symbol: '091990' },
  { corpCode: '00102031', name: '파라다이스', symbol: '034230' },
  { corpCode: '00160160', name: '에이피알', symbol: '278470' },
  { corpCode: '00160479', name: '성일하이텍', symbol: '365340' },
  { corpCode: '00163226', name: '원익IPS', symbol: '240810' },
  { corpCode: '00149655', name: '파크시스템스', symbol: '140860' },
  { corpCode: '00136655', name: '레인보우로보틱스', symbol: '277810' },
  { corpCode: '00155489', name: '씨에스윈드', symbol: '112610' },
  { corpCode: '00128185', name: '동진쎄미켐', symbol: '005290' },
  { corpCode: '00113270', name: '리가켐바이오', symbol: '141080' },
  { corpCode: '00124629', name: '클래시스', symbol: '214150' },
  { corpCode: '00165019', name: '케어젠', symbol: '214370' },
  { corpCode: '00124488', name: '메가스터디교육', symbol: '215200' },
  { corpCode: '00157932', name: '에스티팜', symbol: '237690' },
  { corpCode: '00140571', name: '피에스케이홀딩스', symbol: '319400' },
  { corpCode: '00168345', name: '유니드', symbol: '014830' },
  { corpCode: '00143059', name: '더블유씨피', symbol: '393890' },
  { corpCode: '00165535', name: '이녹스첨단소재', symbol: '272290' },
  { corpCode: '00118797', name: '오스템임플란트', symbol: '048260' },
  { corpCode: '00156535', name: '덴티움', symbol: '145720' },
  { corpCode: '00104215', name: '한글과컴퓨터', symbol: '030520' },
  { corpCode: '00141028', name: '비에이치', symbol: '090460' },
  { corpCode: '00149030', name: '엠씨넥스', symbol: '097520' },
  { corpCode: '00129128', name: '테크트로닉스', symbol: '053610' },
  { corpCode: '00165813', name: '에코앤드림', symbol: '101360' },
  { corpCode: '00132100', name: '제일기획', symbol: '030000' },
];

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

// ─── KRX: 국내 종목 실적 발표 일정 ──────────────────────
// KRX 데이터포털 실적 발표 일정 (날짜 범위로 전체 시장 한번에)
async function fetchKRXEarnings(): Promise<EarningItem[]> {
  const today = new Date(Date.now() + 9 * 3600 * 1000);
  const currentYear = today.getUTCFullYear();

  // 올해 1월 1일 ~ 12월 31일
  const fromDate = `${currentYear}0101`;
  const toDate = `${currentYear}1231`;

  // KRX 종목 심볼→이름 맵 (KR_CORPS 기반)
  const symbolNameMap: Record<string, string> = {};
  for (const c of KR_CORPS) symbolNameMap[c.symbol] = c.name;

  const fetchRange = async (strtDd: string, endDd: string): Promise<EarningItem[]> => {
    try {
      const body = new URLSearchParams({
        bld: 'dbms/MDC/STAT/standard/MDCSTAT23901',
        locale: 'ko_KR',
        strtDd,
        endDd,
        share: '1',
        money: '1',
        csvxls_isNo: 'false',
      });
      const res = await fetch('https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Referer': 'https://data.krx.co.kr/',
          'User-Agent': 'Mozilla/5.0',
        },
        body: body.toString(),
        next: { revalidate: 3600 },
      });
      if (!res.ok) return [];
      const data = await res.json();
      const list: any[] = data.output ?? data.OutBlock_1 ?? [];
      const results: EarningItem[] = [];

      for (const item of list) {
        // KRX 필드: ISU_SRT_CD(종목코드), ISU_NM(종목명), ANNC_TM(발표일), EPS, SALES 등
        const rawCode = (item.ISU_SRT_CD ?? item.shrt_isu_cd ?? '').replace(/^A/, '');
        const rawName = item.ISU_NM ?? item.isu_nm ?? '';
        const rawDate = item.ANNC_TM ?? item.annc_tm ?? item.ANN_DT ?? '';
        if (!rawDate || rawDate.length < 8) continue;

        const dateStr = rawDate.length === 8
          ? `${rawDate.slice(0,4)}-${rawDate.slice(4,6)}-${rawDate.slice(6,8)}`
          : rawDate.slice(0, 10);

        const nameKo = symbolNameMap[rawCode] ?? rawName;

        results.push({
          symbol: rawCode,
          nameKo,
          date: dateStr,
          market: 'KR',
          timing: undefined,
          epsEstimate: parseFloat(item.EPS ?? item.eps ?? '') || null,
          epsActual: parseFloat(item.ADJ_EPS ?? '') || null,
          revenueEstimate: null,
          revenueActual: parseFloat(item.SALES ?? item.sales ?? '') || null,
          surprise: null,
        });
      }
      return results;
    } catch {
      return [];
    }
  };

  // 상반기 + 하반기 나눠서 요청 (KRX 한 번에 너무 많으면 짤릴 수 있음)
  const [h1, h2] = await Promise.all([
    fetchRange(fromDate, `${currentYear}0630`),
    fetchRange(`${currentYear}0701`, toDate),
  ]);

  // symbol 중복 제거 (최신 날짜 우선)
  const bySymbol = new Map<string, EarningItem>();
  for (const e of [...h1, ...h2]) {
    const existing = bySymbol.get(e.symbol);
    if (!existing || e.date > existing.date) bySymbol.set(e.symbol, e);
  }
  return Array.from(bySymbol.values());
}

// ─── Route Handler ───────────────────────────────────────
export async function GET() {
  try {
    const us = await fetchUSEarnings();

    // 각 종목에 index 태그 추가
    const tagged = us.map(e => ({
      ...e,
      isSP500: SP500_SYMBOLS.has(e.symbol),
      isNDX100: NDX100_SYMBOLS.has(e.symbol),
    }));

    const sp500Count = tagged.filter(e => e.isSP500).length;
    const ndx100Count = tagged.filter(e => e.isNDX100).length;

    tagged.sort((a, b) => a.date.localeCompare(b.date));

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
