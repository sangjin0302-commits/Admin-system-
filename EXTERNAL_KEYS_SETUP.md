# 외부 키 일괄 등록 가이드

13 라운드 누적 통합 — 라이브 풀가동을 위한 외부 서비스 가맹 + 환경변수 등록 안내.

## TL;DR (요금 표)

| 서비스 | 용도 | 요금 | 무료/유료 | 필수도 |
|---|---|---|---|---|
| **Vercel** | 프론트+API 호스팅 | Hobby 무료 / Pro $20/월/유저 | 무료 가능 | **필수** |
| **Railway PostgreSQL** | 운영 DB | Hobby $5/월 ~ Pro 사용량 | **유료** | **필수** |
| **Toss Payments** | 결제 | 가맹 무료, 카드결제 수수료 2.9~3.3% | **결제건당** | 권장 |
| **Solapi (CoolSMS)** | 알림톡/SMS | 가맹 무료, 알림톡 7~14원/건, SMS 13~26원/건 | **건당** | 권장 |
| **모두싸인 (Modusign)** | 전자서명 | Lite 33,000원/월(30건) ~ Pro 99,000원/월(무제한) | **유료** | 선택 |
| **Google Calendar API** | 캘린더 동기 | **무료** (개인 OAuth) | 무료 | 선택 |
| **바로빌 (Barobill)** | 전자세금계산서 | 가입 무료, 건당 100~200원 | **건당** | 선택 |
| **Sentry** | 에러 모니터링 | Developer 무료 (5K events/월) / Team $26/월 | **무료 가능** | 권장 |
| **Resend** | 이메일 (Solapi 폴백) | 무료 3K/월 / Pro $20/월 50K | **무료 가능** | 권장 |
| **Cloudflare R2** | 파일 저장 (대용량) | 10GB/월 무료, 이후 $0.015/GB | **무료 가능** | 선택 |
| **법제처 (MoLeg)** | 법령 데이터 (Lawbot bridge) | **무료** | 무료 | Lawbot 사용시 |

**최소 운영 비용 (모든 무료 옵션 + Railway만)**: 월 **약 5,000원~10,000원** (Railway $5 + Vercel 무료 + 결제 건당 수수료)
**풀 셋업 (모두싸인 Lite + 바로빌 + Pro 플랜들 포함)**: 월 **약 100,000~200,000원**

---

## 1. Vercel (필수, 무료 가능)

**용도**: 프론트+API 호스팅, cron 6개, 자동 배포
**가격**: Hobby **무료** (개인 프로젝트). 팀 멤버 추가/대용량은 Pro $20/유저/월
**가입**: https://vercel.com → GitHub 연결

### 등록할 env (Vercel Dashboard → Project Settings → Environment Variables)

```env
# 기본
PRISMA_DB_PROVIDER="postgresql"
DATABASE_URL="<Railway External URL>"
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"   # 또는 vercel.app URL
NEXTAUTH_URL="https://yourdomain.com"
AUTH_SECRET="<openssl rand -base64 32>"
CRON_SECRET="<openssl rand -hex 32>"

# Admin Basic Auth (initial gate)
ADMIN_BASIC_AUTH_USER="<choose>"
ADMIN_BASIC_AUTH_PASSWORD="<min 14 chars>"
ADMIN_IP_ALLOWLIST=""                        # 비우면 모든 IP

# 공개 SEO
NEXT_PUBLIC_OFFICE_PHONE="02-xxxx-xxxx"
NEXT_PUBLIC_OFFICE_EMAIL="contact@yourdomain.com"
NEXT_PUBLIC_GA_ID=""                          # 선택 (Google Analytics)
NEXT_PUBLIC_NAVER_ID=""                       # 선택 (Naver Analytics)
```

---

## 2. Railway PostgreSQL (필수, **유료** 월 $5~)

**용도**: 운영 DB
**가격**: Hobby **$5/월** (1GB RAM, $5 credit), Pro 사용량 기반
**가입**: https://railway.app → GitHub 연결 → New PostgreSQL

### 절차
1. Railway에서 PostgreSQL 서비스 생성
2. **External URL** 복사 (`postgresql://user:pwd@host.proxy.rlwy.net:port/db`)
3. Vercel env `DATABASE_URL` 에 입력
4. 로컬에서 1회 마이그레이션:
   ```bash
   $env:DATABASE_URL="<Railway External URL>"
   npm run db:push:postgres
   ```

