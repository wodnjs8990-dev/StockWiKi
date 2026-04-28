# StockWiKi v2 — 디자인 지침서 (전면 업데이트)
## Claude Designer 전달용 | 2026.04.28 rev2

> **이 문서는 `StockWiki Dashboard.html` (완성 프로토타입) + `StockWiki Handoff Guide.html` 기준으로 작성됩니다.**
> 모든 컴포넌트, 색상, 애니메이션, 페이지 구조는 해당 HTML에서 픽셀 단위로 이식해야 합니다.

---

## 0. 핵심 원칙

1. **Dashboard.html = 정답** — 프로토타입과 동일하게 구현
2. **실제 데이터 이식** — MOCK 데이터 → 실제 DB/API 연결
3. **지구본은 별도 레이어** — 기존 Bento Grid 위에 추가 (교체 X)
4. **건드리지 말 것**: `/data/terms.ts`, `/data/calcs.ts`, `/data/changelog.ts`, `/components/StockWiki.tsx`

---

## 1. 기술 스택

```
Next.js 14 (App Router) + TypeScript
Tailwind CSS (유틸리티 클래스 최소화, 주로 inline style)
폰트: IBM Plex Mono (300/400/500) + IBM Plex Sans (200/300/400/500/600)
배포: Vercel | 렌더링: CSR 중심
```

### Google Fonts import (globals.css 최상단에 추가)
```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;1,300&display=swap');
```

---

## 2. 색상 시스템 — 완전 교체

### CSS 변수 (globals.css :root 교체)
```css
:root {
  --bg: #080808;
  --s1: rgba(255,255,255,.035);
  --s2: rgba(255,255,255,.055);
  --b1: rgba(255,255,255,.09);
  --b2: rgba(255,255,255,.05);
  --b3: rgba(255,255,255,.13);
  --gold: #C89650;
  --green: #4A7045;
  --red: #b84040;
  --t1: #e8e4dc;
  --t2: #8a8680;
  --t3: #3a3835;
  --t4: #1e1c1a;
  --mono: 'IBM Plex Mono', monospace;
  --sans: 'IBM Plex Sans', sans-serif;
}
html, body {
  background: #080808;
  color: var(--t1);
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
  overflow: hidden; /* 앱 셸, 내부 영역별 overflow 제어 */
}
```

### 4가지 Accent 테마 (Tweaks Panel용)
```javascript
const ACCENT_THEMES = {
  gold:    { gold:'#C89650', green:'#4A7045', red:'#b84040', glow:'rgba(200,150,80,' },
  neon:    { gold:'#00d4ff', green:'#00ff88', red:'#ff4488', glow:'rgba(0,212,255,' },
  emerald: { gold:'#34d399', green:'#059669', red:'#f87171', glow:'rgba(52,211,153,' },
  rose:    { gold:'#f472b6', green:'#a78bfa', red:'#fb923c', glow:'rgba(244,114,182,' },
};
```

### 3가지 Surface 스타일 (Tweaks Panel용)
```javascript
const SURFACE_STYLES = {
  glass: {
    s1:'rgba(18,18,22,.72)', s2:'rgba(24,24,30,.9)',
    b1:'rgba(255,255,255,.07)', b2:'rgba(255,255,255,.04)',
    blur:'blur(20px)', before:'linear-gradient(135deg,rgba(255,255,255,.03) 0%,transparent 60%)',
  },
  solid: {
    s1:'#141418', s2:'#1a1a1e',
    b1:'rgba(255,255,255,.09)', b2:'rgba(255,255,255,.05)',
    blur:'none', before:'none',
  },
  ghost: {
    s1:'transparent', s2:'rgba(255,255,255,.02)',
    b1:'rgba(255,255,255,.12)', b2:'rgba(255,255,255,.06)',
    blur:'none', before:'none',
  },
};
```

### 3가지 Density (Tweaks Panel용)
```javascript
const DENSITY_STYLES = {
  compact:  { cardPad:'20px 22px', gap:'10px', fontSize:12, headSize:18, mono:9, radius:'14px' },
  balanced: { cardPad:'24px 26px', gap:'14px', fontSize:13, headSize:20, mono:9, radius:'16px' },
  airy:     { cardPad:'32px 34px', gap:'18px', fontSize:14, headSize:24, mono:10, radius:'20px' },
};
```

