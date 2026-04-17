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

현재 기본 운영 가드는 middleware 기반 Basic Auth로 반영되어 있으며 아래 환경 변수가 필요합니다.

- `ADMIN_BASIC_AUTH_USER`
- `ADMIN_BASIC_AUTH_PASSWORD`

## 4) DB Strategy (Recommended)

- 로컬 개발: SQLite 유지
- 운영/프리뷰: Postgres 사용
- 구현 방식: `PRISMA_DB_PROVIDER` 기준으로 Prisma 스키마를 렌더링해서 운용
  - 로컬 예시: `PRISMA_DB_PROVIDER=sqlite`
  - Railway 예시: `PRISMA_DB_PROVIDER=postgresql`
  - 자동 생성 스크립트:
    - `npm run prisma:generate`
    - `npm run prisma:generate:sqlite`
    - `npm run prisma:generate:postgres`
  - DB 반영 스크립트:
    - `npm run db:push:sqlite`
    - `npm run db:push:postgres`
  - `prebuild`와 `postinstall`도 `PRISMA_DB_PROVIDER`를 읽어 맞는 Prisma client를 생성함

## 5) Railway Postgres Cutover

1. Railway 프로젝트의 Postgres `DATABASE_URL`을 확인
2. Railway 서비스 환경 변수에 아래 값 설정
   - `PRISMA_DB_PROVIDER=postgresql`
   - `DATABASE_URL=<Railway Postgres URL>`
   - `ADMIN_BASIC_AUTH_USER=<admin login id>`
   - `ADMIN_BASIC_AUTH_PASSWORD=<strong password>`
3. 로컬에서는 `.env`를 계속 SQLite로 유지
4. 운영 검증 시 `.env.railway.example` 형식으로 값을 맞춰 확인
5. 배포 빌드 시 `prebuild`가 Postgres용 Prisma client를 자동 생성
6. 운영 시작 전 백업 정책 확인
   - Railway backup schedule
   - 외부 `pg_dump` 백업

## 6) Railway Host Note

- `monorail.proxy.rlwy.net:46311` 같은 주소는 Railway 프록시 호스트 형태라서 정상일 수 있음
- 중요한 것은 `host` 자체보다 Railway가 제공한 전체 연결 문자열을 그대로 쓰는 것
- 수동으로 host/port만 따로 조립하기보다 Railway의 `DATABASE_URL` 전체를 사용 권장

## 7) Domain Connection Later

- Vercel 프로젝트 생성 후 preview URL로 기능 검증
- 운영 전환 시 커스텀 도메인 연결
- 도메인 DNS 설정 후 HTTPS 자동 발급 확인
