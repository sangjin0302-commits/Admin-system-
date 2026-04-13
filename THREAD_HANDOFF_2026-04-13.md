# Admin Office MVP - Thread Handoff (2026-04-13)

## 1) 현재 구현 범위
- 상담 접수 -> 사전진단 -> 견적 초안 -> 견적 상태 전이(발송/수락/거절)
- 계약 초안 생성
- 사건 생성 및 단계 관리
- 사건 문서 체크리스트
- 사건 파일 업로드/버전관리(최신본 지정, 삭제, 다운로드)
- 제출 패키지 생성/상태관리(스냅샷 기반)
- 보완 요청 생성/상태관리
- 사건 기한(제출/보완/체류만료/내부마감) 관리
- 운영 작업 큐(알림/리마인더) + 메시지 초안 복사

## 2) 이번 스레드 핵심 추가사항
- `lib/work-queue` 기반 규칙 엔진 추가
  - `DEADLINE_DUE_SOON`
  - `DEADLINE_OVERDUE`
  - `SUPPLEMENT_PENDING`
  - `MISSING_DOCUMENTS`
  - `QUOTE_FOLLOW_UP`
  - `CONTRACT_PENDING`
- `src/components/admin/work-queue-panel.tsx` 추가
  - 오늘/임박/지연/후속조치 섹션
  - 관련 inquiry 링크
  - 유형별 안내문 초안 복사
- `src/app/admin/page.tsx`를 운영 대시보드로 전환
- `src/app/admin/inquiries/page.tsx`에 작업 큐 패널 통합
- `src/lib/message-templates/work-queue.ts` 추가
- `prisma/seed.ts`에 작업 큐 재현용 데이터 보강

## 3) 주요 파일
- 대시보드/관리 UI
  - `src/app/admin/page.tsx`
  - `src/app/admin/inquiries/page.tsx`
  - `src/components/admin/work-queue-panel.tsx`
  - `src/components/admin/case-workflow-panel.tsx`
- 도메인/서비스
  - `src/lib/work-queue/service.ts`
  - `src/lib/work-queue/types.ts`
  - `src/lib/services/case-service.ts`
  - `src/lib/services/submission-service.ts`
  - `src/lib/services/quote-service.ts`
- 메시지 템플릿
  - `src/lib/message-templates/work-queue.ts`
  - `src/lib/message-templates/submission-flow.ts`
  - `src/lib/message-templates/case-flow.ts`
- API
  - `src/app/api/admin/cases/**`
- 데이터/스키마
  - `prisma/schema.prisma`
  - `prisma/seed.ts`
  - `scripts/bootstrap-sqlite.mjs`

## 4) 다음 스레드 시작 시 체크
1. `rtk npx prisma generate --schema prisma/schema.prisma`
2. `rtk npm run db:init`
3. `rtk npm run db:seed`
4. `rtk npm run build`
5. `rtk npm run dev` 후 아래 확인
   - `/admin`
   - `/admin/inquiries`
   - `/admin/inquiries/[id]`

## 5) 운영상 주의사항
- canonical working directory: `C:\codex-buildcheck\admin-office-mvp`
- OneDrive 경로 사용 금지
- `.next-prod`와 `generated/prisma-v4`는 런타임/생성 산출물이라 커밋 대상에서 제외 권장
- SQLite 로컬 운영 기준이며, 외부 발송(메일/문자/카카오) 연동은 아직 미구현

## 6) 다음 단계 추천
- 작업 큐 항목에 담당자/완료 체크(acknowledge) 추가
- 알림 기록(읽음/해결) 모델 추가
- 메시지 초안 -> 발송 로그 모델 분리
- 견적/사건 SLA 규칙을 설정 파일로 외부화
