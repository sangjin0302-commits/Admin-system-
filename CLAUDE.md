# ETHOS 행정사사무소 — 프로젝트 인수인계

## 프로젝트 개요

행정사(licensed administrative attorney) 사무소 풀스택 플랫폼. 두 가지 목적:
1. **공개 마케팅 사이트** — 고객 유입용 홈페이지 (editorial 디자인 시스템)
2. **관리자/포털 운영 사이트** — 사건 관리, CRM, 재무, AI 분석

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 15 (App Router, Server Components) |
| 언어 | TypeScript, Tailwind CSS |
| ORM | Prisma 6 (SQLite 로컬 / PostgreSQL 프로덕션) |
| 인증 | NextAuth v5 (beta.25), JWT 전략, bcrypt |
| DB | Railway PostgreSQL (prod), SQLite (dev) |
| 호스팅 | Vercel (프론트+API), Railway (DB) |
| 문서 생성 | pdf-lib, docx, exceljs |
| 검색 | fuse.js (클라이언트 사이드) |
| 파일 저장 | S3/R2 어댑터 (코드 완료, 키 미설정) |
| 이메일 | Resend (코드 완료, 키 미설정) |
| AI | Lawbot bridge HTTP client (코드 완료, 키 미설정) |
| 폰트 | next/font/google 자체 호스팅 (Playfair Display, Nanum Myeongjo, Noto Sans KR) |
| 법제처 프록시 | Lightsail → Caddy HTTPS reverse proxy (설정 완료) |

## 디렉토리 구조 (핵심)

```
src/
├── app/
│   ├── page.tsx                    # 홈 (hero, 업무분야, 사례, FAQ 등)
│   ├── about/                      # 소개 페이지
│   ├── services/                   # 업무분야 인덱스 + 개별 상세
│   │   ├── page.tsx                # 서비스 목록
│   │   ├── [slug]/page.tsx         # 동적 서비스 상세
│   │   ├── immigration/            # 비자/체류
│   │   ├── appeal/                 # 행정심판
│   │   ├── contract/               # 계약서/사실조사
│   │   ├── license/                # 인허가
│   │   └── corporate/              # 법인설립 (최신 추가)
│   ├── cases/                      # 성공사례
│   ├── blog/                       # MDX 블로그
│   ├── contact/ fees/ intake/      # 상담·비용·접수
│   ├── quick-check/                # AI 사전 진단
│   ├── track/                      # 사건 진행 추적 (공개)
│   ├── portal/                     # 의뢰인 포털 (로그인, 서류 업로드)
│   ├── admin/                      # 관리자 (사건관리, 문의, 통계, CMS 등)
│   └── admin/lab-disabled/         # 실험 페이지 차단 시 리라이트 대상
├── components/
│   ├── layout/                     # PublicHeader, PublicFooter, AppShell
│   ├── public/                     # CasesGrid, ServicePage, Testimonials, WritingChannels 등
│   └── admin/                      # AdminSidebar, admin-nav-config 등
├── lib/
│   ├── fonts.ts                    # ★ 폰트 중앙 로딩 (next/font/google)
│   ├── practice-areas.ts           # ★ 업무분야 단일 소스 (Single Source of Truth)
│   ├── prisma/                     # Prisma client
│   ├── security/                   # experimental-admin-pages.ts (실험 게이트)
│   └── services/                   # 비즈니스 로직 서비스 레이어
├── content/blog/                   # MDX 블로그 글
prisma/
├── schema.prisma                   # 28개 모델 (dual-provider: sqlite/postgresql)
scripts/
├── render-prisma-schema.mjs        # sqlite ↔ postgresql 스키마 전환
```

## Prisma 듀얼 DB 시스템

```bash
# 로컬 개발 (SQLite)
node scripts/render-prisma-schema.mjs sqlite
npx prisma generate
npx prisma db push

# 프로덕션 배포 전 (PostgreSQL)
node scripts/render-prisma-schema.mjs postgresql
npx prisma generate
# Vercel 빌드 시 자동 실행됨

# Railway PostgreSQL에 스키마 반영
$env:DATABASE_URL="postgresql://..." ; npx prisma db push
```

**주의**: `PRISMA_DB_PROVIDER` 환경변수가 남아있으면 로컬 빌드 시 PostgreSQL로 인식해서 에러 발생. 로컬에선 항상 `render-prisma-schema.mjs sqlite` 후 작업.

