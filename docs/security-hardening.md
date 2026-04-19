# Security Hardening

## 적용된 보호 장치
- `src/middleware.ts`
  - `/admin/*`, `/api/admin/*` Basic Auth 강제
  - 운영 환경에서 인증 env 미설정 시 503 차단
  - `/api/admin/marketing/ingest`는 유효한 `x-admin-sync-token`으로 예외 허용
- 관리자 API 공통 응답
  - `X-Admin-Request-Id` 헤더 부여
  - 오류 응답 구조 통일
- 에러 화면
  - 사용자 화면에 digest 직접 노출 제거

## 운영 환경변수
- `ADMIN_BASIC_AUTH_USER`
- `ADMIN_BASIC_AUTH_PASSWORD`
- `ADMIN_MARKETING_SYNC_TOKEN`
- `ADMIN_MIN_PASSWORD_LENGTH` (기본 14)
- `ADMIN_MARKETING_SYNC_TOKEN_MIN_LENGTH` (기본 24)

## 운영 점검 방법
1. `RUNTIME_ENV=production npm run ops:env:check`
2. `npm run ops:smoke`
3. `/admin/monitoring`의 `관리자 런타임 보호` 항목 확인

## 권장 강화 항목
- Vercel Firewall IP allowlist
- Railway DB 접근 네트워크 제한
- 관리자 계정 주기적 비밀번호 교체
- 토큰 회전 정책(분기 1회 이상)
