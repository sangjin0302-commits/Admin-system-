# Security Hardening (Office Ops)

## 목표
- 관리자 화면/관리 API에 대한 무단 접근 차단 강화
- 공개 접수 API 남용(스팸/봇/과다요청) 억제
- 운영 중 재발하는 장애(보안 설정 누락, 취약 비밀번호, 대량 요청) 예방

## 이번 반영 사항
1. `middleware.ts` 하드닝
- 관리자 인증 비교를 상수시간 비교로 변경
- 인증 실패 횟수 기반 임시 차단(429, `Retry-After`) 추가
- 관리자 API 변경 요청(`POST/PATCH/PUT/DELETE`)에 Origin 검증 추가
- 관리자 접속 IP allowlist 옵션 추가
- 운영 환경 HTTPS 강제/보안 헤더(HSTS, CSP, nosniff, frame deny) 강화
- 관리자 라우트 캐시 금지 헤더(`no-store`) 적용
- 약한 관리자 비밀번호 차단(강도 정책)

2. 공개/연동 API 보호 강화
- `POST /api/inquiries`에 레이트리밋/본문 크기 제한/JSON 타입 검사 추가
- `POST /api/admin/marketing/ingest`에 레이트리밋/본문 크기 제한 추가
- 마케팅 연동 토큰 검증을 상수시간 비교로 변경
- 마케팅 토큰 최소 길이 정책 추가

## 운영 환경변수
- 관리자 인증/접근 제어
  - `ADMIN_BASIC_AUTH_USER`
  - `ADMIN_BASIC_AUTH_PASSWORD`
  - `ADMIN_ENFORCE_STRONG_CREDENTIALS` (기본 `true`)
  - `ADMIN_MIN_PASSWORD_LENGTH` (기본 `14`)
  - `ADMIN_AUTH_RATE_LIMIT_MAX_FAILURES` (기본 `20`)
  - `ADMIN_AUTH_RATE_LIMIT_WINDOW_MS` (기본 `600000`)
  - `ADMIN_REQUIRE_SAME_ORIGIN` (기본 `true`)
  - `ADMIN_ALLOW_MISSING_ORIGIN` (기본 `false`)
  - `ADMIN_IP_ALLOWLIST` (예: `1.2.3.4,10.0.*`)
  - `FORCE_HTTPS` (기본 `true`)

- 공개 접수 API 보호
  - `PUBLIC_INTAKE_RATE_LIMIT_WINDOW_MS` (기본 `300000`)
  - `PUBLIC_INTAKE_RATE_LIMIT_MAX_REQUESTS` (기본 `25`)
  - `PUBLIC_INTAKE_MAX_BODY_BYTES` (기본 `65536`)

- 마케팅 연동 보호
  - `ADMIN_MARKETING_SYNC_TOKEN`
  - `ADMIN_MARKETING_SYNC_TOKEN_MIN_LENGTH` (기본 `24`)
  - `ADMIN_MARKETING_RATE_LIMIT_WINDOW_MS` (기본 `60000`)
  - `ADMIN_MARKETING_RATE_LIMIT_MAX_REQUESTS` (기본 `30`)
  - `ADMIN_MARKETING_MAX_BODY_BYTES` (기본 `524288`)

## 권장 운영 기준
- 관리자 비밀번호는 16자 이상 + 문자/숫자/특수문자 조합 사용
- `ADMIN_IP_ALLOWLIST`를 실제 사무실/본인 고정 IP로 제한
- Vercel/Reverse proxy에서 HTTPS 종단 확인 후 `FORCE_HTTPS=true` 유지
- 운영 배포 후 다음 항목 점검:
  - `/admin` 미인증 접근 시 401
  - 반복 오인증 시 429
  - 타 Origin에서 관리자 변경 API 호출 시 403
  - `/api/inquiries` 과다 호출 시 429