## 업무분야 (Practice Areas) 아키텍처

**`src/lib/practice-areas.ts`** 가 중앙 설정 파일:

```typescript
type PracticeAreaKey = "VISA_STAY" | "ADMIN_APPEAL" | "CONTRACT_INVESTIGATION" | "LICENSE_PERMIT" | "CORP_FORMATION";
```

새 분야 추가 시 이 파일에 항목 추가 → 내보내기 함수들(PRACTICE_AREA_KEYS, PRACTICE_AREA_LABELS 등)이 자동 확장.

## 폰트 시스템 (2026-07-21 리팩토링 완료)

`src/lib/fonts.ts` — next/font/google 로 빌드 시 자체 호스팅:
- **Playfair Display** (`--font-display-latin`) — 영문 디스플레이/제목
- **Nanum Myeongjo** (`--font-display-ko`) — 한글 명조 제목
- **Noto Sans KR** (`--font-body-ko`) — 한글 본문 (21개 유니코드 서브셋 자동 분할)
- `src/app/root-layout-safe.tsx` 의 `<html>` 에 `fontVariables` className 적용
- globals.css 에서 `@import url("fonts.googleapis.com/...")` 제거됨 → 외부 왕복 0

## 디자인 시스템

"Editorial" 스타일 — 잡지/에디토리얼 느낌의 공개 사이트:

| CSS 클래스 | 용도 |
|-----------|------|
| `ethos-aurora` | Hero 배경 (현재 정적 그라데이션, 애니메이션 제거됨) |
| `ethos-paper` | 종이 질감 (feTurbulence SVG noise, opacity 0.32) |
| `ethos-card` | 카드 호버 효과 |
| `ethos-display` | 대형 제목 폰트 (var(--font-display-latin)) |
| `ethos-eyebrow` | 소제목/키커 |
| `ethos-quote` | 인용문 스타일 |
| `ethos-cta-shine` | CTA 버튼 금색 스윕 |
| `ethos-dropcap` | 첫 글자 크게 |
| `ethos-rule` | 장식 구분선 |

**핵심 CSS 규칙**: ethos-display/eyebrow/quote의 색상은 `:where()` (0-specificity)로 설정됨 → 다크 배경 밴드에서 `text-white` 가 항상 우선.

**히어로 방향**: A방향(여백·타이포) + B방향(문서의 물성) 혼합 적용:
- Aurora 애니메이션 → 제거 (ParallaxAurora를 서버 컴포넌트로 전환)
- 정적 종이 그라데이션 + ethos-paper 텍스처 (다크 모드에서는 비활성)
- H1: `max-w-[19ch] text-[2.9rem] leading-[1.06] tracking-[-0.028em]`
- 그리드: `lg:grid-cols-[1.25fr_0.75fr]`

## 홈페이지 구조 (2026-07-21 재편)

의뢰인 여정 4단계 순서로 배치:
1. **발견**: 히어로 → 업무분야 (2번째로 승격)
2. **신뢰**: 왜 ETHOS · 프로필 · 후기
3. **조건확인**: 철학 · 비용 · 절차
4. **행동**: 블로그(법률 칼럼 + LinkedIn) · FAQ

기능 플래그로 꺼진 섹션 (default OFF, `/admin/features` 에서 켤 수 있음):
- `home_naver_reviews`, `home_process_cta`, `home_newsletter`, `home_consult_structure`, `home_tracking_principles`

CTA 라벨: 모든 곳에서 **"무료 검토 신청"** 으로 통일 (이전 3종 혼재 수정).

## 관리자 네비게이션 (2026-07-21 재편)

**설계 근거**: Porter 가치사슬 + Miller 7±2 + 빈도 우선

