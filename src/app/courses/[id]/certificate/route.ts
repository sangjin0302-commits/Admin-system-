import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCourse } from "@/lib/services/course-service";
import { isCompleted, issueCertificate } from "@/lib/services/certification-course-service";
import { generateCertificatePdf } from "@/lib/services/certificate-pdf-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { getSiteSettings } from "@/lib/services/site-settings";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isFeatureEnabled("certification_courses"))) {
    return NextResponse.json({ ok: false, error: "FEATURE_DISABLED" }, { status: 404 });
  }
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  const { id } = await ctx.params;
  const course = await getCourse(id);
  if (!course) return NextResponse.json({ ok: false, error: "COURSE_NOT_FOUND" }, { status: 404 });
  const { done } = await isCompleted(session.user.id, id);
  if (!done) return NextResponse.json({ ok: false, error: "NOT_COMPLETED" }, { status: 403 });

  const p = await issueCertificate(session.user.id, id);
  const settings = await getSiteSettings();
  const buffer = await generateCertificatePdf({
    learnerName: session.user.name ?? session.user.email ?? "수료자",
    courseName: course.title,
    issuedAt: new Date(p.certificateIssuedAt ?? Date.now()),
    certificateNo: `ETHOS-${id.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    officeName: settings["trust.representative"] ? `행정사 사무소 ETHOS` : undefined,
    representativeName: settings["trust.representative"] || undefined,
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="ethos-certificate-${id}.pdf"`,
    },
  });
}
