import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  calculateDeadline,
  type DeadlineType,
} from "@/lib/services/deadline-calculator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const holidayAware = await isFeatureEnabled("deadline_holiday_aware").catch(() => true);
  const body = (await req.json().catch(() => null)) as
    | { dispositionDate?: string; types?: string[] }
    | null;
  const dispositionDate = body?.dispositionDate;
  const types = Array.isArray(body?.types) ? (body!.types as DeadlineType[]) : [];
  if (!dispositionDate || types.length === 0) {
    return NextResponse.json({ ok: false, error: "dispositionDate·types 필수" }, { status: 400 });
  }
  const d = new Date(dispositionDate);
  if (Number.isNaN(d.getTime())) {
    return NextResponse.json({ ok: false, error: "잘못된 날짜" }, { status: 400 });
  }
  const rows = types.map((type) => {
    const r = calculateDeadline(d, type, { holidayAware });
    return {
      type,
      label: r.label,
      basis: r.basis,
      specialLaw: r.specialLaw,
      deadline: r.deadline.toISOString(),
      originalDeadline: r.originalDeadline?.toISOString(),
      daysRemaining: r.daysRemaining,
      holidayAdjusted: r.holidayAdjusted,
      holidayShiftDays: r.holidayShiftDays,
      holidayShiftReason: r.holidayShiftReason,
      holidaysInPeriod: r.holidaysInPeriod,
    };
  });
  return NextResponse.json({ ok: true, rows, holidayAware });
}