| 그룹 | 항목 수 | 내용 |
|------|---------|------|
| 오늘 | 5 | 대시보드·브리핑·받은편지함·일정·알림 |
| 유입/상담 | 5 | 문의·견적·상담예약·채널ROI·UTM |
| 사건수행 | 7 | 사건목록·진행·문서·서면초안·판례·법령·체크리스트 |
| 정산/재무 | 7 | 청구·수금·비용·보고서·세무CSV·미수금·견적발송 |
| 성장/콘텐츠 | 8 | 블로그·후기·랜딩·SEO·SNS·갭분석·뉴스레터·레퍼럴 |
| 인사이트 | 8 | 경영보고·퍼널·의뢰인여정·시장분석·AI지표·감사·모니터링·지식그래프 |
| AI/도구 | 7 | 코파일럿·챗봇·서면검증·리서치·워크플로·매크로·파인튜닝 |
| 시스템 | 8 | 사이트설정·기능플래그·사용자·연동·진단·감사로그·보안·DB |
| 실험실 | 25 (접힘) | 인프라 데모·엔터프라이즈 상상 기능 |

`src/components/admin/admin-nav-config.ts` — 전체 그룹 정의.

## 실험 페이지 게이트 (2026-07-21 도입)

~87개 실험·데모 페이지를 2단 차단:

1. **미들웨어 하드블록** (`src/middleware.ts`):
   - `ADMIN_ENABLE_EXPERIMENTAL` env가 `true`가 아니면 → `/admin/lab-disabled` 로 리라이트
2. **레이아웃 소프트블록** (`src/app/admin/layout-clean.tsx`):
   - `admin_experimental_pages` 기능 플래그 OFF → ExperimentalDisabledNotice 표시

경로 목록: `src/lib/security/experimental-admin-pages.ts`
안전 테스트: `src/lib/security/experimental-gate.test.ts` — NAV_GROUPS 항목이 차단되지 않는지 검증.

## 메뉴 라벨 (학술 근거 기반 정리)

`src/components/layout/public-header.tsx` NAV_ITEMS:
- "분야" → "업무분야" (야콥의 법칙 — 법률 분야 관용 표기)
- "상담" → "상담 안내"
- "AI 진단"/"빠른 진단" → "사전진단"/"자가진단" (Pirolli & Card 정보 냄새)
- "활동" → "강연·활동", "칼럼" → "법률 칼럼" (라벨-언어 일치)

## 대표 정보 (전체 통일 완료)

- **표기**: "행정사 지상진" (이전 "행정사 Jean" 17개 파일에서 수정)
- **경력**: "3년" (이전 "2.5년" 수정)
- **GPA**: 전체 삭제 (ko/en/ar/links)
- **연혁**: 2022 대사관 실무 → 2025 자격 취득 → 2026 개업 (`src/lib/services/credentials.ts`)

## 블로그·콘텐츠 시스템

### 네이버 블로그 자동 동기화
- **RSS 수집**: `src/app/api/cron/naver-rss-sync/route.ts` — 매일 cron
- **영어 자동 번역**: `translate: true` (2026-07-21 켬) — Claude API 호출
- **안전장치**: canonical → 네이버 원문, robots noindex, API key 가드
- **기존 글 번역**: `/admin/blog-translate` 에서 수동 처리

### 글 채널 통합
- `src/components/public/writing-channels.tsx` — 홈페이지용
- 법률 칼럼 (/blog) + LinkedIn (외부 링크) 나란히 표시
- LinkedIn 자동 수집은 기술적으로 불가 (RSS 2013년 폐지, API 제한, TOS)

## i18n (국제화)

- `?lang=en` 쿼리 파라미터 방식 (path-based가 아님)
- `searchParams`를 서버 컴포넌트에서 읽어서 KO/EN 분기
- PublicHeader가 `?lang=en`을 모든 내부 링크에 전파
- `src/lib/services/service-content-en.ts` — 영어 콘텐츠 맵
- hreflang + sitemap에 KO/EN alternate 포함

## CMS (사이트 설정)

`SiteSetting` 모델 — key-value 스토어, 관리자 페이지에서 편집 가능:
- ~22개 키 (hero 제목, 소개글, SEO 인증 코드, GA ID, 서비스 설명 등)
- 8초 인메모리 캐시 + 저장 시 즉시 무효화
- `src/lib/services/site-settings.ts` 에서 관리
- **주의**: DB `home.stat3` 값이 코드 기본값을 덮어씀 — "5대 전문 분야"로 직접 수정 필요 (`/admin/site-content`)

## 기능 플래그 시스템

`src/lib/services/feature-flags-service.ts` — ~140개 플래그:
- `locked: true` + `lockReason` 으로 프로덕션 검증된 기능 잠금
- `public: true` — 클라이언트에 노출되는 플래그 (홈페이지 섹션/메뉴 제어)