### 9개 패밀리 컬러 (변경 금지)
```javascript
const FAMILIES = [
  { id:'fundamental', color:'#c8a96e', en:'FUNDAMENTAL', ko:'기업가치',   cnt:247 },
  { id:'market',      color:'#6ea8c8', en:'MARKET',      ko:'시장·상품',  cnt:183 },
  { id:'macro',       color:'#8bc87a', en:'MACRO',       ko:'거시경제',   cnt:312 },
  { id:'risk',        color:'#c87a8b', en:'RISK',        ko:'리스크·퀀트',cnt:198 },
  { id:'derivatives', color:'#9a7ac8', en:'DERIVATIVES', ko:'파생·헤지',  cnt:221 },
  { id:'trading',     color:'#c8b47a', en:'TRADING',     ko:'실전매매',   cnt:289 },
  { id:'industry',    color:'#7ac8c0', en:'INDUSTRY',    ko:'산업군',     cnt:176 },
  { id:'digital',     color:'#c87ab4', en:'DIGITAL',     ko:'디지털자산', cnt:134 },
  { id:'tax',         color:'#a8c87a', en:'TAX·LEGAL',   ko:'세금·법률',  cnt:98  },
];
```

---

## 3. 타이포그래피 계층

| 역할 | 폰트 | 크기 | 색상 |
|---|---|---|---|
| KPI 숫자 (대형) | IBM Plex Mono 300 | 38~64px | #ffffff + glow |
| KPI 숫자 (중형) | IBM Plex Mono 300 | 28~38px | 패밀리/accent 컬러 |
| 시계 | IBM Plex Mono 300 | 40px | #ffffff |
| 섹션 헤딩 | IBM Plex Sans 300 | 20~24px | #ffffff |
| 카드 제목 | IBM Plex Sans 500 | 14~20px | #e8e4dc |
| 본문 | IBM Plex Sans 400 | 12~14px | #8a8680 |
| 레이블/태그 | IBM Plex Mono 400 | 8~10px | #3a3835 · uppercase · letter-spacing .18em |
| 단위/보조 | IBM Plex Mono 300 | 9~11px | rgba(255,255,255,.35) |

---

## 4. 컴포넌트 스펙 — 완전 교체

### 4-1. Glass Card (`.card`)
```css
.card {
  background: rgba(255,255,255,.035);
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 16px;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  position: relative;
  overflow: hidden;
  transition: transform .22s cubic-bezier(.16,1,.3,1), border-color .2s, box-shadow .22s;
}
.card::before {
  content:'';
  position:absolute; inset:0; border-radius:inherit;
  background: linear-gradient(135deg, rgba(255,255,255,.055) 0%, rgba(255,255,255,.01) 40%, transparent 70%);
  pointer-events:none; z-index:0;
}
.card::after {
  content:'';
  position:absolute; inset:0; border-radius:inherit;
  box-shadow: inset 1px 1px 0 rgba(255,255,255,.08);
  pointer-events:none; z-index:0;
}
.card > * { position:relative; z-index:1; }
.card:hover {
  transform: translateY(-2px);
  border-color: rgba(255,255,255,.13);
  box-shadow: 0 12px 40px rgba(0,0,0,.4), 0 4px 16px rgba(0,0,0,.3);
}
```

### 4-2. Small Card (`.card-sm`)
```css
.card-sm {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px;
  backdrop-filter: blur(16px);
  position: relative; overflow: hidden;
  transition: transform .18s, border-color .15s, box-shadow .18s;
}
.card-sm:hover { transform:translateY(-1px); border-color:rgba(255,255,255,.1); box-shadow:0 6px 20px rgba(0,0,0,.3); }
```

### 4-3. Input Widget (`.inp`)
```css
.inp {
  width: 100%;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(255,255,255,.05) 0%, rgba(255,255,255,.02) 100%);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 12px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 16px; font-weight: 400; color: #ffffff;
  outline: none;
  transition: border-color .2s, box-shadow .25s, background .2s;
  letter-spacing: -.01em;
  backdrop-filter: blur(8px);
}
.inp:focus {
  border-color: rgba(200,150,80,.55);
  box-shadow: 0 0 0 3px rgba(200,150,80,.1), 0 0 20px rgba(200,150,80,.12), inset 0 0 20px rgba(200,150,80,.03);
  background: linear-gradient(135deg, rgba(200,150,80,.06) 0%, rgba(255,255,255,.03) 100%);
}
.inp::placeholder { color: rgba(255,255,255,.2); font-size: 13px; }
```

### 4-4. Glow Dots
```css
.gdot { width:6px; height:6px; border-radius:50%; display:inline-block; flex-shrink:0; }
.gd-green { background:var(--green); box-shadow:0 0 6px var(--green),0 0 14px rgba(74,112,69,.4); animation:pg 2.2s ease-in-out infinite; }
.gd-gold  { background:var(--gold);  box-shadow:0 0 6px var(--gold),0 0 14px rgba(200,150,80,.35); animation:pg2 2.8s ease-in-out infinite; }
.gd-off   { background:#252522; }
.gd-red   { background:var(--red); box-shadow:0 0 6px var(--red); }
```

