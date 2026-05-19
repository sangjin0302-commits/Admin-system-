# HWP/HWPX Template Pipeline Plan

## 1. Purpose

Admin-system의 문서 자동화는 한국 행정사 실무와 공공기관 제출 환경을 고려하여 HWP/HWPX 호환성을 1차 요구사항으로 둔다.

문서 자동화의 목표는 AI가 행정사의 판단을 대체하는 것이 아니라, CaseMatter에 정리된 사건 데이터를 행정사 실무 서식에 안전하게 반영하여 반복 입력, 누락, 서식 관리 부담을 줄이는 것이다.

핵심 원칙:

`CaseMatter 데이터 -> HWP/HWPX-aware template -> admin-only preview -> 관리자 검토 -> export/archive`

## 2. Format Policy

Admin-system의 문서 포맷 정책은 다음과 같다.

| Format | Role | Policy |
|---|---|---|
| HWP | 원본 공공서식/source asset | 런타임 직접 편집 대상이 아니라 검증 기준 원본으로 보관한다. |
| HWPX | 한국 공공기관 호환 자동화 후보 | 가능한 경우 1순위 canonical template 후보로 검토한다. |
| DOCX | 내부 편집/검토용 보조 포맷 | HWP/HWPX 레이아웃 검증이 어렵거나 내부 검토가 필요한 경우 사용한다. |
| PDF | preview/final archive/export | 최종 확인, 보관, 제출 전 확인본 용도로 사용한다. |
| HTML | admin preview rendering | 관리자 미리보기와 누락 필드 확인에 사용한다. |

HWP/HWPX는 한국 공공기관 제출 실무를 위한 first-class requirement다. DOCX는 보조 편집 포맷이고, PDF는 최종 확인/보관 포맷이다.

## 3. Why HWP/HWPX First

한국 행정사 실무에서는 많은 공공기관, 신청서, 청구서, 별지 서식이 한글 문서 형식을 전제로 운용된다.

HWP/HWPX 대응을 선행해야 하는 이유:

- 공공기관 제출 서식은 표, 셀 병합, 고정 여백, 장평/자간, 별지 번호에 민감하다.
- 단순 DOCX 변환은 표 구조, 줄바꿈, 쪽수, 입력란 위치를 깨뜨릴 수 있다.
- PDF는 최종본 확인에는 적합하지만 편집 가능한 기본 템플릿으로는 부적합하다.
- HWP 원본을 무시하고 DOCX/PDF 중심으로 설계하면 실제 제출 단계에서 다시 수동 보정이 필요해질 수 있다.

따라서 문서 자동화의 기반은 단순 DOCX/PDF 생성이 아니라 HWP/HWPX-aware template pipeline이어야 한다.

## 4. Non-goals

초기 버전에서 하지 않는다.

- 범용 HWP -> DOCX 자동 변환기 구현
- 임의의 HWP 파일을 자동으로 완벽한 template으로 변환하는 기능
- 고객 자동 발송
- 외부 기관 자동 제출
- AI 단독 법률판단
- AI 단독 청구취지/청구이유 확정
- 보안 강화 전 민감 파일 대량 저장
- 공식 서식 최신성 검증 없는 실무 사용

단, HWP/HWPX pipeline 자체는 장기 과제가 아니라 선행 검증 과제다.

## 5. Architecture

문서 자동화는 Admin-system 내부의 독립 모듈로 둔다.

```text
DocumentAutomation
  ├─ TemplateRegistry
  ├─ HwpSourceAsset
  ├─ HwpxTemplateAdapter
  ├─ DocxTemplateAdapter
  ├─ HtmlPreviewRenderer
  ├─ PdfExportRenderer
  ├─ GeneratedDocument
  └─ DocumentAuditLog
```

### TemplateRegistry

서식의 업무영역, 위험도, 원본 파일, canonical template, 필수 필드, 출력 포맷을 관리한다.

### HwpSourceAsset

HWP 원본 파일을 공식/실무 기준 원본으로 추적한다. 런타임 직접 편집 대상이 아니라 서식 검증과 변환 비교의 기준으로 사용한다.

### HwpxTemplateAdapter

HWPX가 안정적으로 사용 가능한 서식은 canonical template 후보로 등록한다.

### DocxTemplateAdapter

DOCX는 내부 편집, 검토, 보조 export 포맷으로 사용한다.

### HtmlPreviewRenderer

관리자가 문서 초안을 브라우저에서 확인하고 누락 필드를 점검할 수 있게 한다.

### PdfExportRenderer

승인된 초안의 최종 확인본 또는 보관본을 생성한다.

### GeneratedDocument

생성된 문서 초안, 사용 템플릿, 사건, 생성자, 상태를 기록한다.

### DocumentAuditLog

문서 생성, preview, approval, export, download, void 이력을 남긴다.

## 6. Development Phases

### Phase 1. Docs and inventory

- HWP/HWPX 우선 원칙 문서화
- 문서 템플릿 인벤토리 작성
- 우선 자동화 후보 서식 선정

### Phase 2. Select priority forms

처음에는 3~5개 핵심 서식만 검증한다.

