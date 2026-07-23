import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { listSubscribers } from "@/lib/services/newsletter-service";
import { sendEmail } from "@/lib/services/email-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ethosattorney.com").replace(/\/+$/, "");
}

function buildHtml(posts: Array<{ title: string; slug: string; excerpt: string; publishedAt: Date | null }>): string {
  const base = siteUrl();
  const rows = posts
    .map(
      (p) => `
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid #e5e3da;">
            <a href="${base}/blog/${p.slug}" style="font-size:15px;font-weight:700;color:#1a2744;text-decoration:none;">${escapeHtml(p.title)}</a>
            <p style="margin:6px 0 0;font-size:13px;color:#666;line-height:1.6;">${escapeHtml(p.excerpt || "").slice(0, 140)}</p>
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="font-family:'Pretendard',sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#faf8f2;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-size:20px;color:#1a2744;margin:0;">ETHOS 주간 뉴스레터</h1>
        <p style="font-size:11px;color:#b8963e;margin:4px 0 0;letter-spacing:2px;text-transform:uppercase;">Weekly Digest</p>
      </div>
      <p style="font-size:14px;color:#333;line-height:1.7;">지난 7일 동안 새로 올라온 글을 정리해서 보내드립니다.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;background:#fff;border-radius:12px;padding:8px 20px;">
        ${rows || `<tr><td style="padding:20px 0;font-size:13px;color:#999;">이번 주 새 글이 없습니다.</td></tr>`}
      </table>
      <hr style="border:none;border-top:1px solid #e5e3da;margin:24px 0;" />
      <p style="font-size:11px;color:#999;text-align:center;">
        <a href="${base}" style="color:#b8963e;">ethosattorney.com</a>
      </p>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const posts = await prisma.blogPost.findMany({
    where: { published: true, publishedAt: { gte: weekAgo } },
    orderBy: { publishedAt: "desc" },
    select: { title: true, slug: true, excerpt: true, publishedAt: true },
    take: 20,
  }).catch(() => []);

  try {
    const subscribers = await listSubscribers();
    if (subscribers.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, note: "no subscribers" });
    }

    const html = buildHtml(posts);
    const subject = `[ETHOS] 주간 소식 (${posts.length}편)`;

    // Send in small batches (Resend recommends BCC or 1-per-message; we send individually to keep it simple).
    let sent = 0;
    let failed = 0;
    for (const sub of subscribers) {
      const res = await sendEmail({ to: sub.email, subject, html });
      if (res.ok) sent++;
      else failed++;
    }

    logger.info("[cron/newsletter-digest] complete", { total: subscribers.length, sent, failed, posts: posts.length });
    return NextResponse.json({ ok: true, sent, failed, posts: posts.length });
  } catch (error) {
    console.error("[cron/newsletter-digest] failed", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
