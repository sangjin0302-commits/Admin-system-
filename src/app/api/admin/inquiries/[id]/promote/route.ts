import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { autoCreateCaseFromInquiry } from "@/lib/services/quote-to-case-service";
import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { logger } from "@/lib/utils/logger";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const inquiryId = normalizeAdminEntityId(id);

  if (!inquiryId) {
    return NextResponse.json({ error: "Invalid inquiry ID" }, { status: 400 });
  }

  const enabled = await isFeatureEnabled("inquiry_case_promote_oneclick");
  if (!enabled) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 403 });
  }

  try {
    const caseMatter = await autoCreateCaseFromInquiry(inquiryId);
    if (!caseMatter) {
      return NextResponse.json(
        { error: "Could not create case. Inquiry not found or case already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: true, caseId: caseMatter.id });
  } catch (err) {
    logger.error("[promote] Failed to promote inquiry to case", { inquiryId, err });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
