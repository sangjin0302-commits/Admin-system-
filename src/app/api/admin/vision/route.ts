import { NextResponse } from "next/server";
import {
  analyzeImage,
  type VisionAnalysisType,
} from "@/lib/services/vision-analysis-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      imageBase64?: string;
      mimeType?: string;
      analysisType?: VisionAnalysisType;
    };
    if (!body.imageBase64) {
      return NextResponse.json({ error: "imageBase64 required" }, { status: 400 });
    }
    const result = await analyzeImage({
      imageBase64: body.imageBase64,
      mimeType: body.mimeType ?? "image/jpeg",
      analysisType: body.analysisType ?? "document",
    });
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
