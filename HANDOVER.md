# ETHOS 행정사 사무소 플랫폼 — 프로젝트 인수인계

> 최종 갱신: 2026-06-23  
> 저장소: `https://github.com/sangjin0302-commits/Admin-system-`  
> 브랜치: `main` (50 commits, latest `cb34a1b`)

---

## 1. 프로젝트 개요

**ETHOS 행정사(Licensed Administrative Attorney) 사무소** 풀스택 플랫폼.  
두 가지 목적으로 운영:

| 목적 | 경로 | 설명 |
|------|------|------|
| **공개 마케팅 사이트** | `/`, `/services`, `/blog`, `/fees`, `/contact` 등 | 고객 유입용 홈페이지 (Editorial 디자인 시스템) |
| **관리자/포털 운영 사이트** | `/admin`, `/portal` | 사건 관리, CRM, 재무, AI 분석, 고객 포털 |

---

## 2. 기술 스택

| 계층 | 기술 | 비고 |
|------|------|------|
| **프레임워크** | Next.js 15 (App Router) | React 19, TypeScript 5.7 |
| **ORM** | Prisma 6 | 듀얼 DB: SQLite(dev) / PostgreSQL(prod) |
| **인증** | NextAuth v5 beta | Credentials 방식, 2FA(TOTP) 지원 |
| **결제** | Toss Payments Widget v2 | `@tosspayments/tosspayments-sdk ^2.7.1` |
| **이메일** | Resend | 알림톡 실패 시 폴백 |
| **알림톡** | Solapi BizMessage | 카카오 알림톡 |
| **전자서명** | Modusign API | 웹훅 연동 |
| **세금계산서** | 바로빌 | SOAP API |
| **파일저장** | Cloudflare R2 (S3 호환) | dev: 로컬 `./uploads` |
| **캘린더** | Google Calendar OAuth | iCal 피드 + 양방향 싱크 |
| **모니터링** | Sentry | raw fetch envelope 방식 |
| **검색** | Fuse.js (client) | 공개 사이트 통합 검색 |
| **PDF** | pdf-lib + NotoSansKR | 한글 지원 |
| **배포** | Vercel (프론트) + Railway (PostgreSQL) | `main` push → 자동 배포 |

---

## 3. 디렉토리 구조

```
src/
├── app/
│   ├── (public)          # 공개 마케팅 페이지들
│   │   ├── page.tsx      # 히어로 홈
│   │   ├── about/        # 소개
│   │   ├── services/     # 5개 업무영역 상세
│   │   ├── blog/         # MDX + DB 블로그
│   │   ├── cases/        # 성공 사례
│   │   ├── contact/      # 문의 폼
│   │   ├── fees/         # 수수료 안내
│   │   ├── intake/       # 온라인 접수
│   │   ├── quick-check/  # AI 사전진단
│   │   ├── search/       # Fuse.js 통합 검색
│   │   └── track/        # 공개 진행상황 추적
│   ├── admin/            # 관리자 대시보드 (RBAC)
│   │   ├── inquiries/    # 상담 관리
│   │   ├── case-matters/ # 사건 관리
│   │   ├── site-content/ # CMS
│   │   ├── credentials/  # 이력 관리
│   │   ├── audit-log/    # 감사 로그
│   │   ├── notifications/# 알림 관리 + 재발송
│   │   ├── users/        # 직원 + 내 프로필/2FA
│   │   └── ...
│   ├── portal/           # 고객 포털
│   │   ├── signin/       # 2단계 로그인 (2FA)
│   │   ├── cases/        # 내 사건 조회
│   │   ├── upload/       # 서류 업로드
│   │   ├── notifications/# 알림 확인
│   │   └── payments/     # Toss 결제 (checkout→success/fail)
│   └── api/              # 60+ API 라우트
│       ├── admin/        # 관리자 API
│       ├── portal/       # 포털 API
│       ├── webhooks/     # Toss, Modusign, Solapi
│       ├── auth/         # NextAuth + Google OAuth
│       └── cron/         # 자동화 (마감 스캔, 자동전환 등)
├── lib/
│   ├── services/         # 329개 서비스 파일 (핵심 비즈니스 로직)
│   ├── auth/             # NextAuth 설정
│   └── practice-areas.ts # 5개 업무영역 SSOT
├── components/           # 공유 UI 컴포넌트
└── content/              # MDX 블로그 콘텐츠
```

