# Immigration and Administrative Appeal Taxonomy

## 1. Purpose

이 문서는 Admin-system에서 출입국·행정심판 사건을 CaseMatter로 관리하기 위한 taxonomy와 필드 설계 기준을 정의한다.

목표:

- 강제퇴거, 출국명령, 입국금지, 체류자격 불허 등 사건 유형을 표준화한다.
- 사건별 핵심 기한을 놓치지 않게 한다.
- RequiredDocument checklist template 설계의 기반을 만든다.
- 향후 문서 자동작성 template registry의 입력 구조를 준비한다.
- AI 단독 법률 판단이 아니라 admin-controlled 사건 정리와 문서 초안 생성을 지원한다.

## 2. Case Taxonomy

상위 category:

- `immigration_appeal`
- `immigration_stay`
- `immigration_compliance`
- `immigration_document_support`

구체 matterType 후보:

| matterType | 의미 | 대표 고객 상황 | 주요 기관 | 핵심 기한 | 주요 자료 | 자동작성 후보 문서 |
| --- | --- | --- | --- | --- | --- | --- |
| `deportation_order_appeal` | 강제퇴거명령에 대한 불복/소명 사건 | 강제퇴거명령 또는 보호 조치를 받은 외국인 | 출입국·외국인청, 중앙행정심판위원회 | 송달일, 심판청구 기한, 출국/보호 관련 기한 | 강제퇴거명령서, 보호명령/통지서, 체류 이력, 가족관계, 위반 경위, 정상참작 자료 | 사실관계 정리서, 증거목록, 행정심판 청구서 초안, 집행정지 신청서 초안 |
| `departure_order_appeal` | 출국명령에 대한 불복/소명 사건 | 출국명령을 받고 체류 계속 필요성을 주장하는 외국인 | 출입국·외국인청, 중앙행정심판위원회 | 송달일, 출국기한, 심판청구 기한 | 출국명령서, 체류자격 자료, 국내 생활기반, 소명자료 | 소명서, 진술서, 제출자료 목록, 행정심판 청구서 초안 |
| `departure_recommendation_response` | 출국권고에 대한 소명/대응 | 출국권고를 받고 자진출국 또는 체류 유지 전략을 검토하는 외국인 | 출입국·외국인청 | 권고일, 출국 권고 기한, 후속 제출 기한 | 출국권고 관련 문서, 체류 이력, 생활기반 자료 | 소명서, 사실관계 정리서 |
| `entry_ban_response` | 입국금지 처분 또는 입국 제한 대응 | 입국금지, 재입국 제한, 입국 거부 가능성이 있는 외국인 | 출입국·외국인청, 재외공관 | 통지일, 재심/소명 제출 기한 | 입국금지 관련 문서, 과거 체류/출입국 기록, 가족관계, 초청 사유 | 사유서, 탄원서, 증거목록 |
| `stay_extension_denial_appeal` | 체류기간 연장 불허에 대한 불복/소명 | 체류기간 연장 불허 통지를 받은 외국인 | 출입국·외국인청, 중앙행정심판위원회 | 통지일, 송달일, 체류만료일, 심판청구 기한 | 연장 불허 통지서, 기존 체류자격, 연장 필요 사유, 고용/학업/가족/치료 자료 | 사유서, 소명서, 행정심판 청구서 초안 |
| `status_change_denial_appeal` | 체류자격 변경 불허에 대한 불복/소명 | 체류자격 변경 신청이 불허된 외국인 | 출입국·외국인청, 중앙행정심판위원회 | 통지일, 송달일, 체류만료일, 심판청구 기한 | 변경 불허 통지서, 기존 체류자격, 변경 신청 사유, 요건 충족 증빙 | 체류자격 변경 사유서, 소명서, 행정심판 청구서 초안 |
| `overstay_penalty_response` | 불법체류 기간, 과태료, 범칙금 관련 대응 | 체류기간 도과, 범칙금/과태료 통지, 자진신고를 검토하는 외국인 | 출입국·외국인청 | 납부기한, 출국기한, 소명 제출 기한 | 체류기간 만료 자료, 위반통지, 납부 관련 자료, 정상참작 자료 | 반성문, 소명서, 사실관계 정리서 |
| `immigration_offense_review` | 출입국 사범심사 관련 대응 | 사범심사 출석, 위반 사실 확인, 처분 가능성이 있는 외국인 | 출입국·외국인청 | 출석일, 소명 제출 기한, 처분 예정일 | 출석요구서, 위반 경위 자료, 체류 이력, 정상참작 자료 | 진술서, 소명서, 정상참작 사유서 |
| `detention_or_protection_review` | 보호명령/보호 관련 이슈 대응 | 보호 개시, 보호기간, 보호해제 가능성을 검토하는 외국인 | 출입국·외국인청, 보호소 | 보호 개시일, 이의신청/심사 기한 | 보호명령서, 신원보증/거주지 자료, 가족관계, 건강/인도적 사유 | 보호해제 관련 소명서, 사실관계 정리서 |
| `refugee_or_humanitarian_status` | 난민/인도적 체류 관련 처분 대응 | 난민 불인정, 인도적 체류 관련 통지를 받은 외국인 | 출입국·외국인청, 난민 관련 심사기관 | 통지일, 이의신청/행정심판 기한 | 처분 통지서, 본국 사정 자료, 진술서, 보호 필요 자료 | 진술서, 사실관계 정리서, 증거목록 |
| `visa_issuance_support` | 비자 발급/초청/입국 준비 지원 | 사증 발급 또는 초청자료를 준비하는 고객 | 재외공관, 출입국·외국인청 | 제출 예정일, 보완기한 | 초청장, 신원/소득/관계 증빙, 목적 소명자료 | 초청 사유서, 제출자료 목록 |
| `residence_status_document_support` | 체류자격 관련 자료 준비 지원 | 연장/변경/자격외활동 등 자료를 준비하는 외국인 | 출입국·외국인청 | 체류만료일, 제출 예정일, 보완기한 | 체류자격 자료, 고용/학업/가족 자료, 소득/납세 자료 | 체류자격 연장/변경 사유서 |
| `general_immigration_statement` | 일반 출입국 소명/진술서 작성 지원 | 처분 전후로 사실관계와 사유서를 정리해야 하는 고객 | 출입국·외국인청 | 제출기한, 보완기한 | 사실관계 자료, 증빙자료, 진술 자료 | 진술서, 사유서, 사실확인서 |

