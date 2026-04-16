import type { PricingOptionType } from "@generated/prisma-client/client";

import { mapUrgencyLevelToRuleCode, selectDefaultRuleCode, suggestServiceLegacyIds } from "@/lib/quote-engine/legacy-mapping";
import type {
  PricingOptionMaster,
  PricingRuleMaster,
  QuoteComputationAdjustment,
  QuoteComputationInput,
  QuoteComputationLineItem,
  QuoteComputationPaymentPlan,
  QuoteComputationResult,
  QuoteInquirySnapshot,
  ServiceTypeMaster,
  StageTemplate
} from "@/lib/quote-engine/types";
import { formatCurrency, normalizeStagePercentages, parseRuleJson, roundAmount, toStageKindLabel } from "@/lib/quote-engine/utils";

type PaymentRuleJson = {
  stages: StageTemplate[];
};

type PolicyRuleJson = {
  restrictedWhenAppeal?: boolean;
  message?: string;
};

function requireRule(rules: PricingRuleMaster[], code: string) {
  const rule = rules.find((entry) => entry.code === code && entry.isActive);

  if (!rule) {
    throw new Error(`Pricing rule not found: ${code}`);
  }

  return rule;
}

function resolveServiceSelection(
  inquiry: QuoteInquirySnapshot,
  serviceTypes: ServiceTypeMaster[],
  selectedLegacyIds: string[]
) {
  const fallbackLegacyIds = suggestServiceLegacyIds(inquiry, serviceTypes);
  const legacyIds = selectedLegacyIds.length > 0 ? selectedLegacyIds : fallbackLegacyIds;

  return serviceTypes.filter(
    (serviceType) => serviceType.isActive && legacyIds.includes(serviceType.legacyId)
  );
}

function buildStageTemplates(
  paymentRule: PricingRuleMaster,
  stageOverrides: QuoteComputationInput["stageOverrides"],
  successFeeRestricted: boolean
) {
  const paymentRuleJson = parseRuleJson<PaymentRuleJson>(paymentRule);
  const baseStages =
    paymentRuleJson?.stages ?? [
      { stageKind: "RETAINER", percentage: 50, dueText: "계약 체결 시" },
      { stageKind: "MIDTERM", percentage: 50, dueText: "서류 접수 시" },
      { stageKind: "SUCCESS", percentage: 0, dueText: "업무 완료 시" }
    ];

  const merged = baseStages.map((stage) => ({
    stageKind: stage.stageKind,
    percentage: stageOverrides?.[stage.stageKind]?.percentage ?? stage.percentage,
    dueText: stageOverrides?.[stage.stageKind]?.dueText ?? stage.dueText
  }));

  return normalizeStagePercentages(merged, successFeeRestricted);
}

function computePercentAdjustment(subtotal: number, rate: number) {
  return roundAmount(subtotal * (rate / 100));
}

function optionDescription(option: PricingOptionMaster) {
  return option.description || option.unitLabel || undefined;
}

