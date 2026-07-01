# ETHOS 행정사사무소 — 인수인계 문서

> 작성일: 2026-06-27
> 프로젝트: Admin-system (ethosattorney.com)
> 배포: Vercel (자동 배포, main push)
> DB: Railway PostgreSQL (Prisma ORM)
> 도메인: ethosattorney.com

---

## 1. 프로젝트 개요

**ETHOS 행정사사무소** — 행정사 Jean의 업무 관리 + 마케팅 웹사이트.

### 핵심 구조
```
src/
├── app/                    # Next.js 15 App Router
│   ├── (public pages)      # /, /about, /services, /blog, /consult, /cases, /en, /ar, /keyword, /links, /intake, /quick-check, /fees, /contact, /privacy, /terms
│   ├── admin/              # 관리자 대시보드 (Basic Auth middleware)
│   ├── portal/             # 의뢰인 포털 (NextAuth v5)
│   └── api/                # API routes (inquiries, cron, admin, public)
├── components/
│   ├── admin/              # 관리자 컴포넌트
│   ├── layout/             # 헤더/푸터/앱쉘/StickyCta/FloatingContact
│   ├── public/             # 공개 페이지 컴포넌트
│   ├── portal/             # 의뢰인 포털 컴포넌트
│   ├── seo/                # JSON-LD (Organization/LegalService/Person/FAQ/Event/Article/Breadcrumb)
│   └── ui/                 # 공용 UI (Card, etc.)
├── lib/
│   ├── services/           # 비즈니스 로직
│   ├── security/           # rate limit, upstash
│   ├── utils/              # sanitize-html, keyword-linker, logger
│   └── prisma/             # Prisma client
└── i18n/                   # 다국어 메시지
```

### 기술 스택
- **Framework**: Next.js 15 (App Router, Server Components)
- **Auth**: NextAuth v5 (portal) + Basic Auth middleware (admin)
- **DB**: PostgreSQL (Railway) + Prisma ORM
- **Styling**: Tailwind CSS + 커스텀 ethos-* utility classes
- **Deploy**: Vercel (main push 자동 배포)
- **Analytics**: GA4 + Vercel Analytics + Speed Insights

---

## 2. 이번 세션 작업 내역 (총 50+ commits)

### Phase 1: 콘텐츠 권위 (Stage 1-5)
- Jean 프로필 풀 강화 (대사관 2.5y+, 법무부 번역인, 법원 통번역인, HUFS 4.41)
- SEO/JSON-LD (LegalService, Organization, knowsLanguage 한·영·아)
- /consult 신규 (검토 무료 vs 유료 상담 33k~55k)
- CSS-only 마이크로 인터랙션 (ethos-tilt, magnetic, letter-reveal)
- RSS feed (/feed.xml), sitemap 강화

### Phase 2: 채널 + 다국어
- 5채널 통합 (톡톡/카카오/이메일/텔레그램/엑스퍼트) — channels.ts 단일 소스
- /links 링크트리 허브
- /en 영어 랜딩 (풀페이지)
- /ar 아랍어 RTL 랜딩 (풀페이지)
- KO/EN/AR 헤더 토글

### Phase 3: 블로그 콘텐츠 파이프라인
- 네이버 블로그 50편+ 대량 import (PostTitleListAsync 페이징)
- 카테고리 자동 분류 (5 공개 + 8 내부 세분류)
- /blog 카테고리 필터 + 태그 클라우드
- 블로그 검색 (⌘K 모달, Fuse.js + server-side body 검색 병행)
- 블로그 본문 sanitize (XSS 방어) + 키워드 auto-link
- 블로그 detail: 키워드 badges, reading progress bar, hreflang
- OG 이미지 카테고리별 색 (ImageResponse 동적)
- 매일 01:00 KST RSS 자동 동기화 (cron)

### Phase 4: UX/UI 고도화
- Hero 우측 카드: 로고 prominent (흰 타일 + 골드 ring)
- 다크 카드 가독성 (ethos-grain pseudo overlay + 인라인 RGB)
- 메뉴 라벨 단축 (소개/분야/상담/AI 진단/활동/칼럼)
- 모바일 풀스크린 메뉴 (100dvh + staggered fade-up + safe-area)
- Page transition (Framer Motion scale + ease)
- Hero scroll indicator (bounce dot + 80px fade)
- Smooth scroll + focus-visible 골드 + ::selection 골드
- 블로그 카드 hover (translateY + 골드 shadow + 화살표 슬라이드)
- Exit-intent 모달 (8초 후, session 1회)
- Floating CTA 시간대별 메시지 (평일/주말/영업시간)
- Footer 5채널 strip + Sitemap/RSS 링크

