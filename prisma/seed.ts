import fsSync from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import {
  PrismaClient,
  type CaseStage,
  type PricingOptionType,
  type PricingRuleType
} from "@generated/prisma-client/client";
import { Pool } from "pg";
import { hashPassword } from "../src/lib/auth/password";
import legacyPricing from "./data/legacy-pricing.json";

function loadEnvFile(filePath: string) {
  if (!fsSync.existsSync(filePath)) return;

  const content = fsSync.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(process.cwd(), ".env"));

const databaseUrl = process.env.DATABASE_URL;
const databaseProvider = process.env.DATABASE_PROVIDER?.trim() || (databaseUrl?.startsWith("file:") ? "sqlite" : "postgresql");

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

function normalizePostgresConnectionString(databaseUrlValue: string) {
  try {
    const url = new URL(databaseUrlValue);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("sslcert");
    url.searchParams.delete("sslkey");
    url.searchParams.delete("sslrootcert");
    return url.toString();
  } catch {
    return databaseUrlValue;
  }
}

function shouldRejectUnauthorized(databaseUrlValue: string) {
  const configured = process.env.PGSSL_REJECT_UNAUTHORIZED?.trim().toLowerCase();
  if (configured === "true") return true;
  if (configured === "false") return false;

  try {
    const hostname = new URL(databaseUrlValue).hostname.toLowerCase();
    if (hostname.endsWith(".rlwy.net") || hostname === "postgres.railway.internal") {
      return false;
    }
  } catch {
    return true;
  }

  return true;
}

const adapter =
  databaseProvider === "sqlite"
    ? new PrismaBetterSQLite3(
        {
          url: databaseUrl
        },
        {
          timestampFormat: "unixepoch-ms"
        }
      )
    : new PrismaPg(
        new Pool({
          connectionString: normalizePostgresConnectionString(databaseUrl),
          ssl: {
            rejectUnauthorized: shouldRejectUnauthorized(databaseUrl)
          }
        })
      );

const prisma = new PrismaClient({ adapter });
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

