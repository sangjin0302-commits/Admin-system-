# Admin System 감수 요청 브리프 (2026-04-19)

## 1) 시스템 목적
- 한국 행정사무소 내부용 사건 운영 시스템
- 중심은 CRM/수금이 아니라 사건 라이프사이클 관리
- 목표 흐름: 접수 -> 사건화 -> 문진/체크리스트 -> 문서 준비/검토 -> 제출/보완 -> 종결 -> 수금 후속

## 2) 현재 기술 스택
- Next.js (App Router)
- TypeScript
- Prisma
- 로컬 SQLite, 운영 PostgreSQL 전환 가능 구조

## 3) 현재 구현 범위

### A. 접수/운영 화면
- 공개 접수: `/intake`
- 관리자 대시보드: `/admin`
- 문의 목록/상세: `/admin/inquiries`, `/admin/inquiries/[id]`
- 운영 모니터링: `/admin/monitoring`

### B. 사건 운영 로직
- 문의 생성/상세/상태 전환 서비스 분리
- 견적/계약 드래프트/상태 갱신 보조 헬퍼 분리
- 운영 메모 직렬화/파싱/리스트 헬퍼 분리
- Lawbot 분석 타입/응답/스냅샷 구조 분리

### C. Lawbot 연동 준비
- `LAWBOT_ANALYZE_URL`, `LAWBOT_ANALYZE_TOKEN` 기반 분석 호출
- 사건 화면에서 재분석 가능
- 스냅샷 저장/표시/fallback 기준 유지
- Lawbot 패널 문구 인코딩 복구 및 섹션 구조 정리

### D. 보안/안정성
- `middleware.ts`로 `/admin/*`, `/api/admin/*` 보호
- 생산환경에서 관리자 인증 미설정 시 fail-closed(503)
- `x-admin-sync-token` 기반 마케팅 ingest 예외 통로 관리
- 에러 페이지에서 민감 내부 정보 노출 완화

### E. 운영 검증 스크립트
- `npm run ops:env:check`: 운영 필수 env 점검
- `npm run ops:smoke`: 외부 타깃 스모크
- `npm run ops:smoke:local`: 로컬 서버 실행 후 스모크
- 스모크 코드 분리:
  - `scripts/smoke-admin-runtime-core.mjs` (엔진)
  - `scripts/smoke-admin-runtime.mjs` (일반 진입점)
  - `scripts/smoke-admin-runtime-local.mjs` (로컬용 래퍼)

## 4) 현재 DB 모델 상태 요약
- 핵심 엔터티: `Inquiry`, `Quote`, `ContractDraft`, `CaseRecord` 중심
- 현재 `CaseRecord`는 단순 stage 기반이며, 완전한 CaseMatter 중심 모델(문서버전/제출패키지/보완요구 중심)은 아직 부족
- 즉, 운영 화면은 고도화되었으나 도메인 모델은 다음 단계 확장이 필요

## 5) 감수 요청 포인트
아래를 “사건 중심 운영시스템” 관점에서 감수 요청:

1. 현재 아키텍처가 CaseMatter 중심으로 확장하기 좋은 구조인지
2. `Inquiry/Quote 중심`에서 `CaseMatter 중심`으로 전환할 마이그레이션 전략
3. 문서 라이프사이클 모델 제안:
   - RequiredDocument
   - CaseDocument
   - DocumentVersion
   - SubmissionPackage + SubmissionPackageItem
   - AgencySubmission
   - SupplementRequest
4. 상태 머신 분리 기준:
   - 사건 상태
   - 문서 상태
   - 제출 상태
   - 수금 상태
5. 운영 대시보드 KPI 추천(오늘 할 일, 보완 마감, 자료 대기, 제출 대기)
6. AI Copilot 경계조건(내부 초안, 비보장 문구, 전문가 협업 경고) 강화를 위한 규칙 제안

## 6) 즉시 확인 가능한 실행/검증
```bash
npm run verify
npm run ops:env:check
# 로컬 서버 실행 후
npm run ops:smoke:local
```

## 7) 현재 알려진 운영 이슈
- Windows 환경에서 간헐적으로 Prisma 엔진 DLL 잠금(EPERM) 발생 가능
- 증상 시 `node` 프로세스 정리 후 재실행하면 복구됨

## 8) 다음 단계(우선순위)
1. CaseMatter 중심 Prisma 스키마 확장
2. 문서/버전/제출/보완 도메인 모델 추가
3. 사건 상세 탭을 도메인 흐름 중심으로 재배치
4. 상태전이/다음액션 엔진 테스트 추가
