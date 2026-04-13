# Deploy Notes

## 1) Preview Deploy Status

- 현재 상태: **코드/빌드 기준으로는 준비됨**
- 단, **실무 기능 기준 프리뷰 배포는 보류 권장**
- 이유: 현재 DB가 `sqlite` 파일 기반이라 서버리스(Vercel) 환경에서 쓰기/지속성이 보장되지 않음

## 2) Deployment Risks

### Next.js 설정
- `distDir: ".next-prod"` + `webpackBuildWorker: false`는 Windows/OneDrive 안정화용으로 유지 가능
- Vercel에서 직접 문제를 만들지는 않음

### Prisma Client
- `generated/prisma-v4` 출력 구조는 배포 가능
- 단, 배포 시 `DATABASE_URL`이 실제 외부 DB를 가리켜야 함

### SQLite 파일 DB
- 서버리스에서 파일 DB는 인스턴스 간 공유/지속성 보장 불가
- 접수/메모/상태 변경 같은 쓰기 기능이 운영 수준으로 안전하지 않음

### 관리자 라우트
- `/admin/inquiries`에 인증 가드가 없음
- 프리뷰 URL 공개 시 관리자 데이터 변경 위험

### 환경 변수
- `.env.example`의 로컬 파일 경로(`file:C:/...`)는 배포용으로 부적합
- 배포 환경에 `DATABASE_URL`(호스티드 DB) 재설정 필요

## 3) Minimal Changes Before Real Preview

1. 운영 DB를 외부 호스티드 DB(Postgres)로 준비
2. Vercel 환경 변수에 `DATABASE_URL` 설정
3. 관리자 경로 최소 인증(예: Basic Auth 또는 세션 기반 인증) 추가

## 4) DB Strategy (Recommended)

- 로컬 개발: SQLite 유지
- 운영/프리뷰: Postgres 사용
- 구현 방식: Prisma 스키마를 환경별로 분리해서 운용
  - 예: `prisma/schema.sqlite.prisma`, `prisma/schema.postgres.prisma`
  - 로컬은 SQLite 스키마, 배포는 Postgres 스키마로 generate/migrate

## 5) Domain Connection Later

- Vercel 프로젝트 생성 후 preview URL로 기능 검증
- 운영 전환 시 커스텀 도메인 연결
- 도메인 DNS 설정 후 HTTPS 자동 발급 확인
