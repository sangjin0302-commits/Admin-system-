import { logger } from "@/lib/utils/logger";

const RESEND_API_URL = "https://api.resend.com/emails";

type EmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "ETHOS 행정사사무소 <noreply@ethosattorney.com>";

export async function sendEmail(input: EmailInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    logger.warn("[email] RESEND_API_KEY not configured");
    return { ok: false, error: "Email service not configured" };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        reply_to: input.replyTo,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      logger.warn("[email] send failed", res.status, err);
      return { ok: false, error: `Send failed: ${res.status}` };
    }

    const data = await res.json();
    return { ok: true, id: data.id };
  } catch (err) {
    logger.warn("[email] exception", err);
    return { ok: false, error: "Network error" };
  }
}

export async function sendIntakeConfirmation(input: {
  to: string;
  contactName: string;
  trackingCode?: string;
}): Promise<{ ok: boolean }> {
  const trackingSection = input.trackingCode
    ? `<p style="margin-top:16px;padding:12px 16px;background:#f8f6f0;border-radius:8px;font-size:14px;">접수번호: <strong>${input.trackingCode}</strong><br><a href="https://ethosattorney.com/track?code=${input.trackingCode}" style="color:#b8963e;">접수 현황 확인</a></p>`
    : "";

  return sendEmail({
    to: input.to,
    subject: "[ETHOS 행정사사무소] 의뢰 접수가 완료되었습니다",
    html: `
      <div style="font-family:'Pretendard',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="font-size:20px;color:#1a2744;margin:0;">ETHOS 행정사사무소</h1>
          <p style="font-size:12px;color:#b8963e;margin:4px 0 0;">Administrative Services Office</p>
        </div>
        <p style="font-size:15px;color:#333;line-height:1.7;">
          ${input.contactName}님, 안녕하세요.<br><br>
          의뢰 접수가 완료되었습니다.<br>
          담당자가 내용을 확인한 후 <strong>영업일 24시간 이내</strong>에 연락드리겠습니다.
        </p>
        ${trackingSection}
        <hr style="border:none;border-top:1px solid #e5e3da;margin:24px 0;" />
        <p style="font-size:12px;color:#999;line-height:1.6;">
          ETHOS 행정사사무소 · 행정사 Jean<br>
          <a href="https://ethosattorney.com" style="color:#b8963e;">ethosattorney.com</a>
        </p>
      </div>
    `,
  });
}

export async function sendNewBlogNotification(input: {
  to: string[];
  postTitle: string;
  postSlug: string;
  postDescription?: string;
}): Promise<{ ok: boolean }> {
  return sendEmail({
    to: input.to,
    subject: `[ETHOS 칼럼] ${input.postTitle}`,
    html: `
      <div style="font-family:'Pretendard',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="font-size:20px;color:#1a2744;margin:0;">ETHOS 행정사사무소</h1>
        </div>
        <h2 style="font-size:18px;color:#1a2744;margin:0 0 12px;">${input.postTitle}</h2>
        ${input.postDescription ? `<p style="font-size:14px;color:#666;line-height:1.6;">${input.postDescription}</p>` : ""}
        <a href="https://ethosattorney.com/blog/${input.postSlug}" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#1a2744;color:#fff;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600;">
          글 읽기
        </a>
        <hr style="border:none;border-top:1px solid #e5e3da;margin:24px 0;" />
        <p style="font-size:11px;color:#999;">
          <a href="https://ethosattorney.com" style="color:#b8963e;">ethosattorney.com</a>
        </p>
      </div>
    `,
  });
}