---

## 4. 데이터 모델 (Prisma)

**총 66개 모델, 19개 Enum**

### 핵심 모델 그룹

| 그룹 | 모델 수 | 대표 모델 |
|------|---------|----------|
| **상담·사건** | 36 | Inquiry, CaseMatter, CaseParty, CaseTask, CaseEvent, Quote, ContractDraft |
| **CMS·포털** | 6 | SiteSetting, BlogPost, PortalClient, PortalUploadedFile |
| **결제·서명** | 3 | Payment, ESignRequest, TaxInvoice |
| **알림·감사** | 2 | NotificationLog, AdminAuditEvent |
| **조직·인증** | 3 | AdminUser, Organization, LegacyImportLog |
| **캘린더** | 2 | GoogleOAuthToken, GoogleCalendarSyncMap |
| **B2B/마켓** | 3 | FeeItem, Testimonial, CaseStudy |
| **특화 상세** | 4 | ImmigrationCaseDetail, AdminAppealDetail, ContractInvestigationDetail, LicensePermitDetail |
| **문서 관리** | 7 | CaseDocument, DocumentVersion, RequiredDocument, SubmissionPackage, AgencySubmission 등 |

### RBAC 역할 체계

| 역할 | 권한 |
|------|------|
| **SUPER** | 전체 관리 + 감사 알림 수신 |
| **MANAGER** | 사건·직원 관리 |
| **STAFF** | 일반 업무 |
| **EXTERNAL** | 외부 협력 (제한적 접근) |
| **AUDITOR** | 읽기 전용 감사 |

### 듀얼 DB 시스템

- `scripts/render-prisma-schema.mjs`가 `PRISMA_DB_PROVIDER` 환경변수에 따라 스키마 자동 전환
- **dev**: SQLite (`file:./prisma/dev.db`)
- **prod**: PostgreSQL (Railway)
- 주요 명령:
  - `npm run db:push` — SQLite 스키마 적용
  - `npm run db:push:postgres` — PostgreSQL 스키마 적용
  - `npm run db:seed:admin` — AdminUser 시드

---

## 5. 업무 영역 (Practice Areas)

`src/lib/practice-areas.ts`에서 중앙 관리 (SSOT):

| ID | 한국어 | 영문 |
|----|--------|------|
| `VISA_STAY` | 비자·체류 | Visa & Stay |
| `ADMIN_APPEAL` | 행정심판 | Administrative Appeal |
| `CONTRACT_INVESTIGATION` | 계약·사실조사 | Contract Investigation |
| `LICENSE_PERMIT` | 인허가 | License & Permit |
| `CORP_FORMATION` | 법인설립 | Corporate Formation |

---

## 6. 인증 흐름

### 관리자 (AdminUser)
1. Basic Auth 게이트 (초기 접근 제어)
2. NextAuth Credentials → AdminUser 테이블 검증
3. 2FA 활성화 시: 비밀번호 → TOTP 코드 2단계 인증
4. RBAC 라우트별 역할 강제 (`admin-rbac-service.ts`)

### 고객 포털 (PortalClient)
1. NextAuth Credentials → PortalClient 테이블 → AdminUser 폴백
2. 2FA 활성화 시: `/portal/signin` 2단계 UI
3. JWT에 role + userType 포함

---

## 7. 주요 자동화 흐름

### 결제 (Toss Payments)
```
고객 결제 요청 → CheckoutWidget (Toss SDK v2) → Toss 리다이렉트
→ /success → POST /api/portal/payments/confirm → CaseAccountingMemo 업데이트
→ 알림톡 발송 (+ 이메일 폴백)
```

