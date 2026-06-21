# Seed Data Guide — 런칭 전 채워야 할 데이터

런칭 전 반드시 실제 콘텐츠로 채워야 하는 테이블 목록입니다.
각 섹션의 샘플은 그대로 복사해서 시작점으로 쓸 수 있도록 작성되었습니다.

---

## 1. SiteSetting — 사이트 기본 정보

**관리자 URL:** `/admin/settings`

**필수 필드:**
- `sitePhone` — 대표 전화번호
- `kakaoUrl` — 카카오톡 상담 링크
- `aboutCopy` — 사무소 소개 문구 (메인 페이지 노출)
- `contactEmail` — 대표 이메일
- `address` — 사무소 주소
- `businessHours` — 운영 시간

**샘플 데이터:**

```
sitePhone:    02-1234-5678
kakaoUrl:     https://pf.kakao.com/_ethos
aboutCopy:    ETHOS 행정사사무소는 외국인 체류·인허가 분야에서 15년 경력을 쌓아온 전문 사무소입니다. 복잡한 절차를 명확하게, 의뢰인의 시간을 가치 있게 만듭니다.
contactEmail: contact@ethos-admin.kr
address:      서울시 강남구 테헤란로 123, 4층
businessHours: 평일 09:00 - 18:00 (점심 12:00 - 13:00)
```

---

## 2. Credential — 자격/경력/수상

**관리자 URL:** `/admin/credentials`

**필수 필드:**
- `type` — `career` | `license` | `award`
- `title` — 항목명
- `issuer` — 발행 기관
- `year` — 연도
- `order` — 노출 순서

**샘플 데이터:**

```
1) type: license,  title: 행정사 자격증 (제2010-1234호), issuer: 행정안전부, year: 2010
2) type: career,   title: 출입국·외국인청 민원담당 5년,      issuer: 서울출입국외국인청, year: 2008
3) type: award,    title: 우수 행정사 표창,                  issuer: 대한행정사회, year: 2022
```

---

## 3. FeeItem — 서비스 항목 및 가격

**관리자 URL:** `/admin/fees`

**필수 필드:**
- `category` — 카테고리 (체류/귀화/사업자등)
- `name` — 서비스명
- `priceFrom` — 최소 금액 (원)
- `priceTo` — 최대 금액 (원, 선택)
- `description` — 간단 설명
- `order` — 노출 순서

**샘플 데이터:**

```
1) category: 체류,  name: E-7 비자 신청 대행,    priceFrom: 500000,  priceTo: 800000,
   description: 서류 준비부터 출입국 신청까지 일괄 대행 (사업자 등록증 보유 법인 기준)

2) category: 귀화,  name: 일반귀화 신청,          priceFrom: 1500000, priceTo: 2500000,
   description: 한국어 능력 시험 안내, 면접 모의, 서류 일체 준비

3) category: 사업자, name: 외국인 사업자 등록,    priceFrom: 300000,  priceTo: 500000,
   description: 사업장 임대차 검토, 세무서 신고, 통장 개설 안내 포함
```

---

## 4. Testimonial — 고객 후기

**관리자 URL:** `/admin/testimonials`

**필수 필드:**
- `clientName` — 고객명 (이니셜 권장)
- `clientNationality` — 국적
- `service` — 받은 서비스
- `content` — 후기 본문
- `rating` — 1~5
- `published` — true/false

**샘플 데이터:**

```
1) clientName: M. Nguyen, clientNationality: 베트남,  service: E-7 비자 변경,
   rating: 5, content: 서류 준비가 까다로워 포기 직전이었는데, ETHOS 덕분에 한 번에 통과했습니다. 매 단계마다 진행 상황을 한국어와 영어로 알려주셔서 안심이 됐어요.

2) clientName: 王 선생, clientNationality: 중국,    service: 영주권(F-5) 신청,
   rating: 5, content: 5년간 준비한 영주권을 무사히 받았습니다. 면접 예상 질문까지 함께 준비해주셔서 큰 도움이 됐습니다.

3) clientName: J. Smith, clientNationality: 미국,    service: 외국인 사업자 등록,
   rating: 4, content: Professional and responsive. Highly recommended for foreigners starting a business in Korea.
```

