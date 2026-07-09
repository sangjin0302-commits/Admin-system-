import { NextResponse } from "next/server";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  computeAccuracy,
  listRecentPredictions,
  logPrediction,
  type PredictionOutcome,
} from "@/lib/services/ai-prediction-tracker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  if (!(await isFeatureEnabled("ai_prediction_accuracy"))) {
    return NextResponse.json({ error: "feature disabled" }, { status: 403 });
  }

  const [summary, recent] = await Promise.all([computeAccuracy(), listRecentPredictions(50)]);
  return NextResponse.json({ summary, recent });
}

export async function POST(req: Request) {
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  if (!(await isFeatureEnabled("ai_prediction_accuracy"))) {
    return NextResponse.json({ error: "feature disabled" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    caseId?: string;
    predictedConfidence?: number;
    actualOutcome?: PredictionOutcome;
  };

  if (!body.caseId || typeof body.predictedConfidence !== "number") {
    return NextResponse.json({ error: "caseId and predictedConfidence required" }, { status: 400 });
  }

  await logPrediction(body.caseId, body.predictedConfidence, body.actualOutcome);
  return NextResponse.json({ ok: true });
}