export function computeQuoteDraft(input: QuoteComputationInput): QuoteComputationResult {
  const selectedServices = resolveServiceSelection(
    input.inquiry,
    input.masters.serviceTypes,
    input.selectedServiceLegacyIds
  );

  if (selectedServices.length === 0) {
    throw new Error("견적 계산에 사용할 업무 유형이 선택되지 않았습니다.");
  }

  const rules = input.masters.pricingRules.filter((rule) => rule.isActive);
  const urgencyRuleCode =
    input.urgencyRuleCode ||
    mapUrgencyLevelToRuleCode(input.inquiry.urgencyLevel) ||
    selectDefaultRuleCode(rules, "URGENCY", "URGENCY_STANDARD");
  const consultRuleCode =
    input.consultRuleCode || selectDefaultRuleCode(rules, "CONSULT", "CONSULT_NONE");
  const paymentRuleCode =
    input.paymentRuleCode || selectDefaultRuleCode(rules, "PAYMENT", "PAYMENT_STANDARD");

  const urgencyRule = requireRule(rules, urgencyRuleCode);
  const consultRule = requireRule(rules, consultRuleCode);
  const paymentRule = requireRule(rules, paymentRuleCode);
  const appealPolicy = rules.find((rule) => rule.code === "POLICY_APPEAL_SUCCESS_RESTRICT");
  const appealPolicyJson = appealPolicy ? parseRuleJson<PolicyRuleJson>(appealPolicy) : null;

  let serviceBaseMin = 0;
  let serviceBaseMax = 0;

  const lineItems: QuoteComputationLineItem[] = selectedServices.map((serviceType, index) => {
    serviceBaseMin += serviceType.minPrice;
    serviceBaseMax += serviceType.maxPrice;

    return {
      kind: "SERVICE",
      serviceTypeId: serviceType.id,
      label: serviceType.name,
      description: `${serviceType.category} 기본 범위`,
      amountMin: serviceType.minPrice,
      amountMax: serviceType.maxPrice,
      sortOrder: index
    };
  });

  let rollingMin = serviceBaseMin;
  let rollingMax = serviceBaseMax;

  const urgencyPercent = urgencyRule.percentValue ?? 0;
  if (urgencyPercent > 0) {
    const urgencyMin = computePercentAdjustment(serviceBaseMin, urgencyPercent);
    const urgencyMax = computePercentAdjustment(serviceBaseMax, urgencyPercent);

    lineItems.push({
      kind: "URGENCY",
      label: urgencyRule.label,
      description: urgencyRule.description,
      amountMin: urgencyMin,
      amountMax: urgencyMax,
      sortOrder: lineItems.length
    });

    rollingMin += urgencyMin;
    rollingMax += urgencyMax;
  }

  const selectedOptions = input.masters.pricingOptions.filter(
    (option) => option.isActive && input.selectedOptionLegacyIds.includes(option.legacyId)
  );
  const adjustments: QuoteComputationAdjustment[] = [];
  const deferredVat = selectedOptions.find((option) => option.isVat);

  for (const option of selectedOptions.filter((entry) => !entry.isVat)) {
    const computed = computeOptionAdjustment(option, rollingMin, rollingMax);

    adjustments.push({
      pricingOptionId: option.id,
      label: option.name,
      description: optionDescription(option),
      optionType: option.optionType,
      flatAmount: option.flatAmount,
      percentRate: option.percentRate,
      computedMin: computed.min,
      computedMax: computed.max,
      isVat: false,
      sortOrder: adjustments.length
    });

    rollingMin += computed.min;
    rollingMax += computed.max;
  }

  const subtotalMin = rollingMin;
  const subtotalMax = rollingMax;

  let vatAmountMin = 0;
  let vatAmountMax = 0;

  if (deferredVat) {
    const computed = computeOptionAdjustment(deferredVat, subtotalMin, subtotalMax);
    vatAmountMin = computed.min;
    vatAmountMax = computed.max;

    adjustments.push({
      pricingOptionId: deferredVat.id,
      label: deferredVat.name,
      description: optionDescription(deferredVat),
      optionType: deferredVat.optionType,
      flatAmount: deferredVat.flatAmount,
      percentRate: deferredVat.percentRate,
      computedMin: computed.min,
      computedMax: computed.max,
      isVat: true,
      sortOrder: adjustments.length
    });
  }

  const totalMin = subtotalMin + vatAmountMin;
  const totalMax = subtotalMax + vatAmountMax;
  const consultFee = consultRule.numericValue ?? 0;
  const successFeeRestricted = selectedServices.some((serviceType) => serviceType.isAppeal);
  const stages = buildStageTemplates(paymentRule, input.stageOverrides, successFeeRestricted);
  const paymentPlans: QuoteComputationPaymentPlan[] = stages.map((stage, index) => ({
    stageKind: stage.stageKind,
    percentage: stage.percentage,
    dueText: stage.dueText,
    amountMin: roundAmount(totalMin * (stage.percentage / 100)),
    amountMax: roundAmount(totalMax * (stage.percentage / 100)),
    sortOrder: index
  }));

  const warnings: string[] = [];
  if (successFeeRestricted) {
    warnings.push(
      appealPolicyJson?.message ??
        "행정심판/이의신청 계열 업무는 성공보수를 포함하지 않도록 제한합니다."
    );
  }

  return {
    selectedServiceLegacyIds: selectedServices.map((serviceType) => serviceType.legacyId),
    selectedOptionLegacyIds: selectedOptions.map((option) => option.legacyId),
    urgencyRuleCode,
    consultRuleCode,
    paymentRuleCode,
    rangeMode: input.rangeMode,
    serviceBaseMin,
    serviceBaseMax,
    subtotalMin,
    subtotalMax,
    vatAmountMin,
    vatAmountMax,
    totalMin,
    totalMax,
    consultFee,
    successFeeRestricted,
    calculationSummary: buildCalculationSummary({
      selectedServices,
      urgencyRule,
      selectedOptions,
      consultRule,
      totalMin,
      totalMax,
      successFeeRestricted
    }),
    warnings,
    lineItems,
    adjustments,
    paymentPlans
  };
}

