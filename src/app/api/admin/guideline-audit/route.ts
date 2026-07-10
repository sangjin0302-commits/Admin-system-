import { createAdminRequestContext } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { prisma } from "@/lib/prisma/client";
import {
  getCustomRules,
  scanContent,
  type GuidelineViolation,
} from "@/lib/services/marketing-guideline-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export type AuditFinding = {
  source: "site_setting" | "blog_post";
  sourceId: string;
  label: string;
  href?: string;
  violations: GuidelineViolation[];
};

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.guideline-audit.scan");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const [settings, posts, custom] = await Promise.all([
      prisma.siteSetting.findMany({ select: { key: true, value: true } }),
      prisma.blogPost.findMany({
        select: { id: true, slug: true, title: true, body: true, excerpt: true },
      }),
      getCustomRules(),
    ]);

    const findings: AuditFinding[] = [];
    let errorCount = 0;
    let warnCount = 0;

    for (const s of settings) {
      if (!s.value) continue;
      // Skip large JSON blobs / non-content keys we don't scan
      if (s.key === "feature.flags" || s.key === "marketing_guideline_rules") continue;
      const v = scanContent(s.value, custom);
      if (v.length === 0) continue;
      findings.push({
        source: "site_setting",
        sourceId: s.key,
        label: s.key,
        href: `/admin/content-editor`,
        violations: v,
      });
      for (const x of v) (x.severity === "error" ? errorCount++ : warnCount++);
    }

    for (const p of posts) {
      const combined = `${p.title ?? ""}\n${p.excerpt ?? ""}\n${p.body ?? ""}`;
      const v = scanContent(combined, custom);
      if (v.length === 0) continue;
      findings.push({
        source: "blog_post",
        sourceId: p.id,
        label: p.title || p.slug,
        href: `/admin/blog/${p.id}`,
        violations: v,
      });
      for (const x of v) (x.severity === "error" ? errorCount++ : warnCount++);
    }

    return api.ok({
      ok: true,
      summary: {
        totalFindings: findings.length,
        errorCount,
        warnCount,
        scannedSettings: settings.length,
        scannedPosts: posts.length,
      },
      findings,
    });
  } catch (err) {
    api.logError(err);
    return api.error(500, "지침 감사 실행 실패", { code: "GUIDELINE_AUDIT_FAILED" });
  }
}
