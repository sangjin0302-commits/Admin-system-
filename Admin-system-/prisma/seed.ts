// @ts-nocheck
import {
  PrismaClient,
  type PricingOptionType,
  type PricingRuleType
} from "../generated/prisma-client/client";
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

function sumRange(items: Array<{ min: number; max: number }>) {
  return items.reduce(
    (acc, item) => ({ min: acc.min + item.min, max: acc.max + item.max }),
    { min: 0, max: 0 }
  );
}

async function seedQuoteFlow() {
  const [serviceTypes, pricingOptions] = await Promise.all([
    prisma.serviceType.findMany(),
    prisma.pricingOption.findMany()
  ]);

  const serviceByLegacy = new Map(serviceTypes.map((item) => [item.legacyId, item]));
  const optionByLegacy = new Map(pricingOptions.map((item) => [item.legacyId, item]));

  const visaInquiry = await prisma.inquiry.findFirst({
    where: { email: "minji@example.com" }
  });
  const corporateInquiry = await prisma.inquiry.findFirst({
    where: { email: "ops@hanbitmedical.co.kr" }
  });

  if (!visaInquiry || !corporateInquiry) return;

  const corpServices = ["npo_reg", "npo_minutes"]
    .map((legacyId) => serviceByLegacy.get(legacyId))
    .filter(Boolean);
  const corpBase = sumRange(
    corpServices.map((service) => ({ min: service!.minPrice, max: service!.maxPrice }))
  );
  const corpUrgency = {
    min: Math.round(corpBase.min * 0.3),
    max: Math.round(corpBase.max * 0.3)
  };
  const corpDocs = {
    min: Math.round((corpBase.min + corpUrgency.min) * 0.2),
    max: Math.round((corpBase.max + corpUrgency.max) * 0.2)
  };
  const corpSubtotal = {
    min: corpBase.min + corpUrgency.min + corpDocs.min,
    max: corpBase.max + corpUrgency.max + corpDocs.max
  };
  const corpVat = {
    min: Math.round(corpSubtotal.min * 0.1),
    max: Math.round(corpSubtotal.max * 0.1)
  };
  const corpTotal = {
    min: corpSubtotal.min + corpVat.min,
    max: corpSubtotal.max + corpVat.max
  };

  await prisma.quote.create({
    data: {
      inquiryId: corporateInquiry.id,
      status: "SENT",
      selectedServiceLegacyIds: JSON.stringify(corpServices.map((service) => service!.legacyId)),
      selectedOptionLegacyIds: JSON.stringify(["docs", "vat"]),
      urgencyRuleCode: "URGENCY_EXPRESS",
      consultRuleCode: "CONSULT_NONE",
      paymentRuleCode: "PAYMENT_STANDARD",
      rangeMode: true,
      serviceBaseMin: corpBase.min,
      serviceBaseMax: corpBase.max,
      subtotalMin: corpSubtotal.min,
      subtotalMax: corpSubtotal.max,
      vatAmountMin: corpVat.min,
      vatAmountMax: corpVat.max,
      totalMin: corpTotal.min,
      totalMax: corpTotal.max,
      consultFee: 0,
      successFeeRestricted: false,
      draftNotes: "기업 일괄 의뢰 기준 발송된 견적입니다.",
      calculationSummary: "기업 일괄 의뢰 / 빠른처리 / 서류 수집 대행 + VAT",
      lineItems: {
        create: [
          ...corpServices.map((service, index) => ({
            serviceTypeId: service!.id,
            kind: "SERVICE" as const,
            label: service!.name,
            description: `${service!.category} 기본 범위`,
            amountMin: service!.minPrice,
            amountMax: service!.maxPrice,
            sortOrder: index
          })),
          {
            kind: "URGENCY" as const,
            label: "빠른처리",
            description: "기본 수수료의 30% 가산",
            amountMin: corpUrgency.min,
            amountMax: corpUrgency.max,
            sortOrder: corpServices.length
          }
        ]
      },
      adjustments: {
        create: [
          {
            pricingOptionId: optionByLegacy.get("docs")?.id,
            label: "서류 수집 대행",
            description: "서류 취합",
            optionType: "PERCENT" as const,
            percentRate: 20,
            computedMin: corpDocs.min,
            computedMax: corpDocs.max,
            isVat: false,
            sortOrder: 0
          },
          {
            pricingOptionId: optionByLegacy.get("vat")?.id,
            label: "부가세 포함",
            description: "VAT 10%",
            optionType: "PERCENT" as const,
            percentRate: 10,
            computedMin: corpVat.min,
            computedMax: corpVat.max,
            isVat: true,
            sortOrder: 1
          }
        ]
      },
      paymentPlans: {
        create: [
          {
            stageKind: "RETAINER" as const,
            percentage: 50,
            dueText: "계약 체결 시",
            amountMin: Math.round(corpTotal.min * 0.5),
            amountMax: Math.round(corpTotal.max * 0.5),
            sortOrder: 0
          },
          {
            stageKind: "MIDTERM" as const,
            percentage: 50,
            dueText: "서류 접수 시",
            amountMin: Math.round(corpTotal.min * 0.5),
            amountMax: Math.round(corpTotal.max * 0.5),
            sortOrder: 1
          },
          {
            stageKind: "SUCCESS" as const,
            percentage: 0,
            dueText: "허가 완료 시",
            amountMin: 0,
            amountMax: 0,
            sortOrder: 2
          }
        ]
      }
    }
  });

  await prisma.inquiry.update({
    where: { id: corporateInquiry.id },
    data: { status: "QUOTE_SENT" }
  });

  const visaService = serviceByLegacy.get("stay_chg");
  const visaBase = {
    min: visaService?.minPrice ?? 200000,
    max: visaService?.maxPrice ?? 400000
  };
  const visaUrgency = {
    min: Math.round(visaBase.min * 0.5),
    max: Math.round(visaBase.max * 0.5)
  };
  const visaSubtotal = {
    min: visaBase.min + visaUrgency.min,
    max: visaBase.max + visaUrgency.max
  };
  const visaVat = {
    min: Math.round(visaSubtotal.min * 0.1),
    max: Math.round(visaSubtotal.max * 0.1)
  };
  const visaTotal = {
    min: visaSubtotal.min + visaVat.min,
    max: visaSubtotal.max + visaVat.max
  };

  const acceptedQuote = await prisma.quote.create({
    data: {
      inquiryId: visaInquiry.id,
      status: "ACCEPTED",
      selectedServiceLegacyIds: JSON.stringify(["stay_chg"]),
      selectedOptionLegacyIds: JSON.stringify(["vat"]),
      urgencyRuleCode: "URGENCY_SAME_DAY",
      consultRuleCode: "CONSULT_30M",
      paymentRuleCode: "PAYMENT_STANDARD",
      rangeMode: true,
      serviceBaseMin: visaBase.min,
      serviceBaseMax: visaBase.max,
      subtotalMin: visaSubtotal.min,
      subtotalMax: visaSubtotal.max,
      vatAmountMin: visaVat.min,
      vatAmountMax: visaVat.max,
      totalMin: visaTotal.min,
      totalMax: visaTotal.max,
      consultFee: 50000,
      successFeeRestricted: false,
      draftNotes: "고객 수락 완료. 계약 준비 및 사건 등록 진행.",
      calculationSummary: "자격변경 / 당일처리 / VAT 포함",
      lineItems: {
        create: [
          {
            serviceTypeId: visaService?.id,
            kind: "SERVICE" as const,
            label: visaService?.name ?? "자격변경",
            description: "출입국 기본 범위",
            amountMin: visaBase.min,
            amountMax: visaBase.max,
            sortOrder: 0
          },
          {
            kind: "URGENCY" as const,
            label: "당일처리",
            description: "기본 수수료의 50% 가산",
            amountMin: visaUrgency.min,
            amountMax: visaUrgency.max,
            sortOrder: 1
          }
        ]
      },
      adjustments: {
        create: [
          {
            pricingOptionId: optionByLegacy.get("vat")?.id,
            label: "부가세 포함",
            description: "VAT 10%",
            optionType: "PERCENT" as const,
            percentRate: 10,
            computedMin: visaVat.min,
            computedMax: visaVat.max,
            isVat: true,
            sortOrder: 0
          }
        ]
      },
      paymentPlans: {
        create: [
          {
            stageKind: "RETAINER" as const,
            percentage: 50,
            dueText: "계약 체결 시",
            amountMin: Math.round(visaTotal.min * 0.5),
            amountMax: Math.round(visaTotal.max * 0.5),
            sortOrder: 0
          },
          {
            stageKind: "MIDTERM" as const,
            percentage: 50,
            dueText: "서류 접수 시",
            amountMin: Math.round(visaTotal.min * 0.5),
            amountMax: Math.round(visaTotal.max * 0.5),
            sortOrder: 1
          },
          {
            stageKind: "SUCCESS" as const,
            percentage: 0,
            dueText: "허가 완료 시",
            amountMin: 0,
            amountMax: 0,
            sortOrder: 2
          }
        ]
      }
    }
  });

  const contractDraft = await prisma.contractDraft.create({
    data: {
      inquiryId: visaInquiry.id,
      quoteId: acceptedQuote.id,
      title: `${visaInquiry.contactName} 견적 기반 계약 초안`,
      bodyText:
        "의뢰인: 김민지\n업무: 체류자격 변경(E-7)\n보수: 범위 견적 기준\n세부 절차는 계약 단계에서 확정합니다.",
      scopeText: "1. 체류자격 변경 신청서 작성\n2. 회사 제출서류 정리\n3. 접수 동행/보완 대응",
      paymentSummary: "착수금 50% / 중도금 50% / 성공보수 0%",
      successFeeRestricted: false
    }
  });

  await prisma.caseRecord.create({
    data: {
      caseNumber: "CASE-20260413-001",
      inquiryId: visaInquiry.id,
      quoteId: acceptedQuote.id,
      contractDraftId: contractDraft.id,
      currentStage: "CONTRACT_PREPARATION" as const,
      dueDate: new Date("2026-04-25T09:00:00.000Z"),
      internalMemo: "수락 완료. 계약 특약 정리 후 착수금 안내 예정."
    }
  });

  await prisma.inquiry.update({
    where: { id: visaInquiry.id },
    data: { status: "WON" }
  });
}

