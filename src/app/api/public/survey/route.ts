import { NextResponse } from "next/server";
import { submitSurvey } from "@/lib/services/nps-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, score, feedback, category } = body;

    if (!token || typeof score !== "number" || score < 0 || score > 10) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const survey = await submitSurvey(token, { score, feedback, category });
    return NextResponse.json({ ok: true, id: survey.id });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
