import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";

const SPEND_SETTING_KEY = "channel.roi.spend";

function parseCsv(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return out;
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const chIdx = header.findIndex((h) => h === "channel" || h === "채널");
  const spendIdx = header.findIndex((h) => h === "spend" || h === "광고비" || h === "cost");
  if (chIdx < 0 || spendIdx < 0) return out;
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    const ch = cells[chIdx]?.trim();
    const spend = Number(cells[spendIdx]?.trim().replace(/[",원]/g, ""));
    if (ch && Number.isFinite(spend) && spend >= 0) out[ch] = spend;
  }
  return out;
}

export async function POST(req: Request) {
  if (!(await isFeatureEnabled("ad_spend_csv_import"))) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  let text: string;
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });
    text = await file.text();
  } else {
    text = await req.text();
  }

  const incoming = parseCsv(text);
  const incomingCount = Object.keys(incoming).length;
  if (incomingCount === 0) {
    return NextResponse.json({ error: "no valid rows. header must include channel + spend" }, { status: 400 });
  }

  const existing = await prisma.siteSetting.findUnique({ where: { key: SPEND_SETTING_KEY } });
  let merged: Record<string, number> = {};
  if (existing?.value) {
    try {
      const parsed = JSON.parse(existing.value);
      if (parsed && typeof parsed === "object") {
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          const n = Number(v);
          if (Number.isFinite(n) && n >= 0) merged[k] = n;
        }
      }
    } catch {}
  }
  merged = { ...merged, ...incoming };

  await prisma.siteSetting.upsert({
    where: { key: SPEND_SETTING_KEY },
    create: { key: SPEND_SETTING_KEY, value: JSON.stringify(merged) },
    update: { value: JSON.stringify(merged) },
  });

  return NextResponse.json({ imported: incomingCount, total: Object.keys(merged).length, merged });
}