> ⚠ **주의**: `.internal` 주소는 Railway 내부 전용 — Vercel에서는 External URL 사용

---

## 3. Toss Payments (권장, 결제 건당 수수료)

**용도**: 카드 결제 + 영수증 + 부분취소 + 웹훅
**가격**: 가맹 **무료**, 카드결제 수수료 2.9~3.3% (사업자 매출 따라)
**가입**: https://www.tosspayments.com → 가맹 신청 (사업자등록 필요, 3~5일 심사)

### 발급
1. 가맹 승인 후 [개발자 센터](https://developers.tosspayments.com) → 시크릿 키 발급
2. **테스트 키 (test_sk_*)**: 즉시 발급, 결제 모의 동작
3. **운영 키 (live_sk_*)**: 가맹 승인 후 발급

### 등록할 env
```env
TOSS_SECRET_KEY="test_sk_xxx"                 # 또는 live_sk_xxx
TOSS_WEBHOOK_SECRET="<Toss 대시보드에서 발급>"
NEXT_PUBLIC_TOSS_CLIENT_KEY="test_ck_xxx"     # Round HH 위젯용 (브라우저 노출 OK)
```

### 웹훅 등록
- Toss 대시보드 → 웹훅 설정 → URL: `https://yourdomain.com/api/webhooks/toss`
- WEBHOOK_SECRET 발급 받아 Vercel env에 입력

---

## 4. Solapi/CoolSMS (권장, 건당 7~26원)

**용도**: 카카오 알림톡 + SMS 폴백
**가격**:
- 가맹 **무료**
- 알림톡: **7~14원/건** (템플릿 종류·길이별)
- SMS: 13원, LMS 30원, MMS 100원
- 충전식 (10,000원 단위)
**가입**: https://solapi.com 또는 https://coolsms.co.kr

### 절차
1. Solapi 가입 + 사업자 인증
2. **카카오 비즈니스 채널 등록** → 발신프로필 (pfId) 발급 (별도, 카카오비즈센터 사전 승인 1~2일)
3. **알림톡 템플릿 6종 사전 승인 신청** (카카오비즈센터, 평일 1~2일):
   - `inquiry_received` (접수 알림)
   - `case_status_update` (사건 상태 변경)
   - `deadline_reminder` (기한 임박 D-3)
   - `payment_received` (입금 확인)
   - `esign_completed` (서명 완료)
   - `admin_audit_alert` (관리자 위험액션 알림 — 내부용)
4. API 키 + 시크릿 발급 (개발자 콘솔)

### 등록할 env
```env
SOLAPI_API_KEY="..."
SOLAPI_API_SECRET="..."
SOLAPI_PFID="<카카오 발신프로필 ID>"
SOLAPI_SENDER_PHONE="0212345678"              # SMS 폴백 발신번호 (선택, 사전 등록 필요)
SOLAPI_TEMPLATE_INQUIRY_RECEIVED="<승인된 템플릿 ID>"
SOLAPI_TEMPLATE_CASE_STATUS="..."
SOLAPI_TEMPLATE_DEADLINE="..."
SOLAPI_TEMPLATE_PAYMENT="..."
SOLAPI_TEMPLATE_ESIGN="..."
SOLAPI_TEMPLATE_AUDIT="..."
```

---

## 5. 모두싸인 Modusign (선택, **유료** 월 3.3만원~)

**용도**: 위임장/계약서 전자서명 + 웹훅
**가격**:
- **Lite** 33,000원/월 — 30건/월
- **Standard** 66,000원/월 — 100건/월
- **Pro** 99,000원/월 — 무제한
- 14일 무료 체험
**가입**: https://app.modusign.co.kr → 사업자 인증

### 등록할 env
```env
MODUSIGN_API_KEY="..."                        # 대시보드 → API 키
MODUSIGN_USER_EMAIL="account@yourdomain.com"  # 가맹 계정 이메일
MODUSIGN_WEBHOOK_SECRET="<생성>"
```

### 웹훅 등록
- Modusign 대시보드 → Webhook URL: `https://yourdomain.com/api/webhooks/modusign`

---

## 6. Google Calendar OAuth (선택, **무료**)

**용도**: 사건 마감/작업을 Google 캘린더에 자동 push
**가격**: **완전 무료** (Google Workspace 개인 / 사업자 모두 OK)
**가입**: https://console.cloud.google.com

### 절차
1. 새 프로젝트 생성
2. APIs & Services → **Google Calendar API 활성화**
3. OAuth 동의 화면 구성 (External 또는 Internal)
4. Credentials → OAuth 2.0 Client ID 생성:
   - Application type: **Web application**
   - Authorized redirect URI: `https://yourdomain.com/api/auth/google/callback`
5. Client ID + Client Secret 복사

### 등록할 env
```env
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
GOOGLE_REDIRECT_URI="https://yourdomain.com/api/auth/google/callback"
```

### 활성화
- 배포 후 SUPER 계정으로 `/api/auth/google/start` 한 번 호출 → OAuth 인증 → 매시 자동 sync 동작

---

## 7. 바로빌 Barobill (선택, 건당 100~200원)

**용도**: 전자세금계산서 자동 발행 (Toss 결제 승인 시)
**가격**:
- 가입 **무료** (사업자등록 + 공인인증서 필요)
- 발행 건당 **100~200원** (월 정액 패키지도 있음)
- 충전식
**가입**: https://www.baroservice.com → 가맹 신청

### 절차
1. 사업자등록증 + 공동인증서 제출 (필수)
2. 사용약관 동의 → 가맹 승인 (1~3일)
3. 개발자 콘솔에서 API Key + UserID 발급

### 등록할 env
```env
BAROBILL_API_KEY="..."
BAROBILL_CORP_NUM="1234567890"                # 발행자 사업자번호 10자리
BAROBILL_USER_ID="..."
BAROBILL_BASE_URL="https://ws.baroservice.com" # 운영 / test-ws.baroservice.com 테스트
```

> ⚠ 미설정 시 자동 발행 코드는 DRAFT 만 영속화 (실 발행 X). 의뢰인에게 별도 수동 발행 권장.

---

## 8. Sentry (권장, 무료 가능)

**용도**: 에러 자동 수집 + 알람
**가격**:
- **Developer 무료**: 5,000 events/월, 1 user
- **Team** $26/월: 50,000 events, 무제한 user
**가입**: https://sentry.io → 새 프로젝트 (Next.js)

### 발급
- 프로젝트 생성 → Settings → Client Keys (DSN) 복사

### 등록할 env
```env
SENTRY_DSN="https://...@o....ingest.sentry.io/..."
SENTRY_ENVIRONMENT="production"               # 선택
SENTRY_RELEASE=""                             # 비우면 VERCEL_GIT_COMMIT_SHA 자동
```

---

## 9. Resend (권장, 무료 가능)

**용도**: 이메일 발송 (Solapi 실패시 폴백)
**가격**:
- **무료** 3,000 emails/월, 1 도메인
- **Pro** $20/월: 50K emails, 무제한 도메인
**가입**: https://resend.com → 가입 + 도메인 추가 (DNS DKIM/SPF 필수)

### 절차
1. resend.com 가입
2. Add Domain → 도메인 추가 → DNS에 TXT 레코드 (DKIM/SPF) 등록
3. API Keys → 새 키 발급

### 등록할 env
```env
RESEND_API_KEY="re_..."
RESEND_FROM="noreply@yourdomain.com"
```

---

## 10. Cloudflare R2 (선택, 무료 가능)

**용도**: 파일 업로드 영구 저장소 (현재는 로컬 fallback)
**가격**:
- **10GB/월 무료**
- 이후 $0.015/GB
- Egress 무료 (큰 장점)
**가입**: https://dash.cloudflare.com → R2 → 버킷 생성

### 등록할 env
```env
STORAGE_DRIVER="s3"
S3_BUCKET="ethos-portal-uploads"
S3_REGION="auto"
S3_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_PREFIX="portal-uploads"
```

---

## 11. 법제처 MoLeg (Lawbot bridge 사용시, 무료)

**용도**: 법령 데이터 호출 (별도 Lawbot 서비스 운영시)
**가격**: **무료** (정부 OpenAPI)
**가입**: https://open.law.go.kr → 활용 신청

### 등록할 env
```env
MOLEG_API_OC="<OC 인증값>"
# Lawbot bridge 연결 (별도 운영시)
LAWBOT_BRIDGE_BASE_URL="https://lawbot.yourdomain.com"
LAWBOT_SERVICE_KEY="<bridge 측에서 발급>"
LAWBOT_SERVICE_CALLER="ethos-admin"
```

---

## 12. AdminUser 시드 (1회)

배포 후 1회만, Vercel CLI 또는 로컬에서:

```env
ADMIN_SEED_EMAIL="admin@yourdomain.com"
ADMIN_SEED_NAME="홍길동"
ADMIN_SEED_PASSWORD="<min 8 chars>"
ADMIN_SEED_ROLE="SUPER"
```

```bash
$env:DATABASE_URL="<Railway External URL>"
npm run db:seed:admin
```

---

## 13. 캘린더 피드 토큰 (1회 생성)

```bash
openssl rand -base64 32
```

```env
CALENDAR_FEED_TOKEN="<위에서 생성한 토큰>"
```

→ Google Calendar / Outlook 구독: `https://yourdomain.com/api/calendar/<CALENDAR_FEED_TOKEN>.ics`

---

## 14. 멀티사무소 (선택)

단일 사무소면 비워둬도 OK. 추가 사무소 등록시:

```env
TENANT_DEFAULT_NAME="ETHOS 행정사사무소"
TENANT_DEFAULT_SUBDOMAIN="ethos"
TENANT_DEFAULT_OWNER="admin@yourdomain.com"
TENANT_DEFAULT_PLAN="enterprise"

# 추가 사무소 (예시)
TENANT_BRANCH_NAME="강남지사"
TENANT_BRANCH_SUBDOMAIN="gangnam"
TENANT_BRANCH_OWNER="gangnam@yourdomain.com"
TENANT_BRANCH_PLAN="pro"
```

---

## 15. Round EE 자동전환 모드 (선택)

```env
AUTO_CONVERT_ENABLED="false"   # true면 점수≥85 Inquiry 자동 사건 생성
```

---

## ✅ 등록 체크리스트

순서대로 진행 권장:

- [ ] **Railway PG 생성 + External URL 복사**
- [ ] **Vercel 프로젝트 생성 + GitHub 연결**
- [ ] **DATABASE_URL, AUTH_SECRET, CRON_SECRET, ADMIN_BASIC_AUTH_***
- [ ] **Toss Payments 가맹 신청** → 테스트 키부터 시작
- [ ] **Solapi 가입 + 카카오 채널 등록 + 템플릿 6종 신청**
- [ ] **모두싸인 14일 체험** (필요시)
- [ ] **Google Cloud OAuth Client 발급**
- [ ] **Sentry 프로젝트 생성** (무료 플랜)
- [ ] **Resend 도메인 등록 + DNS** (이메일 폴백)
- [ ] **(선택) 바로빌 가맹** (세금계산서)
- [ ] **(선택) Cloudflare R2 버킷**
- [ ] **`npm run db:push:postgres`** (1회 마이그레이션)
- [ ] **`npm run db:seed:admin`** (SUPER 1명)
- [ ] **Vercel Redeploy** → 모든 환경변수 반영
- [ ] **`/api/auth/google/start`** 1회 호출 → Google Calendar 활성
- [ ] **Toss 웹훅 URL 등록** → `/api/webhooks/toss`
- [ ] **Modusign 웹훅 URL 등록** → `/api/webhooks/modusign`
- [ ] **카카오 알림톡 템플릿 ID** 들을 SOLAPI_TEMPLATE_* env에 입력

---

## 비용 시나리오 예시

### 시나리오 A — 최소 운영 (월 100건 결제, 200건 알림톡)
```
Railway Hobby              5,000원
Vercel Hobby               무료
Sentry Developer           무료
Resend 무료                무료
Toss 카드 수수료 (100건×10만원×3%) = 300,000원
Solapi 알림톡 (200건×10원) =          2,000원
─────────────────────────────────────
월 합계:                          ~307,000원 (수수료 포함)
순 인프라:                          ~5,000원
```

### 시나리오 B — 풀 셋업 (월 200건 결제, 500건 알림톡, 50건 서명, 100건 세금계산서)
```
Railway Pro (사용량)              ~15,000원
Vercel Pro                         ~30,000원
Sentry Team                        ~35,000원
Resend Pro                         ~28,000원
Modusign Standard                  66,000원
바로빌 (100건×150원)               15,000원
Toss 카드 수수료 (200건×20만원×3%) = 1,200,000원
Solapi 알림톡 (500건×10원)         5,000원
─────────────────────────────────────
월 합계:                         ~1,394,000원
순 인프라:                          ~194,000원
```

> 💡 **수수료(Toss)는 매출에 비례하므로 인프라 비용으로 보지 말 것.**
> 인프라만 보면 시나리오 A: **월 5천원**, B: **월 19만원** 정도.