## 3. Disposition Type

처분/이슈 유형 후보:

- 강제퇴거명령
- 출국명령
- 출국권고
- 입국금지
- 체류기간 연장 불허
- 체류자격 변경 불허
- 사범심사
- 보호명령/보호 관련 이슈
- 과태료/범칙금/위반통지
- 난민/인도적 체류 관련 처분
- 기타 출입국 행정처분

내부 code 후보:

- `DEPORTATION_ORDER`
- `DEPARTURE_ORDER`
- `DEPARTURE_RECOMMENDATION`
- `ENTRY_BAN`
- `STAY_EXTENSION_DENIAL`
- `STATUS_CHANGE_DENIAL`
- `IMMIGRATION_OFFENSE_REVIEW`
- `DETENTION_OR_PROTECTION`
- `PENALTY_OR_VIOLATION_NOTICE`
- `REFUGEE_HUMANITARIAN`
- `OTHER_IMMIGRATION_DISPOSITION`

## 4. Deadline Field Map

공통 기한 필드 후보:

- `dispositionDate`
- `noticeDate`
- `serviceDate`
- `appealDeadline`
- `departureDeadline`
- `detentionStartDate`
- `stayExpiryDate`
- `submissionDeadline`
- `supplementDeadline`
- `resultExpectedDate`

표시 원칙:

- 실제 CaseMatter 공통 dueDate에는 가장 중요한 next deadline을 반영한다.
- 상세 출입국 필드는 나중에 별도 vertical detail model 또는 metadata로 확장한다.
- MVP에서는 먼저 문서상 field map으로 정리하고, schema 변경은 후속 PR에서 판단한다.

기한 우선순위 예:

1. `appealDeadline`
2. `departureDeadline`
3. `supplementDeadline`
4. `stayExpiryDate`
5. `submissionDeadline`

## 5. Person / Immigration Profile Fields

후보 필드:

- `nationality`
- `passportNumber`: 민감정보이므로 보안 전까지 저장 보류 가능
- `alienRegistrationNumber`: 고유식별정보라 저장 보류
- `currentStayStatus`
- `stayExpiryDate`
- `firstEntryDate`
- `lastEntryDate`
- `overstayPeriod`
- `familyInKorea`
- `employmentOrSchool`
- `residenceBase`
- `violationHistory`
- `penaltyHistory`

보안 원칙:

- 여권번호, 외국인등록번호 등 고유식별정보는 암호화/접근로그 설계 전까지 저장하지 않는다.
- MVP에서는 “보유 여부/확인 여부” 체크 형태로 먼저 관리한다.
- 실제 파일 업로드 전 파일 보안/다운로드 로그 설계가 필요하다.

## 6. RequiredDocument Template Map

공통 자료:

- 처분서
- 통지서
- 여권
- 외국인등록증
- 출입국 사실/체류 이력 관련 자료
- 가족관계 증빙
- 국내 거주지 증빙
- 고용/재직/사업/학업 증빙
- 소득/납세 자료
- 진술서
- 사실확인서
- 탄원서
- 반성문/소명서
- 기타 정상참작 자료

### `deportation_order_appeal`

- 강제퇴거명령서
- 보호명령/통지서, 있는 경우
- 송달일 확인 자료
- 체류 이력 자료
- 가족관계/국내 생활기반 자료
- 위반 경위 소명자료
- 정상참작 자료
- 행정심판 청구서 초안 자료
- 집행정지 신청 검토 자료

### `departure_order_appeal`

- 출국명령서
- 출국기한 확인 자료
- 송달일 확인 자료
- 체류자격/체류기간 자료
- 국내 생활기반 자료
- 소명서/진술서 자료

### `stay_extension_denial_appeal`

- 연장 불허 통지서
- 기존 체류자격 자료
- 체류기간 만료일 자료
- 연장 필요 사유 자료
- 고용/학업/가족/치료 등 관련 증빙
- 소명서 자료

### `status_change_denial_appeal`

- 변경 불허 통지서
- 기존 체류자격 자료
- 변경 신청 사유 자료
- 요건 충족 증빙
- 소명서 자료

## 7. Document Draft Template Candidates

우선순위:

1. 사실관계 정리서
2. 제출자료 목록
3. 증거목록
4. 사유서/소명서
5. 진술서
6. 탄원서
7. 정상참작 사유서
8. 행정심판 청구서 초안
9. 집행정지 신청서 초안
10. 체류자격 변경/연장 사유서

주의:

- 행정심판 청구서/집행정지 신청서 초안은 업무범위 체크를 강하게 둔다.
- 변호사 업무 가능성 표시가 필요하다.
- 자동작성은 admin-only preview만 허용한다.
- 고객 발송/기관 제출 자동화는 금지한다.

## 8. Workflow / Status Hints

출입국 사건 workflow 후보:

- `intake_received`
- `disposition_document_requested`
- `deadline_confirming`
- `facts_collecting`
- `evidence_collecting`
- `scope_review_required`
- `draft_preparing`
- `admin_review`
- `ready_to_submit`
- `submitted`
- `supplement_requested`
- `waiting_agency`
- `result_received`
- `closed`
- `on_hold`
- `declined_or_referred`

CaseMatterStatus와 직접 enum을 바꾸기 전, view model 또는 checklist label로 먼저 사용한다.

## 9. Safety Guardrails

필수 guardrail:

- 처분서 원문 확인 전 기한 확정 금지
- 송달일 확인 필요 표시
- 제출기한 수동 확인 필요
- 관할기관 확인 필요
- 최신 서식 확인 필요
- 행정사 업무범위 확인 필요
- 변호사 업무 가능성 표시
- AI 단독 법률판단 금지
- AI 단독 고객 안내 금지
- admin approval before document export
- no automatic submission

## 10. Implementation Roadmap

Phase 1. Taxonomy docs

- 본 문서 추가

Phase 2. View model / template registry seed, no DB migration

- matterType labels
- dispositionType labels
- checklist templates as code constants
- no customer upload

Phase 3. Case detail vertical panel

- 출입국 사건 요약 panel
- 기한/처분/자료 상태 표시
- schema 변경 없이 metadata 또는 view model 우선 검토

Phase 4. RequiredDocument starter templates

- matterType별 checklist 생성
- 강제퇴거/출국명령/체류연장불허 등 우선

Phase 5. Document template registry

- admin-only document draft preview
- fact summary
- evidence list
- statement draft
- petition/appeal draft candidates

Phase 6. Security/file upload before sensitive storage

- 여권/외국인등록증/처분서 파일 업로드 전 보안 설계
- access log
- download log
- retention/destruction

## 11. What Not To Implement Yet

- 여권번호/외국인등록번호 평문 저장
- 고객 파일 업로드
- 자동 기관 제출
- AI 단독 법률 판단
- 변호사 업무영역 대체
- 행정심판 문서 자동 완성 후 무검토 발송
- HWP 자동화
- 결제/수임료 연계
