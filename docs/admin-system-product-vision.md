# Admin System Product Vision

## 1. North Star

Admin-system의 최종 이상향은 단순 관리자 페이지가 아니라 다음이다.

`1인 또는 소규모 행정사 사무소용 End-to-End 사건 운영 OS`

이 시스템은 고객 유입부터 사건 종결, 장부, 보존/파기까지 행정사 실무 흐름 전체를 관리하는 것을 목표로 한다.

핵심 흐름:

`고객 유입 -> 접수 -> 상담 -> 수임 -> 자료요청 -> 문서작성 -> 제출 -> 보완 -> 결과수령 -> 종결 -> 장부/보존/파기`

## 2. Core Purpose

Admin-system의 목적은 AI가 행정사를 대체하는 것이 아니라, 행정사가 사건을 안정적으로 운영하도록 돕는 업무 통제 시스템이 되는 것이다.

주요 목적:

1. 누락 방지
   - 기한, 자료, 보완, 제출, 후속 연락 누락 방지
2. 사건 표준화
   - 사건유형별 checklist와 workflow로 처리 품질 유지
3. 고객 응대 안정화
   - 접수번호, 진행조회, 안내문, communication log 기반 응대
4. 기록/장부 자동화
   - 업무처리부, 수임관리대장, 제출이력, 종결기록 자동화
5. 리스크 관리
   - 업무범위, 공식 확인 필요사항, 개인정보, 파일 접근, 보존/파기 관리

## 3. Final Ideal System Scope

완성형 Admin-system은 아래 8개 축을 하나로 연결한다.

1. 고객 접수/진행조회 포털
   - `/intake`
   - public tracking code
   - `/track`
   - 고객 안내/진행상황 조회

2. 관리자 문의/상담 CRM
   - 문의 목록
   - 문의 상세
   - 상담/후속 연락
   - communication logs
   - 견적/수임 전환 관리

3. CaseMatter 중심 사건 카드
   - 사건번호
   - 의뢰인/관계자
   - 업무유형
   - 제출기관
   - 기한/D-day
   - 진행상태
   - 상담/업무 메모
   - 사건 이벤트 타임라인

4. 자료요청/증빙/파일 관리
   - RequiredDocument checklist
   - 고객 자료요청
   - 파일 업로드
   - 파일명 정리
   - 미제출/보완 필요 표시
   - 다운로드/access log

5. 제출기관/제출이력/보완요청 관리
   - SubmissionPackage
   - AgencySubmission
   - receipt number
   - supplement request
   - response package
   - result received tracking

6. 업무처리부/수임관리대장 자동 생성
   - 사건 데이터 기반 row 생성
   - 기간별 조회
   - CSV/Excel export
   - 종결/비고/수임료 반영

7. 문서 템플릿/HWP-HWPX-aware 자동화
   - template registry
   - HWP/HWPX first-class requirement
   - HWP source asset 보존
   - HWPX/DOCX/HTML runtime template 후보 검증
   - 위임장
   - 개인정보동의서
   - 사실확인서
   - 진술서
   - 내용증명
   - 정보공개청구서
   - admin-only preview
   - approval flow
   - DOCX는 내부 편집/검토 보조 포맷
   - PDF는 preview/final archive/export 포맷

8. 보안/권한/감사로그/보존/파기
   - 관리자 계정 체계
   - 2FA
   - role-based access
   - 접근 로그
   - 파일 다운로드 로그
   - 민감정보 암호화
   - 보존기간
   - 파기예정일
   - 파기완료 기록

## 3-A. 출입국·행정심판 우선 업무영역

Admin-system의 최우선 전문 업무영역은 출입국·체류·강제퇴거·출국명령·입국금지·체류자격 관련 행정심판, 이의신청, 소명 업무다.

이 vertical은 단순 상담 접수나 일반 서류작성보다 우선순위가 높다. 이유는 기한, 처분서, 사실관계, 증빙자료, 가족관계, 체류이력, 제출기관, 보완요청을 사건 카드 안에서 정밀하게 관리해야 하기 때문이다.

### 핵심 사건유형

- 강제퇴거명령
- 출국명령
- 출국권고
- 입국금지
- 체류기간 연장 불허
- 체류자격 변경 불허
- 사범심사/보호 관련 이슈
- 난민/인도적 체류 관련 처분
- 기타 출입국·체류 관련 행정처분

### 우선 관리 필드

- 처분 유형
- 처분일
- 통지일
- 송달일
- 불복/신청 기한
- 출국기한
- 보호 개시일
- 심판청구/이의신청 제출일
- 국적
- 체류자격
- 체류기간 만료일
- 입국일
- 체류 이력
- 국내 생활기반
- 가족관계
- 직장/학교/사업장
- 위반/범칙 이력
- 처분기관
- 제출기관
- 관할기관

