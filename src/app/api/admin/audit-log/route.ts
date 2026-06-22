import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "CREATE",
  "UPDATE",
  "DELETE",
  "EXPORT",
  "PAYMENT_CANCEL",
  "ESIGN_SEND",
  "ALIMTALK_SEND",
  "ROLE_CHANGE",
  "CONFIG_CHANGE",
] as const;

function escapeCsv(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.audit-log.list");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "AUDITOR"]);
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const resource = url.searchParams.get("resource");
  const actor = url.searchParams.get("actor");
  const since = url.searchParams.get("since");
  const format = url.searchParams.get("format");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 200), 5000);

  const where: Record<string, unknown> = {};
  if (action && (VALID_ACTIONS as readonly string[]).includes(action)) {
    where.action = action;
  }
  if (resource) where.resource = resource;
  if (actor) where.actorEmail = actor;
  if (since) {
    const d = new Date(since);
    if (!Number.isNaN(d.getTime())) where.createdAt = { gte: d };
  }

  try {
    const items = await prisma.adminAuditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    if (format === "csv") {
      const header = [
        "createdAt",
        "actorEmail",
        "actorRole",
        "action",
        "resource",
        "resourceId",
        "ip",
        "details",
      ].join(",");
      const lines = items.map((it) =>
        [
          it.createdAt.toISOString(),
          it.actorEmail,
          it.actorRole ?? "",
          it.action,
          it.resource,
          it.resourceId ?? "",
          it.ip ?? "",
          it.details ?? "",
        ]
          .map(escapeCsv)
          .join(",")
      );
      const csv = "﻿" + [header, ...lines].join("\n");
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="audit-log-${Date.now()}.csv"`,
          "X-Admin-Request-Id": api.requestId,
        },
      });
    }

    return api.ok({
      ok: true,
      items: items.map((it) => ({
        ...it,
        createdAt: it.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    api.logError(err);
    return api.error(500, "감사 로그 조회 실패", { code: "AUDIT_LIST_FAILED" });
  }
}
