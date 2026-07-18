# 환경변수 설정 가이드 — ETHOS 행정사사무소

## 📍 어디에 설정?

**Vercel Dashboard** → Project `ethos` → Settings → Environment Variables

각 변수 추가 시:
- **Environment**: Production / Preview / Development (전부 선택 권장)
- **Sensitive**: 비밀키는 체크 (Secret 표시)

---

## 🟢 필수 (없으면 운영 불가)

| 변수 | 용도 | 발급처 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 연결 | Railway → PostgreSQL → Connect → `DATABASE_URL` |
| `ADMIN_PASSWORD` | 관리자 Basic Auth | 직접 강력한 비밀번호 생성 |
| `NEXTAUTH_SECRET` | 세션 암호화 | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | 콜백 URL | `https://ethosattorney.com` |

---

## 🟡 권장 (기능 활성화)

### AI 기능
| 변수 | 활성화되는 기능 |
|------|----------------|
| `ANTHROPIC_API_KEY` | AI 분류, 자동응답, 문서 생성, Computer Use, Vision, STT 요약 |
| `OPENAI_API_KEY` | 벡터 검색 (RAG), Whisper 음성 전사 |
| `GOOGLE_VISION_API_KEY` | OCR 추출 (신분증/영수증) |

**Anthropic 발급**: https://console.anthropic.com/ → API Keys
**OpenAI 발급**: https://platform.openai.com/api-keys
**Google Vision 발급**: GCP Console → APIs → Cloud Vision API 활성화 → 자격증명

### 알림 채널
| 변수 | 용도 |
|------|------|
| `RESEND_API_KEY` | 이메일 알림 (신규 문의·후속) |
| `ADMIN_NOTIFICATION_EMAIL` | 알림 받을 이메일 |
| `SLACK_WEBHOOK_URL` | Slack 알림 |
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ADMIN_CHAT_ID` | 텔레그램 알림 (관리자 chat_id) |
| `KAKAO_REST_API_KEY` + `KAKAO_SENDER_KEY` | 카카오 알림톡 |
| `FCM_SERVER_KEY` | 모바일 푸시 |

**Resend**: https://resend.com → API Keys
**Slack Webhook**: Slack workspace → Apps → Incoming Webhooks
**Telegram Bot**: @BotFather → /newbot
**Kakao Biz**: https://business.kakao.com → 알림톡 신청
**FCM**: Firebase Console → 프로젝트 설정 → 클라우드 메시징

### 결제
| 변수 | 용도 |
|------|------|
| `TOSS_SECRET_KEY` | Toss Payments (수임료 온라인 결제) |

**Toss 발급**: https://docs.tosspayments.com → 가입 → 시크릿 키

### 한국 공공 API
| 변수 | 용도 |
|------|------|
| `PUBLIC_DATA_API_KEY` | 외국인 정보·법령·사업자 조회 |
| `HOMETAX_API_KEY` | 홈택스 전자세금계산서 |
| `WETAX_API_KEY` | 위택스 전자세금계산서 |
| `NAVER_TALKTALK_PARTNER_ID` + `NAVER_TALKTALK_TOKEN` | 네이버 톡톡 상담 |

**Public Data**: https://www.data.go.kr → API 신청
**Hometax**: https://www.hometax.go.kr → 전자세금계산서 → API
**Naver TalkTalk**: https://partner.talk.naver.com

### 분석/모니터링
| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_TAWKTO_WIDGET_ID` | Tawk.to 실시간 채팅 |
| `SENTRY_DSN` | 서버 에러 모니터링 |
| `NEXT_PUBLIC_SENTRY_DSN` | 클라이언트 에러 모니터링 (SENTRY_DSN과 같은 값) |
| `SENTRY_ORG` | Sentry 조직 slug (소스맵 업로드용, 선택) |
| `SENTRY_PROJECT` | Sentry 프로젝트 slug (소스맵 업로드용, 선택) |
| `SENTRY_AUTH_TOKEN` | Sentry auth token (소스맵 업로드용, 선택) |
| `GOOGLE_CALENDAR_TOKEN` | Google Calendar 동기화 |

---

## 🔵 봇 통합 (Lawbot/Market 연결)

