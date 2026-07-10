import { z } from "zod";
import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  getSectionOrder,
  setSectionOrder,
  SECTION_ORDER_SCHEMA,
  type PageId
} from "@/lib/services/site-section-order-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ page: string }> };

const PAGES = new Set<PageId>(Object.keys(SECTION_ORDER_SCHEMA) as PageId[]);

function isPageId(v: string): v is PageId {
  return PAGES.has(v as PageId);
}

export async function GET(req: Request, ctx: Ctx) {
  const api = createAdminRequestContext("admin.section-order.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const { page } = await ctx.params;
  if (!isPageId(page)) {
    return api.error(404, "알 수 없는 페이지", { code: "PAGE_UNKNOWN" });
  }
  try {
    const order = await getSectionOrder(page);
    return api.ok({ ok: true, page, order, schema: SECTION_ORDER_SCHEMA[page] });
  } catch (err) {
    api.logError(err);
    return api.error(500, "순서 조회 실패", { code: "SECTION_ORDER_GET_FAILED" });
  }
}

const PutSchema = z.object({
  order: z.array(z.string()).max(64)
});

export async function PUT(req: Request, ctx: Ctx) {
  const api = createAdminRequestContext("admin.section-order.set");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const { page } = await ctx.params;
  if (!isPageId(page)) {
    return api.error(404, "알 수 없는 페이지", { code: "PAGE_UNKNOWN" });
  }
  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = PutSchema.safeParse(parsed.body);
  if (!validation.success) {
    return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });
  }

  try {
    const order = await setSectionOrder(page, validation.data.order);
    return api.ok({ ok: true, page, order });
  } catch (err) {
    api.logError(err);
    return api.error(500, "순서 저장 실패", { code: "SECTION_ORDER_SET_FAILED" });
  }
}
