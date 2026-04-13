import {
  PrismaClient,
  type PricingOptionType,
  type PricingRuleType
} from "../generated/prisma-v4";
import legacyPricing from "./data/legacy-pricing.json";

const prisma = new PrismaClient();

async function seedLegacyPricing() {
  await prisma.legacyImportLog.create({
    data: {
      source: legacyPricing.source,
      version: legacyPricing.version,
      payloadJson: JSON.stringify(legacyPricing),
      createdCount: legacyPricing.serviceTypes.length + legacyPricing.pricingOptions.length + legacyPricing.pricingRules.length
    }
  });

  for (const serviceType of legacyPricing.serviceTypes) {
    await prisma.serviceType.create({
      data: serviceType
    });
  }

  for (const option of legacyPricing.pricingOptions) {
    await prisma.pricingOption.create({
      data: {
        ...option,
        optionType: option.optionType as PricingOptionType
      }
    });
  }

  for (const rule of legacyPricing.pricingRules) {
    await prisma.pricingRule.create({
      data: {
        ...rule,
        ruleType: rule.ruleType as PricingRuleType
      }
    });
  }
}

async function seedInquiries() {
  await prisma.inquiry.createMany({
    data: [
      {
        contactName: "김민지",
        email: "minji@example.com",
        phone: "010-1234-5678",
        preferredLanguage: "KO",
        clientType: "INDIVIDUAL",
        title: "D-10에서 E-7 변경 가능 여부 문의",
        description:
          "현재 D-10 체류 중이며 국내 IT 회사 취업 예정입니다. 2주 안에 체류자격 변경이 가능한지, 회사가 준비해야 할 서류가 무엇인지 알고 싶습니다.",
        requestedOutcome: "2주 내 체류자격 변경 접수 가능 여부 확정",
        requestedInquiryType: "FOREIGNER_VISA",
        declaredUrgency: "HIGH",
        nationality: "인도",
        currentStatus: "D-10 체류 중",
        hasPreparedDocuments: true,
        needsTranslation: false,
        isCorporateRequest: false,
        dueDate: new Date("2026-04-25T09:00:00.000Z"),
        wantsCallback: true,
        consentToPrivacy: true,
        status: "CONSULTATION_REQUIRED",
        inquiryType: "FOREIGNER_VISA",
        urgencyLevel: "HIGH",
        consultationRequired: true,
        classificationConfidence: 0.92,
        qualificationScore: 88,
        generatedSummary:
          "취업 예정 외국인 고객의 체류자격 변경 건입니다. 2주 이내 일정이 있어 우선 검토가 필요합니다.",
        generatedGuidance:
          "1. 여권 사본\n2. 외국인등록증 사본\n3. 고용계약서 초안\n4. 회사 사업자등록증 및 법인등기부등본\n5. 학력 또는 경력 입증자료",
        generatedReceiptMessage:
          "접수가 완료되었습니다. 체류자격 변경 가능성과 회사 준비서류를 검토한 뒤 빠르게 회신드리겠습니다.",
        classificationReason:
          "D-10, E-7, 취업 예정, 회사 서류 등의 키워드가 확인되어 외국인 비자 유형으로 분류했습니다.",
        recommendedNextStep: "회사 기본서류 보유 여부 확인 후 상담 일정 제안",
        riskComplexityHint: "체류자격 변경 건 / 마감 2주 / 회사 서류 동시 점검 필요",
        precheckRecommendedDocs: JSON.stringify([
          "여권 사본",
          "외국인등록증 사본",
          "고용계약서 초안",
          "회사 사업자등록증",
          "학력 또는 경력 입증자료"
        ]),
        serviceTags: JSON.stringify(["visa-change", "employment", "e7"]),
        assignee: "김행정사",
        internalMemo: "고용계약서 초안과 회사 기본서류 보유 여부 먼저 확인. 1차 상담 우선 배정."
      },
      {
        contactName: "James Patel",
        email: "jpatel@globaldocs.io",
        phone: "+82-10-8888-7777",
        preferredLanguage: "EN",
        clientType: "COMPANY",
        organizationName: "Global Docs Korea",
        title: "Apostille and certified translation for corporate registration documents",
        description:
          "We need apostille support and Korean certified translations for US corporate documents to submit in Korea. Please confirm timeline and whether notarization is also required.",
        requestedOutcome: "Bundle quote with apostille + translation workflow",
        requestedInquiryType: "CORPORATE_REQUEST",
        declaredUrgency: "MEDIUM",
        documentCountry: "United States",
        targetAgency: "Korean court and bank",
        hasPreparedDocuments: false,
        needsTranslation: true,
        isCorporateRequest: true,
        dueDate: new Date("2026-04-30T09:00:00.000Z"),
        wantsCallback: false,
        consentToPrivacy: true,
        status: "PRE_DIAGNOSED",
        inquiryType: "CORPORATE_REQUEST",
        urgencyLevel: "MEDIUM",
        consultationRequired: true,
        classificationConfidence: 0.87,
        qualificationScore: 90,
        generatedSummary:
          "Corporate document localization request involving apostille, translation, and potential notarization.",
        generatedGuidance:
          "1. Clear scans of original corporate documents\n2. Country of issuance and intended Korean use\n3. Required deadline\n4. Entity registration information\n5. Existing notarization status",
        generatedReceiptMessage:
          "Your inquiry has been received. We will review the apostille and translation path and respond with the most practical sequence.",
        classificationReason:
          "Corporate client with apostille, translation, and Korean submission context indicates a corporate international document project.",
        recommendedNextStep: "Check document list and advise bundled timeline",
        riskComplexityHint: "기업 건 / 번역 포함 / 국가별 절차 확인 필요",
        precheckRecommendedDocs: JSON.stringify([
          "법인 문서 원본/스캔본",
          "문서별 발행국 및 제출처",
          "번역 대상 언어 방향",
          "공증 완료 여부",
          "희망 일정"
        ]),
        serviceTags: JSON.stringify(["apostille", "translation", "corporate"]),
        assignee: "운영담당",
        internalMemo: "미국 법인서류 목록을 먼저 받아 번역/아포스티유 패키지 견적 가능성 검토."
      },
      {
        contactName: "라일라 하산",
        email: "laila.hassan@example.com",
        phone: "010-2222-3333",
        preferredLanguage: "EN",
        clientType: "INDIVIDUAL",
        title: "Urgent extension of stay before expiration this week",
        description:
          "My stay expires this week and I need to understand whether I can extend it without leaving Korea. I also need to know what documents should be prepared before the appointment.",
        requestedOutcome: "체류 연장 가능 여부와 즉시 제출 서류 확정",
        requestedInquiryType: "IMMIGRATION_STAY",
        declaredUrgency: "CRITICAL",
        nationality: "Egypt",
        currentStatus: "Current stay expires in 3 days",
        targetAgency: "Seoul Immigration Office",
        hasPreparedDocuments: false,
        needsTranslation: false,
        isCorporateRequest: false,
        dueDate: new Date("2026-04-15T09:00:00.000Z"),
        wantsCallback: true,
        consentToPrivacy: true,
        status: "CONSULTATION_REQUIRED",
        inquiryType: "IMMIGRATION_STAY",
        urgencyLevel: "CRITICAL",
        consultationRequired: true,
        classificationConfidence: 0.95,
        qualificationScore: 84,
        generatedSummary:
          "Urgent extension of stay inquiry with expiry in 3 days. Priority review recommended before consultation scheduling.",
        generatedGuidance:
          "1. Passport copy\n2. ARC copy\n3. Current stay expiry date\n4. Recent immigration history\n5. Documents supporting the extension reason",
        generatedReceiptMessage:
          "Your inquiry has been received. Because the current stay is close to expiry, the case will be reviewed with priority.",
        classificationReason:
          "Stay extension, expiry this week, and immigration office keywords indicate an immigration/stay matter with critical urgency.",
        recommendedNextStep: "Check expiry date and current visa details, then offer priority consultation.",
        riskComplexityHint: "만료 임박 고위험 / 서류 미보유 / 우선 상담 필요",
        precheckRecommendedDocs: JSON.stringify([
          "여권 사본",
          "외국인등록증 사본",
          "체류만료일 확인 자료",
          "연장 사유 입증자료",
          "최근 출입국 이력"
        ]),
        serviceTags: JSON.stringify(["stay-extension", "urgent", "immigration"]),
        assignee: "김행정사",
        internalMemo: "만료 임박 건. 서류 검토 전에 체류자격과 만료일을 정확히 확인해야 함."
      },
      {
        contactName: "주식회사 한빛메디컬",
        email: "ops@hanbitmedical.co.kr",
        phone: "02-555-1004",
        preferredLanguage: "KO",
        clientType: "COMPANY",
        organizationName: "주식회사 한빛메디컬",
        title: "해외 학위증명서 번역공증 및 아포스티유 일괄 문의",
        description:
          "외국인 인력 채용을 위해 해외 학위증명서 번역공증과 아포스티유 확인이 여러 건 필요합니다. 국가별로 절차가 달라지는지와 예상 일정, 일괄 견적 가능 여부를 알고 싶습니다.",
        requestedOutcome: "국가별 절차 분리 + 일괄 패키지 견적 확보",
        requestedInquiryType: "CORPORATE_REQUEST",
        declaredUrgency: "MEDIUM",
        documentCountry: "인도, 필리핀",
        targetAgency: "병원 인사팀 및 관계기관",
        hasPreparedDocuments: true,
        needsTranslation: true,
        isCorporateRequest: true,
        dueDate: new Date("2026-05-02T09:00:00.000Z"),
        wantsCallback: false,
        consentToPrivacy: true,
        status: "QUOTE_DRAFTED",
        inquiryType: "CORPORATE_REQUEST",
        urgencyLevel: "MEDIUM",
        consultationRequired: false,
        classificationConfidence: 0.89,
        qualificationScore: 93,
        generatedSummary:
          "복수 국가 문서에 대한 번역공증 및 아포스티유 일괄 의뢰 가능성 문의입니다. 기업 패키지 견적 검토 가치가 높습니다.",
        generatedGuidance:
          "1. 문서별 발행국 목록\n2. 원본 또는 사본 보유 여부\n3. 제출처 정보\n4. 국가별 필요 일정\n5. 예상 건수",
        generatedReceiptMessage:
          "접수가 완료되었습니다. 문서 국가와 범위를 검토한 뒤 일괄 진행 가능 여부 및 다음 절차를 안내드리겠습니다.",
        classificationReason:
          "기업 의뢰, 복수 국가 문서, 번역공증, 아포스티유 키워드가 함께 확인되어 기업 국제문서 프로젝트로 분류했습니다.",
        recommendedNextStep: "문서 리스트와 건수 확보 후 기업 패키지 견적 초안 검토",
        riskComplexityHint: "복수 국가 / 번역 포함 / 일괄 견적 조정 필요",
        precheckRecommendedDocs: JSON.stringify([
          "문서별 발행국 목록",
          "원본 또는 사본 보유 여부",
          "번역 대상 페이지 수",
          "제출처 및 필요 인증 형태",
          "예상 처리 일정"
        ]),
        serviceTags: JSON.stringify(["corporate", "batch-request", "apostille", "translation"]),
        assignee: "운영담당",
        internalMemo: "건수에 따라 단가표 적용 가능. 국가별 절차 차이 정리한 안내서 함께 발송 검토."
      }
    ]
  });
}

async function main() {
  await prisma.contractDraft.deleteMany();
  await prisma.paymentPlan.deleteMany();
  await prisma.quoteAdjustment.deleteMany();
  await prisma.quoteLineItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.legacyImportLog.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.pricingOption.deleteMany();
  await prisma.serviceType.deleteMany();
  await prisma.inquiry.deleteMany();

  await seedLegacyPricing();
  await seedInquiries();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
