# Operations Notes

## 운영 목표
- 접수 데이터 안정성 유지
- 관리자 접근 보안 강제
- 배포 전 자동 검증 표준화

## 배포 전 체크리스트
1. `npm run verify` 통과
2. `RUNTIME_ENV=production npm run ops:env:check` 통과
3. `npm run ops:smoke` 통과
4. `/admin/monitoring`에서 `admin-runtime-guard` 항목 확인

## Vercel 운영 필수 환경변수
- `ADMIN_BASIC_AUTH_USER`
- `ADMIN_BASIC_AUTH_PASSWORD`
- `ADMIN_MARKETING_SYNC_TOKEN`
- `DATABASE_URL` (Railway Postgres 권장)

## 권장 운영 기준
- 관리자 비밀번호 길이 최소 14자 이상
- 마케팅 동기화 토큰 최소 24자 이상
- 공개 접수 보안 옵션 유지:
  - `PUBLIC_INTAKE_REQUIRE_SAME_ORIGIN=true`
  - `PUBLIC_INTAKE_ENABLE_HONEYPOT=true`

## 장애 대응 기본 흐름
1. `/admin/monitoring`에서 경고/치명 항목 확인
2. `X-Admin-Request-Id` 기반으로 API 로그 추적
3. `DATABASE_URL` 연결 및 Railway 상태 확인
4. Lawbot/Notion 연동 env 재검증

## 참고
- 보안 상세: `docs/security-hardening.md`
- Railway 운영: `docs/railway-postgres-operations.md`
- 인코딩 품질: `docs/encoding-integrity.md`