### 알림 오케스트레이터 (`notify-orchestrator.ts`)
```
notifyClient() 호출 → Solapi 알림톡 시도
  → 성공: NotificationLog(ALIMTALK, SENT) 기록
  → 실패: Resend 이메일 폴백 → NotificationLog(EMAIL, SENT/FAILED) 기록
```

### 감사 위험 액션 알림
```
위험 액션 발생 (PAYMENT_CANCEL, ROLE_CHANGE, DELETE, CONFIG_CHANGE)
→ AdminAuditEvent 기록
→ alertSupersIfNeeded() → SUPER 역할 관리자에게 알림톡 발송
```

### 상담 자동전환 (Cron)
```
/api/cron/auto-conversion-proposals (CRON_SECRET 인증)
→ AUTO_CONVERT_ENABLED=true 시
→ qualificationScore ≥ 85인 Inquiry → CaseMatter 자동 생성
```

---

## 8. 외부 서비스 연동 현황

**모든 코드는 완성됨. 환경변수 미설정 시 SKIPPED/mock으로 안전하게 폴백.**

| 서비스 | 상태 | 비용 | 환경변수 접두사 |
|--------|------|------|----------------|
| Vercel | ✅ 배포 중 | Free~$20/user/mo | — |
| Railway PostgreSQL | ✅ 운영 중 | ~$5/mo | `DATABASE_URL` |
| Toss Payments | 🔑 키 등록 필요 | 2.9-3.3%/건 | `TOSS_*` |
| Solapi 알림톡 | 🔑 키 등록 필요 | 7-26₩/건 | `SOLAPI_*` |
| Modusign | 🔑 키 등록 필요 | 33K₩/mo~ | `MODUSIGN_*` |
| Google Calendar | 🔑 키 등록 필요 | 무료 | `GOOGLE_*` |
| 바로빌 | 🔑 키 등록 필요 | 100-200₩/건 | `BAROBILL_*` |
| Sentry | 🔑 키 등록 필요 | 무료~$26/mo | `SENTRY_*` |
| Resend | 🔑 키 등록 필요 | 3K/mo 무료 | `RESEND_*` |
| Cloudflare R2 | 🔑 키 등록 필요 | 10GB 무료 | `S3_*` |
| 법제처 MoLeg | 🔑 키 등록 필요 | 무료 | `MOLEG_API_OC` |
| Google Analytics | 선택 | 무료 | `NEXT_PUBLIC_GA_ID` |
| Naver Analytics | 선택 | 무료 | `NEXT_PUBLIC_NAVER_ID` |

> 전체 설정 가이드: [`EXTERNAL_KEYS_SETUP.md`](EXTERNAL_KEYS_SETUP.md)

---

## 9. 디자인 시스템

**Editorial 스타일** — `:where()` 저특수성 CSS 유틸리티

