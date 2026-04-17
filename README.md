# Administrative Office Intake MVP v2

행정사 사무소의 실제 운영 흐름에 맞춰 만든 상담 접수/분류/관리 웹앱입니다.  
외국인 비자, 출입국/체류, 아포스티유/영사확인, 번역/공증, 일반 행정민원, 기업 의뢰를 접수하고 관리자 화면에서 검색, 필터, 메모, 담당자 지정, 메시지 미리보기까지 처리할 수 있습니다.

운영 환경 메모는 [OPERATIONS.md](./OPERATIONS.md)에서 확인할 수 있습니다.

- 실개발 기준 경로: `C:\codex-buildcheck\admin-office-mvp`
- 운영 기준 빌드 명령: `npm run build`
- production 출력 경로는 `.next-prod`를 사용합니다.

## 1. 주요 업그레이드

- 디자인 시스템 정리
- 관리자 대시보드 실무형 재구성
- 검색 / 필터 / 정렬 / 반응형 카드 + 테이블 뷰
- 상태 / 담당자 / 내부 메모 관리
- 문의 유형별 자동 안내 메시지 템플릿 서비스
- 한국어 / 영어 메시지 지원, 아랍어 placeholder 구조
- Prisma Client를 `generated/prisma-v4`로 분리해 Windows 환경 호환성 개선

## 2. 폴더 구조

```text
admin-office-mvp/
├─ DESIGN_GUIDE.md
├─ generated/
│  └─ prisma-v4/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ scripts/
│  └─ bootstrap-sqlite.mjs
├─ src/
│  ├─ app/
│  │  ├─ admin/
│  │  │  └─ inquiries/
│  │  ├─ api/
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  ├─ admin/
│  │  ├─ intake/
│  │  └─ ui/
│  ├─ lib/
│  │  ├─ classification/
│  │  ├─ design-system/
│  │  ├─ message-templates/
│  │  ├─ prisma/
│  │  ├─ services/
│  │  ├─ validation/
│  │  └─ utils.ts
│  └─ types/
├─ package.json
└─ README.md
```

## 3. 실행 방법

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

브라우저 경로:

- 사용자 접수: `http://localhost:3000`
- 관리자 대시보드: `http://localhost:3000/admin/inquiries`

## 4. 환경 변수

Windows + OneDrive + 한글 경로 환경에서는 SQLite 파일을 ASCII 경로에 두는 편이 안전합니다.

예시:

```env
DATABASE_URL="file:C:/Users/your-user/AppData/Local/admin-office-mvp/dev.db"
```

`npm run db:setup`은 다음 순서로 실행됩니다.

1. `npm run db:init`
2. `npm run db:seed`

참고:

- 일부 Windows 환경에서 `prisma db push`가 실패할 수 있어, `scripts/bootstrap-sqlite.mjs`를 함께 제공합니다.
- Prisma Client는 `generated/prisma-v4`로 생성되며, 런타임은 이 generated client를 사용합니다.
- `.next-prod`를 사용해 Windows + OneDrive 환경의 빌드 산출물 잠금 충돌을 줄입니다.

## 5. 주요 화면

### 사용자 접수 화면

- 상담 접수 폼
- 한국어 / 영어 응대 언어 선택
- 자동 분류 결과, 긴급도, 준비 권장 서류, 접수 메시지 즉시 표시

### 관리자 대시보드

- 문의 목록
- 검색
- 필터: 문의 유형 / 상태 / 긴급도 / 언어
- 정렬: 최신순 / 긴급도순
- 모바일 카드뷰 / 데스크톱 테이블 뷰

### 관리자 상세 화면

- 상태 변경
- 담당자 지정
- 내부 메모 저장
- 분류 근거 / 추천 다음 조치 확인
- 고객용 메시지 미리보기

## 6. 데이터 모델

`Inquiry` 모델 주요 필드:

- 기본 정보: 이름, 회사명, 이메일, 전화번호
- 업무 문맥: 국적, 현재 상태, 문서 발행 국가, 제출처, 마감일
- 자동 분류: 문의 유형, 긴급도, 분류 신뢰도, 수임 적합도, 태그
- 생성 결과: 자동 요약, 준비 권장 서류, 접수 완료 메시지
- 운영 정보: 상태, 담당자, 내부 메모, 생성일, 수정일

## 7. 핵심 아키텍처

### 분류 로직

`src/lib/classification/rule-based-classifier.ts`

- 키워드 기반 문의 유형 분류
- 마감일 + 긴급 키워드 기반 긴급도 판정
- 설명 밀도, 회사 여부, 마감일, 매칭 키워드를 이용한 수임 적합도 점수
- 추후 AI 분류기로 바꿀 수 있도록 `InquiryClassifier` 인터페이스 분리

### 메시지 템플릿

`src/lib/message-templates/`

- 문의 유형별 권장 서류
- 언어별 감사/분류/다음 단계/유의사항 문구
- 관리자 상세에서 미리보기 가능
- 이메일 / 문자 / 알림톡 연동을 고려한 service layer 구조

### 서비스 레이어

`src/lib/services/inquiry-service.ts`

- 접수 검증
- 자동 분류 실행
- 요약/안내문 생성
- DB 저장
- 고객 메시지 전송 훅 호출

`src/lib/services/client-message-service.ts`

- 현재는 no-op adapter
- 추후 이메일 / SMS / 알림톡 provider 연결 지점

## 8. 디자인 시스템

자세한 디자인 규칙은 [DESIGN_GUIDE.md](./DESIGN_GUIDE.md)에 정리되어 있습니다.

핵심 원칙:

- 신뢰형 서비스 톤
- 과한 장식 제거
- 정보 밀도와 가독성 균형
- semantic color / spacing / radius / button variant 재사용

## 9. 시드 데이터

운영 흐름 확인을 위해 아래 유형이 포함된 seed 데이터가 들어갑니다.

- 외국인 비자
- 출입국/체류 긴급 건
- 기업 국제문서 일괄 의뢰
- 영문 기업 문의

## 10. 다음 단계 제안

- 파일 업로드: 여권, 외국인등록증, 원문 PDF
- 견적서 / 위임계약서 / 결제 링크 자동화
- Notion / Google Sheets / 이메일 / 알림톡 실제 연동
- 상담 예약 일정 연동
- PostgreSQL 전환
- 사용자 인증 및 고객 진행상태 조회

## Marketing Sync (Auto-Sns integration)
- Ingest endpoint: `POST /api/admin/marketing/ingest`
- Read endpoint: `GET /api/admin/marketing/overview`

Required env (production):
- `ADMIN_MARKETING_SYNC_TOKEN`: shared secret for webhook auth (`x-admin-sync-token` header)
- Optional `AUTOPOST_MARKETING_PAYLOAD_PATH`: local snapshot path override

Default snapshot path:
- `./data/marketing-sync-latest.json`
