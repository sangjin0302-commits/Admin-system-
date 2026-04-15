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
  contactName?: string;
};

export type InquiryScreeningResult = {
  grade: ScreeningGrade;
  route: ScreeningRoute;
  headline: string;
  summary: string;
  suggestedStatus: InquiryStatus;
  statusActionLabel: string;
  actionLabel: string;
  actionHref: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  opsChecklist: string[];
  clientMessageDraft: string;
};

function getDaysUntil(date?: Date | null) {
  if (!date) return null;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));
}

function buildKoreanSummary(input: InquiryScreeningInput, _grade: ScreeningGrade, route: ScreeningRoute) {
  const parts: string[] = [];
  const daysUntil = getDaysUntil(input.dueDate);

  if (input.urgencyLevel === "CRITICAL") {
    parts.push("기한이 매우 촉박해 즉시 대응이 필요한 문의입니다.");
  } else if (input.urgencyLevel === "HIGH") {
    parts.push("긴급 우선순위가 높은 문의입니다.");
  }

  if (typeof daysUntil === "number") {
    if (daysUntil < 0) {
      parts.push("희망 기한이 이미 지난 상태라 사실관계 재확인이 필요합니다.");
    } else if (daysUntil <= 7) {
      parts.push(`희망 기한이 ${daysUntil}일 이내라 빠른 검토가 필요합니다.`);
    }
  }

  if (input.qualificationScore >= 80) {
    parts.push("현재 정보만으로도 수임 전환 가능성이 높은 편입니다.");
  } else if (input.qualificationScore >= 60) {
    parts.push("추가 서류나 사실관계 확인이 있으면 전환 가능성이 더 높아질 수 있습니다.");
  } else {
    parts.push("안내 또는 추가 확인을 먼저 진행하는 것이 적절한 문의입니다.");
  }

  if (input.hasPreparedDocuments) {
    parts.push("기본 서류가 어느 정도 준비되어 있어 상담 또는 진단 속도를 높일 수 있습니다.");
  } else {
    parts.push("기본 서류 보유 여부가 불명확해 추가 서류 수집이 먼저 필요합니다.");
  }

  if (input.isCorporateRequest) {
    parts.push("기업 의뢰 성격이 있어 범위와 일정 확인을 먼저 받는 것이 좋습니다.");
  }

  if (input.needsTranslation) {
    parts.push("번역 또는 다국어 안내가 필요한 건이라 준비 문구를 함께 보내는 편이 좋습니다.");
  }

  if (route === "PAID_DIAGNOSIS") {
    parts.push("무료 응대보다 유료 사전진단으로 바로 분기하는 편이 효율적입니다.");
  } else if (route === "DOCS_REVIEW_FIRST") {
    parts.push("상담보다 먼저 추가 서류를 받아 1차 검토를 진행하는 편이 좋습니다.");
  } else if (route === "GUIDANCE_FIRST") {
    parts.push("즉시 상담보다 안내문, FAQ, 기본 준비 문구를 먼저 보내는 것이 적절합니다.");
  } else if (route === "DECLINE_OR_REFER") {
    parts.push("수임 효율과 적합도를 다시 확인하고 불수임 또는 외부 연계도 검토하는 편이 좋습니다.");
  }

  return parts.join(" ");
}

