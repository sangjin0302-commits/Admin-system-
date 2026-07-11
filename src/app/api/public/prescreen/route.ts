import { NextResponse } from "next/server";

import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { prescreenInquiry } from "@/lib/services/intake-prescreen-service";

export async function POST(request: Request) {
  const enabled = await isFeatureEnabled("intake_ai_prescreen");
  if (!enabled) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      category?: string;
      description?: string;
      urgencyHint?: string;
    };

    if (!body.category || !body.description) {
      return NextResponse.json(
        { error: "category and description are required" },
        { status: 400 },
      );
    }

    const result = await prescreenInquiry({
      category: body.category,
      description: body.description,
      urgencyHint: body.urgencyHint,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Prescreen failed" },
      { status: 500 },
    );
  }
}
