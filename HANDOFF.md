# StockWiki.kr — Handoff Document

> 작성일: 2026-04-17
> 대상: 새 Cowork 프로젝트에서 이 프로젝트를 이어받는 Claude 세션

---

## 1. 프로젝트 개요

**StockWiki.kr** — 한국어 주식/금융 용어 사전 + 계산기 웹사이트
- **도메인**: stockwiki.kr (Vercel 자동 배포)
- **GitHub**: `wodnjs8990-dev/StockWiKi` (main 브랜치 기준 자동 배포)
- **오너**: 재원 (wodnjs8990@gmail.com) — 대한민국 거주 주식/선물 전업 투자자
- **로컬 경로**: `~/Desktop/stockwiki`

## 2. 기술 스택

- **프레임워크**: Next.js 16 (App Router, TypeScript)
- **스타일**: Tailwind CSS + USM Haller Noir 다크 테마 (색상: #0a0a0a 배경, #e8e4d6 텍스트, #C89650 포인트)
- **배포**: Vercel (GitHub main 브랜치 push 시 자동 배포, 1~2분 소요)
- **인증**: bcryptjs + JWT (관리자 페이지)
- **피처 토글**: Vercel Edge Config (maintenance mode, glossary/calculator/commandK on/off)

## 3. 주요 파일 구조

```
~/Desktop/stockwiki/
├─ app/                     # Next.js App Router
│  ├─ page.tsx              # 홈 (StockWiki 컴포넌트 마운트)
│  ├─ terms/[slug]/page.tsx # 용어 상세 페이지 (SEO용)
│  └─ calc/[slug]/page.tsx  # 계산기 상세 페이지 (SEO용)
├─ components/
│  └─ StockWiki.tsx         # 메인 UI 컴포넌트 (~2500줄, 용어/계산기 통합)
├─ data/
│  ├─ terms.ts              # 용어 DB (현재 487개, 17 카테고리)
│  └─ calcs.ts              # 계산기 메타데이터 (29개 계산기)
└─ HANDOFF.md               # 이 문서
```

## 4. 데이터 모델

### Term (data/terms.ts)

```ts
type Term = {
  id: string;                         // 고유 식별자 (라틴 소문자, kebab-case 지양)
  name: string;                       // 짧은 이름 (UI 카드 제목)
  fullName: string;                   // 풀네임 (한글)
  en: string;                         // 영문 명칭
  category: string;                   // CATEGORIES 중 하나
  related: string[];                  // 관련 용어 id 배열 (UI: "관련 용어" 칩)
  description: string;                // 한 줄 설명
  detailed?: string;                  // 상세 설명 (선택)
  relations?: Record<string, string>; // 연결 관계 (키=표시라벨, 값=관계 설명)
  marketImpact?: string;              // 시장 영향 텍스트
  formula: string;                    // 공식
  example: string;                    // 예시
  easy?: string;                      // 쉬운 설명 (유치원생 수준)
};
```

### 카테고리 (17개)
전체 · 밸류에이션 · 수익성 · 배당 · 재무안정성 · 선물옵션 · 파생헤지 · 기술적지표 · 시장거래 · 거시경제 · 미시경제 · 기업재무 · 회계심화 · 포트폴리오 · 퀀트통계 · 해외주식ETF · 차트심리

## 5. 지금까지 완료한 작업 (2026-04 기준)

### 5-1. 용어 추가: 340 → 487개 (+147)
- **1차 +50**: 회계심화, 퀀트통계, 차트심리, 파생헤지, 선물옵션 집중 보강
- **2차 +100**: 전 카테고리 균등 확장
- **3차 +11**: 데드링크 해소용 핵심 용어 (realrate, demand, supply, consumption, deleverage, sifi, exotic, peak, fiscaldeficit, compound, dotplot)

### 5-2. 필터 버그 수정 (React 중복 키 이슈)
"기업재무" 필터 클릭 시 REIT/당좌비율/D/E/MACD 등 다른 카테고리 카드가 섞여 렌더링되던 버그 해결.

**원인**: 13쌍의 중복 `id` 로 인해 `key={term.id}` reconciliation 충돌
**조치**: 중복 13개(`alpha`, `correlation`, `de`, `diversification`, `ichimoku`, `ipo`, `macd`, `obv`, `quickratio`, `rebalancing`, `reit`, `stoch`, `vwap`)의 두 번째 항목 제거

### 5-3. 연결관계 전수조사 + 데드링크 해소
- `related: [...]` 깨진 ID 12건 → 모두 복원 또는 매칭 가능한 ID로 교체
- `relations: {...}` UI 매칭 실패 키 9건 → 매칭 가능한 라벨로 리라이트
  - ppi: `기업이익률` → `영업이익률 (Operating Margin)`
  - businesscycle: `Credit Cycle` → `신용경색 (Credit Crunch)`
  - costpush: `수요견인과 구분` → `수요견인 인플레이션`
  - liquidity: `QE/QT` → `양적완화 (QE)`
  - marketefficiency: `패시브 투자` → `VOO (패시브 투자)`
  - cpi: `헤드라인 vs 근원` 제거 (개념성 중복)

**결과**: 487 unique ID, 중복 0, 깨진 related 0, relations 데드링크 0

### 5-4. 계산기 자동 스크롤 기능
`components/StockWiki.tsx`의 `CalculatorView`에 `activeCalcRef` + `useEffect` 추가. 계산기 아이콘 클릭 시 확장 패널로 부드럽게 스크롤 (smooth, 상단 80px 헤더 오프셋 보정).

## 6. UI 렌더링 핵심 로직

### 연결 관계 (Relations) 퍼지 매칭 (StockWiki.tsx:583-588)
```ts
const matchTerm = TERMS.find(t =>
  t.name === key ||
  t.fullName === key ||
  key.includes(t.name) ||
  (t.en && key.toLowerCase().includes(t.en.toLowerCase()))
);
```
→ `relations` 객체 키를 작성할 때 위 4개 조건 중 하나를 반드시 만족하도록 작성할 것. 매칭 실패 시 데드카드(클릭 불가)로 표시됨.

### 관련 용어 (Related) ID 렌더링 (StockWiki.tsx:514)
```ts
const relatedTerms = term.related?.map(id => TERMS.find(t => t.id === id)).filter(Boolean) || [];
```
→ `related` 배열에 존재하지 않는 ID를 넣으면 조용히 사라짐. 반드시 실제 존재하는 ID만 사용.

## 7. 알려진 기술 부채

1. **StockWiki.tsx TypeScript 에러** — 일부 하위 컴포넌트 (`NumInput`, `ResultBox` 등)가 implicit `any` props를 받아 strict 모드에서 ~60개 에러 발생. 빌드에는 영향 없음 (Next.js가 기본적으로 type error ignore 설정).
2. **중복 데이터**: `terms.ts` 카테고리 분포가 불균형 — 거시경제 89개 vs 수익성 16개.
3. **계산기 미연동 용어**: terms.ts의 `compound`, `realrate` 등과 calcs.ts의 동명 계산기 id 간 크로스링크 없음 (향후 "관련 계산기" 섹션 추가 고려).

## 8. 배포 플로우

```bash
cd ~/Desktop/stockwiki
git status
git add -A
git commit -m "설명"
git push          # 자동 Vercel 배포 (1~2분)
```

**주의**: Cowork 샌드박스에서는 git 락 파일 권한 문제로 자동 커밋/푸시 불가 → **반드시 맥 터미널에서 수동 실행**.

## 9. 새 Cowork 세션용 부트스트랩 프롬프트

새 Cowork 프로젝트를 시작할 때 이 프롬프트를 그대로 복붙하세요:

---

```
Cowork 프로젝트 워크스페이스 폴더: ~/Desktop/stockwiki

나는 StockWiki.kr (한국어 주식/금융 용어 사전 + 계산기) 프로젝트의 오너다.
다음 문서를 먼저 읽고 프로젝트 컨텍스트를 파악해라:
- ~/Desktop/stockwiki/HANDOFF.md (프로젝트 개요, 데이터 모델, 진행 내역)
- ~/Desktop/stockwiki/data/terms.ts (용어 DB — 크다, 필요한 부분만 Read)
- ~/Desktop/stockwiki/components/StockWiki.tsx (UI — 크다, 필요한 부분만 Read)

규칙:
1. 내가 용어를 추가해 달라고 하면 `easy` 필드 반드시 포함 (유치원생도 이해 수준의 설명).
2. 새 용어 추가/수정 시 `related: [...]` 배열에는 실제 존재하는 ID만, `relations: {...}` 키는 StockWiki.tsx의 퍼지 매칭 로직(name/fullName/부분문자열/en소문자)에 걸리도록 작성.
3. 코드 수정 후 반드시 `grep`/`tsc --noEmit`로 깨진 참조·중복 ID·타입 에러 여부 전수 검사.
4. 커밋/푸시는 샌드박스에서 불가하므로 명령어만 한 줄씩 분리해 제공 (내가 맥 터미널에서 수동 실행).
5. Next.js 16 App Router + TypeScript 환경, 스타일은 기존 USM Haller Noir 다크 테마 유지.
6. 답변은 한국어, 전업투자자 수준 용어 사용 가능.

환경 세팅 확인:
- Vercel 자동 배포 설정되어 있음 (main 푸시 시 1~2분 내 반영)
- Edge Config로 피처 토글 가능 (glossary/calculator/commandK)

지금 네가 받은 첫 번째 작업은: [여기에 실제 작업 내용을 기재]
```

---

## 10. 자주 쓰는 명령어 모음

```bash
# 용어 개수 확인
grep -c "^  { id: '" data/terms.ts

# 특정 ID 위치 찾기
grep -n "^  { id: 'XXX'" data/terms.ts

# 중복 ID 찾기
grep -n "^  { id: '" data/terms.ts | awk -F"'" '{print $2}' | sort | uniq -c | sort -rn | awk '$1 > 1'

# 카테고리별 분포
python3 -c "import re; from collections import Counter; print(Counter(re.findall(r\"category: '([^']+)'\", open('data/terms.ts').read())).most_common())"

# TypeScript 검사
npx tsc --noEmit 2>&1 | grep "data/terms.ts"
```

---

*End of HANDOFF.md*