### 4-5. Pills
```css
.pill {
  padding:6px 14px; border-radius:20px; font-family:var(--mono); font-size:10px;
  color:#4a4845; cursor:pointer; transition:all .15s; white-space:nowrap;
  background:rgba(255,255,255,.03); border:1px solid var(--b2);
  display:inline-flex; align-items:center; gap:5px;
}
.pill:hover  { border-color:var(--b1); color:#a8a49a; }
.pill.on     { background:rgba(74,112,69,.12); border-color:rgba(74,112,69,.3); color:#6aaa64; }
.pill.sel    { background:rgba(200,150,80,.1);  border-color:rgba(200,150,80,.28); color:var(--gold); }
```

### 4-6. Buttons
```css
.btn-gold {
  padding:11px 24px; background:var(--gold); color:#06090f;
  border:none; border-radius:10px; font-family:var(--mono);
  font-size:10px; letter-spacing:.14em; text-transform:uppercase;
  cursor:pointer; font-weight:500;
  transition:opacity .15s;
  box-shadow:0 0 20px rgba(200,150,80,.25),0 4px 12px rgba(200,150,80,.1);
}
.btn-gold:hover { opacity:.85; }
.btn-ghost {
  padding:10px 18px; background:transparent; color:var(--t2);
  border:1px solid var(--b1); border-radius:10px;
  font-family:var(--mono); font-size:10px; letter-spacing:.12em;
  cursor:pointer; transition:all .15s;
}
.btn-ghost:hover { border-color:var(--b3); color:var(--t1); }
```

### 4-7. Nav Tabs
```css
.nav-tab {
  padding:7px 18px; border-radius:22px; font-size:11px; letter-spacing:.04em;
  cursor:pointer; transition:all .15s; color:#4a4845;
  background:transparent; border:none; font-family:var(--sans); font-weight:400;
}
.nav-tab:hover { color:#a8a49a; }
.nav-tab.active {
  background:rgba(255,255,255,.08); color:var(--t1);
  border:1px solid rgba(255,255,255,.08); font-weight:500;
}
```

