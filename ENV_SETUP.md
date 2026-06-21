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
| `NEXTAUTH_URL` | 콜백 URL | `https://adminofficemvp2.vercel.app` |

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
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` | 텔레그램 알림 |
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
| `SENTRY_DSN` | 에러 모니터링 |
| `GOOGLE_CALENDAR_TOKEN` | Google Calendar 동기화 |

---

## 🔵 봇 통합 (Lawbot/Market 연결)

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
       allow_origins=["https://adminofficemvp2.vercel.app"],
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

### Market Analyze 봇 연결 방법

Market Analyze는 시장 정보 분석 API (FastAPI). 인증: `x-admin-token` 헤더.

**Vercel 환경변수**:
```
MARKET_BOT_API_URL = https://market-analyze-production.up.railway.app
MARKET_BOT_ADMIN_TOKEN = <Railway의 ADMIN_API_TOKEN 값과 동일>
```

Railway 쪽에서는 `ADMIN_API_TOKEN`으로 설정되어 있어도 됨. 양쪽 이름은 달라도 OK — **값만 일치**하면 됨.

코드 fallback: `MARKET_BOT_ADMIN_TOKEN` → 없으면 `ADMIN_API_TOKEN` → 없으면 미설정 에러.

엔드포인트 29개 자동 연동 (대시보드/트렌드/경쟁사/리포트/수집/동기화). 자세한 페이지는 `/admin/market-bot/`.

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
GET https://adminofficemvp2.vercel.app/api/health
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