### ⚠️ Lawbot 변수는 3계열이다 — 먼저 읽을 것

이름이 비슷한 LAWBOT_* 변수가 **서로 다른 3개 시스템**에 속한다. 엉뚱한 계열에
값을 넣으면 "설정했는데 안 된다"가 된다. `/admin/diagnostics` 에서 어느 계열이
잡혀 있는지 확인할 수 있다.

| 계열 | 변수 | 쓰는 곳 | 비고 |
|---|---|---|---|
| **A. 법제처 직접** | `LAW_OC`, `LAW_PROXY_TOKEN`, `LAW_PROXY_URL`, `EASYLAW_KEY` | `/admin/law-research`, `/law-lookup`, 공개 법령검색 | 안정화 잠금됨. **LAWBOT_ 접두사가 아님** |
| **B. 브릿지** | `LAWBOT_BRIDGE_BASE_URL`, `LAWBOT_SERVICE_KEY`, `LAWBOT_SERVICE_CALLER` | `/quick-check`, 문의 접수 자동분석, 서면·메시지 초안, batch cron | 봇 쪽에 `/bridge/*` 엔드포인트가 있어야 동작 |
| **C. 판례 동기화** | `LAWBOT_API_URL` | `precedent-database-service`, `precedent-live-verifier` | `GET /precedents` 필요 |

`LAWBOT_API_KEY` 는 코드에서 읽지 않는다(과거 문서 잔재). 넣어도 효과 없음.

#### ✅ 실제로 붙는 조합은 "D. 분석" 계열이다 (2026-07-18 코드 대조 확인)

Lawbot 저장소(`sangjin0302-commits-Telegram-Lawbot-`)의 `web_api.py` 는 FastAPI로
`POST /analyze` 와 `POST /analyze/admin` 을 제공하며, 인증은 `x-lawbot-token`
헤더를 읽는다(`web_helpers.is_internal_analyze_authorized`).

사이트의 `lawbot-case-analysis-service.ts` 는 정확히 이렇게 호출한다:

```
POST {LAWBOT_ANALYZE_URL}
헤더: x-lawbot-token: {LAWBOT_ANALYZE_TOKEN}
본문: { "fact_input": "..." }
```

**양쪽이 이미 맞아 있으므로 코드 수정 없이 환경변수만으로 연결된다.**

| Lawbot(Railway) | 사이트(Vercel) | 값 |
|---|---|---|
| `LAWBOT_INTERNAL_ANALYZE_TOKEN` | `LAWBOT_ANALYZE_TOKEN` | **같은 값**(이름만 다름) |
| 배포 URL | `LAWBOT_ANALYZE_URL` | `https://<host>/analyze/admin` (관리자용, 8000자·무제한) 또는 `/analyze` (공개용, 4000자·일 5회) |
| `WEB_ALLOWED_ORIGINS` | — | `https://ethosattorney.com` 추가 필요 |
| — | `LAWBOT_ENABLE_AUTOMATIC_CALLS` | 자동 분석까지 원하면 `true` |

#### 관리자용 / 고객용 분리 (2026-07-18 적용)

`/quick-check`(고객)를 브릿지에서 **D 계열로 이관했다.** 관리자 경로와 고객 경로는
엔드포인트·토큰·한도가 분리되어 있다.

| 구분 | 엔드포인트 | 토큰 | 입력 상한 | 횟수 제한 |
|---|---|---|---|---|
| 관리자(사건 분석·초안) | `/analyze/admin` | `x-lawbot-token` **보냄** | 8000자 | 없음 |
| 고객(`/quick-check`) | `/analyze` | **안 보냄** | 4000자 | 봇 일 5회 + 사이트 IP당 5분 5회 |

`LAWBOT_ANALYZE_URL` 을 `.../analyze/admin` 으로 넣으면, 고객용 URL은 코드가
`/analyze` 로 **자동 변환**한다(`toPublicAnalyzeUrl`). 별도 지정이 필요하면
`LAWBOT_ANALYZE_PUBLIC_URL` 을 쓴다.