### 4-8. GlowChart (SVG 컴포넌트)
```tsx
function GlowChart({ data, color, h=70, showArea=true }) {
  const W=300, H=h;
  const min=Math.min(...data), max=Math.max(...data), range=max-min||1;
  const pts = data.map((v,i) => [
    i/(data.length-1)*W,
    H-((v-min)/range)*(H*.85)-H*.08
  ]);
  const path = pts.map((p,i) => `${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${W},${H} L0,${H} Z`;
  const id = `gc${color.replace('#','')}`;
  const [lx,ly] = pts[pts.length-1];
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{overflow:'visible'}}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
        <filter id={`${id}g`} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {showArea && <path d={area} fill={`url(#${id})`}/>}
      <path d={path} fill="none" stroke={color} strokeWidth=".8" opacity=".2"/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.6"
        style={{filter:`drop-shadow(0 0 5px ${color}99) drop-shadow(0 0 12px ${color}44)`}}/>
      <circle cx={lx} cy={ly} r="3.5" fill={color}
        style={{filter:`drop-shadow(0 0 6px ${color}) drop-shadow(0 0 14px ${color}66)`}}/>
    </svg>
  );
}
```

### 4-9. MiniSpark (카드 내 스파크라인)
```tsx
function MiniSpark({ color='#C89650', seed=1, h=24 }) {
  const W=80, H=h;
  const data = Array.from({length:20}, (_,i) => {
    const x = Math.sin(i*seed*.7+seed)*0.5 + Math.cos(i*seed*.3)*0.3;
    return 40 + x*25 + (i/20)*15;
  });
  const min=Math.min(...data), max=Math.max(...data), range=max-min||1;
  const pts = data.map((v,i) =>
    `${i/(data.length-1)*W},${H-((v-min)/range)*(H-3)-2}`
  ).join(' ');
  const id = `ms${seed}${color.replace('#','')}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
        <filter id={`${id}f`}>
          <feGaussianBlur stdDeviation="1" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#${id}g)`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4"
        filter={`url(#${id}f)`}
        style={{filter:`drop-shadow(0 0 3px ${color}99)`}}/>
    </svg>
  );
}
```

### 4-10. Gauge (반원 게이지)
```tsx
function Gauge({ value, low, mid, high, color='#C89650', unit='' }) {
  const r=44, c=52, stroke=8, arc=Math.PI*1.4;
  const startAngle=Math.PI*.8;
  const pct = Math.min(Math.max((value-low)/(high-low),0),1);
  const angle = startAngle + pct*arc;
  const x1=c+r*Math.cos(startAngle), y1=c+r*Math.sin(startAngle);
  const x2=c+r*Math.cos(startAngle+arc), y2=c+r*Math.sin(startAngle+arc);
  const fx=c+r*Math.cos(angle), fy=c+r*Math.sin(angle);
  const trackD=`M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 1 1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
  const fillD=`M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${pct>.5?1:0} 1 ${fx.toFixed(2)},${fy.toFixed(2)}`;
  const gc = pct<.33?'#4A7045':pct<.67?color:'#c87a8b';
  return (
    <svg width="104" height="68" viewBox="0 0 104 80">
      <path d={trackD} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={stroke} strokeLinecap="round"/>
      <path d={fillD} fill="none" stroke={gc} strokeWidth={stroke} strokeLinecap="round"
        style={{filter:`drop-shadow(0 0 4px ${gc}88)`}}/>
      <text x="52" y="72" textAnchor="middle" fontFamily="IBM Plex Mono"
        fontSize="16" fontWeight="300" fill={gc}>{value}{unit}</text>
    </svg>
  );
}
```

---

## 5. 키프레임 애니메이션 (globals.css)

```css
/* 전역 배경 */
@keyframes gridDrift { from{background-position:0 0} to{background-position:56px 56px} }
@keyframes scanLine  { from{top:0} to{top:100vh} }

/* 계산기 */
@keyframes sweep {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
@keyframes gaugeIn      { from{transform:scaleX(0)} to{transform:scaleX(1)} }
@keyframes resultFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

/* 상태 표시 */
@keyframes pg  { 0%,100%{opacity:1;box-shadow:0 0 6px var(--green),0 0 14px rgba(74,112,69,.4)}  50%{opacity:.55;box-shadow:0 0 3px var(--green)} }
@keyframes pg2 { 0%,100%{opacity:1;box-shadow:0 0 6px var(--gold),0 0 14px rgba(200,150,80,.35)} 50%{opacity:.55;box-shadow:0 0 3px var(--gold)} }
@keyframes mktpulse { 0%,100%{opacity:1} 50%{opacity:.15} }

/* 마켓 배너 */
@keyframes bannerPulse { 0%,100%{opacity:.6} 50%{opacity:1} }

/* UI 전환 */
@keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes slideIn   { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
@keyframes slideInRight { from{opacity:0;transform:translateX(24px)}  to{opacity:1;transform:translateX(0)} }
@keyframes slideInLeft  { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
@keyframes mobSlideUp   { from{opacity:0;transform:translateY(16px)}  to{opacity:1;transform:translateY(0)} }

/* Command Palette */
@keyframes cmdIn      { from{opacity:0} to{opacity:1} }
@keyframes cmdPanelIn { from{opacity:0;transform:translateY(-12px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }

/* 기타 */
@keyframes spin { to{transform:rotate(360deg)} }

/* 지구본 (GlobePanel 추가 시) */
/* Three.js requestAnimationFrame으로 자전 처리 */
/* .globe-exit: transform scale+translateZ+opacity CSS transition */

/* 유틸 클래스 */
.anim-up { animation: fadeUp .35s cubic-bezier(.16,1,.3,1) both; }
.anim-in { animation: slideIn .3s cubic-bezier(.16,1,.3,1) both; }
.slide-right { animation: slideInRight .3s cubic-bezier(.16,1,.3,1) both; }
.slide-left  { animation: slideInLeft  .3s cubic-bezier(.16,1,.3,1) both; }
.result-anim { animation: resultFadeIn .4s cubic-bezier(.16,1,.3,1) both; }
.calculating {
  background: linear-gradient(90deg, transparent 0%, rgba(200,150,80,.3) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: sweep .8s linear;
}
```

---

## 6. 페이지 구조 (4개 탭)

### 6-1. 전체 앱 셸
```
┌──────────────────────────────────────────────────────┐
│  HEADER (52px, sticky)                               │
│  로고 | 탭 네비 | 검색 버튼(⌘K) | v2 badge          │
├──────────────────────────────────────────────────────┤
│  MARKET BANNER (2px) — 장중 시 골드↔그린 그라데이션  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  TAB CONTENT (calc(100vh - 54px))                    │
│  Home / Glossary / Calculator / Events               │
│                                                      │
└──────────────────────────────────────────────────────┘
+ COMMAND PALETTE (⌘K, 전역 오버레이)
+ MOBILE NAV BAR (하단, 768px 이하)
+ TWEAKS PANEL (우하단 플로팅 버튼)
```

### 6-2. HEADER
```tsx
// 구성:
// 좌: StockWiki 로고 (SVG 아이콘 + 텍스트)
// 중: nav-tab 4개 (홈/금융사전/계산기/이벤트)
// 우: 검색 버튼(⌘K 뱃지 포함) + PROTOTYPE 뱃지 + 버전

// 마켓 배너 (헤더 바로 아래, 2px):
<div style={{
  height: 2,
  background: 'linear-gradient(90deg, transparent 0%, var(--gold) 30%, var(--green) 70%, transparent 100%)',
  boxShadow: '0 0 12px rgba(200,150,80,.5), 0 0 24px rgba(74,112,69,.3)',
  animation: 'bannerPulse 3s ease-in-out infinite',
  display: anyMarketOpen ? 'block' : 'none',
}}/>
```

---

## 7. 홈 대시보드 (Dashboard)

### 레이아웃
```
┌────────────────────┬────────────────────────────────┐
│  LEFT PANEL        │  RIGHT — Bento Grid             │
│  (clamp 300px~36%~440px) │  (flex:1, 2열)           │
│  overflow-y: auto  │  overflow-y: auto               │
│                    │                                  │
│  배경: rgba(0,0,0,.6)   배경: linear-gradient(160deg, │
│  border-right: 1px │    rgba(255,255,255,.018),#080808│
└────────────────────┴────────────────────────────────┘
```

### LEFT PANEL 구성 (위에서 아래 순서)
```
1. Clock Card
   - "KOREA STANDARD TIME" 레이블 (8px mono, uppercase, var(--t3))
   - KST 시간: 40px mono 300, #ffffff, textShadow gold glow
   - 날짜 + 요일: 우측 정렬

2. Market Pills (가로 스크롤)
   - KOSPI / K200F주간 / K200F야간 / NDX / NXT
   - pill.on / pill.sel / 기본

3. Status Grid (2열)
   - 좌: 장중 개수 (46px mono, green 배경 카드, #4A7045 테두리)
   - 우: 장외 개수 (46px mono, red 배경 카드, #b84040 테두리)

4. KPI Chart Card
   - "금융 용어 데이터베이스" 레이블 + ↗ 버튼
   - 카운트업 숫자: 38px mono, white, gold glow (0→16,323)
   - "9 families · 108 categories" 보조텍스트
   - GlowChart (kospiData, gold, h=68)
   - 하단: FUN/MKT/MAC/RSK/DRV/TRD/IND/DIG/TAX 레이블

5. KPI Mini Grid (2열)
   - 계산기: 28px mono, #4a9e9a, "69종 전체"
   - 이벤트:  28px mono, #7C6A9B, "200+ 예정"

6. CTA (2열)
   - btn-gold: 사전 열기 →
   - btn-ghost: 계산기 →

7. 로고 + 버전 (하단)
```

### RIGHT PANEL — Bento Grid
```
gridTemplateColumns: 1fr 1fr
gap: 10px
padding: 12px

① KOSPI 차트 카드 (1열)
   - 지수명 + 현재값 (28px mono) + 등락률 (green)
   - GlowChart (h=58, gold)
   - 하단: 상태 + 52W 고점 대비

② NDX 차트 카드 (1열)
   - 동일 구조, 색상: #6ea8c8

③ 오늘의 용어 카드 (gridColumn: 1/3, 전폭)
   - 배경: rgba(20,18,30,.75) + 보라 glow
   - 좌: 패밀리 컬러 바 + 용어명 + 영문명 + 설명
   - 우: 핵심 공식 박스 (mono 13px, 패밀리 컬러)
   - 클릭 → 사전 탭 이동

④ 다음 이벤트 카드 (1열)
   - 최근 4개 이벤트: D-day + 이름 + 날짜
   - 클릭 → 이벤트 탭 이동

⑤ 시장 스케줄 카드 (1열)
   - 5개 시장 상태 목록
   - SCHEDULE OFFSET ± 2.5 min 박스

⑥ 9 Families 카드 (gridColumn: 1/3, 전폭)
   - 9열 그리드
   - 각 셀: 상단 2px 컬러 바 + EN(5글자) + KO + 개수
   - 클릭 → 사전(해당 패밀리) 이동
```

### 실제 데이터 연결 (MOCK → 실제)
```typescript
// Dashboard 컴포넌트에서:
// 1. totalTerms → props로 받거나 TERMS.length 사용
// 2. kospiData, ndxData → 시세 API 없으므로 genData() 유지 (더미)
// 3. 오늘의 용어 → 날짜 기반 seed로 TERMS 배열에서 선택
// 4. upcoming → EVENTS_DATA (실제 데이터)
// 5. mktItems → getMktState() (기존 로직 유지)
```

---

## 8. 금융 사전 (Glossary)

### 레이아웃
```
┌──────────────┬──────────────────────────────────────┐
│ FAMILY SIDEBAR│ MAIN AREA                            │
│ (195px)       │ Hero Search + Family Pills + Grid    │
│ (모바일 숨김) │                                      │
└──────────────┴──────────────────────────────────────┘
+ TERM MODAL OVERLAY (절대 포지셔닝)
```

### Family Sidebar
```
- "FAMILY · 9개" 레이블
- 전체 항목 (선택 시 gold 바)
- 9개 패밀리 항목: 컬러 바 + ko + en(8자) + 개수
- 선택된 패밀리: 컬러 바 glow, 이름 컬러 변경
```

### Hero Search Section
```
- gold glow 배경 + ambient 오브
- 상단: 패밀리명 or "금융 용어 사전" + 개수
- 서브: 패밀리 EN + 설명 or "9 FAMILIES · 108 CATEGORIES"
- 검색 인풋: inp 스타일 + gold 돋보기 아이콘
- 패밀리 필터 필: 가로 스크롤, 컬러 dot 포함
```

### Term Card Grid
```
gridTemplateColumns: repeat(auto-fill, minmax(220px, 1fr))
gap: 10px

각 카드:
- 상단 2.5px 컬러 바 (선택 시 glow)
- 카테고리 뱃지 (패밀리 컬러 배경)
- 용어명: 20px 500, 영문명: 12px italic
- 설명: 2줄 클램프, 11.5px
- 하단: MiniSpark + 계산기 연결 뱃지
- 호버: ↗ 화살표 등장, translateY(-3px)
```

### Term Modal
```
오버레이: rgba(0,0,0,.65) + blur(6px)
모달: max 860px, #0e0e12, borderRadius 20px
상단: 3px 컬러 바 (glow)
헤더: 검색 결과 수 + 번호 | ★ 즐겨찾기 + ⎘ 복사 + × 닫기
본문 (좌):
  - 패밀리 뱃지 + 용어명 (48px 200) + 영문 + 카테고리
  - 구분선 (패밀리 컬러 그라데이션)
  - 01 쉽게 말하면 / 02 개요 / 03 공식 / 04 예시
  - 관련 용어 pill 목록
  - 계산기 버튼 (calcId 있을 때)
우측 TOC (200px):
  - CONTENTS 섹션 목록
  - 관련 용어 리스트
하단 네비: ‹ 이전 | n/total | 다음 ›
```

### 실제 데이터 연결
```typescript
// 실제 API 사용:
// fetchTerms(q, cat, favs, page, family) → { items, total, hasMore }
// fetchTermById(id) → Term | null
// 무한 스크롤: IntersectionObserver
// 패밀리별 용어 수: FAMILIES 배열의 cnt 값 사용
```

---

## 9. 계산기 (Calculator)

### 레이아웃
```
┌────────────────┬────────────────────────────────────┐
│ CALC SIDEBAR   │ CALC MAIN                          │
│ (250px)        │ Breadcrumb + 2열 (입력 | 결과)      │
│ (모바일 숨김)  │                                     │
└────────────────┴────────────────────────────────────┘
```

### Calc Sidebar
```
- "CALCULATORS · 69종" 레이블
- 그룹별: 컬러 바 + 그룹명 + 개수
- 그룹 내 아이템: 2열 그리드
  - 번호 (7.5px mono, 패밀리 컬러)
  - 이름 (11px)
  - 선택 시: 패밀리 컬러 배경 + 테두리
```

### Calc Main — 좌열 (입력)
```
1. Calc Header Card
   - 상단 3px 컬러 바 (glow)
   - 번호 + 그룹명 (9px mono uppercase, 패밀리 컬러)
   - 계산기명 (22px 500, white)
   - 설명 (12px, t2)
   - A/B 시나리오 버튼

2. Input Widget Cards (field별 1개)
   - 패밀리 컬러 gradient 배경
   - 레이블 (11px mono uppercase) + 단위 뱃지
   - inp 스타일 인풋 (22px mono, fontWeight 300)
   - Enter 키 → 계산 실행

3. 계산하기 버튼 (btn-gold, sweep 애니메이션)
   - 계산 중: spinner 표시

4. HOW TO USE
   - 01/02/03 번호 + 팁 텍스트
```

### Calc Main — 우열 (결과)
```
1. Result Card (최소 220px)
   - 결과 전: 빈 상태 (아이콘 + 안내 문구)
   - 결과 후:
     * radial glow 배경
     * 레이블 + SCENARIO A/B
     * 결과값: 64px mono 200, white, glow
     * 단위: 22px mono, 반투명
     * Gauge Bar (저평가↔적정↔고평가)
     * 상태 텍스트 (▼▲◆ + 레이블)

2. 시장 참고 데이터
   - 3개 참고값: 레이블 + 수치 + 단위

3. EXAMPLE
   - 컬러 배경 박스 (패밀리 컬러)
   - mono 12px 예시 텍스트

4. 관련 용어 pills

5. 계산 기록 (최근 5개)
   - 컬러 바 + 계산기명 + 시간 + 결과값
```

### 실제 데이터 연결
```typescript
// 기존 StockWiki.tsx의 계산기 로직 그대로 사용:
// - selectedCalc state → 계산기 선택
// - calcHistory (localStorage) → 계산 기록
// - CALC_CATEGORIES, calcs 데이터 → /data/calcs.ts
// MARKET_REF 데이터는 인라인으로 유지
```

---

## 10. 이벤트 캘린더 (Events)

### 레이아웃
```
┌──────────────────────────────────┬──────────────┐
│ MAIN (flex:1)                    │ SIDEBAR      │
│ Hero + 달력                       │ (260px)     │
│                                  │ Upcoming +  │
│                                  │ 범례         │
└──────────────────────────────────┴──────────────┘
```

### Hero Section
```
- 틸 컬러 ambient glow
- 제목 "이벤트 캘린더" (22px 300)
- 서브: "FOMC · CPI · NFP · K200 만기 · KST 기준"
- 필터 버튼: MACRO / EARNINGS / OPTIONS
- D-day Spotlight 3개 카드 (가장 가까운 이벤트)
  * 패밀리 컬러 배경 + 레이블 + D-n + 날짜
```

### Calendar
```
- 월 네비게이션 (‹ › TODAY 버튼)
- 7열 그리드 (MON~SUN)
- 각 셀 (minHeight: 72px):
  * 날짜 숫자 (오늘: gold dot + gold 색상)
  * 이벤트: 좌측 컬러 바 + 레이블 + 중요도 점
  * 주말 희미 처리
- 선택된 날짜 detail 카드 (anim-up)
```

### 우측 사이드바
```
- UPCOMING EVENTS (D-day 순 8개)
- D-DAY / D-n 뱃지
- 범례 (컬러 바 + 이벤트 유형)
```

### 실제 데이터 연결
```typescript
// /data/events.ts 또는 StockWiki.tsx의 customEvents props 사용
// 기존 EVENTS_DATA 구조 유지
```

---

## 11. ⌘K Command Palette

```
트리거: Cmd+K / Ctrl+K (전역)
오버레이: rgba(0,0,0,.72) + blur(8px), cmdIn 애니메이션
패널: max 640px, #0e0e12, borderRadius 18px, cmdPanelIn 애니메이션

구성:
- 검색 인풋 (gold 돋보기 + 15px sans)
- 결과 그룹: 이동 / 용어 / 계산기
- 각 항목: 28px 아이콘 박스 + 제목 + 부제
- 활성: gold 배경 tint
- 키보드: ↑↓ 이동, Enter 선택, ESC 닫기
- 하단 힌트: ↑↓ / ↵ / ESC
- 우측: "16,323 terms · 69 calcs"

실제 연결:
- 용어 검색 → fetchTerms API
- 계산기 → CALC_CATEGORIES
- 네비 → setActiveTab
```

---

## 12. 모바일 반응형

```css
@media (max-width: 768px) {
  html, body { overflow: auto; }
  .hide-mobile { display: none !important; }
  .mob-nav { display: flex !important; }  /* 하단 탭바 */
  .app-body { padding-bottom: 58px !important; }

  /* Dashboard */
  .dash-split { flex-direction: column !important; }
  .dash-left { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,.05); }
  .dash-bento { grid-template-columns: 1fr !important; }

  /* Glossary */
  .term-grid { grid-template-columns: repeat(2,1fr) !important; }
  .term-detail { position: fixed !important; inset: 0 !important; animation: mobSlideUp .3s both !important; }

  /* Calculator */
  .calc-split { flex-direction: column !important; overflow: auto !important; }

  /* Events */
  .events-sidebar { display: none !important; }
  .cal-cell { min-height: 60px !important; }
}
```

### 모바일 하단 탭바
```
높이: 58px, 고정, 상단 구분선
배경: rgba(9,9,11,.97) + blur
4개 버튼: 아이콘 + 레이블 (9px mono)
활성: gold 색상
```

---

## 13. Tweaks Panel (우하단 플로팅)

```
트리거: 우하단 플로팅 버튼 (32px, ⚙ 아이콘)
패널: 256px 너비, glass card 스타일

3가지 조절:
1. ACCENT THEME: Gold / Neon / Emerald / Rose (4x1 버튼 그리드)
2. SURFACE: Glass / Solid / Ghost
3. DENSITY: Compact / Balanced / Airy

변경 시 CSS 변수 실시간 업데이트 (document.documentElement.style.setProperty)
localStorage 저장 (stockwiki_tweaks)
```

---

## 14. 지구본 패널 (GlobePanel — 추후 추가)

> **현재 우선순위 아님.** Dashboard Bento Grid 구현 완료 후 별도 추가.

```
위치: Dashboard LEFT PANEL 최하단 or 별도 배경 레이어
구현: Three.js (dynamic import, ssr:false)
방식: WireframeGeometry (외부 API 불필요)
상태별:
  - 대기: Y축 자전 (20~25초/회전), rimLight
  - 사전 클릭: scale 1→0.3 + translateZ + opacity 0 → setActiveTab('glossary')
```

---

## 15. 파일 구조 & 수정 범위

### 수정 대상
```
/components/DashboardHome.tsx    ← Dashboard 전면 재구성
/components/StockWiki.tsx        ← Header, ⌘K, Tweaks Panel 추가
/app/globals.css                 ← 색상 변수 전환, 키프레임 추가
```

### 신규 생성
```
/components/CommandK.tsx         ← ⌘K 팔레트
/components/TweaksPanel.tsx      ← Tweaks Panel
/components/GlobePanel.tsx       ← (추후) Three.js 지구본
```

### 절대 건드리지 말 것
```
/data/terms.ts          ← 용어 DB
/data/calcs.ts          ← 계산기 데이터
/data/changelog.ts      ← 패치노트
/data/events.ts         ← 이벤트 (있다면)
/api/*                  ← API 라우트
```

### Props 인터페이스 (기존 유지)
```typescript
// DashboardHome props
interface Props {
  T: any;
  isDark: boolean;
  totalTerms: number;
  recent: any[];
  favorites: Set<string>;
  setActiveTab: (tab: string) => void;
  setSelectedCalc: (id: string) => void;
  setSelectedTerm?: (term: any) => void;
}
```

---

## 16. Scrollbar 스타일

```css
.sc {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #1e1e22 transparent;
}
.sc::-webkit-scrollbar { width: 3px; }
.sc::-webkit-scrollbar-thumb { background: #1e1e22; border-radius: 2px; }

.scx {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #1e1e22 transparent;
}
.scx::-webkit-scrollbar { height: 3px; }
.scx::-webkit-scrollbar-thumb { background: #1e1e22; }
```

---

## 17. 전달 요청사항 (클로드 디자인에게)

> **`StockWiki Dashboard.html` (프로토타입)을 Next.js TypeScript로 완전히 이식해주세요.**
>
> **필수 요건:**
> 1. `Dashboard.html`의 모든 컴포넌트(Dashboard/Glossary/Calculator/Events/CommandK/TweaksPanel) 이식
> 2. MOCK 데이터 → 실제 데이터 연결:
>    - 용어: `/api/terms` fetchTerms/fetchTermById 사용
>    - 계산기: `/data/calcs.ts`의 CALC_CATEGORIES 사용
>    - 이벤트: 기존 이벤트 데이터 사용
>    - 총 용어수: `TERMS.length` (자동)
> 3. 기존 StockWiki.tsx의 상태 관리 (favorites, recent, calcHistory, selectedTerm 등) 유지
> 4. getMktState() 로직 — 기존 DashboardHome.tsx 것 그대로 유지 (주말 야간 버그 수정 완료)
> 5. IBM Plex Mono/Sans 폰트 반드시 적용
> 6. globals.css 색상 변수 `#080808` 기반으로 업데이트
> 7. 모바일 반응형 완전 구현 (768px 기준)
> 8. ⌘K 팔레트 — 기존 StockWiki.tsx showCommandK state 연동
> 9. `GlowChart`, `MiniSpark`, `Gauge` SVG 컴포넌트 공통 분리
> 10. Tweaks Panel — localStorage 'stockwiki_tweaks'에 저장

---

*StockWiKi v2 Design Brief rev2 | 2026.04.28*
*Based on: StockWiki Dashboard.html (Full Prototype) + StockWiki Handoff Guide.html*
