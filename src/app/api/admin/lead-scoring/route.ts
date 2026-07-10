import { NextResponse } from "next/server";
import { getLeadScores } from "@/lib/services/lead-scoring-service";

export async function GET() {
  const report = await getLeadScores();
  return NextResponse.json(report);
}
