/**
 * 홈페이지 마케팅 문구 — admin(/admin/i18n)에서 편집 가능한 네임스페이스.
 *
 * 키 이름은 i18n-public.ts 의 HOME_COPY 와 일치시켜, 홈 페이지가
 * override[key] ?? HOME_COPY[lang][key] 로 읽는다(override 없으면 기본값).
 *
 * ⚠️ override 시스템은 문자열만 지원한다. 배열/객체(benefits·whyCards·
 *    PHILOSOPHY·PROCESS_STEPS·PRACTICE_AREAS 등)는 한 개의 여러 줄 문자열로
 *    직렬화해 편집한다(키 접미사 *List). 직렬화 규칙:
 *      - 한 줄 = 한 항목
 *      - 객체 필드 구분 = " :: "(공백-콜론콜론-공백)
 *      - 항목 안 하위목록(bullets) 구분 = "|"
 *    페이지(page.tsx)는 src/lib/services/home-copy-parsers.ts 의 파서로 역직렬화하며,
 *    값이 비었거나 형식이 어긋나면 하드코딩 기본값으로 회귀한다(홈 안 깨짐).
 *    아래 *List 기본값은 현재 하드코딩 배열을 그대로 직렬화한 것 → 편집기에 현재
 *    내용이 노출되고, 그대로 저장하면 파서를 통해 동일 배열로 라운드트립된다.
 */

