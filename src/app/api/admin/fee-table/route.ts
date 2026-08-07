import { NextResponse } from "next/server";
import { withJsonHandler } from "@/lib/utils/api-handler";
import {
  getFeeTable,
  getAdjustments,
  saveFeeTable,
  saveAdjustments,
  resetFeeTable,
  resetAdjustments,
  DEFAULT_ADJUSTMENTS,
  type FeeTable,
} from "@/lib/services/fee-estimator-service";
import { invalidatePath } from "@/lib/services/edge-cache-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const [table, adjustments] = await Promise.all([getFeeTable(), getAdjustments()]);
  return NextResponse.json({ table, adjustments });
}

type SaveBody = {
  table?: FeeTable;
  adjustments?: typeof DEFAULT_ADJUSTMENTS;
};

export const POST = withJsonHandler<SaveBody, { ok: true }>(
  async (body) => {
    if (body.table) await saveFeeTable(body.table);
    if (body.adjustments) await saveAdjustments(body.adjustments);
    // /fees, /en/fees(fees-content)는 getFeeTable 을 읽는다.
    for (const p of ["/fees", "/en/fees"]) void invalidatePath(p, "fee-table save");
    return { ok: true };
  },
  { logScope: "admin.fee-table.save", errorMessage: "수임료 테이블 저장 실패" },
);

export async function DELETE() {
  await Promise.all([resetFeeTable(), resetAdjustments()]);
  for (const p of ["/fees", "/en/fees"]) void invalidatePath(p, "fee-table reset");
  return NextResponse.json({ ok: true });
}