---

## 5. CaseStudy — 사례 연구

**관리자 URL:** `/admin/case-studies`

**필수 필드:**
- `title` — 사례 제목
- `category` — 분야
- `summary` — 한 줄 요약
- `challenge` — 문제 상황
- `solution` — 해결 과정
- `outcome` — 결과
- `published` — true/false

**샘플 데이터:**

```
1) title: 전과 기록이 있는 외국인의 체류 연장 성공 사례
   category: 체류
   summary: 경미한 전과로 거절 위기에 놓인 D-10 비자 연장을 사유서·소명자료로 통과
   challenge: 의뢰인은 5년 전 경미한 도로교통법 위반 전과가 있었고, 1차 심사에서 보완 요구를 받음
   solution: 전과 경위서, 회개 진술서, 안정 거주 증빙 자료를 종합한 사유서 작성
   outcome: 2주 내 추가 보완 없이 연장 승인

2) title: 다국적 가족의 동시 영주권 신청
   category: 영주권
   summary: 부모-자녀 3인의 F-5 동시 신청을 3개월 만에 완료
   challenge: 자녀의 출생증명서가 본국 시스템 변경으로 발급 지연
   solution: 본국 영사관과 직접 협의, 임시 증빙으로 선접수 후 보완 일정 사전 조율
   outcome: 가족 전원 동시 영주권 취득
```

---

## 6. BlogPost — 초기 블로그 포스트

**관리자 URL:** `/admin/blog`

**필수 필드:**
- `title` — 제목
- `slug` — URL 슬러그
- `excerpt` — 요약 (목록 노출용)
- `content` — 본문 (Markdown)
- `category` — 카테고리
- `tags` — 태그 (콤마구분)
- `published` — true/false
- `publishedAt` — 발행일

**샘플 데이터:**

```
1) title: 2026년 달라진 E-7 비자 심사 기준 정리
   slug: e7-visa-2026-changes
   category: 비자 정보
   tags: E-7, 취업비자, 2026
   excerpt: 2026년 1월부터 적용되는 E-7 비자 심사 기준 변경 사항을 항목별로 정리했습니다.
   content: ## 주요 변경 사항\n\n1. 학력 요건 완화...\n2. 연봉 기준 상향...\n3. 산업별 가점...

2) title: 외국인 사업자 등록, 이렇게 준비하면 1주일 안에 끝납니다
   slug: foreign-business-registration-guide
   category: 사업자
   tags: 사업자등록, 외국인투자, D-8
   excerpt: 임대차 계약부터 세무서 신고까지, 외국인 사업자 등록 전 과정을 체크리스트로 정리했습니다.
   content: ## 준비물 체크리스트\n\n- [ ] 사업장 임대차계약서...\n

3) title: F-5 영주권 신청 자격 자가 점검표
   slug: f5-permanent-residence-checklist
   category: 영주권
   tags: F-5, 영주권, 자가진단
   excerpt: F-5 영주권 신청 자격이 되는지 5분 만에 점검할 수 있는 체크리스트입니다.
   content: ## 기본 자격 요건\n\n1. 5년 이상 합법 체류...\n
```

---

## 작업 순서 권장

1. **SiteSetting** — 전화번호, 카카오 링크가 없으면 어떤 페이지도 정상 동작하지 않습니다. 최우선.
2. **FeeItem** — 가격표 페이지 노출용. 최소 5~10개.
3. **Credential** — About 페이지 신뢰도. 최소 3개.
4. **Testimonial** — 최소 3개 이상이어야 슬라이더가 자연스럽습니다.
5. **CaseStudy** — 최소 2개. SEO 강화 목적.
6. **BlogPost** — 최소 3개로 시작, 이후 주 1회 페이스.

각 테이블은 비어 있으면 해당 섹션이 자동으로 숨김 처리되거나 placeholder가 노출됩니다.
