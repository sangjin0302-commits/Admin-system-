import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";

import { prisma } from "@/lib/prisma/client";
import { invalidateSiteSettingsCache } from "@/lib/services/site-settings";

const ALLOWED_KEYS = ["image.logo", "image.aboutPhoto", "image.ogImage"] as const;
type ImageKey = (typeof ALLOWED_KEYS)[number];

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ ok: false, error: "INVALID_FORM" }, { status: 400 });
  }

  const key = formData.get("key") as string | null;
  const file = formData.get("file") as File | null;

  if (!key || !ALLOWED_KEYS.includes(key as ImageKey)) {
    return NextResponse.json({ ok: false, error: "INVALID_KEY" }, { status: 400 });
  }
  if (!file || file.size === 0) {
    return NextResponse.json({ ok: false, error: "NO_FILE" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ ok: false, error: "FILE_TOO_LARGE" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "NOT_IMAGE" }, { status: 400 });
  }

  // Delete previous blob if exists
  const existing = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
  if (existing?.value) {
    try {
      await del(existing.value);
    } catch {
      // old blob may not exist
    }
  }

  // Upload to Vercel Blob
  const blob = await put(`site/${key}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  // Save URL to SiteSetting
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: blob.url },
    update: { value: blob.url },
  });
  invalidateSiteSettingsCache();

  return NextResponse.json({ ok: true, url: blob.url });
}

export async function DELETE(request: Request) {
  const { key } = await request.json().catch(() => ({ key: null }));
  if (!key || !ALLOWED_KEYS.includes(key as ImageKey)) {
    return NextResponse.json({ ok: false, error: "INVALID_KEY" }, { status: 400 });
  }

  const existing = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
  if (existing?.value) {
    try {
      await del(existing.value);
    } catch {
      // blob may already be gone
    }
  }

  await prisma.siteSetting.delete({ where: { key } }).catch(() => null);
  invalidateSiteSettingsCache();

  return NextResponse.json({ ok: true });
}
