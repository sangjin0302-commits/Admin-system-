import { NextResponse } from "next/server";

import {
  predictWinRate,
  type PredictionInput,
} from "@/lib/services/win-rate-prediction-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PredictionInput>;

    if (
      typeof body.inquiryType !== "string" ||
      typeof body.urgencyLevel !== "string" ||
      typeof body.qualificationScore !== "number" ||
      typeof body.clientType !== "string" ||
      typeof body.hasPreparedDocuments !== "boolean" ||
      typeof body.consultationRequired !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid input payload" },
        { status: 400 }
      );
    }

    const result = predictWinRate(body as PredictionInput);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
