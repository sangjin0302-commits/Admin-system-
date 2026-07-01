export type DeadlineType =
  | "OBJECTION_APPEAL" // 이의신청 (60일)
  | "ADMIN_APPEAL" // 행정심판 (90일)
  | "REINVESTIGATION" // 재조사청구 (90일)
  | "REVOCATION_LAWSUIT" // 취소소송 (90일 - 처분을 안 날)
  | "REVOCATION_LAWSUIT_1YEAR"; // 취소소송 (1년 - 처분이 있은 날)

const DEADLINE_RULES: Record<
  DeadlineType,
  { days: number; label: string; basis: string }
> = {
  OBJECTION_APPEAL: {
    days: 60,
    label: "이의신청",
    basis: "처분을 안 날부터 60일"
  },
  ADMIN_APPEAL: {
    days: 90,
    label: "행정심판",
    basis: "처분을 안 날부터 90일"
  },
  REINVESTIGATION: {
    days: 90,
    label: "재조사청구",
    basis: "고지받은 날부터 90일"
  },
  REVOCATION_LAWSUIT: {
    days: 90,
    label: "취소소송",
    basis: "처분을 안 날부터 90일"
  },
  REVOCATION_LAWSUIT_1YEAR: {
    days: 365,
    label: "취소소송(장기)",
    basis: "처분이 있은 날부터 1년"
  }
};

export function calculateDeadline(
  dispositionDate: Date,
  type: DeadlineType
): {
  deadline: Date;
  daysRemaining: number;
  isExpired: boolean;
  label: string;
  basis: string;
} {
  const rule = DEADLINE_RULES[type];
  const deadline = new Date(dispositionDate);
  deadline.setDate(deadline.getDate() + rule.days);

  const now = new Date();
  const msRemaining = deadline.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  return {
    deadline,
    daysRemaining,
    isExpired: daysRemaining < 0,
    label: rule.label,
    basis: rule.basis
  };
}

export function calculateAllApplicableDeadlines(
  dispositionDate: Date,
  category: string | null
): Array<ReturnType<typeof calculateDeadline> & { type: DeadlineType }> {
  const upperCat = category?.toUpperCase() ?? "";
  const applicable: DeadlineType[] = [];

  if (upperCat.includes("APPEAL") || upperCat.includes("ADMIN")) {
    applicable.push(
      "OBJECTION_APPEAL",
      "ADMIN_APPEAL",
      "REVOCATION_LAWSUIT",
      "REVOCATION_LAWSUIT_1YEAR"
    );
  } else if (upperCat.includes("VISA") || upperCat.includes("LICENSE")) {
    applicable.push("OBJECTION_APPEAL", "ADMIN_APPEAL");
  } else {
    applicable.push("OBJECTION_APPEAL", "ADMIN_APPEAL");
  }

  return applicable.map((type) => ({
    ...calculateDeadline(dispositionDate, type),
    type
  }));
}
