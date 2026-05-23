# Document Lab Source Verification Work Queue Runbook

## 1. Purpose

이 문서는 `/admin/document-lab`의 `공식 출처 검토 워크큐`를 운영하는 기준을 정의한다.

핵심 원칙:

- work queue는 문서 생성 단계 진입 목록이 아니다.
- work queue는 공식 출처, 최신성, 확인자, 검토 메모 누락을 우선 처리하기 위한 내부 운영 큐다.
- 이 단계에서는 문서 생성, 다운로드, 업로드, CaseMatter 연결, 고객 발송, 기관 제출을 하지 않는다.
- 공식 출처 확인은 HWP/HWPX 공공서식 자동화 전에 먼저 고정해야 하는 운영 기준이다.

## 2. Work Queue Inputs

워크큐는 다음 registry metadata에서 계산한다.

- `riskLevel`
- `officialSourceReferenceKo`
- `latestVerifiedAt`
- `verifiedBy`
- `verificationMemoKo`
- `isManualOnly`
- `sourceStatus`
- readiness status

워크큐 계산에 사용하지 않는 것:

- 실제 HWP 파일
- Google Drive 파일
- filesystem path
- 고객 사건 데이터
- CaseMatter 데이터
- uploaded files

## 3. Missing Reason Definitions

### official_source_missing

의미:

- 공식 출처 확인 필요
- 공식 출처명 또는 공식 출처 후보가 불명확한 상태

조치:

- 공식 기관, 법령, 정부 포털, 제출기관 홈페이지 기준으로 원본을 확인한다.
- 블로그, 카페, 커뮤니티, 출처 불명 파일만 있으면 STOP 처리한다.
- 실제 고객 사건 파일에서 추출한 서식은 공식 원본으로 쓰지 않는다.

### latest_verified_at_missing

의미:

- 최신 확인일 필요
- 공식 출처 후보는 있으나 언제 확인했는지 기록이 없는 상태

조치:

- 오늘 기준으로 공식 사이트를 직접 확인한다.
- `latestVerifiedAt` 기록 후보를 `YYYY-MM-DD` 형식으로 남긴다.
- 다운로드 날짜와 공식 출처 확인일이 다를 수 있음을 메모에 남긴다.

### verified_by_missing

의미:

- 확인자 기록 필요
- 누가 공식 출처를 확인했는지 불명확한 상태

조치:

- 확인자를 기록한다.
- 개인 실명 대신 운영상 허용된 내부 이름이나 role을 쓸 수 있다.
- 예: `Admin`, `Document Reviewer`, `대표 행정사`
- 자동 시스템 값만으로 확인자 처리를 끝내지 않는다.

### verification_memo_missing

의미:

- 검토 메모 필요
- 어떤 기준으로 확인했는지 기록이 부족한 상태

조치:

- 공식 출처, 서식 최신성, 주의사항을 짧게 기록한다.
- 실제 고객정보, 사건번호, 연락처, 고유식별정보를 넣지 않는다.
- 메모는 나중에 사람이 검토 흐름을 재구성할 수 있을 정도로만 남긴다.

예시:

- `온라인 행정심판 공식 서식 최신성 확인 필요`
- `하이코리아 서식 개정 여부 재확인 필요`
- `고위험 서식: 업무범위 검토 후 template 작업 후보`

### high_risk_review_needed

의미:

- 고위험 서식 검토 필요
- 행정심판, 집행정지, 난민, 출입국 처분 관련 서식처럼 업무범위와 제출 기준 확인이 필요한 상태

조치:

- 업무범위를 검토한다.
- 공식 서식 최신성을 확인한다.
- AI 단독 법률판단 금지 여부를 확인한다.
- 고객 발송 또는 기관 제출 자동화가 없음을 확인한다.
- 청구취지, 청구이유, 소명 핵심 문구를 AI가 단독 확정해야 하는 구조라면 STOP 처리한다.

### manual_only_review

의미:

- 수동 작성 유지 검토
- 자동화 대상에서 제외하거나 보류하는 서식

조치:

- 수동 유지 이유를 기록한다.
- 향후 자동화 재검토 여부를 기록한다.
- manual-only는 안전한 운영 판단일 수 있으며 실패 상태로 보지 않는다.

## 4. Processing Priority

처리 순서:

1. High-risk + official source missing
2. High-risk + latest verified date missing
3. High-risk + reviewer missing
4. High-risk + review memo missing
5. Medium-risk + source missing
6. Medium-risk + latest verified date missing
7. Manual-only review
8. Low-risk missing metadata

우선 처리 대상:

- 행정심판 청구서
- 집행정지 신청서
- 난민인정신청서
- 출입국 처분 관련 신청/소명 서식
- 제출기관 공식 서식이 자주 바뀌는 서식

운영 팁:

- high-risk 항목은 출처가 있어도 최신 확인일, 확인자, 검토 메모가 없으면 먼저 본다.
- medium-risk는 source missing을 먼저 처리한다.
- low-risk는 업무 여유가 있을 때 일괄 정리한다.

## 5. Reviewer / Date / Memo Policy

확인자:

- 개인 실명 대신 운영상 허용된 내부 이름 또는 role 사용 가능
- 예: `Admin`, `Document Reviewer`, `대표 행정사`
- 자동 시스템 값만으로 확인자 처리 금지

최신 확인일:

- 공식 출처를 직접 확인한 날짜
- 다운로드 날짜와 다를 수 있음
- 포맷: `YYYY-MM-DD`

검토 메모:

- 짧게 쓴다.
- 비민감하게 쓴다.
- 실제 고객정보를 넣지 않는다.
- 공식 출처, 최신성, 주의사항 중심으로 쓴다.

검토 메모 좋은 예:

- `온라인 행정심판 공식 서식 최신성 확인 필요`
- `하이코리아 서식 개정 여부 재확인 필요`
- `고위험 서식: 업무범위 검토 후 template 작업 후보`

검토 메모 나쁜 예:

- 실제 고객 이름, 전화번호, 여권번호, 외국인등록번호 포함
- 사건별 소명 내용 포함
- 비공식 파일 출처를 공식처럼 단정
- 청구취지나 청구이유를 확정한 표현

## 6. Pass Criteria

워크큐에서 제외 가능한 상태:

- 공식 출처 후보가 명확함
- `latestVerifiedAt` 있음
- `verifiedBy` 있음
- `verificationMemoKo` 있음
- high-risk는 업무범위와 공식서식 검토 메모 있음
- manual-only는 수동 유지 이유 있음

주의:

- 워크큐에서 빠졌다고 문서 생성 단계에 들어간다는 뜻은 아니다.
- readiness, conversion test, PDF preview, layout verification은 별도 단계다.
- HWP/HWPX 원본 보존과 working copy 분리는 별도 asset policy를 따른다.

## 7. Stop Criteria

즉시 중단:

- 비공식 파일만 존재
- 실제 고객정보 포함 파일 발견
- 출처 불명
- 서식 버전 충돌
- 기관별 서식 차이 해결 안 됨
- high-risk인데 업무범위 검토 없음
- AI가 청구취지 또는 청구이유를 단독 확정해야 하는 구조
- 고객 발송 또는 기관 제출 자동화가 전제되는 구조

STOP 시 처리:

- 자동화 후보로 넘기지 않는다.
- 검토 메모에 중단 이유를 남긴다.
- 필요하면 `manual_only` 또는 source pending 상태로 유지한다.

## 8. Relationship to Document Lab

Document Lab 표시와의 관계:

- dashboard card: 긴급 누락 사유 요약
- document-lab priority summary: 검토 우선순위
- work queue: 실제 확인해야 할 항목
- mini checklist: 개별 template의 출처 검증 상태
- readiness: 자동화 파이프라인 준비 상태

해석 기준:

- source verification은 readiness의 일부 조건이다.
- work queue는 source verification 누락 처리 화면이다.
- ready candidate는 다음 실험 후보라는 뜻이며 제출 후보가 아니다.
- conversion test, preview, layout 검수 전에는 파일 생성 단계로 보지 않는다.

## 9. QA Checklist

GET-only QA:

- `/admin` 200
- dashboard Document Lab card 표시
- `/admin/document-lab` 200
- work queue 표시
- priority query 200
- safety copy 유지
- upload/download/generate action 없음
- production mutation 없음

Docs review:

- reason labels가 UI와 일치
- pass/stop criteria가 official source verification runbook과 충돌하지 않음
- HWP/HWPX first-class 방향과 일치
- customer-facing 기능으로 해석되지 않음

## 10. Future Implementation Notes

후속 후보:

- read-only reviewer/status field display 고도화
- source verification filter by missing reason
- admin-only verification PATCH
- verification audit event
- TemplateRegistry schema
- GeneratedDocument/AuditLog
- CaseMatter documents tab
- 실제 파일 업로드는 보안 설계 후 검토

장기 구현 전제:

- 파일 업로드, 다운로드, 문서 생성은 별도 권한/감사/저장 정책 필요
- GeneratedDocument/AuditLog 설계 전에는 export 기능을 붙이지 않는다.
- customer send 또는 agency submit은 별도 장기 과제로 분리한다.