### 우선 자료 checklist

- 처분서
- 통지서
- 출입국 기록
- 여권
- 외국인등록증
- 가족관계 증빙
- 고용/사업/학업 증빙
- 소득/납세 증빙
- 거주지 증빙
- 진술서
- 사실확인서
- 탄원서
- 반성문/소명서
- 기타 정상참작 자료

### 문서 자동작성 우선순위

- 행정심판 청구서 초안
- 집행정지 신청서 초안
- 사실관계 정리서
- 정상참작 사유서
- 증거목록
- 제출자료 목록
- 사유서
- 진술서
- 사실확인서
- 탄원서
- 체류자격 변경/연장 사유서

### 자동작성 원칙

- HWP/HWPX는 장기 과제가 아니라 공공서식 자동화의 first-class requirement다.
- HWP 원본은 source asset으로 보존한다.
- HWPX/DOCX/HTML 중 검증된 포맷만 runtime template 후보로 둔다.
- DOCX는 내부 편집/검토 보조 포맷으로 사용한다.
- PDF는 preview/final archive/export 포맷으로 사용한다.
- admin-only preview를 먼저 검증한다.
- 고객 발송 전 관리자 검토를 필수로 한다.
- 기관 제출 자동화는 하지 않는다.
- 공식 서식과 제출기관 기준은 항상 최신 여부를 확인한다.

### 안전장치

- 변호사 업무 가능성 체크
- 행정사 업무범위 체크
- 공식 기관 확인 필요 표시
- 제출기한 확인 필수
- 처분서 원문 확인 필수
- AI 단독 법률판단 금지
- AI 단독 고객 안내 금지
- 민감정보 보호 우선
- 파일 업로드 전 보안 설계 선행

### 로드맵 반영

1. 출입국 사건유형 taxonomy
2. 출입국 사건 카드 필드 확장
3. 출입국 RequiredDocument template
4. 행정심판/강제퇴거 checklist
5. 문서 template registry
6. admin-only 문서 초안 preview
7. HWP/HWPX-aware template pipeline
8. DOCX/PDF preview/archive/export
9. 파일 보안/업로드
10. 고객 자료제출 portal

## 4. Ideal Case Card

완성형 사건 카드에서 사건 하나를 열면 아래 정보가 한 화면에서 확인되어야 한다.

- 사건번호
- 사건명
- 의뢰인
- 관계자
- 연락처
- 업무유형
- 제출기관
- 담당자
- 접수일
- 수임일
- 기한
- D-day
- 현재 진행상태
- 다음 액션
- 상담 메모
- 내부 결정 로그
- 필수자료 checklist
- 고객 제출 자료
- 작성 문서
- 제출 패키지
- 제출 이력
- 접수번호/receipt number
- 보완요청
- 보완 대응 이력
- 결과 수령
- 수임료
- 입금 상태
- 종결일
- 업무처리부 반영 여부
- 보존기한
- 파기예정일
- 사건 이벤트 타임라인

## 5. Current Position

현재 Admin-system은 아래 영역에서 강점이 있다.

- 공개 접수
- 고객 접수번호
- 고객 진행상황 조회
- 관리자 문의 상세
- 고객 커뮤니케이션 허브
- Lawbot 검토/승인 흐름
- 이메일 dry-run/audit 안전 설계
- public marketing pages
- intake source tracking
- `/admin/intake-sources`
- Inquiry -> CaseMatter 전환 구조
- CaseMatter / RequiredDocument / CaseEvent 등 사건관리 모델
- `/admin/ledger` 장부/수임관리 read-only 운영 UX
- 장부 summary, dashboard card, filter presets, reason badges
- ledger CSV export safety
- accounting follow-up runbook
- `/admin/document-lab` read-only 문서 실험실
- document template inventory/filter/readiness/source verification/work queue
- `/admin` Document Lab priority card
- HWP/HWPX template pipeline 문서와 source verification runbook
- public website 3D brand entrance plan

현재 부족한 영역:

- CaseMatter 상세 화면이 아직 실무 사건 카드로 부족
- 업무처리부/수임관리대장은 read-only 운영 UX 이후 실제 생성/수정 workflow가 부족
- 실제 파일 업로드/증빙관리 부족
- 제출이력/보완요청 등록 화면 부족
- 수임료/입금관리 write workflow 부족
- 문서 템플릿 자동작성은 아직 생성 전 read-only 준비 단계
- HWP/HWPX/DOCX/PDF generation 미구현
- CaseMatter document generation 연결 미구현
- 권한/감사/보존/파기 정책 부족