async function seedAdminUsers() {
  const [adminPasswordHash, staffPasswordHash] = await Promise.all([
    hashPassword("Admin1234!"),
    hashPassword("Staff1234!")
  ]);

  await prisma.user.createMany({
    data: [
      {
        email: "admin@admin-office.local",
        name: "Local Admin",
        role: "ADMIN",
        passwordHash: adminPasswordHash,
        isActive: true
      },
      {
        email: "staff@admin-office.local",
        name: "Local Staff",
        role: "STAFF",
        passwordHash: staffPasswordHash,
        isActive: true
      }
    ]
  });
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
  type ServiceTypeRecord = (typeof serviceTypes)[number];
  type PricingOptionRecord = (typeof pricingOptions)[number];

  const serviceByLegacy: Map<string, ServiceTypeRecord> = new Map(
    serviceTypes.map((item: ServiceTypeRecord) => [item.legacyId, item] as const)
  );
  const optionByLegacy: Map<string, PricingOptionRecord> = new Map(
    pricingOptions.map((item: PricingOptionRecord) => [item.legacyId, item] as const)
  );

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

  const corpServices: ServiceTypeRecord[] = ["npo_reg", "npo_minutes"]
    .map((legacyId) => serviceByLegacy.get(legacyId))
    .filter((service): service is ServiceTypeRecord => Boolean(service));
  const corpBase = sumRange(
    corpServices.map((service) => ({ min: service.minPrice, max: service.maxPrice }))
  );
  const corpUrgency = {
    min: Math.round(corpBase.min * 0.3),
    max: Math.round(corpBase.max * 0.3)
  };
  const corpDocs = {
    min: Math.round((corpBase.min + corpUrgency.min) * 0.2),
    max: Math.round((corpBase.max + corpUrgency.max) * 0.2)
  };
  const docsOption = optionByLegacy.get("docs");
  const vatOption = optionByLegacy.get("vat");
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
      selectedServiceLegacyIds: JSON.stringify(corpServices.map((service) => service.legacyId)),
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
            serviceTypeId: service.id,
            kind: "SERVICE" as const,
            label: service.name,
            description: `${service.category} 기본 범위`,
            amountMin: service.minPrice,
            amountMax: service.maxPrice,
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
            pricingOptionId: docsOption?.id,
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
            pricingOptionId: vatOption?.id,
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
            pricingOptionId: vatOption?.id,
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
  type SeededCaseDocumentItem = (typeof seededItems)[number];
  const passportItem = seededItems.find(
    (item: SeededCaseDocumentItem) => item.documentType === "passport_copy"
  );

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
            pricingOptionId: vatOption?.id,
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

async function seedRelationshipFlow() {
  const serviceType = await prisma.serviceType.findFirst({
    where: { isActive: true },
    orderBy: { minPrice: "asc" }
  });
  const vatOption = await prisma.pricingOption.findFirst({
    where: { legacyId: "vat" }
  });

  if (!serviceType) return;

  const inquiry = await prisma.inquiry.create({
    data: {
      contactName: "박서윤",
      email: "seoyun.review@example.com",
      phone: "010-5555-2222",
      preferredLanguage: "KO",
      clientType: "INDIVIDUAL",
      title: "사건 종결 이후 후기와 재의뢰 관리 샘플",
      description: "종결 처리와 후기 요청, 추천 가능 고객 관리 흐름을 점검하기 위한 샘플 사건입니다.",
      requestedOutcome: "종결 처리 후 고객 관계 상태 관리",
      requestedInquiryType: "GENERAL_ADMIN_CIVIL",
      declaredUrgency: "LOW",
      hasPreparedDocuments: true,
      needsTranslation: false,
      isCorporateRequest: false,
      dueDate: dateFromToday(-20, 10),
      wantsCallback: false,
      consentToPrivacy: true,
      status: "WON",
      inquiryType: "GENERAL_ADMIN_CIVIL",
      urgencyLevel: "LOW",
      consultationRequired: false,
      classificationConfidence: 0.9,
      qualificationScore: 78,
      generatedSummary: "종결 이후 고객 관계 관리가 필요한 일반 행정 사건 샘플입니다.",
      generatedGuidance: "1. 종결 요약 확인\n2. 후기 요청 여부 확인\n3. 재의뢰 가능성 검토",
      generatedReceiptMessage: "샘플 문의가 등록되었습니다.",
      classificationReason: "운영 샘플 데이터",
      recommendedNextStep: "종결 후 후기 요청과 후속 일정 등록",
      precheckRecommendedDocs: JSON.stringify(["신분증", "기존 처리 결과", "후속 문의 메모"]),
      serviceTags: JSON.stringify(["closed-case", "review-request", "dashboard"]),
      assignee: "운영관리",
      internalMemo: "종결 후 관계 관리 샘플"
    }
  });

  const baseMin = serviceType.minPrice;
  const baseMax = serviceType.maxPrice;
  const subtotalMin = baseMin;
  const subtotalMax = baseMax;
  const vatAmountMin = vatOption ? Math.round(subtotalMin * 0.1) : 0;
  const vatAmountMax = vatOption ? Math.round(subtotalMax * 0.1) : 0;
  const totalMin = subtotalMin + vatAmountMin;
  const totalMax = subtotalMax + vatAmountMax;

  const quote = await prisma.quote.create({
    data: {
      inquiryId: inquiry.id,
      status: "ACCEPTED",
      selectedServiceLegacyIds: JSON.stringify([serviceType.legacyId]),
      selectedOptionLegacyIds: JSON.stringify(vatOption ? ["vat"] : []),
      urgencyRuleCode: "URGENCY_STANDARD",
      consultRuleCode: "CONSULT_NONE",
      paymentRuleCode: "PAYMENT_STANDARD",
      rangeMode: true,
      serviceBaseMin: baseMin,
      serviceBaseMax: baseMax,
      subtotalMin,
      subtotalMax,
      vatAmountMin,
      vatAmountMax,
      totalMin,
      totalMax,
      consultFee: 0,
      successFeeRestricted: false,
      draftNotes: "종결 처리와 후속 관리 샘플용 견적",
      calculationSummary: "운영 샘플 견적",
      lineItems: {
        create: [
          {
            serviceTypeId: serviceType.id,
            kind: "SERVICE" as const,
            label: serviceType.name,
            description: "종결 처리 샘플",
            amountMin: baseMin,
            amountMax: baseMax,
            sortOrder: 0
          }
        ]
      },
      adjustments: vatOption
        ? {
            create: [
              {
                pricingOptionId: vatOption.id,
                label: "VAT",
                description: "VAT 10%",
                optionType: "PERCENT" as const,
                percentRate: 10,
                computedMin: vatAmountMin,
                computedMax: vatAmountMax,
                isVat: true,
                sortOrder: 0
              }
            ]
          }
        : undefined,
      paymentPlans: {
        create: [
          {
            stageKind: "RETAINER" as const,
            percentage: 50,
            dueText: "계약 시",
            amountMin: Math.round(totalMin * 0.5),
            amountMax: Math.round(totalMax * 0.5),
            sortOrder: 0
          },
          {
            stageKind: "MIDTERM" as const,
            percentage: 50,
            dueText: "종결 시",
            amountMin: Math.round(totalMin * 0.5),
            amountMax: Math.round(totalMax * 0.5),
            sortOrder: 1
          }
        ]
      }
    }
  });

  const contractDraft = await prisma.contractDraft.create({
    data: {
      inquiryId: inquiry.id,
      quoteId: quote.id,
      title: "종결 관리 샘플 계약 초안",
      bodyText: "운영 샘플 계약 초안입니다.",
      scopeText: "종결 후 안내 및 후속 관리",
      paymentSummary: "선금 50% / 종결 시 50%",
      successFeeRestricted: false
    }
  });

  const caseRecord = await prisma.caseRecord.create({
    data: {
      caseNumber: "CASE-20260413-REL-001",
      inquiryId: inquiry.id,
      quoteId: quote.id,
      contractDraftId: contractDraft.id,
      currentStage: "CLOSED",
      dueDate: dateFromToday(-10, 10),
      internalMemo: "종결 후 후기 요청과 재의뢰 관리 샘플",
      closedAt: dateFromToday(-3, 15),
      closeReason: "업무 완료 및 결과 안내 종료",
      outcomeSummary: "필요 서류 정리와 제출 확인이 마무리되어 종결 처리함.",
      nextFollowUpDate: dateFromToday(4, 10),
      clientRelationshipStatus: "REVIEW_REQUESTED",
      reviewRequestedAt: dateFromToday(-2, 11),
      referralEligible: true,
      reengagementEligible: true,
      lastFollowUpAt: dateFromToday(-2, 11)
    }
  });

  await prisma.caseStageLog.createMany({
    data: [
      {
        caseId: caseRecord.id,
        fromStage: null,
        toStage: "CONTRACT_PREPARATION",
        note: "샘플 사건 생성"
      },
      {
        caseId: caseRecord.id,
        fromStage: "CONTRACT_PREPARATION",
        toStage: "COMPLETED",
        note: "업무 완료"
      },
      {
        caseId: caseRecord.id,
        fromStage: "COMPLETED",
        toStage: "CLOSED",
        note: "종결 처리"
      }
    ]
  });

  await prisma.followUpAction.createMany({
    data: [
      {
        caseId: caseRecord.id,
        type: "REVIEW_REQUEST",
        status: "PENDING",
        title: "후기 요청 발송 확인",
        note: "리뷰 링크 안내 후 회신 여부 확인",
        dueDate: dateFromToday(4, 10),
        messageDraft: "사건이 잘 마무리되었는지 확인드리며, 가능하시면 간단한 후기를 부탁드립니다."
      },
      {
        caseId: caseRecord.id,
        type: "REFERRAL_CHECK",
        status: "COMPLETED",
        title: "추천 가능 고객 체크",
        note: "소개 의향 확인 완료",
        dueDate: dateFromToday(-1, 10),
        completedAt: dateFromToday(-1, 12),
        messageDraft: "비슷한 업무가 필요한 지인이 있다면 편하게 소개 부탁드립니다."
      }
    ]
  });
}

async function seedForecastingPilot() {
  const today = new Date();
  const monday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const dayOfWeek = monday.getUTCDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setUTCDate(monday.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);

  const weeklyOffsets = [-35, -28, -21, -14, -7, 0];

  await prisma.externalIndicatorObservation.createMany({
    data: weeklyOffsets.flatMap((offset, index) => {
      const observationDate = new Date(monday);
      observationDate.setUTCDate(observationDate.getUTCDate() + offset);

      return [
        {
          observationDate,
          indicatorKey: "search_trend_visa",
          category: "FOREIGNER_VISA",
          numericValue: 54 + index * 3,
          source: "manual-seed",
          note: "TimesFM pilot sample"
        },
        {
          observationDate,
          indicatorKey: "foreign_resident_index",
          category: "FOREIGNER_VISA",
          numericValue: 101.2 + index * 0.4,
          source: "manual-seed",
          note: "TimesFM pilot sample"
        },
        {
          observationDate,
          indicatorKey: "is_holiday_week",
          category: null,
          numericValue: index === 3 ? 1 : 0,
          source: "manual-seed",
          note: "TimesFM pilot sample"
        }
      ];
    })
  });

  await prisma.forecastEventFlag.createMany({
    data: [
      {
        eventDate: new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() - 21)),
        eventType: "policy",
        eventName: "visa_document_rule_change",
        category: "FOREIGNER_VISA",
        impactFlag: true,
        memo: "체류자격 서류 보완 요건이 강화된 주간"
      },
      {
        eventDate: new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() - 7)),
        eventType: "seasonal",
        eventName: "spring_recruitment_wave",
        category: "FOREIGNER_VISA",
        impactFlag: true,
        memo: "채용 시즌 유입 증가"
      }
    ]
  });

  const forecastRun = await prisma.demandForecastRun.create({
    data: {
      targetMetric: "INQUIRY_COUNT",
      targetCategory: "FOREIGNER_VISA",
      horizonWeeks: 4,
      modelName: "TimesFM",
      modelVersion: "google/timesfm-2.5-200m-pytorch",
      sourceWindowWeeks: 12,
      status: "COMPLETED",
      contextJson: JSON.stringify({
        note: "Seeded pilot forecast preview",
        targetMetric: "INQUIRY_COUNT"
      }),
      note: "초기 관리자 화면 확인용 샘플 예측",
      completedAt: new Date(),
      points: {
        create: [1, 2, 3, 4].map((step, index) => {
          const targetWeekStart = new Date(monday);
          targetWeekStart.setUTCDate(targetWeekStart.getUTCDate() + 7 * step);

          return {
            targetWeekStart,
            predictedValue: 10 + index * 2,
            lowerBound: 8 + index,
            upperBound: 13 + index * 2
          };
        })
      }
    }
  });

  console.log(`Seeded forecast run ${forecastRun.id}`);
}

async function main() {
  await prisma.demandForecastPoint.deleteMany();
  await prisma.demandForecastRun.deleteMany();
  await prisma.weeklyForecastDataset.deleteMany();
  await prisma.forecastEventFlag.deleteMany();
  await prisma.externalIndicatorObservation.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.followUpAction.deleteMany();
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

  await seedAdminUsers();
  await seedLegacyPricing();
  await seedInquiries();
  await seedQuoteFlow();
  await seedRelationshipFlow();
  await seedForecastingPilot();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
