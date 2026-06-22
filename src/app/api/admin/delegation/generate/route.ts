import { NextResponse } from "next/server";
import { z } from "zod";
import {
  generateDelegationPDF,
  generateAndSendForSignature,
} from "@/lib/services/delegation-document-service";
import { createAdminRequestContext } from "@/lib/http/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  caseId: z.string().min(1).max(64),
  templateType: z.enum(["POWER_OF_ATTORNEY", "RETAINER_AGREEMENT", "CONSENT_FORM"]),
  customBody: z.string().max(20_000).optional(),
  sendForSignature: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.delegation.generate");
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return api.error(400, "invalid json", { code: "INVALID_JSON" });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return api.error(400, parsed.error.issues[0]?.message ?? "invalid body", {
      code: "INVALID_BODY",
    });
  }

  if (parsed.data.sendForSignature) {
    const res = await generateAndSendForSignature(parsed.data);
    if (!res.ok) {
      return api.error(422, res.error ?? "PDF 생성/발송 실패", {
        code: "DELEGATION_SEND_FAILED",
      });
    }
    return NextResponse.json({
      ok: true,
      requestId: res.requestId,
      signUrl: res.signUrl,
    });
  }

  const generated = await generateDelegationPDF(parsed.data);
  if (!generated) {
    return api.error(404, "case 또는 party를 찾지 못했습니다.", {
      code: "DELEGATION_CASE_NOT_FOUND",
    });
  }

  return new NextResponse(new Uint8Array(generated.pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(generated.title)}.pdf"`,
      "X-Admin-Request-Id": api.requestId,
    },
  });
}