### Phase 5: 마케팅 funnel
- /keyword 랜딩 (7 키워드: D-8/D-10/F-2-7/행정심판/귀화/법인설립/강제퇴거)
- /keyword/[term] OG 이미지 동적
- Quick-Check → intake prefill (?from=&cat=&summary=)
- IntakePrefillBanner (소스 표시 + 분야 + 진단 요약)
- Funnel tracking (data-funnel + data-funnel-cat → GA4 funnel_click)
- Scroll depth tracker (25/50/75/100% GA4)
- Channel tracker (5채널 + SNS share 자동 추적)
- Newsletter 배너 (mailto 전략, 인프라 0)
- Share buttons (X/네이버/Telegram/LinkedIn)
- ResponseTimeChip 실 데이터 (updatedAt-createdAt heuristic)

### Phase 6: 운영 자동화
- 텔레그램 봇 알림 (신규 의뢰 → Jean push)
- 24h 미응답 alert (매일 08:00 cron)
- 주간 운영 리포트 (일요일 21:00 cron)
- 신규 글 텔레그램 채널 자동 share (TELEGRAM_CHANNEL_ID)
- admin v4.8 응답 템플릿 (한·영·아 quick copy)
- /admin/insights (recharts 3 차트 + 기간 필터 7/30/90일)
- /admin/setup (12개 외부 설정 상태 + 가이드)
- /admin/blog-import (대량 import + 카테고리 backfill + 메타 batch 버튼)

### Phase 7: 보안
- Cron secret fail-closed (3개 라우트)
- DOMPurify 도입 (admin email template XSS)
- X-Frame-Options 통일 (DENY)
- $queryRawUnsafe → $queryRaw
- Upstash ratelimit (분산 Redis, in-memory fallback)
- SSRF 방어 (lawbot-analyze + tax-invoice https 강제)
- /api/inquiries Upstash + in-memory 이중 보호

### Phase 8: Toss 비활성 + 계좌이체
- NEXT_PUBLIC_TOSS_ENABLED=1 일 때만 Toss 위젯
- BankTransferGuide (은행/계좌/예금주 + 복사 버튼)
- site-settings: payment.bankName/accountNumber/accountHolder

### Phase 9: OSS 도입
- @vercel/analytics + @vercel/speed-insights
- @formkit/auto-animate (2KB)
- date-fns (ko locale)
- react-medium-image-zoom
- isomorphic-dompurify
- @upstash/ratelimit + @upstash/redis
- react-hook-form + @hookform/resolvers
- sonner (toast)

### Phase 10: 코드 정리
- safe/v-suffix 컴포넌트 6개 rename
- .ethos-dark-card / .ethos-dark-card-v CSS utility (Tailwind purge-proof)
- ethos-grain → ::after pseudo overlay

---

## 3. 환경변수 목록

### 필수 (Vercel env)
| Key | 용도 | 상태 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 연결 | Railway에서 제공 |
| `NEXTAUTH_SECRET` | NextAuth 세션 | 설정됨 |
| `NEXTAUTH_URL` | NextAuth base URL | 설정됨 |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | admin Basic Auth | 설정됨 |
| `NEXT_PUBLIC_SITE_URL` | sitemap/OG/JSON-LD | `https://ethosattorney.com` |
| `CRON_SECRET` | cron 보안 | `openssl rand -hex 32` |

