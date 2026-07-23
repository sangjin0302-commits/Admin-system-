import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { listSubscribers } from "@/lib/services/newsletter-service";
import { sendEmail } from "@/lib/services/email-service";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ethosattorney.com").replace(/\/+$/, "");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildHtml(posts: Array<{ title: string; slug: string; excerpt: string }>): string {
  const base = siteUrl();
  const rows = posts
    .map(
      (p) => `
        <tr><td style="padding:16px 0;border-bottom:1px solid #e5e3da;">
          <a href="${base}/blog/${p.slug}" style="font-size:15px;font-weight:700;color:#1a2744;text-decoration:none;">${escapeHtml(p.title)}</a>
          <p style="margin:6px 0 0;font-size:13px;color:#666;line-height:1.6;">${escapeHtml(p.excerpt || "").slice(0, 140)}</p>
        </td></tr>
      `
    )
    .join("");
  return `
    <div style="font-family:'Pretendard',sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#faf8f2;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-size:20px;color:#1a2744;margin:0;">ETHOS 주간 뉴스레터 (테스트)</h1>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;background:#fff;border-radius:12px;padding:8px 20px;">
        ${rows || `<tr><td style="padding:20px 0;font-size:13px;color:#999;">이번 주 새 글이 없습니다.</td></tr>`}
      </table>
    </div>
  `;
}

/**
 * Send a test digest to the first N subscribers (max 3) so admin can review formatting
 * without spamming everyone. If no subscribers, sends to contact.email from env.
 */
export async function POST() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const posts = await prisma.blogPost.findMany({
    where: { published: true, publishedAt: { gte: weekAgo } },
    orderBy: { publishedAt: "desc" },
    select: { title: true, slug: true, excerpt: true },
    take: 20,
  }).catch(() => []);

  try {
    const subscribers = await listSubscribers();
    const recipients = subscribers.slice(0, 3);
    const html = buildHtml(posts);

    let sent = 0;
    for (const s of recipients) {
      const res = await sendEmail({
        to: s.email,
        subject: "[ETHOS 테스트] 주간 뉴스레터",
        html,
      });
      if (res.ok) sent++;
    }

    return NextResponse.json({ ok: true, posts: posts.length, recipients: sent });
  } catch (error) {
    console.error("[admin/newsletter/test-digest] failed", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
