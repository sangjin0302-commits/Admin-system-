export type DeadlineType =
  | "OBJECTION_APPEAL" // 이의신청 (60일)
  | "ADMIN_APPEAL" // 행정심판 (90일)
  | "REINVESTIGATION" // 재조사청구 (90일)
  | "REVOCATION_LAWSUIT" // 취소소송 (90일 - 처분을 안 날)
  | "REVOCATION_LAWSUIT_1YEAR" // 취소소송 (1년 - 처분이 있은 날)
  // 특별법 규정
  | "NOISE_VIBRATION_SPECIAL" // 소음진동관리법 60일
  | "NATIONAL_TAX_OBJECTION" // 국세기본법 이의신청 90일
  | "NATIONAL_TAX_REVIEW" // 국세기본법 심사청구 90일
  | "NATIONAL_TAX_TRIBUNAL" // 국세기본법 심판청구 90일
  | "MILITARY_SERVICE_OBJECTION"; // 병역법 30일

const DEADLINE_RULES: Record<
  DeadlineType,
  { days: number; label: string; basis: string; specialLaw?: string }
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
  },
  NOISE_VIBRATION_SPECIAL: {
    days: 60,
    label: "소음·진동 특별 청구",
    basis: "고지받은 날부터 60일",
    specialLaw: "소음진동관리법"
  },
  NATIONAL_TAX_OBJECTION: {
    days: 90,
    label: "국세 이의신청",
    basis: "처분 통지일부터 90일",
    specialLaw: "국세기본법 제66조"
  },
  NATIONAL_TAX_REVIEW: {
    days: 90,
    label: "국세 심사청구",
    basis: "처분 통지일부터 90일",
    specialLaw: "국세기본법 제61조"
  },
  NATIONAL_TAX_TRIBUNAL: {
    days: 90,
    label: "국세 심판청구",
    basis: "처분 통지일부터 90일",
    specialLaw: "국세기본법 제68조"
  },
  MILITARY_SERVICE_OBJECTION: {
    days: 30,
    label: "병역 이의신청",
    basis: "처분 통지일부터 30일",
    specialLaw: "병역법"
  }
};

// ─── 한국 공휴일 데이터 (2026-2028, 양력 확정 + 음력 환산) ───────────
// 형식: YYYY-MM-DD → 공휴일명
const HOLIDAYS_2026_2028: Record<string, string> = {
  // 2026
  "2026-01-01": "신정",
  "2026-02-16": "설날 연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날 연휴",
  "2026-03-01": "삼일절",
  "2026-03-02": "삼일절 대체",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-05-25": "부처님오신날 대체",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-08-17": "광복절 대체",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",
  "2026-10-03": "개천절",
  "2026-10-05": "개천절 대체",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절",
  // 2027
  "2027-01-01": "신정",
  "2027-02-06": "설날 연휴",
  "2027-02-07": "설날",
  "2027-02-08": "설날 연휴",
  "2027-02-09": "설날 대체",
  "2027-03-01": "삼일절",
  "2027-05-05": "어린이날",
  "2027-05-13": "부처님오신날",
  "2027-06-06": "현충일",
  "2027-06-07": "현충일 대체",
  "2027-08-15": "광복절",
  "2027-08-16": "광복절 대체",
  "2027-09-14": "추석 연휴",
  "2027-09-15": "추석",
  "2027-09-16": "추석 연휴",
  "2027-10-03": "개천절",
  "2027-10-04": "개천절 대체",
  "2027-10-09": "한글날",
  "2027-10-11": "한글날 대체",
  "2027-12-25": "성탄절",
  // 2028
  "2028-01-01": "신정",
  "2028-01-26": "설날 연휴",
  "2028-01-27": "설날",
  "2028-01-28": "설날 연휴",
  "2028-03-01": "삼일절",
  "2028-05-02": "부처님오신날",
  "2028-05-05": "어린이날",
  "2028-06-06": "현충일",
  "2028-08-15": "광복절",
  "2028-10-02": "추석 연휴",
  "2028-10-03": "추석 / 개천절",
  "2028-10-04": "추석 연휴",
  "2028-10-05": "추석 대체",
  "2028-10-09": "한글날",
  "2028-12-25": "성탄절",
};

export type Holiday = { date: string; name: string };

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isHoliday(date: Date): { holiday: boolean; name?: string; weekend: boolean } {
  const key = fmtDate(date);
  const dow = date.getDay();
  const weekend = dow === 0 || dow === 6;
  const name = HOLIDAYS_2026_2028[key];
  return { holiday: Boolean(name), name, weekend };
}

