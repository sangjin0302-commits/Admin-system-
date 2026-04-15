import type { InquiryStatus, LanguageCode, ScreeningGrade, ScreeningRoute, UrgencyLevel } from "@/types/inquiry";

type InquiryScreeningInput = {
  id: string;
  qualificationScore: number;
  classificationConfidence: number;
  urgencyLevel: UrgencyLevel;
  consultationRequired: boolean;
  hasPreparedDocuments: boolean;
  needsTranslation: boolean;
  isCorporateRequest: boolean;
  dueDate?: Date | null;
  preferredLanguage: LanguageCode;
  status?: InquiryStatus;
};

export type InquiryScreeningResult = {
  grade: ScreeningGrade;
  route: ScreeningRoute;
  headline: string;
  summary: string;
  actionLabel: string;
  actionHref: string;
};

function getDaysUntil(date?: Date | null) {
  if (!date) return null;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));
}

function buildKoreanSummary(input: InquiryScreeningInput, grade: ScreeningGrade, route: ScreeningRoute) {
  const parts: string[] = [];
  const daysUntil = getDaysUntil(input.dueDate);

  if (input.urgencyLevel === "CRITICAL") {
    parts.push("기한 임박으로 즉시 대응이 필요합니다.");
  } else if (input.urgencyLevel === "HIGH") {
    parts.push("긴급 대응 우선순위가 높은 문의입니다.");
  }

  if (typeof daysUntil === "number") {
    if (daysUntil < 0) {
      parts.push("희망 기한이 이미 지난 상태입니다.");
    } else if (daysUntil <= 7) {
      parts.push(`희망 기한이 ${daysUntil}일 이내라 빠른 검토가 필요합니다.`);
    }
  }

  if (input.qualificationScore >= 80) {
    parts.push("현재 정보만으로도 수임 전환 가능성이 높습니다.");
  } else if (input.qualificationScore >= 60) {
    parts.push("핵심 요건은 맞지만 추가 확인이 있으면 전환률이 높아집니다.");
  } else {
    parts.push("추가 확인 또는 안내 분기가 필요한 문의입니다.");
  }

  if (input.hasPreparedDocuments) {
    parts.push("기본 서류가 준비돼 있어 상담 속도를 높일 수 있습니다.");
  } else {
    parts.push("서류 준비 여부가 불명확해 추가 수집 단계가 필요합니다.");
  }

  if (input.isCorporateRequest) {
    parts.push("기업 의뢰 성격이 있어 객단가와 장기 전환 가능성을 함께 봐야 합니다.");
  }

  if (input.needsTranslation) {
    parts.push("번역/다국어 안내가 필요해 준비 문구를 함께 보내는 편이 좋습니다.");
  }

  if (route === "PAID_DIAGNOSIS") {
    parts.push("무료 응대보다 유료 사전진단으로 바로 분기하는 편이 효율적입니다.");
  } else if (route === "DOCS_REVIEW_FIRST") {
    parts.push("상담보다 먼저 추가서류를 받아 1차 판별을 줄이는 편이 좋습니다.");
  } else if (route === "GUIDANCE_FIRST") {
    parts.push("즉시 상담보다는 안내문/FAQ/기본 답변 먼저 보내는 편이 효율적입니다.");
  } else if (route === "DECLINE_OR_REFER") {
    parts.push("수임 효율과 적합도를 다시 확인하고 외부 연계도 열어두는 편이 좋습니다.");
  }

  return parts.join(" ");
}

export function deriveInquiryScreening(input: InquiryScreeningInput): InquiryScreeningResult {
  const daysUntil = getDaysUntil(input.dueDate);
  const urgent = input.urgencyLevel === "CRITICAL" || input.urgencyLevel === "HIGH";
  const imminent = typeof daysUntil === "number" && daysUntil <= 7;
  const strongFit = input.qualificationScore >= 80 && input.classificationConfidence >= 0.75;
  const mediumFit = input.qualificationScore >= 60;

  let grade: ScreeningGrade = "C";
  let route: ScreeningRoute = "GUIDANCE_FIRST";
  let actionLabel = "기본 안내 확인";
  let actionHref = `/admin/inquiries/${input.id}`;

  if (strongFit && input.hasPreparedDocuments && (urgent || imminent || input.isCorporateRequest)) {
    grade = "A";
    route = input.consultationRequired ? "PRIORITY_CONSULT" : "PAID_DIAGNOSIS";
    actionLabel = route === "PRIORITY_CONSULT" ? "상담 우선 검토" : "유료 진단 전환";
    actionHref = `/admin/inquiries/${input.id}/quote`;
  } else if (strongFit || (mediumFit && input.hasPreparedDocuments)) {
    grade = "B";
    route = input.consultationRequired ? "PAID_DIAGNOSIS" : "DOCS_REVIEW_FIRST";
    actionLabel = route === "PAID_DIAGNOSIS" ? "유료 진단 권장" : "추가서류 요청";
    actionHref =
      route === "PAID_DIAGNOSIS"
        ? `/admin/inquiries/${input.id}/quote`
        : `/admin/inquiries/${input.id}/relationship`;
  } else if (mediumFit || input.classificationConfidence >= 0.55) {
    grade = "C";
    route = "GUIDANCE_FIRST";
    actionLabel = "기본 안내 / 상담 대기";
    actionHref = `/admin/inquiries/${input.id}/relationship`;
  } else {
    grade = "D";
    route = "DECLINE_OR_REFER";
    actionLabel = "불수임 / 외부 연계 검토";
    actionHref = `/admin/inquiries/${input.id}/relationship`;
  }

  const headline =
    grade === "A"
      ? "즉시 전환 우선 검토"
      : grade === "B"
        ? "서류/진단 후 전환 후보"
        : grade === "C"
          ? "안내 후 선별 유지"
          : "비효율 / 불수임 재검토";

  return {
    grade,
    route,
    headline,
    summary: buildKoreanSummary(input, grade, route),
    actionLabel,
    actionHref
  };
}