고객 응답에서 실무자 전략 필드(`pros`/`cons`/`argument_strategy`/
`counter_argument_points`/`matched_*`)는 서버에서 제거되며, 법령은 **이름과 원문
링크만** 나가고 요약 본문은 나가지 않는다. 이 두 가지와 "공개 호출에 관리자 토큰이
실리지 않을 것"은 테스트로 고정되어 있다
(`src/lib/services/lawbot-analyze-public-client.test.ts`).

반면 **B(브릿지) 계열이 요구하는 `/bridge/intake/analyze` 등은 Lawbot에 존재하지
않는다**(실측 404). 아직 브릿지를 쓰는 경로(문의 접수 자동분석, 서면·메시지 초안,
batch cron 등 10곳)는 설정이 없으면 조용히 비활성 상태로 넘어간다.

**A 계열의 `LAW_PROXY_URL` 은 미설정 시 하드코딩된 평문 HTTP IP로 폴백**한다
(`src/lib/services/law-api-service.ts`). 운영에서는 반드시 명시 설정할 것.

### Lawbot 연결 방법

1. **봇 쪽에 REST 엔드포인트 추가** (Python/FastAPI):
   ```python
   # lawbot/web_api.py
   from fastapi import Header, HTTPException
   from pydantic import BaseModel
   import os

   class WebQueryRequest(BaseModel):
       query: str
       tier: str  # "anonymous" | "registered" | "customer" | "admin"
       user_id: str | None = None
       max_length: int = 2000

   @app.post("/api/v1/web/query")
   async def web_query(req: WebQueryRequest, x_api_key: str = Header(None)):
       if x_api_key != os.getenv("WEB_API_KEY"):
           raise HTTPException(401, "Invalid API key")
       
       # tier별 시스템 프롬프트
       system_prompts = {
           "anonymous": "간결하고 짧게 답변하세요. 상세는 가입 권장.",
           "registered": "표준 답변.",
           "customer": "전문가 수준 상세 답변.",
           "admin": "운영 관리자용 무제한 답변."
       }
       system = system_prompts.get(req.tier, system_prompts["registered"])
       
       # 기존 봇 핸들러 wrap
       answer = await your_existing_handler(
           message=req.query,
           system_prompt=system,
           max_tokens=req.max_length
       )
       
       return {"answer": answer, "tokens_used": len(answer.split())}
   ```

