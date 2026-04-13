import type { PricingRuleType } from "@generated/prisma-v4";

import type {
  PricingRuleMaster,
  QuoteInquirySnapshot,
  ServiceTypeMaster
} from "@/lib/quote-engine/types";

const serviceKeywordMap: Record<string, string[]> = {
  visa_inv: ["비자", "visa", "초청", "invitation", "sponsorship"],
  stay_reg: ["연장", "등록", "체류", "stay", "extension", "renew", "arc"],
  stay_chg: ["변경", "자격변경", "change of status", "e-7", "d-10", "취업"],
  deportation: ["사범", "강제퇴거", "퇴거", "deportation"],
  adm_drink: ["음주", "음주운전", "drunk"],
  adm_biz: ["영업정지", "사업정지", "business suspension"],
  adm_school: ["학교폭력", "school violence"],
  adm_fine: ["과태료", "fine", "이의신청", "objection"],
  npo_basic: ["고유번호", "비영리단체", "npo"],
  npo_reg: ["비영리법인", "인가", "nonprofit corporation"],
  npo_minutes: ["정관", "회의록", "minutes"],
  doc_cert: ["내용증명", "apostille", "consular", "영사확인", "공증", "번역", "translation", "notary", "certified"],
  doc_petition: ["진정서", "탄원서", "petition"],
  biz_license: ["영업허가", "허가", "신고", "license", "permit"],
  construct: ["건축", "개발행위", "construction", "development"],
  food: ["식품", "위생", "food", "restaurant"],
  rdev_comp: ["재개발", "보상", "compensation"],
  law_interp: ["유권해석", "interpretation"]
};

const inquiryTypeDefaults: Record<QuoteInquirySnapshot["inquiryType"], string[]> = {
  FOREIGNER_VISA: ["stay_chg", "visa_inv"],
  IMMIGRATION_STAY: ["stay_reg", "stay_chg"],
  APOSTILLE_CONSULAR: ["doc_cert"],
  TRANSLATION_NOTARY: ["doc_cert"],
  GENERAL_ADMIN_CIVIL: ["biz_license", "construct"],
  CORPORATE_REQUEST: ["doc_cert", "npo_minutes"],
  UNKNOWN: ["doc_cert"]
};

export function suggestServiceLegacyIds(
  inquiry: QuoteInquirySnapshot,
  serviceTypes: ServiceTypeMaster[]
) {
  const searchableText = [
    inquiry.title,
    inquiry.description,
    inquiry.classificationReason,
    ...inquiry.serviceTags
  ]
    .join(" ")
    .toLowerCase();

  const scored = serviceTypes
    .filter((serviceType) => serviceType.isActive)
    .map((serviceType) => {
      const keywords = serviceKeywordMap[serviceType.legacyId] ?? [];
      const score = keywords.reduce(
        (sum, keyword) => (searchableText.includes(keyword.toLowerCase()) ? sum + 1 : sum),
        0
      );

      return { legacyId: serviceType.legacyId, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  if (scored.length > 0) {
    return scored.slice(0, Math.min(2, scored.length)).map((entry) => entry.legacyId);
  }

  return inquiryTypeDefaults[inquiry.inquiryType];
}

export function mapUrgencyLevelToRuleCode(urgencyLevel: QuoteInquirySnapshot["urgencyLevel"]) {
  if (urgencyLevel === "CRITICAL") return "URGENCY_SAME_DAY";
  if (urgencyLevel === "HIGH") return "URGENCY_EXPRESS";
  return "URGENCY_STANDARD";
}

export function selectDefaultRuleCode(
  rules: PricingRuleMaster[],
  ruleType: PricingRuleType,
  fallbackCode: string
) {
  return rules.find((rule) => rule.ruleType === ruleType && rule.isDefault)?.code ?? fallbackCode;
}