현재 도달 수준은 대략 다음과 같이 본다.

- 고객 접수/조회: 90%
- Public marketing/유입 추적: 85%
- Admin 문의 관리: 75%
- 고객 커뮤니케이션: 75~80%
- Lawbot 검토/승인 구조: 80~85%
- Inquiry -> Case 전환: 65~70%
- CaseMatter 데이터 모델: 70%
- CaseMatter 실무 화면: 35~45%
- 필수자료 checklist: 45~55%
- 제출/보완 관리: 25~35%
- 업무처리부/수임대장: 85~92%
- 문서 자동화 기반: 70~76%
- 파일/증빙관리: 10~20%
- 수임료/입금관리: 35~45%
- 보안/권한/감사: 35~45%

전체 이상향 대비 현재 위치:

- 운영 MVP: 96~98%
- 출입국 vertical: 95~98%
- 장부/수임관리: 85~92%
- 문서 자동화 기반: 70~76%
- 최종 운영 OS 전체: 65~75%

## 6. Development Roadmap

### Phase 1. CaseMatter 사건 카드 MVP

목표:

`/admin/cases/[id]`를 실제 행정사 사건 카드로 확장한다.

범위:

- 사건 요약
- 의뢰인/관계자
- 원 문의 연결
- D-day
- 필수자료 요약
- 업무 태스크
- 제출/보완 read section
- 사건 이벤트 타임라인

원칙:

- read-oriented
- 기존 schema 활용
- schema/migration 없이 진행
- 쓰기 기능은 최소화
- 기존 상태 변경 기능은 유지

### Phase 2. 업무처리부/수임관리대장

목표:

사건 데이터 기반 장부/수임관리 상태를 안정적으로 읽고, 이후 승인된 workflow에서 row 생성/수정으로 확장한다.

범위:

- 사건별 ledger row
- ledger summary
- `/admin` accounting dashboard card
- quick filter presets
- accounting follow-up reason badges
- 접수일자
- 의뢰인명
- 업무유형
- 업무내용
- 처리상태
- 제출기관
- 종결일자
- 비고
- CSV export safety

추후 확장:

- 수임료
- 입금 상태
- 세금계산서/현금영수증 메모
- write workflow
- 승인/감사 로그

### Phase 3. 기한관리/오늘 할 일

목표:

관리자가 매일 "오늘 무엇을 처리해야 하는지" 바로 알 수 있게 한다.

범위:

- dueDate
- nextActionAt
- D-day
- overdue
- due soon
- 오늘 처리할 사건
- 자료 미제출
- 보완 마감
- 고객 회신 대기

### Phase 4. 자료요청/제출이력/보완요청

목표:

행정기관 제출 실무 흐름을 사건 안에서 관리한다.

범위:

- RequiredDocument 강화
- 고객 자료요청 checklist
- SubmissionPackage
- AgencySubmission
- SupplementRequest
- 접수번호/receipt number
- 보완 대응 이력
- 결과 수령

### Phase 5. HWP/HWPX 문서 자동화 기반

목표:

HWP/HWPX 공공서식 자동화 전에 공식 출처, 최신성, readiness, work queue를 안전하게 관리한다.

우선순위:

1. HWP/HWPX official source verification
2. `/admin/document-lab` read-only inventory
3. category/risk/conversion status/search/source status filters
4. readiness checklist/status
5. official source verification metadata
6. source verification priority summary
7. source verification work queue
8. admin-only preview experiment
9. sample placeholder mapping
10. HWPX/DOCX/HTML conversion test

원칙:

- HWP/HWPX는 first-class requirement
- DOCX는 내부 편집/검토 보조 포맷
- PDF는 preview/final archive/export 포맷
- file upload 금지
- document generation 금지
- HWP/HWPX/DOCX/PDF generation 금지
- CaseMatter document generation 연결 금지
- customer send 금지
- agency submission 금지

### Phase 6. 보안/권한/감사 강화

목표:

실제 민감정보와 파일을 다룰 수 있는 운영 보안 수준으로 강화한다.

범위:

- 관리자 계정 체계
- 2FA
- role-based access
- 접근 로그
- 다운로드 로그
- 민감정보 암호화
- 파일 보안
- 자동 로그아웃
- 보존/파기 정책

### Phase 7. 완성형 운영 OS

목표:

소규모 행정사 사무소가 일상 업무 대부분을 Admin-system 안에서 운영할 수 있게 한다.

범위:

- 고객 포털
- 사건 카드
- 자료요청
- 제출관리
- 문서작성
- 장부
- 알림
- 보안
- 운영 분석
- 전환율 분석

### Public Website Direction