function buildOpsChecklist(route: ScreeningRoute, urgent: boolean, hasPreparedDocuments: boolean) {
  const common = [
    "AI 분류 사유와 희망 결과를 다시 확인합니다.",
    "문의 상세의 내부 메모에 이번 판단 근거를 남깁니다."
  ];

  if (route === "PRIORITY_CONSULT") {
    return [
      ...common,
      urgent ? "긴급 여부를 먼저 확인하고 상담 우선순위를 최상단으로 올립니다." : "상담 가능 시간부터 빠르게 제안합니다.",
      "관계관리 화면에서 후속조치와 회신 일정을 등록합니다.",
      "필요 시 견적 화면으로 이동해 초안 준비를 시작합니다."
    ];
  }

  if (route === "PAID_DIAGNOSIS") {
    return [
      ...common,
      "유료 사전진단 또는 유료 상담으로 분기할지 먼저 확정합니다.",
      "견적 화면에서 진단/제안서 초안을 준비합니다.",
      hasPreparedDocuments ? "현재 보유 서류 기준으로 검토 범위를 좁힙니다." : "사전진단 전에 필요한 서류 목록을 먼저 보냅니다."
    ];
  }

  if (route === "DOCS_REVIEW_FIRST") {
    return [
      ...common,
      "관계관리 화면에서 추가서류 요청 메시지를 보냅니다.",
      "서류가 들어오면 상담 또는 견적 단계로 올립니다.",
      "기한이 있는 경우 후속조치 마감일을 함께 설정합니다."
    ];
  }

  if (route === "GUIDANCE_FIRST") {
    return [
      ...common,
      "기본 안내문과 FAQ 수준 답변을 먼저 정리합니다.",
      "무료 안내 범위를 넘는 경우 유료 상담 또는 유료 진단으로 다시 분기합니다.",
      "재접촉 가능성이 있으면 후속 일정만 등록합니다."
    ];
  }

  return [
    ...common,
    "불수임 사유 또는 외부 연계 필요 여부를 명확히 남깁니다.",
    "기본 안내문만 발송하고 추가 무료 응대는 최소화합니다.",
    "필요 시 타 전문가 연계 여부를 별도로 기록합니다."
  ];
}

function buildClientMessageDraft(input: InquiryScreeningInput, route: ScreeningRoute) {
  const name = input.contactName?.trim() || "고객님";

  if (route === "PRIORITY_CONSULT") {
    return `${name}, 문의 내용을 확인했습니다. 현재 건은 우선 상담이 필요한 유형으로 분류되어 빠르게 일정 조율을 진행하겠습니다. 필요한 기본 자료가 있다면 함께 보내주시면 검토 속도를 높일 수 있습니다.`;
  }

  if (route === "PAID_DIAGNOSIS") {
    return `${name}, 문의 내용을 확인했습니다. 현재 건은 가능 여부와 리스크를 정확히 보기 위해 유료 사전진단 또는 상담으로 먼저 안내드리는 편이 적절합니다. 관리자 검토 후 상세 범위와 진행 절차를 안내드리겠습니다.`;
  }

  if (route === "DOCS_REVIEW_FIRST") {
    return `${name}, 문의 내용을 확인했습니다. 현재는 상담 전에 기본 서류를 먼저 확인하면 더 정확한 안내가 가능합니다. 준비 가능한 자료를 보내주시면 검토 후 다음 단계를 안내드리겠습니다.`;
  }

  if (route === "GUIDANCE_FIRST") {
    return `${name}, 문의 내용을 확인했습니다. 우선 기본 안내와 준비 사항을 먼저 드리고, 추가 확인이 필요한 경우 상담 단계로 이어서 안내드리겠습니다.`;
  }

  return `${name}, 문의 내용을 확인했습니다. 현재 정보 기준으로는 즉시 수임보다는 기본 안내 또는 다른 전문가 연계 검토가 더 적절할 수 있습니다. 필요한 범위 안에서 확인 후 다시 안내드리겠습니다.`;
}