async function seedCaseMatterFlow() {
  const [visaInquiry, corporateInquiry, urgentInquiry] = await Promise.all([
    prisma.inquiry.findFirst({ where: { email: "minji@example.com" } }),
    prisma.inquiry.findFirst({ where: { email: "ops@hanbitmedical.co.kr" } }),
    prisma.inquiry.findFirst({ where: { email: "laila.hassan@example.com" } })
  ]);

  if (!visaInquiry || !corporateInquiry || !urgentInquiry) {
    return;
  }

  const [visaCaseRecord, visaAcceptedQuote, visaContractDraft] = await Promise.all([
    prisma.caseRecord.findFirst({ where: { inquiryId: visaInquiry.id } }),
    prisma.quote.findFirst({ where: { inquiryId: visaInquiry.id, status: "ACCEPTED" } }),
    prisma.contractDraft.findFirst({ where: { inquiryId: visaInquiry.id } })
  ]);

  const visaMatter = await prisma.caseMatter.create({
    data: {
      caseNo: "MAT-20260419-001",
      title: "E-7 체류자격 변경 사건",
      matterType: "immigration_status_change",
      status: "DOCUMENT_COLLECTING",
      priority: "HIGH",
      riskLevel: "HIGH",
      inquiryId: visaInquiry.id,
      legacyCaseRecordId: visaCaseRecord?.id,
      openedAt: new Date("2026-04-14T09:00:00.000Z"),
      dueDate: new Date("2026-04-25T09:00:00.000Z"),
      nextActionAt: new Date("2026-04-20T10:00:00.000Z"),
      assignedTo: "김수정 행정사",
      summary: "D-10에서 E-7 변경 예정. 회사 제출 자료와 신청인 경력 입증이 핵심.",
      internalMemo: "기한 촉박 건. 준비서류 누락 시 즉시 보완 요청.",
      parties: {
        create: [
          {
            role: "CLIENT",
            name: visaInquiry.contactName,
            email: visaInquiry.email,
            phone: visaInquiry.phone,
            nationality: visaInquiry.nationality,
            memo: "주요 연락 채널: 전화 우선"
          },
          {
            role: "EMPLOYER",
            name: "채용 예정 회사 담당자",
            organization: "국내 IT 회사",
            memo: "고용계약서/사업자자료 제출 담당"
          }
        ]
      },
      requiredDocuments: {
        create: [
          {
            name: "여권 사본",
            required: true,
            status: "APPROVED",
            requestedAt: new Date("2026-04-14T12:00:00.000Z"),
            receivedAt: new Date("2026-04-15T09:00:00.000Z"),
            reviewedAt: new Date("2026-04-15T13:00:00.000Z")
          },
          {
            name: "외국인등록증 사본",
            required: true,
            status: "RECEIVED",
            requestedAt: new Date("2026-04-14T12:00:00.000Z"),
            receivedAt: new Date("2026-04-16T09:00:00.000Z")
          },
          {
            name: "고용계약서",
            required: true,
            status: "REQUESTED",
            dueDate: new Date("2026-04-21T09:00:00.000Z"),
            requestedAt: new Date("2026-04-16T16:00:00.000Z")
          }
        ]
      },
      tasks: {
        create: [
          {
            title: "회사 제출서류 수신 확인",
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueDate: new Date("2026-04-20T10:00:00.000Z"),
            assignedTo: "김수정 행정사"
          },
          {
            title: "체류기한 임박 여부 재확인",
            status: "TODO",
            priority: "URGENT",
            dueDate: new Date("2026-04-19T18:00:00.000Z"),
            assignedTo: "김수정 행정사"
          }
        ]
      },
      events: {
        create: [
          {
            eventType: "CASE_CREATED",
            actorName: "system",
            message: "문의에서 사건으로 전환됨",
            payloadJson: JSON.stringify({ inquiryId: visaInquiry.id })
          },
          {
            eventType: "DOC_REQUESTED",
            actorName: "김수정 행정사",
            message: "기본 제출서류 요청 발송",
            payloadJson: JSON.stringify({ channel: "phone", requestedCount: 3 })
          }
        ]
      }
    }
  });

  const passportDoc = await prisma.caseDocument.create({
    data: {
      caseId: visaMatter.id,
      title: "여권 사본",
      docType: "passport_copy",
      status: "APPROVED",
      originalFileName: "passport_copy.pdf",
      uploadedBy: "client",
      receivedAt: new Date("2026-04-15T09:00:00.000Z"),
      reviewedAt: new Date("2026-04-15T13:00:00.000Z")
    }
  });

  const passportVersion = await prisma.documentVersion.create({
    data: {
      documentId: passportDoc.id,
      versionNo: 1,
      status: "APPROVED_FOR_SUBMISSION",
      fileName: "passport_copy_v1.pdf",
      createdBy: "client",
      approvedBy: "김수정 행정사",
      approvedAt: new Date("2026-04-15T13:00:00.000Z")
    }
  });

  await prisma.caseDocument.update({
    where: { id: passportDoc.id },
    data: { currentVersionId: passportVersion.id }
  });

  const submissionPackage = await prisma.submissionPackage.create({
    data: {
      caseId: visaMatter.id,
      title: "1차 출입국 제출 패키지",
      status: "READY",
      targetAgency: "서울출입국·외국인청",
      targetOffice: "체류관리과",
      preparedAt: new Date("2026-04-17T11:00:00.000Z"),
      reviewedAt: new Date("2026-04-17T14:00:00.000Z"),
      items: {
        create: [
          {
            documentId: passportDoc.id,
            versionId: passportVersion.id,
            orderNo: 1
          }
        ]
      }
    }
  });

  const submission = await prisma.agencySubmission.create({
    data: {
      caseId: visaMatter.id,
      packageId: submissionPackage.id,
      agencyName: "서울출입국·외국인청",
      officeName: "체류관리과",
      method: "VISIT",
      status: "SUPPLEMENT_REQUESTED",
      submittedAt: new Date("2026-04-18T10:00:00.000Z"),
      receiptNo: "IMM-2026-0418-001"
    }
  });

  await prisma.supplementRequest.create({
    data: {
      caseId: visaMatter.id,
      submissionId: submission.id,
      title: "고용계약서 원본 보완 요청",
      description: "계약서 서명본과 회사 사업자 증빙 보완",
      status: "DOCS_REQUESTED",
      receivedAt: new Date("2026-04-18T17:00:00.000Z"),
      dueDate: new Date("2026-04-22T18:00:00.000Z"),
      requestedDocsJson: JSON.stringify(["고용계약서 서명본", "사업자등록증"])
    }
  });

  if (visaAcceptedQuote) {
    await prisma.quote.update({
      where: { id: visaAcceptedQuote.id },
      data: { caseMatterId: visaMatter.id }
    });
  }

  if (visaContractDraft) {
    await prisma.contractDraft.update({
      where: { id: visaContractDraft.id },
      data: { caseMatterId: visaMatter.id }
    });
  }

  await prisma.caseMatter.create({
    data: {
      caseNo: "MAT-20260419-002",
      title: "기업 국제문서 패키지 사건",
      matterType: "corporate_apostille_translation",
      status: "DOCUMENT_REVIEWING",
      priority: "NORMAL",
      riskLevel: "NORMAL",
      inquiryId: corporateInquiry.id,
      openedAt: new Date("2026-04-12T09:00:00.000Z"),
      dueDate: new Date("2026-05-02T09:00:00.000Z"),
      nextActionAt: new Date("2026-04-21T10:00:00.000Z"),
      assignedTo: "운영 담당",
      summary: "미국 문서 아포스티유/번역공증 패키지 견적 후 문서 검토 단계",
      parties: {
        create: [
          {
            role: "CLIENT",
            name: corporateInquiry.organizationName ?? corporateInquiry.contactName,
            email: corporateInquiry.email,
            phone: corporateInquiry.phone,
            organization: corporateInquiry.organizationName
          }
        ]
      },
      tasks: {
        create: [
          {
            title: "국가별 요구 형식 체크리스트 검토",
            status: "TODO",
            priority: "NORMAL",
            dueDate: new Date("2026-04-21T10:00:00.000Z"),
            assignedTo: "운영 담당"
          }
        ]
      },
      events: {
        create: [
          {
            eventType: "CASE_CREATED",
            actorName: "system",
            message: "기업 문의 기반 사건 생성",
            payloadJson: JSON.stringify({ inquiryId: corporateInquiry.id })
          }
        ]
      }
    }
  });

  await prisma.caseMatter.create({
    data: {
      caseNo: "MAT-20260419-003",
      title: "체류기간 만료 임박 사전검토",
      matterType: "immigration_extension",
      status: "INTAKE_REVIEW",
      priority: "URGENT",
      riskLevel: "CRITICAL",
      inquiryId: urgentInquiry.id,
      dueDate: urgentInquiry.dueDate,
      nextActionAt: new Date("2026-04-19T15:00:00.000Z"),
      assignedTo: "김수정 행정사",
      summary: "만료 3일 전 긴급 문의, 사건화 전 사실관계 확인 단계",
      parties: {
        create: [
          {
            role: "CLIENT",
            name: urgentInquiry.contactName,
            email: urgentInquiry.email,
            phone: urgentInquiry.phone,
            nationality: urgentInquiry.nationality
          }
        ]
      },
      events: {
        create: [
          {
            eventType: "INTAKE_ESCALATED",
            actorName: "system",
            message: "긴급 사건 후보로 분류",
            payloadJson: JSON.stringify({ urgency: "CRITICAL" })
          }
        ]
      }
    }
  });
}

async function main() {
  await prisma.caseEvent.deleteMany();
  await prisma.caseTask.deleteMany();
  await prisma.supplementRequest.deleteMany();
  await prisma.agencySubmission.deleteMany();
  await prisma.submissionPackageItem.deleteMany();
  await prisma.submissionPackage.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.caseDocument.deleteMany();
  await prisma.requiredDocument.deleteMany();
  await prisma.caseParty.deleteMany();
  await prisma.caseMatter.deleteMany();
  await prisma.caseRecord.deleteMany();
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
  await seedQuoteFlow();
  await seedCaseMatterFlow();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