function computeOptionAdjustment(
  option: PricingOptionMaster,
  subtotalMin: number,
  subtotalMax: number
) {
  if (option.optionType === "FLAT") {
    const amount = option.flatAmount ?? 0;
    return { min: amount, max: amount };
  }

  const rate = option.percentRate ?? 0;
  return {
    min: computePercentAdjustment(subtotalMin, rate),
    max: computePercentAdjustment(subtotalMax, rate)
  };
}

function buildCalculationSummary(input: {
  selectedServices: ServiceTypeMaster[];
  urgencyRule: PricingRuleMaster;
  selectedOptions: PricingOptionMaster[];
  consultRule: PricingRuleMaster;
  totalMin: number;
  totalMax: number;
  successFeeRestricted: boolean;
}) {
  const services = input.selectedServices.map((serviceType) => serviceType.name).join(", ");
  const optionText =
    input.selectedOptions.length > 0
      ? input.selectedOptions.map((option) => option.name).join(", ")
      : "추가 옵션 없음";
  const consultText =
    (input.consultRule.numericValue ?? 0) > 0
      ? `${input.consultRule.label} ${formatCurrency(input.consultRule.numericValue ?? 0)}`
      : input.consultRule.label;

  return [
    `기본 업무: ${services}`,
    `긴급도 규칙: ${input.urgencyRule.label}`,
    `추가 옵션: ${optionText}`,
    `상담료: ${consultText}`,
    `견적 합계: ${formatCurrency(input.totalMin)} ~ ${formatCurrency(input.totalMax)}`,
    input.successFeeRestricted
      ? "행정심판/이의신청 계열 업무로 분류되어 성공보수는 제한됩니다."
      : "성공보수 포함 여부는 관리자가 개별 사건 특성에 따라 조정할 수 있습니다."
  ].join("\n");
}

export function buildManualSummary(input: {
  lineItems: Array<{ label: string; amountMin: number; amountMax: number }>;
  adjustments: Array<{ label: string; computedMin: number; computedMax: number; isVat: boolean }>;
  consultFee: number;
  successFeeRestricted: boolean;
}) {
  const lines = input.lineItems
    .map((line) => `${line.label}: ${formatCurrency(line.amountMin)} ~ ${formatCurrency(line.amountMax)}`)
    .slice(0, 5);

  const optionLines = input.adjustments
    .map(
      (adjustment) =>
        `${adjustment.isVat ? "VAT" : adjustment.label}: ${formatCurrency(adjustment.computedMin)} ~ ${formatCurrency(adjustment.computedMax)}`
    )
    .slice(0, 5);

  return [
    ...lines,
    ...optionLines,
    input.consultFee > 0 ? `상담료: ${formatCurrency(input.consultFee)}` : "상담료 미적용",
    input.successFeeRestricted
      ? "행정심판/이의신청 계열로 분류되어 성공보수 제한이 적용됩니다."
      : "성공보수 구조는 관리자 검토 후 추가 조정 가능합니다."
  ].join("\n");
}

