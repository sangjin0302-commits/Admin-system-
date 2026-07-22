import { generateResumePdf, type ResumeEntry } from "@/lib/pdf/generate";
import { CREDENTIAL_TYPE_LABELS, listPublicCredentials } from "@/lib/services/credentials";

/**
 * 대표 약력(이력서) PDF 생성. 게시된 경력 항목 기반.
 * /api/admin/* — Basic Auth 보호.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : "대표 행정사";
  const subtitle = typeof body?.subtitle === "string" ? body.subtitle.trim() : "ETHOS 행정사사무소";

  try {
    const creds = await listPublicCredentials();
    const entries: ResumeEntry[] = creds.map((c) => ({
      typeLabel: CREDENTIAL_TYPE_LABELS[c.type] ?? c.type,
      year: c.year,
      title: c.title,
      detail: c.detail || undefined
    }));

    const pdf = await generateResumePdf({ name, subtitle, entries });
    const date = new Date().toISOString().slice(0, 10);

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume-${date}.pdf"`
      }
    });
  } catch (error) {
    console.error("admin/credentials/resume POST failed", error);
    return Response.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
