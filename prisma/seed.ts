import { promises as fs } from "node:fs";
import path from "node:path";

import {
  PrismaClient,
  type CaseStage,
  type PricingOptionType,
  type PricingRuleType
} from "../generated/prisma-v4";
import legacyPricing from "./data/legacy-pricing.json";

const prisma = new PrismaClient();
const uploadRoot = path.resolve(process.cwd(), process.env.DOCUMENT_UPLOAD_DIR?.trim() || "uploads");

async function writeSeedUploadFile(storagePath: string, content: string) {
  const absolutePath = path.resolve(uploadRoot, storagePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, "utf8");
}

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

function dateFromToday(days: number, hour = 9, minute = 0) {
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  target.setDate(target.getDate() + days);
  return target;
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
  const lailaInquiry = await prisma.inquiry.findFirst({
    where: { email: "laila.hassan@example.com" }
  });

  if (!visaInquiry || !corporateInquiry || !lailaInquiry) return;

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
      createdAt: dateFromToday(-6, 10),
      updatedAt: dateFromToday(-6, 10),
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

  const caseRecord = await prisma.caseRecord.create({
    data: {
      caseNumber: "CASE-20260413-001",
      inquiryId: visaInquiry.id,
      quoteId: acceptedQuote.id,
      contractDraftId: contractDraft.id,
      currentStage: "CONTRACT_PREPARATION" as const,
      dueDate: dateFromToday(1, 17),
      filingDeadline: dateFromToday(-1, 17),
      supplementDeadline: dateFromToday(0, 17),
      stayExpirationDate: dateFromToday(2, 12),
      internalDeadline: dateFromToday(-2, 18),
      internalMemo: "수락 완료. 계약 특약 정리 후 착수금 안내 예정."
    }
  });

  await prisma.caseDocumentItem.createMany({
    data: [
      {
        caseId: caseRecord.id,
        documentType: "passport_copy",
        label: "여권 사본",
        isRequired: true,
        isReceived: true,
        receivedAt: new Date("2026-04-13T11:00:00.000Z"),
        sortOrder: 0,
        note: "스캔본 수령"
      },
      {
        caseId: caseRecord.id,
        documentType: "arc_copy",
        label: "외국인등록증 사본",
        isRequired: true,
        isReceived: false,
        sortOrder: 1,
        note: "미제출"
      },
      {
        caseId: caseRecord.id,
        documentType: "application_form",
        label: "신청서 초안",
        isRequired: true,
        isReceived: false,
        sortOrder: 2,
        note: "작성 대기"
      }
    ]
  });

  const seededItems = await prisma.caseDocumentItem.findMany({
    where: { caseId: caseRecord.id }
  });
  const passportItem = seededItems.find((item) => item.documentType === "passport_copy");

  if (passportItem) {
    const version1Path = `cases/${caseRecord.id}/${passportItem.id}/sample-passport-v1.txt`;
    const version2Path = `cases/${caseRecord.id}/${passportItem.id}/sample-passport-v2.txt`;
    await writeSeedUploadFile(version1Path, "seed sample passport file v1");
    await writeSeedUploadFile(version2Path, "seed sample passport file v2");

    await prisma.caseDocumentFile.createMany({
      data: [
        {
          caseId: caseRecord.id,
          caseDocumentItemId: passportItem.id,
          originalFilename: "passport-copy-v1.txt",
          storedFilename: "sample-passport-v1.txt",
          storagePath: version1Path,
          mimeType: "text/plain",
          size: Buffer.byteLength("seed sample passport file v1"),
          note: "초기 수령본",
          isCurrentVersion: false,
          versionNumber: 1,
          uploadedAt: new Date("2026-04-13T11:00:00.000Z")
        },
        {
          caseId: caseRecord.id,
          caseDocumentItemId: passportItem.id,
          originalFilename: "passport-copy-v2.txt",
          storedFilename: "sample-passport-v2.txt",
          storagePath: version2Path,
          mimeType: "text/plain",
          size: Buffer.byteLength("seed sample passport file v2"),
          note: "보완본(최신)",
          isCurrentVersion: true,
          versionNumber: 2,
          uploadedAt: new Date("2026-04-13T15:00:00.000Z")
        }
      ]
    });
  }

  if (passportItem) {
    const latestPassportFile = await prisma.caseDocumentFile.findFirst({
      where: {
        caseId: caseRecord.id,
        caseDocumentItemId: passportItem.id,
        isCurrentVersion: true
      }
    });

    if (latestPassportFile) {
      const submissionPackage = await prisma.submissionPackage.create({
        data: {
          caseId: caseRecord.id,
          packageNumber: `${caseRecord.caseNumber}-SUB-001`,
          packageLabel: "1차 제출본",
          submittedTo: "서울출입국청",
          submittedAt: dateFromToday(-2, 9, 30),
          status: "SUBMITTED",
          note: "초기 제출 패키지",
          items: {
            create: [
              {
                caseDocumentItemId: passportItem.id,
                caseDocumentFileId: latestPassportFile.id,
                labelSnapshot: passportItem.label,
                versionNumberSnapshot: latestPassportFile.versionNumber,
                documentTypeSnapshot: passportItem.documentType,
                filenameSnapshot: latestPassportFile.originalFilename
              }
            ]
          }
        }
      });

      await prisma.supplementRequest.create({
        data: {
          caseId: caseRecord.id,
          submissionPackageId: submissionPackage.id,
          requestedAt: dateFromToday(-1, 8),
          dueDate: dateFromToday(0, 18),
          requestedBy: "서울출입국청 심사관",
          summary: "체류목적 입증자료 추가 제출 요청",
          status: "IN_PROGRESS",
          note: "고용사유서 및 추가 확인서류 준비중",
          items: {
            create: [
              {
                caseDocumentItemId: passportItem.id,
                labelSnapshot: passportItem.label,
                sortOrder: 0
              }
            ]
          }
        }
      });
    }
  }

  await prisma.caseStageLog.createMany({
    data: [
      {
        caseId: caseRecord.id,
        fromStage: null,
        toStage: "CONTRACT_PREPARATION" as CaseStage,
        note: "초기 사건 생성"
      }
    ]
  });

  await prisma.inquiry.update({
    where: { id: visaInquiry.id },
    data: { status: "WON" }
  });

  const lailaService = serviceByLegacy.get("stay_ext");
  const lailaBase = {
    min: lailaService?.minPrice ?? 180000,
    max: lailaService?.maxPrice ?? 320000
  };
  const lailaSubtotal = {
    min: lailaBase.min,
    max: lailaBase.max
  };
  const lailaVat = {
    min: Math.round(lailaSubtotal.min * 0.1),
    max: Math.round(lailaSubtotal.max * 0.1)
  };
  const lailaTotal = {
    min: lailaSubtotal.min + lailaVat.min,
    max: lailaSubtotal.max + lailaVat.max
  };

  await prisma.quote.create({
    data: {
      inquiryId: lailaInquiry.id,
      status: "ACCEPTED",
      selectedServiceLegacyIds: JSON.stringify([lailaService?.legacyId ?? "stay_ext"]),
      selectedOptionLegacyIds: JSON.stringify(["vat"]),
      urgencyRuleCode: "URGENCY_STANDARD",
      consultRuleCode: "CONSULT_NONE",
      paymentRuleCode: "PAYMENT_STANDARD",
      rangeMode: true,
      serviceBaseMin: lailaBase.min,
      serviceBaseMax: lailaBase.max,
      subtotalMin: lailaSubtotal.min,
      subtotalMax: lailaSubtotal.max,
      vatAmountMin: lailaVat.min,
      vatAmountMax: lailaVat.max,
      totalMin: lailaTotal.min,
      totalMax: lailaTotal.max,
      consultFee: 0,
      successFeeRestricted: false,
      draftNotes: "수락되었으나 계약/사건 후속조치 미생성 상태 샘플",
      calculationSummary: "체류연장 기본 견적 (후속조치 대기)",
      createdAt: dateFromToday(-2, 9),
      updatedAt: dateFromToday(-2, 9),
      lineItems: {
        create: [
          {
            serviceTypeId: lailaService?.id,
            kind: "SERVICE" as const,
            label: lailaService?.name ?? "체류 연장",
            description: "체류 연장 기본 범위",
            amountMin: lailaBase.min,
            amountMax: lailaBase.max,
            sortOrder: 0
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
            computedMin: lailaVat.min,
            computedMax: lailaVat.max,
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
            amountMin: Math.round(lailaTotal.min * 0.5),
            amountMax: Math.round(lailaTotal.max * 0.5),
            sortOrder: 0
          },
          {
            stageKind: "MIDTERM" as const,
            percentage: 50,
            dueText: "접수 전",
            amountMin: Math.round(lailaTotal.min * 0.5),
            amountMax: Math.round(lailaTotal.max * 0.5),
            sortOrder: 1
          },
          {
            stageKind: "SUCCESS" as const,
            percentage: 0,
            dueText: "완료 시",
            amountMin: 0,
            amountMax: 0,
            sortOrder: 2
          }
        ]
      }
    }
  });
}

async function main() {
  await prisma.supplementRequestItem.deleteMany();
  await prisma.supplementRequest.deleteMany();
  await prisma.submissionPackageItem.deleteMany();
  await prisma.submissionPackage.deleteMany();
  await prisma.caseStageLog.deleteMany();
  await prisma.caseDocumentFile.deleteMany();
  await prisma.caseDocumentItem.deleteMany();
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