### 잠긴 플래그 (14개, 변경 금지)

| 플래그 | 잠금 사유 |
|--------|----------|
| `rag_chatbot` | 노션 연동 안정화 (2026-07-17) |
| `notion_sync` | 노션 연동 안정화 (2026-07-17) |
| `ai_chatbot_rag` | 노션 연동 안정화 (2026-07-17) |
| `admin_law_copilot` | Lawbot 안정화 (2026-07-17) |
| `law_health_check` | Lawbot 안정화 (2026-07-17) |
| `case_auto_research` | Lawbot 안정화 (2026-07-17) |
| `admin_easylaw` | Lawbot 안정화 (2026-07-17) |
| `case_research_verify_citations` | Lawbot 안정화 (2026-07-17) |
| `market_collect` | 시장분석 안정화 (2026-07-17) |
| `admin_market_analysis` | 시장분석 안정화 (2026-07-17) |
| `market_ai_report` | 시장분석 안정화 (2026-07-17) |
| `inquiry_bulk_actions` | 프로덕션 검증 완료 (2026-07-19) |
| `public_law_search` | 법제처 실호출 검증 완료 (2026-07-19) |

## 외부 연동

| 서비스 | 환경변수 | 상태 |
|--------|---------|------|
| Cloudflare R2 | `S3_*` | 코드 완료, 키 입력 필요 |
| Resend (이메일) | `RESEND_API_KEY`, `RESEND_FROM` | 코드 완료, 키 입력 필요 |
| Lawbot AI | `LAWBOT_ANALYZE_URL`, `LAWBOT_ANALYZE_TOKEN` | 코드 완료, 키 입력 필요 |
| Notion 동기화 | `NOTION_TOKEN`, `NOTION_*_DATABASE_ID` | 코드 완료, 키 입력 필요 |
| 법제처 프록시 | `LAW_PROXY_URL`, `X_PROXY_TOKEN` | Lightsail + Caddy HTTPS 설정 완료 |
| 텔레그램 알림 | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | 동작 중 |

## 배포

- **Vercel**: GitHub `main` push → 자동 빌드·배포. Cron jobs (deadline-scan, naver-rss-sync, cleanup) 설정됨.
- **Railway**: PostgreSQL DB만 운영. 외부 프록시 URL 사용 (`.internal` 주소는 Railway 내부 전용).
- **Lightsail**: 법제처 API 프록시 서버. Caddy HTTPS reverse proxy 설정 완료.
- **도메인**: `ethosattorney.com` (프로덕션). `adminofficemvp2.vercel.app`은 구 프리뷰 배포 — 하드코딩 금지.
- **사이트 URL**: `getSiteUrl()` (`src/lib/utils/site-url.ts`) 단일 소스. `NEXT_PUBLIC_SITE_URL` 읽고 `ethosattorney.com`으로 폴백. **env는 호출 시점에 읽을 것** — 모듈 레벨 const는 Vercel 빌드 캐시가 빈 값을 고정시킴.

## Git 상태 (2026-07-21)

- **repo**: `https://github.com/sangjin0302-commits/Admin-system-`
- **브랜치**: `main` (단일 브랜치)
- **총 커밋**: ~70개
- **최신 커밋**: `ccafd80` — `feat(blog): 네이버 신규 글 영어 자동 번역 켜기`
- **워킹트리**: 클린

### 최근 주요 커밋 (2026-07-17 ~ 07-21, 역순)

| 커밋 | 내용 |
|------|------|
| `ccafd80` | 네이버 블로그 영어 자동 번역 켜기 |
| `65edac3` | 괘선 제거(오판 수정) · 메뉴/CTA 문구 정리 |
| `e568db5` | 폰트 자체 호스팅 · 히어로 A방향(여백·타이포) + B방향(문서의 물성) |
| `d42270e` | 대표 프로필의 사진/로고 카드 제거 |
| `86a04f8` | 대표 표기 지상진 통일 · 연혁/연차 정정 · 글 채널 통합(칼럼+LinkedIn) |
| `2198f0a` | 실험 하드차단 · 고아 정리 2차 · 홈 12섹션 · 날짜 국문화 |
| `b9b2c50` | 실험실 게이트 · 팔레트 전메뉴 색인 · 보고서 국문화 · 프록시 보안 노출 |
| `1d6ad54` | 운영자 메뉴 8그룹 재편 + 홈페이지 의뢰인 여정 정렬 |
| `de1a9af` | 문의·사건 일괄 이동/삭제 검증 완료 후 잠금 |
| `c485178` | 법제처 연동 실동작 확인 후 잠금 + 조회권 소모 버그 수정 |
| `dab320c` | 영문으로 남아 있던 관리자 화면 22곳 국문화 |
| `372312c` | 진단 401 · 조회 실패 은폐 · RAG 검색 화면 국문화 |
| `3bb05b6` | 화면과 API 응답 형식 불일치 · cron 페일오픈 등 버그 수정 |
| `32ce77f` | 포털·크론 인증 우회 차단 |

