import { NextRequest, NextResponse } from "next/server";
import { submitSurveyResponse } from "@/lib/services/satisfaction-survey-service";

export async function POST(req: NextRequest) {
  const { token, rating, comment } = await req.json();
  if (!token || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const ok = await submitSurveyResponse(token, rating, comment || "");
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
