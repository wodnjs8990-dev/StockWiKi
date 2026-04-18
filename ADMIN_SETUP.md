# 🔐 관리자 시스템 설정 가이드

이 가이드를 따라하면 **관리자 페이지 + 점검 모드 기능**이 완성됩니다.

전체 과정: **약 20~30분** (Vercel Edge Config 설정 + 환경변수 + 파일 배포)

---

## 📋 목차

- [1. 파일 배치](#1-파일-배치)
- [2. 비밀번호 해시 생성](#2-비밀번호-해시-생성)
- [3. Vercel Edge Config 설정](#3-vercel-edge-config-설정)
- [4. 환경변수 4개 등록](#4-환경변수-4개-등록)
- [5. 배포 및 확인](#5-배포-및-확인)
- [6. 사용법](#6-사용법)
- [7. 보안 체크리스트](#7-보안-체크리스트)

---

## 1. 파일 배치

제공된 파일들을 프로젝트 폴더에 배치해야 합니다.

### 파일 구조
```
stockwiki/
├── app/
│   ├── admin-stk-2026/
│   │   ├── page.tsx                      ← 새 파일
│   │   ├── login/page.tsx                ← 새 파일
│   │   └── dashboard/page.tsx            ← 새 파일
│   ├── api/admin/
│   │   ├── login/route.ts                ← 새 파일
│   │   ├── logout/route.ts               ← 새 파일
│   │   ├── toggle-maintenance/route.ts   ← 새 파일
│   │   └── feature-toggle/route.ts       ← 새 파일
│   └── maintenance/page.tsx              ← 새 파일
├── components/
│   └── AdminDashboard.tsx                ← 새 파일
├── lib/
│   ├── auth.ts                           ← 새 파일
│   └── config.ts                         ← 새 파일
├── middleware.ts                          ← 새 파일 (루트에 위치)
├── public/robots.txt                      ← 수정
├── package.json                           ← 수정 (의존성 추가)
└── generate-password-hash.js              ← 새 파일 (일회용 도구)
```

---

## 2. 비밀번호 해시 생성

### 터미널에서 실행

```bash
cd ~/Desktop/stockwiki
```

의존성 설치:
```bash
npm install
```

비밀번호 해시 생성 (원하는 비밀번호로 교체):
```bash
node generate-password-hash.js "YourStrongPassword123!"
```

출력된 두 값을 **메모장에 복사**해두세요:
- `ADMIN_PASSWORD_HASH`: `$2a$12$...` (약 60자)
- `ADMIN_JWT_SECRET`: `xxxx...` (약 44자)

⚠️ **이 값들은 GitHub에 절대 올라가지 않습니다.** Vercel 환경변수에만 저장하세요.

---

## 3. Vercel Edge Config 설정

점검 모드 값을 전 세계 엣지에서 빠르게 읽기 위한 저장소입니다.

### 3-1. Edge Config 생성

1. 👉 https://vercel.com/dashboard/stores 접속
2. **Create Database** 클릭
3. **Edge Config** 선택
4. 이름: `stockwiki-config` 입력
5. **Create** 클릭

### 3-2. Edge Config ID와 Token 복사

생성 후 화면에서 **Edge Config ID**를 메모.

Connection String 섹션에서 **READ Token** 복사 (EDGE_CONFIG 환경변수용).

### 3-3. 프로젝트에 연결

1. 해당 Edge Config 페이지 상단의 **Projects** 탭
2. **Connect Project** 클릭
3. `stockwiki` 프로젝트 선택 → **Connect**
4. 자동으로 `EDGE_CONFIG` 환경변수가 프로젝트에 추가됨

### 3-4. 초기 값 삽입

Edge Config 페이지 **Items** 탭에서:
- **Add Item** 클릭
- Key: `siteConfig`
- Value (JSON):
```json
{
  "maintenanceMode": false,
  "maintenanceMessage": "더 나은 서비스 제공을 위해 시스템을 점검하고 있습니다.",
  "features": {
    "glossary": true,
    "calculator": true,
    "commandK": true
  }
}
```
- **Save** 클릭

### 3-5. Vercel API 토큰 생성

관리자 페이지에서 Edge Config를 수정하려면 API 토큰이 필요합니다.

1. 👉 https://vercel.com/account/settings/tokens
2. **Create Token** 클릭
3. Token Name: `stockwiki-admin`
4. Expiration: **No Expiration** (또는 1년)
5. Scope: **Full Account** (Edge Config 쓰기 권한 포함)
6. **Create** 클릭
7. 생성된 토큰 복사 (한 번만 보여짐!) → 메모장에 저장

---

## 4. 환경변수 4개 등록

Vercel 프로젝트에 **총 4개의 환경변수**를 등록합니다:

| 변수명 | 값 | 출처 |
|--------|-----|------|
| `ADMIN_PASSWORD_HASH` | `$2a$12$...` | 2단계 출력 |
| `ADMIN_JWT_SECRET` | `xxxx...` | 2단계 출력 |
| `VERCEL_API_TOKEN` | `xxxxxx` | 3-5단계 출력 |
| `EDGE_CONFIG_ID` | `ecfg_xxx` | 3-2단계 출력 |

⚠️ `EDGE_CONFIG` 변수는 3-3단계에서 자동 등록됩니다 (별도 추가 불필요)

### 등록 방법

1. Vercel → `stockwiki` 프로젝트 → **Settings** → **Environment Variables**
2. 각 변수마다:
   - Key: 변수명 입력
   - Value: 값 붙여넣기
   - Environments: **Production / Preview / Development 모두 체크** ✓
3. **Save** 클릭

---

## 5. 배포 및 확인

### 5-1. 터미널에서 배포

```bash
cd ~/Desktop/stockwiki
```

```bash
git add .
```

```bash
git commit -m "feat: admin dashboard with maintenance mode"
```

```bash
git push
```

### 5-2. Vercel 자동 재배포 대기 (2~3분)

Vercel 대시보드에서 Deployment 상태 확인.

### 5-3. 접속 테스트

1. https://stockwiki.kr/admin-stk-2026 접속
2. 로그인 화면이 뜨면 비밀번호 입력
3. 대시보드 진입 성공 시 ✓

---

## 6. 사용법

### 🔴 점검 모드 켜기

1. https://stockwiki.kr/admin-stk-2026 로그인
2. 상단 **사이트 상태** 카드의 메시지·종료 시각 입력
3. **점검 시작** 버튼 클릭
4. **즉시** 전 세계 방문자에게 점검 화면 표시

### ✅ 점검 모드 해제

1. 관리자 페이지에서 **점검 해제** 버튼 클릭
2. 즉시 정상 운영 재개

### 🎛️ 기능별 개별 토글

특정 탭만 잠그고 싶을 때:
- 대시보드 **Feature Toggles** 섹션
- 금융 사전 / 계산기 / 빠른 검색 각각 ON/OFF

(주의: 이 기능은 StockWiki.tsx에서 config 값을 읽어야 완전 동작합니다. 현재는 관리자 DB만 구축된 상태. 필요 시 추가 구현 요청하세요.)

---

## 7. 보안 체크리스트

배포 후 아래 항목 확인:

- [ ] 관리자 URL을 타인에게 노출하지 않았다
- [ ] 비밀번호는 12자 이상, 사전 단어 아님
- [ ] .env.local 파일을 GitHub에 올리지 않았다 (.gitignore에 포함됨)
- [ ] ADMIN_PASSWORD_HASH는 Vercel 환경변수에만 저장
- [ ] 5회 실패 시 15분간 잠금 (레이트 리미트 작동)
- [ ] JWT 토큰 24시간 후 자동 만료
- [ ] httpOnly + secure + sameSite 쿠키 설정됨

### 🚨 비밀번호 변경 방법

1. `node generate-password-hash.js "새비밀번호"` 실행
2. Vercel 환경변수 `ADMIN_PASSWORD_HASH` 업데이트
3. **Deployments** 탭에서 **Redeploy** 클릭
4. 이전 세션은 자동 무효화됨 (ADMIN_JWT_SECRET도 변경하면 확실)

### 🚨 해킹 시도 징후 발견 시

1. 모든 환경변수 즉시 재생성 (비밀번호 + JWT Secret + API Token)
2. Vercel API 토큰 revoke (https://vercel.com/account/settings/tokens)
3. Redeploy

---

## 🆘 트러블슈팅

### 로그인 했는데 대시보드로 안 넘어가요
- Vercel 환경변수 4개 모두 등록되었는지 확인
- `ADMIN_PASSWORD_HASH` 앞뒤 공백 제거
- Redeploy 후 다시 시도

### "점검 시작" 눌렀는데 사이트 반영 안 됨
- Edge Config의 `siteConfig` 항목이 생성되었는지 확인
- `VERCEL_API_TOKEN` 권한 확인 (Edge Config 쓰기 권한 필요)
- 브라우저 캐시 삭제 후 시크릿 모드로 확인

### 비밀번호 입력했는데 계속 실패
- 비밀번호 복사 시 공백 포함 안 되도록
- 5회 이상 실패 시 15분 대기 필요
- 해시 재생성 후 환경변수 교체

---

## 🎯 구조 요약

```
사용자 요청 → middleware.ts → Edge Config 조회
  ↓
maintenanceMode?
  ├─ true  → /maintenance (공사장 화면)
  └─ false → 정상 서비스

관리자 요청 → /admin-stk-2026
  ↓
인증됨?
  ├─ Yes → /dashboard
  └─ No  → /login → API 검증 (bcrypt + JWT)
```

---

**문의**: 설정 중 막히면 어느 단계 어떤 에러인지 알려주세요.