## 보안 참고

- Admin API는 Basic Auth + IP allowlist + rate limiting
- Portal은 NextAuth JWT + bcrypt
- 공개 intake는 honeypot + 중복 방지 + rate limiting
- CSRF: same-origin 검증
- 보안 헤더 설정 완료 (middleware)
- 법제처 프록시: `warnIfInsecureLawProxy()` — HTTP 사용 시 경고 로그 (현재 Caddy HTTPS 완료)
- 실험 페이지: 미들웨어 하드블록 + 레이아웃 소프트블록
- **⚠️ Railway DB 비밀번호가 과거 채팅에 노출됨** — Railway에서 비밀번호 재생성 + Vercel 환경변수 업데이트 권장
- **⚠️ 노션에 평문으로 적힌 auth secret·CRON_SECRET 재발급 후 노션에서 삭제 필요**

## 완료되지 않은 작업 (Pending)

1. **DB값 수정 필요**: `/admin/site-content` 에서 `home.stat3` 를 "5대 전문 분야 | 비자·심판·계약·인허가·법인설립" 으로 변경 (코드는 5대이지만 DB가 "4대"로 덮어쓰고 있음)
2. **네이버 기존 글 영어 번역**: 신규 글은 자동 번역 켜짐. 기존 미번역 글은 `/admin/blog-translate` 에서 수동 처리
3. **비밀 재발급**: Railway DB 비밀번호 + auth secret + CRON_SECRET 재생성 → 노션 삭제 → Vercel 환경변수 업데이트

## 추천 고도화 (우선순위순)

1. **Resend 키 설정** — 이메일 알림 실제 발송 (무료 월 3,000통, 코드 준비 완료)
2. **Lawbot 연동** — AI 사전 분석 실제 동작
3. **프로덕션 검증 후 잠금**: 홈페이지 변경(종이 질감·메뉴 라벨·CTA 통일), 실험 게이트, 네비 재편 → 확인 후 locked 처리
4. **PWA 오프라인** — 서비스 워커 추가

## 빌드 & 개발

```bash
npm run dev          # 로컬 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
```

## 설계 결정 기록 (2026-07-21 세션)

아래는 이 세션에서 내린 주요 결정과 그 이유. 되돌리려면 근거를 확인하고 판단할 것.

### 괘선(ruled lines) 제거
ethos-paper 에 30개 수평선을 3.5% opacity로 넣었으나, 공간 주파수 채널에서 증폭돼 눈에 너무 띄었음. 또한 "관인 서류"가 아닌 "줄노트" 느낌이라 공식 문서 메타포와 맞지 않아 전면 삭제.

### Aurora 애니메이션 제거
20초 무한 루프 + blur(50px) — 성능 비용 대비 에디토리얼 방향과 어울리지 않음. ParallaxAurora를 서버 컴포넌트로 전환해 클라이언트 JS 제거.

### Pretendard 대신 Noto Sans KR 선택
Pretendard variable 폰트가 2MB 단일 파일이라 유니코드 서브셋 자동 분할이 안 됨. Noto Sans KR은 next/font/google이 21개 서브셋 파일로 자동 분할해 필요한 것만 로딩.

### LinkedIn 자동 수집 불가 판정
LinkedIn RSS는 2013년 폐지. API는 Organization Admin 전용. 스크래핑은 TOS 위반. → 내부 `/blog` 에 영어 글 직접 작성 권장.

### Google Blogger 비추 판정
SEO 자산이 blogspot.com에 쌓여 본 도메인에 기여하지 않음. 내부 블로그가 있으므로 외부 플랫폼 불필요.