- 위임장
- 개인정보수집동의서
- 행정심판 청구서
- 보충서면
- 정보공개청구서

### Phase 3. Conversion and layout test

각 서식에 대해 아래 결과물을 비교한다.

```text
원본 HWP
-> HWPX 변환본
-> DOCX 변환본
-> PDF 출력본
```

검수 기준:

- 표 깨짐 여부
- 셀 병합 유지 여부
- 줄바꿈 유지 여부
- 쪽수 유지 여부
- 입력란 위치 유지 여부
- placeholder 삽입 가능 여부
- 한글 프로그램에서 열람 가능 여부
- PDF 출력 시 제출 가능한 수준인지 여부

### Phase 4. `/admin/document-lab`

실제 사건 데이터와 연결하기 전에 admin-only document lab을 만든다.

범위:

- 템플릿 목록 보기
- 샘플 데이터 입력
- placeholder 치환
- preview 확인
- HWPX/DOCX/PDF 생성 실험
- 변환 결과 다운로드

이 단계에서는 실제 고객정보를 사용하지 않는다.

### Phase 5. Template registry

검증된 템플릿만 registry에 올린다.

필드 예시:

```text
id
title
category
caseType
sourceFormat
sourceAssetPath
canonicalFormat
canonicalTemplatePath
requiredFields
optionalFields
riskLevel
conversionStatus
latestVerifiedAt
isActive
```

### Phase 6. Placeholder syntax

템플릿 치환 문법을 확정한다.

단순 필드:

```text
{{client.name}}
{{client.birthDate}}
{{client.address}}
{{case.agency}}
{{case.dispositionDate}}
{{case.claimPurpose}}
```

반복 필드:

```text
{{#evidenceList}}
{{index}}. {{title}} - {{description}}
{{/evidenceList}}
```

조건부 필드:

```text
{{#if client.isForeigner}}
외국인등록번호: {{client.foreignerRegistrationNumber}}
{{/if}}
```

### Phase 7. CaseMatter read-only connection

`/admin/cases/[id]/documents`는 CaseMatter 데이터를 읽어 문서 초안을 생성한다.

초기 원칙:

- CaseMatter 원본 데이터 수정 금지
- 필수값 누락 표시
- 생성 가능한 템플릿 표시
- admin-only preview
- download/export는 로그 기록 후 허용

### Phase 8. GeneratedDocument persistence

문서 생성 이력을 저장한다.

상태값:

```text
draft
reviewed
approved
exported
void
```

### Phase 9. Audit log

다음 이벤트를 기록한다.

```text
TEMPLATE_SELECTED
DRAFT_GENERATED
PREVIEW_OPENED
HWPX_DOWNLOADED
DOCX_DOWNLOADED
PDF_DOWNLOADED
APPROVED
VOIDED
```

### Phase 10. Administrative appeal package

행정심판 사건에서 자주 쓰는 서식을 package로 묶는다.

- 행정심판 청구서
- 위임장
- 개인정보동의서
- 보충서면
- 증거목록
- 제출자료목록

### Phase 11. Immigration package

출입국/체류 사건에서 자주 쓰는 서식을 package로 묶는다.

- 난민인정신청서
- 체류자격 변경/연장 사유서
- 외국인근로자 관련 신고서
- 고용허가기간 연장신청서
- 귀화추천서
- 국내정착 사정 설명서

## 7. Priority Templates

초기 우선순위는 다음과 같다.

| Priority | Template | Category | Risk |
|---:|---|---|---|
| 1 | 위임장 | Common office forms | Medium |
| 2 | 개인정보수집동의서 | Common office forms | High |
| 3 | 행정심판 청구서 | Administrative appeal | High |
| 4 | 보충서면 | Administrative appeal | High |
| 5 | 정보공개청구서 | Civil petition / information disclosure | Medium |
| 6 | 난민인정신청서 | Immigration / stay status | High |
| 7 | 체류자격 변경/연장 사유서 | Immigration / stay status | High |
| 8 | 운전면허처분 이의신청서 | Driver license / DUI relief | High |
| 9 | 탄원서 | Statement / petition / confirmation | Medium |
| 10 | 반성문 | Statement / petition / confirmation | Medium |

## 8. Safety Principles

- admin-only preview first
- read-only CaseMatter integration first
- generated documents must be logged
- downloads must be logged
- official forms must be version-checked
- sensitive fields must be minimized and protected
- AI output must remain draft-only until reviewed
- external submission automation is out of scope

## 9. Success Criteria

HWP/HWPX template pipeline MVP가 성공했다고 판단하는 기준:

- 최소 3개 핵심 HWP 원본이 inventory에 등록된다.
- 최소 1개 템플릿이 HWPX 또는 DOCX canonical template으로 검증된다.
- placeholder 치환 후 preview가 가능하다.
- 관리자 전용 환경에서 초안을 생성할 수 있다.
- PDF 확인본 또는 export 파일을 생성할 수 있다.
- 생성/다운로드 이력이 남는다.
- 고객 자동 발송이나 기관 자동 제출이 발생하지 않는다.