2. **CORS 허용** (FastAPI):
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://ethosattorney.com"],
       allow_methods=["POST"],
       allow_headers=["*"],
   )
   ```

3. **봇 Railway 환경변수 추가**:
   - `WEB_API_KEY` = 강력한 랜덤 키 (예: `openssl rand -hex 32`)

4. **사이트 Vercel 환경변수 추가**:
   ```
   LAWBOT_API_URL = https://your-lawbot.up.railway.app
   LAWBOT_API_KEY = (위에서 만든 WEB_API_KEY 동일값)
   ```

5. **사이트 코드 수정** (이미 mock으로 작성됨, 다음 한 줄만 변경):
   ```ts
   // src/app/api/bot/query/route.ts 내부 mock 부분 교체
   const r = await fetch(`${process.env.LAWBOT_API_URL}/api/v1/web/query`, {
     method: "POST",
     headers: { "Content-Type": "application/json", "X-API-Key": process.env.LAWBOT_API_KEY! },
     body: JSON.stringify({ query, tier, max_length: features.maxAnswerLength }),
   });
   const data = await r.json();
   answer = data.answer;
   ```

### 시장분석 (Market Analyze)

> ⚠️ 2026-07-18 정정: 예전 문서에 적혀 있던 `MARKET_BOT_API_URL` /
> `MARKET_BOT_ADMIN_TOKEN` 및 `/admin/market-bot/` 페이지는 **코드에 존재하지 않는다.**
> 외부 FastAPI 봇을 붙이는 구조가 아니라, 사이트가 네이버 API를 직접 호출한다.
> 해당 변수를 Vercel에 넣어도 아무 효과가 없으니 등록하지 말 것.

**실제 구조**: 별도 저장소 `market-analyze`(Python)의 로직을 **TypeScript로 포팅해
사이트 안에 넣어둔 것**이다. 외부 서비스를 HTTP로 부르지 않는다.

| 사이트 파일 | 원본(market-analyze) |
|---|---|
| `market-naver-client.ts` | `app/services/naver.py` |
| `market-collect-service.ts` | `collector_v2.py` + `pipeline.rebuild_competitor_profiles` |
| `market-classifier-service.ts` | `app/services/classifier.py` + `filters.py` |

따라서 **네이버 키만 있으면 동작하고, Python 서비스는 띄우지 않아도 된다.**
화면은 `/admin/market`.

> 단, `/admin/inquiries/[id]` 상세 화면의 "시장 신호" 패널은 아직 mock이다
> (`inquiry-detail-view-market-helpers.ts` — "market-analyze 연동 전 단계"). 포팅
> 범위에 포함되지 않은 별개 항목.

**필요 환경변수**:
```
NAVER_CLIENT_ID          / NAVER_CLIENT_SECRET          # 네이버 검색 API
NAVER_DATALAB_CLIENT_ID  / NAVER_DATALAB_CLIENT_SECRET  # 데이터랩(트렌드)
```

**관련 기능 플래그** (2026-07-17 안정화 잠금 — 변경하려면 잠금 먼저 해제):
`market_collect`, `admin_market_analysis`, `market_ai_report`

발급: https://developers.naver.com → 애플리케이션 등록 → 검색 / 데이터랩 API 선택

### 봇 → 사이트 호출 차단 (보안)

봇 Railway에서 X-API-Key 헤더 검증 필수. CORS도 사이트 도메인만 허용. 키 노출 시 즉시 변경.

---

## 🟣 설정 확인 방법

### 1. 모든 변수 한 줄로 확인 (로컬)
`.env.local` 파일에 모두 넣고 `npm run dev`. 에러 없이 뜨면 OK.

### 2. Vercel 배포 후 확인
- `/admin` 로그인 → 각 기능 페이지 방문
- `/admin/integrations/kakao` → 카카오 연결 상태 표시됨
- `/admin/webhooks` → Slack/Telegram 연결 상태
- `/admin/payments` → Toss 상태
- `/admin/lawbot` (공개) → 봇 mock vs 실 응답 확인

### 3. 헬스체크
```
GET https://ethosattorney.com/api/health
```
JSON으로 어떤 서비스가 연결됐는지 표시 (선택: 헬스체크 엔드포인트 추가 권장).

---

## 🔐 보안 체크리스트

- [ ] 모든 `*_API_KEY` / `*_SECRET` Vercel에서 "Sensitive" 체크
- [ ] `NEXTAUTH_SECRET` 32바이트 이상 랜덤
- [ ] `ADMIN_PASSWORD` 12자 이상 + 영문 대소문자 + 숫자 + 특수문자
- [ ] `DATABASE_URL` 외부 노출 절대 금지 (Railway 비공개 연결)
- [ ] `.env.local` git 제외 확인 (`.gitignore`)
- [ ] 봇 `WEB_API_KEY` Railway에만 저장 (코드/저장소 X)

---

## 🚨 응급 시나리오

| 상황 | 조치 |
|------|------|
| 키 노출 의심 | 발급처에서 키 폐기 → 새 키 발급 → Vercel 변경 → 재배포 |
| DB 다운 | Railway Console → PostgreSQL 인스턴스 재시작 |
| Vercel 빌드 실패 | Vercel Dashboard → Deployments → 빌드 로그 확인 |
| 봇 API 다운 | 사이트는 자동으로 mock 응답으로 fallback (코드에 try/catch) |

---

## 📞 발급처 빠른 링크

- Anthropic: https://console.anthropic.com/
- OpenAI: https://platform.openai.com/
- Resend: https://resend.com/
- Toss: https://docs.tosspayments.com/
- Slack: workspace → Apps → Incoming Webhooks
- Telegram: @BotFather
- Kakao Biz: https://business.kakao.com/
- Naver TalkTalk: https://partner.talk.naver.com/
- Public Data: https://www.data.go.kr/
- Google Cloud: https://console.cloud.google.com/
- Firebase: https://console.firebase.google.com/
- Railway: https://railway.app/
- Vercel: https://vercel.com/dashboard