export const HOME_MESSAGES: Record<"ko" | "en" | "zh", Record<string, string>> = {
  ko: {
    heroEyebrow: "행정사 사무소 · 비자 · 행정심판 · 인허가",
    ctaFreeReview: "무료 검토 신청",
    ctaQuickCheck30: "30초 AI 사전 진단",
    socialEcho: "접수 후 영업일 24시간 내 담당 행정사가 직접 회신드립니다.",
    practiceTitle: "다섯 가지 주력 분야",
    practiceSubtitle: "각 분야별 전문 워크플로우로 처음부터 끝까지 안내합니다.",
    whyTitle: "왜 ETHOS인가",
    whySubtitle: "변호사, 셀프, 행정사 — 사안별로 적합한 경로가 다릅니다.",
    processTitle: "다섯 단계 진행 절차",
    processSubtitle: "고객이 준비할 일과 사무소가 확인할 일을 단계별로 안내합니다.",
    faqTitle: "자주 묻는 질문",
    faqMore: "더 궁금한 점이 있으신가요?",
    finalCtaTitle: "지금 필요한 업무를 접수하고 다음 단계를 확인하세요",
    finalCtaDescription: "비자·행정심판·계약서·인허가 — 어떤 사안이든 사실관계 확인부터 신중하게 시작합니다.",
    safetyNote: "※ 사안별 검토가 필요하며, 기관 제출 방식은 공식 기준 확인 후 안내드립니다.",
    deadlineCta: "무료로 남은 기한 확인",
    noticeLabel: "공지",
    cardAuthority: "주한 대사관 비자 실무 3년\n법무부 번역인 · 법원 통번역인",
    practiceDetail: "자세히 보기",
    practiceConsult: "이 분야 상담",
    leadTitle: "행정사 지상진",
    leadDesc: "비자·출입국, 행정심판, 계약서·사실조사, 인허가 업무를 직접 담당합니다. 외국인 의뢰인도 모국어로 안심하고 상담할 수 있습니다.",
    profileCta: "프로필 자세히 보기 →",
    brandPara1: "행정 문제는 단순한 서류 작성이 아닙니다. 그 안에는 누군가의 생계, 체류, 권리, 가족, 사업, 그리고 앞으로의 삶이 함께 담겨 있습니다.",
    brandPara2Pre: "에토스 행정사사무소는 아리스토텔레스가 말한 설득의 세 요소, ",
    brandPara2Post: " 를 바탕으로 사안에 맞는 방향을 함께 찾아갑니다.",
    brandQuote: "절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를.",
    pricingTitle: "비용이 궁금하세요?",
    pricingDesc: "사안·난이도별 예상 수임료를 30초 만에 확인해 보세요.",
    pricingCta: "예상 수임료 30초 계산 →",
    officeTitle: "사무소 운영 원칙",
    ctaTrack: "포털 · 진행조회",
    // ── 배열 편집 키(*List) — 아래는 현재 하드코딩 기본값의 직렬화본 ──
    benefitsList: "주한 대사관 실무 3년\n영업일 24시간 내 회신 안내\n한국어 · 영어 상담",
    leadBulletsList:
      "주한 대사관 비자·출입국 실무 3년\n법무부 난민 판결문 공식 번역인\n법원행정처 법정 통번역인 등록\n한국어 · 영어 상담 가능",
    whyCardsList:
      "행정 절차 근거 명확 :: 행정사법 제2조 업무 범위 내에서 사안별로 견적하고 착수 전 서면으로 확인합니다.\n대사관 실무 3년 :: 주한 대사관 비자·출입국 실무 경험을 바탕으로 서식·기한·근거를 짚어드립니다.\n끝까지 한 창구 :: 검토 → 서면 → 제출 → 결과까지 담당 행정사가 직접 관리합니다.\n다국어 대응 :: 한국어 · 영어로 외국인 의뢰인도 편하게 상담할 수 있습니다.",
    philosophyList:
      "이성 :: 이성, 질서, 절차. 행정 문제를 정확하고 논리적으로 풀어가는 태도를 담았습니다. :: → 기한·서식·근거를 정확히 짚어 흔들리지 않는 서면을 만듭니다.\n신뢰 :: 신뢰, 품격, 책임. 의뢰인에게 믿을 수 있는 기준과 방향을 제시하는 마음을 담았습니다. :: → 결과를 부풀리지 않고, 가능성과 한계를 솔직하게 안내합니다.\n공감 :: 공감, 이해, 위로. 행정의 문제 뒤에 있는 사람의 사정과 마음을 함께 헤아립니다. :: → 처음 겪는 절차도 이해하기 쉽게, 끝까지 곁에서 안내합니다.",
    processList:
      "01 :: 접수 :: 업무 분야, 연락처, 기본 사실관계를 남깁니다.\n02 :: 사실관계 확인 :: 처분서, 통지일, 체류자격, 제출기관을 확인합니다.\n03 :: 자료 요청 :: 필요 자료와 보완 항목을 안내합니다.\n04 :: 기한·서식 검토 :: 공식 서식·제출기관 기준·기한을 확인합니다.\n05 :: 제출 준비 :: 관리자 검토 후 제출 준비와 보완 대응을 정리합니다.",
    practiceList:
      "비자 / 외국인 체류 :: VISA & IMMIGRATION :: 체류기간 연장, 자격 변경, 초청, 영주·국적, 강제퇴거 대응까지 한 흐름으로 정리합니다. :: 체류 자격 변경 / 연장|사업·투자 비자|강제퇴거 / 출국명령 대응\n행정심판 :: ADMINISTRATIVE APPEAL :: 처분 내용·통지일·청구기한을 확인하고 청구이유·증거자료를 정리해 심판을 준비합니다. :: 청구기한 검토 (90일)|처분청·재결청 분리 관리|재결까지 단계별 추적\n계약서 / 사실조사 :: CONTRACT & INVESTIGATION :: 계약 검토·작성, 분쟁 사실관계 조사, 법적 근거 정리, 조사보고서 작성을 지원합니다. :: 계약서 작성 / 검토|분쟁 사실관계 조사|조사보고서 작성\n인허가 :: LICENSE & PERMIT :: 사업·건축·식품·의료·환경 등 인허가 신청, 보완 대응, 불복 절차를 함께 준비합니다. :: 사업·건축·식품 허가|처리기한 / 보완 관리|불허 시 불복 절차\n법인 설립 :: CORPORATE FORMATION :: 법인 형태 결정, 정관·설립 등기 준비부터 설립 후 필요한 인허가 연계까지 함께합니다. :: 법인 유형 / 자본금 설계|정관 · 설립 등기 준비|설립 후 인허가 연계"
  },
  en: {
    heroEyebrow: "Administrative Attorney · Visa · Appeal · Permits",
    ctaFreeReview: "Free Review",
    ctaQuickCheck30: "30-sec AI Pre-Check",
    socialEcho: "A dedicated attorney replies within 24 business hours of intake.",
    practiceTitle: "Five Core Areas",
    practiceSubtitle: "A dedicated workflow for each area, organized step by step.",
    whyTitle: "Why ETHOS",
    whySubtitle: "Lawyer, DIY, or administrative attorney — the right path depends on the matter.",
    processTitle: "Five-Step Procedure",
    processSubtitle: "What you prepare and what we verify, clearly separated step by step.",
    faqTitle: "Frequently Asked Questions",
    faqMore: "Have more questions?",
    finalCtaTitle: "Start your matter and confirm your next step.",
    finalCtaDescription: "Visa · Admin Appeal · Contract · License — whatever the matter, we start by verifying the facts.",
    safetyNote: "* Each matter is reviewed individually; submission methods follow official agency rules.",
    deadlineCta: "Check your remaining deadline (free)",
    noticeLabel: "Notice",
    cardAuthority: "3 yrs embassy visa practice\nMOJ translator · Court interpreter",
    practiceDetail: "Learn more",
    practiceConsult: "Consult this area",
    leadTitle: "Attorney Ji Sang-jin",
    leadDesc: "Handles visa & immigration, administrative appeals, contracts & fact-finding, and permits directly. Foreign clients can consult with confidence.",
    profileCta: "View full profile →",
    brandPara1: "An administrative matter is not just paperwork. Within it are someone's livelihood, residency, rights, family, business, and the life ahead.",
    brandPara2Pre: "ETHOS builds on Aristotle's three elements of persuasion, ",
    brandPara2Post: ", to find the right direction for each matter.",
    brandQuote: "Reason in process, empathy for people, trust in every step.",
    pricingTitle: "Curious about fees?",
    pricingDesc: "Check an estimated fee by matter and difficulty in 30 seconds.",
    pricingCta: "Estimate fees in 30s →",
    officeTitle: "Office Principles",
    ctaTrack: "Portal / Track",
    // ── Array editing keys (*List) — serialized from current hardcoded defaults ──
    benefitsList: "3 yrs embassy practice\nReply within 24 business hours\nKorean · English consultation",
    leadBulletsList:
      "3 yrs embassy visa & immigration practice\nMOJ official translator for refugee rulings\nRegistered court interpreter/translator\nKorean · English consultation",
    whyCardsList:
      "Clear legal basis :: We quote within the scope of the Administrative Attorney Act Art. 2 and confirm in writing before starting.\n3 yrs embassy practice :: Grounded in embassy visa & immigration practice, we pinpoint forms, deadlines, and grounds.\nOne point of contact :: From review to filing to result, your dedicated attorney handles it directly.\nMultilingual :: Korean · English, so foreign clients can consult comfortably.",
    philosophyList:
      "Reason :: Reason, order, procedure — resolving administrative matters precisely and logically. :: → Pinpointing deadlines, forms, and grounds to build filings that hold.\nTrust :: Trust, dignity, responsibility — offering clients a reliable standard and direction. :: → We never overstate outcomes; we're honest about possibilities and limits.\nEmpathy :: Empathy, understanding, comfort — considering the person behind the administrative matter. :: → We guide even first-time procedures clearly, by your side to the end.",
    processList:
      "01 :: Intake :: Leave your practice area, contact, and basic facts.\n02 :: Fact Check :: We verify the disposition, notice date, status, and agency.\n03 :: Document Request :: We guide the documents and supplements needed.\n04 :: Deadline & Form Review :: We confirm official forms, agency rules, and deadlines.\n05 :: Submission Prep :: After review, we organize submission and supplementary responses.",
    practiceList:
      "Visa / Immigration :: VISA & IMMIGRATION :: Extensions, status changes, invitations, permanent residency & nationality, and removal defense — organized in one flow. :: Status change / extension|Business & investment visa|Removal / departure order defense\nAdministrative Appeal :: ADMINISTRATIVE APPEAL :: We verify the disposition, notice date, and filing deadline, then organize grounds and evidence to prepare the appeal. :: Filing deadline review (90 days)|Disposition vs. adjudication agency|Step-by-step tracking to decision\nContract / Investigation :: CONTRACT & INVESTIGATION :: Contract drafting & review, fact-finding in disputes, legal-basis organization, and investigation reports. :: Contract drafting / review|Dispute fact-finding|Investigation reports\nLicenses & Permits :: LICENSE & PERMIT :: Business, construction, food, medical, and environmental permits — applications, supplementary responses, and appeals. :: Business / construction / food permits|Deadline & supplement management|Appeal on denial\nCompany Formation :: CORPORATE FORMATION :: From entity type and articles of incorporation to registration, and linking the permits you need afterward. :: Entity type / capital design|Articles & registration prep|Post-formation permits"
  },
  zh: {}
};
