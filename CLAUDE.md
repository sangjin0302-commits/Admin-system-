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
│   └── admin/                      # 관리자 (사건관리, 문의, 통계, CMS 등)
├── components/
│   ├── layout/                     # PublicHeader, PublicFooter, AppShell
│   └── public/                     # CasesGrid, ServicePage, Testimonials 등
├── lib/
│   ├── practice-areas.ts           # ★ 업무분야 단일 소스 (Single Source of Truth)
│   ├── prisma/                     # Prisma client
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

### 아직 practice-areas.ts를 import하지 않는 파일들 (리팩토링 대상)

다음 8개 파일에 카테고리 배열이 하드코딩되어 있음:
- `src/app/api/admin/case-studies/route.ts` + `[id]/route.ts`
- `src/app/api/admin/testimonials/route.ts` + `[id]/route.ts`
- `src/app/api/admin/fees/route.ts` + `[id]/route.ts`
- `src/app/api/admin/case-matters/[id]/category/route.ts`
- `src/lib/public-cases.ts`

이들을 `import { PRACTICE_AREA_KEYS } from "@/lib/practice-areas"` 로 교체하면 향후 분야 추가 시 1파일만 수정하면 됨.

## 디자인 시스템

"Editorial" 스타일 — 잡지/에디토리얼 느낌의 공개 사이트:

| CSS 클래스 | 용도 |
|-----------|------|
| `ethos-aurora` | Hero 배경 그라데이션 애니메이션 |
| `ethos-card` | 카드 호버 효과 |
| `ethos-display` | 대형 제목 폰트 |
| `ethos-eyebrow` | 소제목/키커 |
| `ethos-quote` | 인용문 스타일 |
| `ethos-cta-shine` | CTA 버튼 금색 스윕 |
| `ethos-dropcap` | 첫 글자 크게 |
| `ethos-rule` | 장식 구분선 |

**핵심 CSS 규칙**: ethos-display/eyebrow/quote의 색상은 `:where()` (0-specificity)로 설정됨 → 다크 배경 밴드에서 `text-white` 가 항상 우선.

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

## 외부 연동 (코드 완료, 키 미설정)

| 서비스 | 환경변수 | 상태 |
|--------|---------|------|
| Cloudflare R2 | `S3_*` | 코드 완료, 키 입력 필요 |
| Resend (이메일) | `RESEND_API_KEY`, `RESEND_FROM` | 코드 완료, 키 입력 필요 |
| Lawbot AI | `LAWBOT_ANALYZE_URL`, `LAWBOT_ANALYZE_TOKEN` | 코드 완료, 키 입력 필요 |
| Notion 동기화 | `NOTION_TOKEN`, `NOTION_*_DATABASE_ID` | 코드 완료, 키 입력 필요 |

## 배포

- **Vercel**: GitHub `main` push → 자동 빌드·배포. Cron jobs (deadline-scan, cleanup) 설정됨.
- **Railway**: PostgreSQL DB만 운영. 외부 프록시 URL 사용 (`.internal` 주소는 Railway 내부 전용).
- **도메인**: `adminofficemvp2.vercel.app` (커스텀 도메인 미설정)

## Git 상태 (2026-06-17)

- **repo**: `https://github.com/sangjin0302-commits/Admin-system-`
- **브랜치**: `main` (단일 브랜치)
- **총 커밋**: 50개
- **최신 커밋**: `cb34a1b` — `feat: add 법인설립 (Corporate Formation) as 5th practice area`
- **워킹트리**: 클린 (미커밋 변경 없음)
- **⚠️ 미푸시**: `cb34a1b` 커밋이 아직 `git push origin main` 안 됨

## 즉시 해야 할 일

1. **`git push origin main`** — 법인설립 확장 커밋 푸시
2. **Vercel 배포 확인** — 푸시 후 빌드 성공 + `/services/corporate` 페이지 200 확인
3. **Railway DB 스키마 동기화** — 아직 `npx prisma db push` 미실행 시:
   ```bash
   node scripts/render-prisma-schema.mjs postgresql
   npx prisma generate
   $env:DATABASE_URL="<Railway외부URL>" ; npx prisma db push
   ```

## 추천 고도화 (우선순위순)

1. **practice-areas.ts 리팩토링** — 8개 하드코딩 파일을 중앙 config에서 import하도록 전환
2. **Cloudflare R2 키 설정** — 파일 업로드 실제 동작
3. **Resend 키 설정** — 이메일 알림 실제 발송
4. **Lawbot 연동** — AI 사전 분석 실제 동작
5. **커스텀 도메인** — Vercel에 도메인 연결
6. **PWA 오프라인** — 서비스 워커 추가

## 빌드 & 개발

```bash
npm run dev          # 로컬 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
```

## 보안 참고

- Admin API는 Basic Auth + IP allowlist + rate limiting
- Portal은 NextAuth JWT + bcrypt
- 공개 intake는 honeypot + 중복 방지 + rate limiting
- CSRF: same-origin 검증
- 보안 헤더 설정 완료 (middleware)
- **⚠️ Railway DB 비밀번호가 과거 채팅에 노출됨** — Railway에서 비밀번호 재생성 + Vercel 환경변수 업데이트 권장
