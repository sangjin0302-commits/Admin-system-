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

7. 문서 템플릿/DOCX/PDF 자동작성
   - template registry
   - 위임장
   - 개인정보동의서
   - 사실확인서
   - 진술서
   - 내용증명
   - 정보공개청구서
   - admin-only preview
   - approval flow
   - DOCX/PDF export
   - HWP compatibility는 장기 과제

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

## 3-1. Public Website / Customer Entry Vision

현재 공개 접수 화면과 웹사이트가 같은 역할처럼 보이는 문제를 장기적으로 분리한다.

최종 공개 고객 경험은 일반 웹사이트를 중심 입구로 두고, 그 안에서 고객 페이지와 관리자 영역으로 연결되는 구조를 목표로 한다.

방향:

- 공개 웹사이트는 사무소의 첫인상과 신뢰 형성을 담당한다.
- 상담 신청은 웹사이트 안의 하나의 행동 지점으로 둔다.
- 처리 내역 조회는 고객용 진행상황 확인 입구로 둔다.
- 관리자 페이지는 공개 고객 메뉴와 분리하되, 운영자는 별도 보호된 경로로 접근한다.
- intake form은 웹사이트 그 자체가 아니라 상담 신청/접수 flow로 위치를 조정한다.

구상:

1. 3D 입구/게이트
   - 로고를 반영한 3D entrance 또는 hero entry를 만든다.
   - 로고 asset은 추후 제공 가능성을 열어 둔다.
   - 과도한 효과보다 신뢰감, 전문성, 행정 절차의 안정감을 우선한다.

2. 공개 메뉴 구조
   - 홈
   - 소개
   - 전문 분야
   - 질의 응답
   - 상담 신청
   - 처리 내역 조회

3. 하단 영역
   - SNS 로고를 포함한다.
   - 운영자가 실제 사용하는 SNS 링크를 연결한다.
   - SNS 링크는 추후 확정 전까지 placeholder 또는 비활성 상태로 둘 수 있다.

4. 고객/관리자 관계
   - 고객은 공개 웹사이트에서 상담 신청과 처리 내역 조회로 진입한다.
   - 관리자는 보호된 `/admin` 영역에서 문의, 사건, 자료, 기한, 장부를 관리한다.
   - 공개 웹사이트에는 admin link를 노출하지 않는 원칙을 유지한다.

5. 구현 원칙
   - public/admin separation을 유지한다.
   - 상담 신청 CTA는 기존 intake tracking을 유지한다.
   - 처리 내역 조회는 기존 `/track` 흐름과 연결한다.
   - 공개 문구는 결과 보장, 즉시 수임, 100% 허가 같은 위험 표현을 사용하지 않는다.
   - 3D/visual polish는 기능 안정화 이후 단계적으로 반영한다.

이 아이디어는 CaseMatter 운영 기능이 안정된 뒤 public website polish phase에서 구체화한다.

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

현재 부족한 영역:

- CaseMatter 상세 화면이 아직 실무 사건 카드로 부족
- 업무처리부/수임관리대장 자동 생성 부족
- 실제 파일 업로드/증빙관리 부족
- 제출이력/보완요청 등록 화면 부족
- 수임료/입금관리 부족
- 문서 템플릿 자동작성 부족
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
- 업무처리부/수임대장: 20~30%
- 문서 자동작성: 25~35%
- 파일/증빙관리: 10~20%
- 수임료/입금관리: 10~20%
- 보안/권한/감사: 35~45%

전체 이상향 대비 현재 위치:

- 이상향 대비: 45~55%
- 실제 업무 보조용: 65~70%
- 메인 업무관리툴로 사용하기에는: 50~55%

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

사건 데이터 기반으로 장부 row를 자동 생성한다.

범위:

- 사건별 ledger row
- 접수일자
- 의뢰인명
- 업무유형
- 업무내용
- 처리상태
- 제출기관
- 종결일자
- 비고
- CSV/Excel export

추후 확장:

- 수임료
- 입금 상태
- 세금계산서/현금영수증 메모

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

### Phase 5. 문서 자동작성

목표:

반복 문서를 template 기반으로 생성한다.

우선순위:

1. 위임장
2. 개인정보동의서
3. 사실확인서
4. 진술서
5. 내용증명
6. 정보공개청구서

원칙:

- admin-only preview 먼저
- 승인 전 고객 발송 금지
- DOCX/PDF 먼저
- HWP는 장기 과제

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

## 8. What Not To Do Yet

아래 기능은 충분한 설계 전까지 서두르지 않는다.

- 고객 파일 업로드
- 실제 이메일/SMS/AlimTalk 발송
- HWP 자동 생성
- 결제 연동
- 외부 기관 자동 제출
- 민감정보 대량 저장
- 자동 법률 판단/자동 수임 결정
- AI 단독 고객 안내

## 9. Near-term Priority

현재 가장 중요한 다음 작업은:

`/admin/cases/[id]`를 실무 사건 카드로 확장하는 것이다.

그 다음 순서:

1. CaseMatter 사건 카드 MVP
2. 업무처리부/수임관리대장 기본 row
3. 기한관리/오늘 할 일
4. 자료요청/제출/보완 관리
5. 문서 자동작성
6. 파일 보안/업로드
7. 권한/감사/파기 고도화

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
