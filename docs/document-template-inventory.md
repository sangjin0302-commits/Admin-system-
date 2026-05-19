# Document Template Inventory

이 문서는 Admin-system 문서 자동화 후보 서식을 추적하기 위한 초기 inventory다.

초기 목표는 실제 변환 구현이 아니라 다음을 명확히 하는 것이다.

- 어떤 서식을 자동화 후보로 볼 것인지
- 어떤 업무영역에 속하는지
- 원본 포맷이 무엇인지
- HWPX/DOCX/PDF 변환 검증 상태가 어떤지
- 어떤 필드가 필요할지
- 실무 리스크가 어느 정도인지

## Inventory Fields

| Field | Description |
|---|---|
| Template ID | 시스템 내부 식별자 |
| Title | 사용자에게 보이는 서식명 |
| Category | 업무영역 |
| Source format | 원본 파일 형식 |
| Target canonical format | 런타임 템플릿 후보 형식 |
| Priority | 초기 자동화 우선순위 |
| Risk level | 개인정보/법률판단/제출 리스크 |
| Conversion status | 변환/레이아웃 검증 상태 |
| Required fields | 자동완성에 필요한 주요 필드 |
| Notes | 비고 |

## Conversion Status Values

| Status | Meaning |
|---|---|
| not_tested | 아직 변환/레이아웃 검증 전 |
| source_only | 원본 source asset으로만 보관 |
| hwpx_candidate | HWPX canonical template 후보 |
| docx_candidate | DOCX canonical template 후보 |
| html_preview_only | HTML/PDF preview만 우선 가능 |
| verified | 자동완성 template으로 검증 완료 |
| manual_only | 자동화보다 수동 작성 유지가 안전 |

## Categories

- Common office forms
- Administrative appeal
- Immigration / stay status
- Driver license / DUI relief
- Civil petition / information disclosure
- Statement / petition / confirmation
- Ledger / office operation
- Other regulated workflow

## Initial Priority Inventory

| Template ID | Title | Category | Source format | Target canonical format | Priority | Risk level | Conversion status | Required fields | Notes |
|---|---|---|---|---|---:|---|---|---|---|
| common_power_of_attorney | 위임장 | Common office forms | HWP | HWPX or DOCX | 1 | Medium | not_tested | client.name, client.address, admin.name, case.scope, today | 공통 사건 패키지의 기본 서식 |
| common_privacy_consent | 개인정보수집동의서 | Common office forms | HWP | HWPX or DOCX | 2 | High | not_tested | client.name, client.contact, consent.scope, today | 민감정보 처리 전 우선 검증 필요 |
| admin_appeal_petition | 행정심판 청구서 | Administrative appeal | HWP | HWPX preferred | 3 | High | not_tested | client.name, client.address, case.agency, case.dispositionType, case.dispositionDate, case.claimPurpose, case.claimReasonSummary | 공식 서식 최신성 확인 필요 |
| admin_appeal_supplement | 보충서면 | Administrative appeal | HWP | HWPX or DOCX | 4 | High | not_tested | case.title, case.agency, client.name, case.argumentSummary, evidenceList | 행정심판 package 대상 |
| civil_info_disclosure_request | 정보공개청구서 | Civil petition / information disclosure | HWP | HWPX or DOCX | 5 | Medium | not_tested | client.name, client.address, agency.name, requestedInfo, receiveMethod | 공식 별지 서식 최신성 확인 필요 |
| immigration_refugee_application | 난민인정신청서 | Immigration / stay status | HWP | HWPX preferred | 6 | High | not_tested | client.name, nationality, sensitiveIdentityRef, entryDate, claimSummary | 민감정보/체류이력 보호 필요 |
| immigration_stay_reason_statement | 체류자격 변경/연장 사유서 | Immigration / stay status | HWP | HWPX or DOCX | 7 | High | not_tested | client.name, nationality, stayStatus, stayExpiryDate, reasonSummary, supportingFacts | 출입국 priority vertical |
| driver_license_objection | 운전면허처분 이의신청서 | Driver license / DUI relief | HWP | HWPX or DOCX | 8 | High | not_tested | client.name, dispositionDate, agency.name, objectionReason | 음주/면허구제 package 후보 |
| petition_letter | 탄원서 | Statement / petition / confirmation | HWP | DOCX or HWPX | 9 | Medium | not_tested | petitioner.name, client.name, case.summary, petitionReason | 자유서술/AI draft 보조 가능 |
| reflection_letter | 반성문 | Statement / petition / confirmation | HWP | DOCX or HWPX | 10 | Medium | not_tested | client.name, incidentSummary, reflectionSummary, futurePlan | AI draft는 관리자 검토 필수 |
| office_consultation_log | 행정사상담일지 | Ledger / office operation | HWP | DOCX or HTML | 11 | Medium | not_tested | client.name, contact, consultationDate, caseType, memo | 내부 기록용 |
| office_case_ledger | 행정사 업무처리부 | Ledger / office operation | HWP | HTML/CSV/PDF | 12 | Medium | not_tested | case.number, client.name, case.type, acceptedAt, closedAt, feeStatus | 장부 자동화와 연결 |

## Near-term Validation Set

첫 변환 검증은 아래 5개로 제한한다.

1. 위임장
2. 개인정보수집동의서
3. 행정심판 청구서
4. 보충서면
5. 정보공개청구서

각 서식에 대해 다음 결과를 남긴다.

```text
- source HWP available: yes/no
- HWPX conversion result: pass/fail/partial
- DOCX conversion result: pass/fail/partial
- PDF output result: pass/fail/partial
- layout notes
- placeholder feasibility
- official form verification needed: yes/no
```

## Safety Notes

- 이 inventory는 실무 사용 승인 목록이 아니다.
- `verified` 상태 전까지 고객 발송이나 기관 제출에 사용하지 않는다.
- 공식 서식은 최신성 확인이 필요하다.
- 민감 식별정보, 주소, 가족관계, 체류이력 등은 최소화하고 보호해야 한다.
- AI-generated text는 항상 draft로만 취급한다.