export function buildContractDraftText(input: {
  inquiry: QuoteInquirySnapshot;
  lineItems: Array<{ label: string; description: string | null; amountMin: number; amountMax: number }>;
  paymentPlans: Array<{ stageKind: string; percentage: number; dueText: string; amountMin: number; amountMax: number }>;
  totalMin: number;
  totalMax: number;
  vatAmountMin: number;
  vatAmountMax: number;
  consultFee: number;
  successFeeRestricted: boolean;
  warnings: string[];
  draftNotes?: string | null;
}) {
  const scopeText = input.lineItems
    .map(
      (line, index) =>
        `${index + 1}. ${line.label}${line.description ? ` (${line.description})` : ""}: ${formatCurrency(line.amountMin)} ~ ${formatCurrency(line.amountMax)}`
    )
    .join("\n");

  const paymentSummary = input.paymentPlans
    .map(
      (stage) =>
        `${toStageKindLabel(stage.stageKind as "RETAINER" | "MIDTERM" | "SUCCESS")} ${stage.percentage}% - ${stage.dueText} (${formatCurrency(stage.amountMin)} ~ ${formatCurrency(stage.amountMax)})`
    )
    .join("\n");

  const noticeLines = [
    `의뢰인: ${input.inquiry.organizationName || input.inquiry.contactName}`,
    `문의 제목: ${input.inquiry.title}`,
    "",
    "[업무 범위]",
    scopeText,
    "",
    "[보수 범위]",
    `총 보수: ${formatCurrency(input.totalMin)} ~ ${formatCurrency(input.totalMax)}`,
    `VAT: ${formatCurrency(input.vatAmountMin)} ~ ${formatCurrency(input.vatAmountMax)}`,
    input.consultFee > 0
      ? `상담료(수임 시 공제): ${formatCurrency(input.consultFee)}`
      : "상담료 미적용",
    "",
    "[결제 구조]",
    paymentSummary,
    "",
    "[기본 안내]",
    "1. 본 계약 초안은 현재까지 제공된 사실관계와 자료를 기준으로 작성된 내부 초안입니다.",
    "2. 실제 업무 진행 가능 여부와 결과는 추가 자료, 관할 기관 심사, 사실관계 변동에 따라 달라질 수 있습니다.",
    "3. 의뢰인은 사실관계와 제출 자료를 정확하게 제공해야 하며, 누락 또는 허위 자료로 인한 불이익은 별도 검토가 필요합니다.",
    "4. 업무 범위에 명시되지 않은 번역, 공증, 외부 기관 수수료, 송달 비용, 추가 보완 대응은 별도 협의될 수 있습니다.",
    "5. 기관 재량 판단, 제도 변경, 추가 보완 요청 등 외부 사유로 인한 지연 또는 결과 차이는 본 계약 초안만으로 확정되지 않습니다.",
    "6. 업무 착수 이후 해지, 환불, 추가 비용 정산 기준은 실제 체결 시 별도 특약 또는 최종 계약문에서 확정합니다."
  ];

  if (input.successFeeRestricted) {
    noticeLines.push(
      "",
      "[성공보수 제한]",
      input.warnings[0] ??
        "행정심판/이의신청 계열 업무는 결과 연동형 성공보수를 포함하지 않도록 제한합니다."
    );
  }

  if (input.draftNotes?.trim()) {
    noticeLines.push("", "[관리자 메모]", input.draftNotes.trim());
  }

  return {
    title: `${input.inquiry.organizationName || input.inquiry.contactName} 견적 기반 계약 초안`,
    bodyText: noticeLines.join("\n"),
    scopeText,
    paymentSummary
  };
}

