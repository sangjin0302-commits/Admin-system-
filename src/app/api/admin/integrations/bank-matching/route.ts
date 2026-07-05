import { z } from "zod";
import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  importTransactions,
  listImportHistory,
  loadCandidatesPublic,
  getProviderStatus,
} from "@/lib/services/bank-transaction-matcher";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.integrations.bank.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  try {
    const [history, candidates, providers] = await Promise.all([
      listImportHistory(),
      loadCandidatesPublic(),
      Promise.resolve(getProviderStatus()),
    ]);
    return api.ok({ ok: true, history, candidates, providers });
  } catch (err) {
    api.logError(err);
    return api.error(500, "은행 매칭 조회 실패", { code: "BANK_GET_FAILED" });
  }
}

const ImportSchema = z.object({
  action: z.literal("import"),
  csv: z.string().min(1),
  fileName: z.string().optional(),
  provider: z.enum(["KB", "SHINHAN", "GENERIC"]).optional(),
});
const ConfirmSchema = z.object({
  action: z.literal("confirm"),
  caseId: z.string().min(1),
  amount: z.number().int().positive(),
  memo: z.string().optional(),
  paidAt: z.string().optional(),
});
const PostSchema = z.discriminatedUnion("action", [ImportSchema, ConfirmSchema]);

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.integrations.bank.post");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = PostSchema.safeParse(parsed.body);
  if (!validation.success) return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });

  try {
    if (validation.data.action === "import") {
      const res = await importTransactions(validation.data.csv, {
        fileName: validation.data.fileName,
        provider: validation.data.provider,
      });
      return api.ok({ ok: true, result: res });
    }
    // confirm — CaseAccountingMemo 업데이트로 결제 확정 기록
    const { caseId, amount, memo, paidAt } = validation.data;
    await prisma.caseAccountingMemo.upsert({
      where: { caseId },
      create: {
        caseId,
        paidAmount: amount,
        paymentStatus: "PAID",
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        paymentMemo: memo,
      },
      update: {
        paidAmount: amount,
        paymentStatus: "PAID",
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        paymentMemo: memo,
      },
    });
    return api.ok({ ok: true });
  } catch (err) {
    api.logError(err);
    return api.error(500, "은행 매칭 처리 실패", { code: "BANK_POST_FAILED" });
  }
}