### 외부 설정 (선택)
| Key | 용도 | 비용 |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ADMIN_CHAT_ID` | 의뢰 알림 | 무료 |
| `TELEGRAM_CHANNEL_ID` | 블로그 자동 share | 무료 |
| `BLOB_READ_WRITE_TOKEN` | 이미지 업로드 | 무료 (1GB) |
| `ANTHROPIC_API_KEY` | 블로그 메타/번역 | ~$0.5/batch |
| `UPSTASH_REDIS_REST_URL` + `TOKEN` | 분산 rate limit | 무료 tier |
| `SENTRY_DSN` | 에러 추적 | 무료 (5k/월) |
| `NEXT_PUBLIC_TOSS_ENABLED` | Toss 결제 (보류) | 33만원 가입 |
| `NEXT_PUBLIC_GA_ID` 또는 site-settings `analytics.gaId` | GA4 | 무료 |

**전체 가이드**: `/admin/setup` 페이지에 12개 항목별 상태 + 단계 안내.

---

## 4. Cron 일정 (vercel.json)

| 경로 | 주기 | 용도 |
|---|---|---|
| `/api/cron/deadline-scan` | 매일 00:00 | 기한 스캔 |
| `/api/cron/cleanup` | 주 1회 일요일 03:00 | 데이터 정리 |
| `/api/cron/google-calendar-sync` | 매일 06:00 | 구글 캘린더 동기화 |
| `/api/cron/lawbot-batch-analyze` | 매일 02:00 | AI 분석 배치 |
| `/api/cron/auto-conversion-proposals` | 매일 03:00 | 자동 전환 제안 |
| `/api/cron/audit-cleanup` | 주 1회 일요일 04:00 | 감사 로그 정리 |
| `/api/cron/naver-rss-sync` | 매일 01:00 | 네이버 블로그 동기화 |
| `/api/cron/stale-inquiries-alert` | 매일 08:00 | 24h 미응답 알림 |
| `/api/cron/weekly-report` | 주 1회 일요일 12:00 UTC | 주간 리포트 |

---

## 5. 주요 커스텀 CSS 클래스 (globals.css)

| 클래스 | 용도 |
|---|---|
| `.ethos-dark-card` | 다크 네이비 gradient (인라인 RGB, Tailwind purge-proof) |
| `.ethos-dark-card-v` | 같은 수직 gradient |
| `.ethos-grain::after` | 골드 dot texture pseudo overlay |
| `.ethos-tilt` | 3D hover rotation |
| `.ethos-magnetic` | radial glow hover |
| `.ethos-letter-reveal` | 글자별 staggered 등장 |
| `.ethos-fadeUp` | 모바일 메뉴 fade-up stagger |
| `.ethos-caret::after` | AI 로딩 blink cursor |
| `.ethos-blog-card` | 블로그 카드 hover (translateY + 골드) |
| `.ethos-keyword-link` | 본문 키워드 auto-link (골드 dotted) |
| `.ethos-skeleton` | shimmer loading |
| `.min-h-screen-d` / `.h-screen-d` | 100dvh (iOS fix) |

---

## 6. 남은 작업 (우선순위)

### P0 보안
- [ ] middleware.ts → Upstash adminAuthLimiter 통합 (Edge runtime 신중)
- [ ] CSP nonce 동적화

### P1 마케팅
- [ ] 블로그 50편 description batch 실행 (Anthropic env 설정 후 /admin/blog-import 버튼)
- [ ] intake form react-hook-form multi-step (refactor)
- [ ] 새 글 → 이메일 발송 (newsletter 확장)

### P1 업무
- [ ] firstResponseAt Prisma migration (prod schema 변경)
- [ ] 의뢰자 알림 inbox 정리
- [ ] 카카오 자동응답 Solapi (옵션)

### P2 콘텐츠
- [ ] 태그 DB 컬럼화 (migration)
- [ ] /admin/insights funnel chart (로컬 DB)
- [ ] 블로그 cross-promotion 이메일

### P3 코드 정리
- [ ] safe 파일 sprint (service/validation/copy — 10+ files 의존)
- [ ] Sentry DSN 실연결 (env만 set)
- [ ] e2e 테스트 5개 (Playwright)
- [ ] Prisma PostgreSQL 11개 모델 동기화

---

## 7. 의사결정 기록

| 결정 | 이유 |
|---|---|
| Toss 보류 (33만원) | 의뢰 0건 시 비효율 → 네이버 엑스퍼트 + 계좌이체 |
| 모두싸인 보류 | 월 5만원+, PDF 이메일 서명으로 충분 |
| GSAP 거절 | 30KB, CSS keyframe + framer-motion으로 95% |
| shadcn/ui 전면 도입 안 함 | ethos-card 톤이 럭셔리 변호사 톤에 더 적합 |
| next-intl 전면 안 함 | /en /ar 정적 분리로 현재 충분 |
| 공개 카테고리 5개 유지 | "여러 개 = 비전문적" 사용자 피드백 반영, 내부는 13개 |

---

## 8. 운영자 가이드 (Jean)

### 블로그 50편 import
1. `/admin/blog-import` → "대량 가져오기 시작" (max 100)
2. 분류 backfill: "미분류 글 재분류" 버튼
3. 메타 batch: "30편 메타 생성" (Anthropic env 필요)

### 검토 응답
1. `/admin/inquiries/[id]` → 하단 v4.8 응답 템플릿 quick copy
2. 한·영·아랍어 3개 탭

### 외부 설정 확인
- `/admin/setup` → 12개 항목 상태 한눈 보기

### 텔레그램 봇 설정
- @BotFather → /newbot → BOT_TOKEN
- getUpdates → chat.id → Vercel env

---

## 9. 사이트 구조도

```
ethosattorney.com/
├── /                    홈 (Hero + 5분야 + 상담구조 + 블로그 + 후기 + Newsletter + CTA)
├── /about               사무소 소개 (Jean 프로필 + 행정사법 §2 + 가치)
├── /services             5대 업무 분야 (각 /services/[slug])
├── /consult              상담 안내 (검토 무료 vs 유료 비교 + FAQ JSON-LD)
├── /quick-check          AI 사전 진단 (LLM + 키워드 추천)
├── /cases                강연 · 활동 (OASIS 4 + 후기 + Event JSON-LD)
├── /blog                 블로그 (카테고리 필터 + 태그 + 검색)
├── /blog/[slug]          블로그 상세 (sanitize + auto-link + hreflang + OG)
├── /keyword              키워드 가이드 인덱스
├── /keyword/[term]       키워드 랜딩 (7개, sitemap priority 0.75~0.8)
├── /links                링크트리 허브 (6채널 + 보조 링크)
├── /en                   영어 랜딩
├── /ar                   아랍어 RTL 랜딩
├── /intake               의뢰 접수 (prefill 배너 + IntakeForm)
├── /portal               의뢰인 포털 (사건 목록 + 5스텝 타임라인)
├── /portal/upload        자료 업로드 (drag-drop 멀티파일)
├── /portal/payments/...  결제 (Toss OFF → 계좌이체)
├── /feed.xml             RSS (한국어)
├── /en/feed.xml          RSS (영어)
├── /admin/               관리자 대시보드
├── /admin/setup           외부 설정 가이드 (12개 항목)
├── /admin/insights        운영 인사이트 (recharts 3차트 + 기간 필터)
├── /admin/blog-import     블로그 import + 분류 + 메타 batch
└── /admin/inquiries/[id]  의뢰 상세 + 응답 템플릿
```

---

## 10. 핵심 파일 위치

| 기능 | 파일 |
|---|---|
| 채널 URL 상수 | `src/lib/constants/channels.ts` |
| 카테고리 분류기 | `src/lib/services/blog-categorizer.ts` |
| 태그 추출기 | `src/lib/services/blog-tag-extractor.ts` |
| 키워드 auto-linker | `src/lib/utils/keyword-linker.ts` |
| HTML sanitizer | `src/lib/utils/sanitize-html.ts` |
| 텔레그램 알림 | `src/lib/services/telegram-notify.ts` |
| Upstash rate limit | `src/lib/security/upstash-ratelimit.ts` |
| 블로그 대량 import | `src/lib/services/naver-bulk-importer.ts` |
| 블로그 메타 생성 | `src/lib/services/blog-meta-generator.ts` |
| 응답시간 칩 | `src/components/public/response-time-chip.tsx` |
| 검색 모달 | `src/components/public/blog-search.tsx` |
| exit-intent | `src/components/public/exit-intent.tsx` |
| scroll depth | `src/components/public/scroll-depth-tracker.tsx` |
| channel tracker | `src/components/public/channel-tracker.tsx` |
| 계좌이체 안내 | `src/components/portal/bank-transfer-guide.tsx` |
| 의뢰인 타임라인 | `src/components/portal/case-timeline.tsx` |
| admin 설정 가이드 | `src/app/admin/setup/page.tsx` |
| admin 차트 | `src/components/admin/insights-charts.tsx` |
| site-settings | `src/lib/services/site-settings.ts` |

---

*이 문서는 2026-06-27 기준입니다. 최신 코드는 GitHub main 브랜치를 참조하세요.*