| 클래스 | 용도 |
|--------|------|
| `ethos-card` | 카드 컨테이너 |
| `ethos-display` | 큰 타이틀 |
| `ethos-aurora` | 오로라 배경 효과 |
| `text-primary` | 브랜드 컬러 (#0f172a계) |
| `text-text-strong` | 강조 텍스트 |
| `text-text-muted` | 보조 텍스트 |

- 폰트: serif 헤딩 + sans-serif 본문
- 반응형: 모바일 우선 (sm/md/lg 브레이크포인트)
- 다크밴드: 히어로/CTA에서 흰색 텍스트 보장

---

## 10. 개발 환경 설정

### 최초 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 복사
cp .env.example .env
# .env에서 최소한 ADMIN_BASIC_AUTH_USER, ADMIN_BASIC_AUTH_PASSWORD 설정

# 3. Prisma 클라이언트 생성 + DB 초기화
npm run db:init

# 4. AdminUser 시드 (ADMIN_SEED_* 환경변수 설정 후)
npm run db:seed:admin

# 5. 개발 서버
npm run dev          # http://localhost:3000
```

### 핵심 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (포트 3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run typecheck` | TypeScript 검사 |
| `npm run verify` | 빌드 + 타입체크 + 린트 전체 파이프라인 |
| `npm run db:push` | SQLite 스키마 적용 |
| `npm run db:push:postgres` | PostgreSQL 스키마 적용 |
| `npm run db:seed:admin` | AdminUser 시드 |
| `npm run ops:env:check` | 환경변수 검증 |
| `npm run ops:smoke` | 스모크 테스트 |

---

## 11. 배포

### Vercel (프론트엔드)
- `main` 브랜치 push → 자동 빌드 + 배포
- 환경변수: Vercel Project Settings에서 관리
- Cron: `vercel.json`에 정의된 cron 라우트 (`/api/cron/*`)

### Railway (데이터베이스)
- PostgreSQL 인스턴스
- `DATABASE_URL` 연결 문자열을 Vercel env에 설정
- 스키마 변경 시: `npm run db:push:postgres` 수동 실행 필요

---

## 12. 개발 라운드 히스토리

| 라운드 | 주요 내용 |
|--------|----------|
| **V** | Toss 결제 + Solapi 알림톡 + Modusign 전자서명 + iCal 피드 + Sentry + CI |
| **W** | DB 영속화 + 알림 클로즈드 루프 |
| **X** | Organization 멀티사무소 + 서명완료 알림 루프 + 모바일 |
| **Y** | Google Cal OAuth 양방향 + 바로빌 세금계산서 + 위임장 PDF |
| **Z** | RBAC + Lawbot 자동분석 cron + SEO JSON-LD |
| **AA** | Admin Users UI + Audit Log + Lawbot 패널 |
| **BB** | 사건상세 Lawbot + 공개 SEO 5종 + NextAuth AdminUser |
| **CC** | E서명/결제 패널 + 포털 대시 + 자동전환 cron |
| **DD** | Dashboard KPI + 블로그 카테고리 + Lawbot quick |
| **EE** | 통합검색 + 2FA + 자동전환 auto + Audit SUPER 알람 |
| **FF** | 프로필/2FA UI + 로그인 2FA 강제 + 통합 알림 오케스트레이터 |
| **GG** | 포털 2단계 로그인 + 알림 재발송 + Lawbot CSV export |
| **HH** | Toss Widget v2 결제 UI + 외부 키 가이드 문서 |

---

## 13. 미완료 / 다음 작업

### 즉시 필요
- [ ] `cb34a1b` 커밋 push (법인설립 추가, 아직 origin에 안 올라감)
- [ ] `npm run db:push:postgres` — Railway DB에 최신 스키마 반영
- [ ] `npm run db:seed:admin` — AdminUser 시드 실행
- [ ] 외부 서비스 키 등록 (`EXTERNAL_KEYS_SETUP.md` 체크리스트)

### 제안된 Round II 고도화
- [ ] `/admin/cases` 멀티필터 (상태·카테고리·담당자·기간)
- [ ] Inquiry 분석 카드 (AI 요약 시각화)
- [ ] `/admin/blog-import` 자동 분류
- [ ] `/faq` 검색 기능
- [ ] 대시보드 차트 (Recharts)
- [ ] 영수증 PDF 생성

### 리팩토링 대상
- [ ] 8개 API 라우트가 카테고리를 하드코딩 → `practice-areas.ts` import로 전환

---

## 14. 주의사항

1. **Prisma import 경로**: `@generated/prisma-client/client` (기본 `@prisma/client` 아님)
2. **Admin API 인증**: `createAdminRequestContext()` + Basic Auth 미들웨어
3. **2FA**: 자체 TOTP 구현 (`totp-service.ts`, RFC 6238), 외부 의존성 없음
4. **i18n**: 쿼리 파라미터 `?lang=en` 방식 (경로 기반 아님)
5. **CMS 캐시**: SiteSetting 8초 메모리 캐시, 저장 시 즉시 무효화
6. **환경변수 안전성**: 모든 외부 서비스 키 미설정 시 SKIPPED/mock으로 폴백 → 사이트 정상 작동

---

## 15. 환경변수 전체 목록 (61개)

> 상세 설명은 [`.env.example`](.env.example) 참조

```
# DB
PRISMA_DB_PROVIDER, DATABASE_URL

# Auth
AUTH_SECRET, NEXTAUTH_URL, ADMIN_BASIC_AUTH_USER, ADMIN_BASIC_AUTH_PASSWORD
ADMIN_ENFORCE_STRONG_CREDENTIALS, ADMIN_MIN_PASSWORD_LENGTH
ADMIN_AUTH_RATE_LIMIT_MAX_FAILURES, ADMIN_AUTH_RATE_LIMIT_WINDOW_MS
ADMIN_REQUIRE_SAME_ORIGIN, ADMIN_ALLOW_MISSING_ORIGIN, ADMIN_IP_ALLOWLIST
FORCE_HTTPS

# Site
NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_OFFICE_PHONE, NEXT_PUBLIC_OFFICE_EMAIL
NEXT_PUBLIC_GA_ID, NEXT_PUBLIC_NAVER_ID

# Lawbot
LAWBOT_ANALYZE_URL, LAWBOT_ENABLE_AUTOMATIC_CALLS, LAWBOT_ANALYZE_TIMEOUT_MS
LAWBOT_ANALYZE_TOKEN, LAWBOT_BRIDGE_BASE_URL, LAWBOT_SERVICE_KEY, LAWBOT_SERVICE_CALLER

# Notion
NOTION_SYNC_ENABLED, NOTION_TOKEN, NOTION_CASE_DATABASE_ID
NOTION_CONSULTATION_DATABASE_ID, NOTION_REFERENCE_ARCHIVE_DATABASE_ID
NOTION_REFERENCE_WEBSITE_DATABASE_ID

# Intake
ADMIN_MARKETING_SYNC_TOKEN, PUBLIC_INTAKE_RATE_LIMIT_*, PUBLIC_INTAKE_DEDUP_*
PUBLIC_INTAKE_MAINTENANCE_MODE, PUBLIC_INTAKE_ENABLE_HONEYPOT

# Email
NOTIFICATION_PROVIDER, RESEND_API_KEY, RESEND_FROM

# Storage
PORTAL_UPLOAD_DIR, PORTAL_UPLOAD_MAX_BYTES, STORAGE_DRIVER
S3_BUCKET, S3_REGION, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PREFIX

# Payments
TOSS_SECRET_KEY, TOSS_WEBHOOK_SECRET, NEXT_PUBLIC_TOSS_CLIENT_KEY
BAROBILL_API_KEY, BAROBILL_CORP_NUM, BAROBILL_USER_ID, BAROBILL_BASE_URL

# Communications
SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_PFID, SOLAPI_SENDER_PHONE
SOLAPI_TEMPLATE_* (6개)
MODUSIGN_API_KEY, MODUSIGN_USER_EMAIL, MODUSIGN_WEBHOOK_SECRET

# Calendar
CALENDAR_FEED_TOKEN, GOOGLE_CALENDAR_TOKEN
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

# Monitoring
SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_RELEASE

# Cron & Seed
CRON_SECRET
ADMIN_SEED_EMAIL, ADMIN_SEED_NAME, ADMIN_SEED_PASSWORD, ADMIN_SEED_ROLE

# Multi-office
TENANT_DEFAULT_NAME, TENANT_DEFAULT_SUBDOMAIN, TENANT_DEFAULT_OWNER, TENANT_DEFAULT_PLAN

# Features
AUTO_CONVERT_ENABLED, PDF_KOREAN_FONT_PATH, MOLEG_API_OC
```