Public website는 신뢰형 행정사·출입국 전문 브랜드 입구로 둔다.

- 3D brand entrance는 첫 hero section에 제한적으로 적용한다.
- 시작은 static mock과 첫 hero prototype이다.
- 전체 3D 사이트화는 하지 않는다.
- 상담/조회 CTA 접근성을 3D 연출보다 우선한다.
- 모바일 fallback과 성능 QA를 필수로 둔다.

## 7. Product Principles

1. Case-centered
   - 최종 중심은 Inquiry가 아니라 CaseMatter다.

2. Admin-controlled
   - 고객에게 자동 발송하거나 외부 제출하는 기능은 반드시 관리자 검토/승인을 거친다.

3. Safe by default
   - 기본값은 dry-run, read-only, fail-closed를 우선한다.

4. No secret exposure
   - env, token, provider secret, raw internal payload는 UI/API에 노출하지 않는다.

5. Public/admin separation
   - public route와 admin route를 엄격히 분리한다.

6. Auditability
   - 상태 변경, 문서 승인, 제출, 다운로드, 고객 안내는 기록으로 남긴다.

7. Incremental rollout
   - 파일 업로드, 실제 발송, 문서 export, 결제 등 위험도가 높은 기능은 설계와 검증 후 단계적으로 도입한다.

8. Practical over fancy
   - 예쁜 화면보다 사건 누락 방지, 기한 관리, 자료 상태, 제출 이력, 장부 자동화가 우선이다.

9. HWP/HWPX first-class
   - 한국 공공서식 실무에서는 HWP/HWPX 원본과 레이아웃 검증이 핵심 요구사항이다.

10. Risk-based PR size
   - docs/read-only/helper/test 변경은 같은 목적이면 묶을 수 있다. DB/API/mutation/file generation/security/env 변경은 작고 격리된 PR로 유지한다.

## 8. What Not To Do Yet

아래 기능은 충분한 설계 전까지 서두르지 않는다.

- 고객 파일 업로드
- 실제 이메일/SMS/AlimTalk 발송
- document generation
- HWP/HWPX/DOCX/PDF generation
- CaseMatter document generation 연결
- 결제 연동
- 외부 기관 자동 제출
- 민감정보 대량 저장
- 자동 법률 판단/자동 수임 결정
- AI 단독 고객 안내
- customer send
- agency submission

## 9. Near-term Priority

현재 가장 중요한 다음 작업은:

`/admin/document-lab`의 official source verification 운영 기준을 실제 검토 workflow로 연결하기 전, read-only 표면과 runbook 정합성을 계속 고정하는 것이다.

그 다음 순서:

1. README/product vision/docs link 정합성
2. Document Lab official source verification workflow 설계
3. sample placeholder mapping
4. HTML/admin-only preview experiment
5. HWPX/DOCX conversion test script 조사
6. TemplateRegistry schema 설계
7. GeneratedDocument/AuditLog 설계
8. CaseMatter read-only documents tab
9. 파일 보안/업로드
10. 권한/감사/파기 고도화

## 10. Success Definition

Admin-system이 "업무에 무리 없이 안정적으로 쓸 수 있다"고 판단하는 기준:

- 모든 실제 사건이 CaseMatter로 관리된다.
- 사건별 기한과 다음 액션을 놓치지 않는다.
- 필수자료 미제출 상태가 명확히 보인다.
- 제출/보완/결과수령 이력이 사건에 남는다.
- 업무처리부/수임관리대장을 사건 데이터에서 만들 수 있다.
- 고객 안내 이력이 남는다.
- 민감정보와 파일 접근이 통제된다.
- 종결 후 보존/파기 예정일을 관리할 수 있다.

## 11. Related Docs

- HWP/HWPX template pipeline: `docs/hwp-hwpx-template-pipeline-plan.md`
- Document template inventory: `docs/document-template-inventory.md`
- Document Lab readiness runbook: `docs/runbooks/document-lab-readiness.md`
- Official source verification runbook: `docs/runbooks/document-template-official-source-verification.md`
- Document Lab source work queue runbook: `docs/runbooks/document-lab-source-work-queue.md`
- Accounting follow-up runbook: `docs/runbooks/case-accounting-follow-up.md`
- Immigration due date sync QA runbook: `docs/runbooks/immigration-due-date-sync-qa.md`
- Public website 3D brand entrance: `docs/public-website-3d-brand-entrance.md`
- OSS upgrade/reference roadmap: `docs/oss-upgrade-roadmap.md`
- Notion integration strategy: `docs/notion-integration-strategy.md`
- Notion schema mapping snapshot: `docs/notion-schema-mapping-snapshot.md`
