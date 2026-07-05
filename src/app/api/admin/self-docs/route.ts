import { createAdminRequestContext } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { regenerateDocs, previewDocs, readGeneratedDoc, type DocCategory } from "@/lib/services/self-documentation-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.self-docs.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const cat = url.searchParams.get("category") as DocCategory | null;
  try {
    if (cat && ["feature", "config", "env"].includes(cat)) {
      const md = (await readGeneratedDoc(cat)) ?? previewDocs()[cat];
      return api.ok({ ok: true, category: cat, markdown: md });
    }
    const previews = previewDocs();
    return api.ok({ ok: true, previews });
  } catch (err) {
    api.logError(err);
    return api.error(500, "문서 조회 실패", { code: "SELF_DOCS_READ_FAILED" });
  }
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.self-docs.regenerate");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const docs = await regenerateDocs();
    return api.ok({ ok: true, docs });
  } catch (err) {
    api.logError(err);
    return api.error(500, "문서 재생성 실패", { code: "SELF_DOCS_REGEN_FAILED" });
  }
}