/**
 * 마감일이 공휴일/주말에 걸리면 다음 영업일로 순연.
 * (민법 제161조: 기간 말일이 공휴일인 경우 다음날 만료)
 */
export function shiftToNextBusinessDay(date: Date): { adjusted: Date; shiftedDays: number; reason?: string } {
  const cur = new Date(date);
  let shifted = 0;
  let reasons: string[] = [];
  // safety cap 30 iterations
  for (let i = 0; i < 30; i++) {
    const info = isHoliday(cur);
    if (!info.holiday && !info.weekend) break;
    if (info.name) reasons.push(info.name);
    else if (info.weekend) reasons.push(cur.getDay() === 0 ? "일요일" : "토요일");
    cur.setDate(cur.getDate() + 1);
    shifted++;
  }
  return {
    adjusted: cur,
    shiftedDays: shifted,
    reason: reasons.length > 0 ? reasons.join(", ") : undefined,
  };
}

/**
 * 기간 내 공휴일 목록.
 */
export function holidaysWithinRange(from: Date, to: Date): Holiday[] {
  const out: Holiday[] = [];
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cur.getTime() <= end.getTime()) {
    const key = fmtDate(cur);
    const name = HOLIDAYS_2026_2028[key];
    if (name) out.push({ date: key, name });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export type DeadlineCalcResult = {
  deadline: Date;
  originalDeadline?: Date;
  daysRemaining: number;
  isExpired: boolean;
  label: string;
  basis: string;
  specialLaw?: string;
  holidayAdjusted?: boolean;
  holidayShiftDays?: number;
  holidayShiftReason?: string;
  holidaysInPeriod?: Holiday[];
};

export function calculateDeadline(
  dispositionDate: Date,
  type: DeadlineType,
  options: { holidayAware?: boolean } = {}
): DeadlineCalcResult {
  const rule = DEADLINE_RULES[type];
  const raw = new Date(dispositionDate);
  raw.setDate(raw.getDate() + rule.days);

  let deadline = new Date(raw);
  let holidayAdjusted = false;
  let shiftedDays = 0;
  let shiftReason: string | undefined;
  let holidaysInPeriod: Holiday[] | undefined;

  if (options.holidayAware) {
    const shift = shiftToNextBusinessDay(raw);
    if (shift.shiftedDays > 0) {
      holidayAdjusted = true;
      shiftedDays = shift.shiftedDays;
      shiftReason = shift.reason;
      deadline = shift.adjusted;
    }
    holidaysInPeriod = holidaysWithinRange(dispositionDate, deadline);
  }

  const now = new Date();
  const msRemaining = deadline.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  return {
    deadline,
    originalDeadline: holidayAdjusted ? raw : undefined,
    daysRemaining,
    isExpired: daysRemaining < 0,
    label: rule.label,
    basis: rule.basis,
    specialLaw: rule.specialLaw,
    holidayAdjusted,
    holidayShiftDays: shiftedDays || undefined,
    holidayShiftReason: shiftReason,
    holidaysInPeriod,
  };
}

export function calculateAllApplicableDeadlines(
  dispositionDate: Date,
  category: string | null,
  options: { holidayAware?: boolean } = {}
): Array<DeadlineCalcResult & { type: DeadlineType }> {
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
  } else if (upperCat.includes("TAX")) {
    applicable.push(
      "NATIONAL_TAX_OBJECTION",
      "NATIONAL_TAX_REVIEW",
      "NATIONAL_TAX_TRIBUNAL"
    );
  } else if (upperCat.includes("NOISE") || upperCat.includes("VIBRATION")) {
    applicable.push("NOISE_VIBRATION_SPECIAL", "ADMIN_APPEAL");
  } else if (upperCat.includes("MILITARY")) {
    applicable.push("MILITARY_SERVICE_OBJECTION", "ADMIN_APPEAL");
  } else {
    applicable.push("OBJECTION_APPEAL", "ADMIN_APPEAL");
  }

  return applicable.map((type) => ({
    ...calculateDeadline(dispositionDate, type, options),
    type
  }));
}

export function getAllDeadlineTypes(): Array<{ type: DeadlineType; label: string; days: number; basis: string; specialLaw?: string }> {
  return (Object.keys(DEADLINE_RULES) as DeadlineType[]).map((type) => ({
    type,
    label: DEADLINE_RULES[type].label,
    days: DEADLINE_RULES[type].days,
    basis: DEADLINE_RULES[type].basis,
    specialLaw: DEADLINE_RULES[type].specialLaw,
  }));
}
