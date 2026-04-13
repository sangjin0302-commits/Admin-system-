# Operations Notes

운영용 빌드와 Windows 환경 대응 기준을 정리한 메모입니다.

- Canonical working directory: `C:\codex-buildcheck\admin-office-mvp`
- OneDrive 경로는 백업/보관용으로 두고, 실제 개발과 빌드는 OneDrive 밖 경로를 기준으로 합니다.

## 1. 운영용 빌드 기준

- 기준 명령: `npm run build`
- 실제 실행: `next build --debug`
- `--experimental-debug-memory-usage`는 당분간 사용하지 않습니다.
- 현재 프로젝트는 Windows + OneDrive 환경에서 `.next` 잠금과 `spawn EPERM` 이슈가 있었기 때문에, 안정성 우선으로 설정을 유지합니다.

## 2. 유지 설정

### `next.config.ts`

- `distDir = ".next-prod"`
  - 기본 `.next` 대신 별도 출력 경로를 사용해 빌드 산출물 잠금 충돌을 줄입니다.
- `experimental.webpackBuildWorker = false`
  - Windows 환경에서 발생했던 `spawn EPERM` 회피 설정입니다.

### Prisma Client 출력 경로

- `prisma/schema.prisma`
  - `output = "../generated/prisma-v4"`
- 앱 소스와 generated client를 분리해 빌드 스캔 부담을 낮추고, `src` 내부 generated 파일 누적 문제를 피합니다.

## 3. `dynamic = "force-dynamic"` 점검 체크리스트

### 유지해야 할 라우트

- `src/app/admin/inquiries/page.tsx`
  - 관리자 검색/필터 기반 목록 조회
  - 요청 시점 DB 데이터 반영이 필요함
- `src/app/admin/inquiries/[id]/page.tsx`
  - 문의 상세, 메모, 상태, 견적 워크스페이스 표시
  - 요청 시점 DB 데이터 반영이 필요함
- `src/app/page.tsx`
  - `await searchParams`로 언어 전환을 처리하므로 dynamic 명시가 필요함

### 제거 검토 라우트

- 현재 없음
  - 현재 `force-dynamic`은 관리자 라우트 2곳과 홈 라우트 1곳에만 사용 중입니다.

### 확인 필요 라우트

- 현재 없음

### 점검 질문

- 이 페이지가 요청마다 최신 DB 데이터를 반드시 읽는가
- 쿠키, 헤더, `searchParams`, 실시간 상태 등 요청 컨텍스트 의존이 있는가
- 정적 생성으로 바꿔도 운영상 문제가 없는가
- 캐시된 결과보다 즉시성 있는 관리자 데이터가 더 중요한가

## 4. OneDrive 밖 최소 이전 절차

Windows PowerShell 기준입니다.

1. 새 작업 경로를 만듭니다.  
   `New-Item -ItemType Directory -Force -Path 'C:\codex-buildcheck'`
2. 프로젝트를 OneDrive 밖으로 복사합니다.  
   `Copy-Item -LiteralPath 'C:\Users\sangj\OneDrive\문서\New project\admin-office-mvp' -Destination 'C:\codex-buildcheck' -Recurse -Force`
3. 새 경로로 이동합니다.  
   `Set-Location 'C:\codex-buildcheck\admin-office-mvp'`
4. 이전 설치물과 빌드 산출물을 제거합니다.  
   `Remove-Item -LiteralPath '.\node_modules','.\.next','.\.next-prod' -Recurse -Force -ErrorAction SilentlyContinue`
5. 의존성을 다시 설치합니다.  
   `npm ci`
6. Prisma Client를 다시 생성합니다.  
   `npm run prisma:generate`
7. 운영 기준 빌드를 실행합니다.  
   `npm run build`
8. 필요하면 앱 Router만 따로 확인합니다.  
   `npx next build --debug --experimental-app-only`
9. 빌드가 정상적이면 이 경로를 실개발 경로로 사용합니다.

## 5. 진단 최소 원칙

- 먼저 일반 빌드가 통과하는지 확인합니다.
- memory debug는 실제 메모리 크래시나 OOM이 있을 때만 다시 켭니다.
- 지원되지 않는 옵션은 기준 절차에서 제외합니다.
  - 제외: `--webpack`, `--debug-build-paths`

## 6. 운영 전 확인 항목

- `.env`의 `DATABASE_URL`이 ASCII 경로를 가리키는지 확인
- `npm run prisma:generate`가 현재 경로에서 성공하는지 확인
- `npm run build`가 반복 실행에도 안정적인지 확인
- 관리자 목록/상세 라우트에서만 `force-dynamic`이 유지되는지 확인

## 7. Intake -> Quote 운영 메모

- 이번 단계 기준 내부 흐름: `상담 접수 -> 사전진단 -> 견적 초안 생성 -> 관리자 검토`
- 접수 시 `문의유형/긴급도/번역/기업/보유서류`가 함께 저장되고 사전진단 결과가 자동 생성됩니다.
- 견적 초안 생성 시 intake 조건(긴급도/번역/기업/서류보유) 기반으로 초기 옵션이 자동 반영됩니다.
- 확인 명령:
  - `npm run db:init`
  - `npm run db:seed`
  - `npm run build`