export function deriveInquiryScreening(input: InquiryScreeningInput): InquiryScreeningResult {
  const daysUntil = getDaysUntil(input.dueDate);
  const urgent = input.urgencyLevel === "CRITICAL" || input.urgencyLevel === "HIGH";
  const imminent = typeof daysUntil === "number" && daysUntil <= 7;
  const strongFit = input.qualificationScore >= 80 && input.classificationConfidence >= 0.75;
  const mediumFit = input.qualificationScore >= 60;

  let grade: ScreeningGrade = "C";
  let route: ScreeningRoute = "GUIDANCE_FIRST";
  let suggestedStatus: InquiryStatus = "IN_REVIEW";
  let statusActionLabel = "안내 검토 상태 반영";
  let actionLabel = "기본 안내 / 후속조치";
  let actionHref = `/admin/inquiries/${input.id}/relationship`;
  let secondaryActionLabel: string | undefined;
  let secondaryActionHref: string | undefined;

  if (strongFit && input.hasPreparedDocuments && (urgent || imminent || input.isCorporateRequest)) {
    grade = "A";
    route = input.consultationRequired ? "PRIORITY_CONSULT" : "PAID_DIAGNOSIS";
    suggestedStatus = route === "PRIORITY_CONSULT" ? "WAITING_CONSULTATION" : "CONSULTATION_REQUIRED";
    statusActionLabel = route === "PRIORITY_CONSULT" ? "상담 우선 상태 반영" : "유료 진단 상태 반영";
    actionLabel = route === "PRIORITY_CONSULT" ? "상담 안내 / 후속조치" : "유료 진단 / 견적 준비";
    actionHref = route === "PRIORITY_CONSULT" ? `/admin/inquiries/${input.id}/relationship` : `/admin/inquiries/${input.id}/quote`;
    secondaryActionLabel = route === "PRIORITY_CONSULT" ? "견적 초안 준비" : "후속조치 메모";
    secondaryActionHref = route === "PRIORITY_CONSULT" ? `/admin/inquiries/${input.id}/quote` : `/admin/inquiries/${input.id}/relationship`;
  } else if (strongFit || (mediumFit && input.hasPreparedDocuments)) {
    grade = "B";
    route = input.consultationRequired ? "PAID_DIAGNOSIS" : "DOCS_REVIEW_FIRST";
    suggestedStatus = route === "PAID_DIAGNOSIS" ? "CONSULTATION_REQUIRED" : "PRE_DIAGNOSED";
    statusActionLabel = route === "PAID_DIAGNOSIS" ? "유료 진단 상태 반영" : "서류 검토 상태 반영";
    actionLabel = route === "PAID_DIAGNOSIS" ? "유료 진단 / 견적 준비" : "추가서류 요청";
    actionHref = route === "PAID_DIAGNOSIS" ? `/admin/inquiries/${input.id}/quote` : `/admin/inquiries/${input.id}/relationship`;
    secondaryActionLabel = route === "PAID_DIAGNOSIS" ? "후속조치 메모" : "견적 검토";
    secondaryActionHref = route === "PAID_DIAGNOSIS" ? `/admin/inquiries/${input.id}/relationship` : `/admin/inquiries/${input.id}/quote`;
  } else if (mediumFit || input.classificationConfidence >= 0.55) {
    grade = "C";
    route = "GUIDANCE_FIRST";
    suggestedStatus = "IN_REVIEW";
    statusActionLabel = "안내 검토 상태 반영";
    actionLabel = "기본 안내 / 후속조치";
    actionHref = `/admin/inquiries/${input.id}/relationship`;
    secondaryActionLabel = "상세 검토";
    secondaryActionHref = `/admin/inquiries/${input.id}`;
  } else {
    grade = "D";
    route = "DECLINE_OR_REFER";
    suggestedStatus = "ON_HOLD";
    statusActionLabel = "보류 / 불수임 검토 상태 반영";
    actionLabel = "불수임 / 외부 연계 메모";
    actionHref = `/admin/inquiries/${input.id}/relationship`;
    secondaryActionLabel = "세부 접수 다시 확인";
    secondaryActionHref = `/admin/inquiries/${input.id}`;
  }

  const headline =
    grade === "A"
      ? "즉시 전환 우선 검토"
      : grade === "B"
        ? "서류/진단 후 전환 유력"
        : grade === "C"
          ? "안내 후 단계적 전환"
          : "비효율 / 불수임 검토";

  return {
    grade,
    route,
    headline,
    summary: buildKoreanSummary(input, grade, route),
    suggestedStatus,
    statusActionLabel,
    actionLabel,
    actionHref,
    secondaryActionLabel,
    secondaryActionHref,
    opsChecklist: buildOpsChecklist(route, urgent, input.hasPreparedDocuments),
    clientMessageDraft: buildClientMessageDraft(input, route)
  };
}
