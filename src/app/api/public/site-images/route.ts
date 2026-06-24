import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";

const IMAGE_KEYS = ["image.logo", "image.aboutPhoto", "image.ogImage"];

export async function GET() {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: IMAGE_KEYS } } }).catch(() => []);
  const images: Record<string, string> = {};
  for (const row of rows) {
    if (row.value) images[row.key] = row.value;
  }
  return NextResponse.json({ ok: true, images }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
