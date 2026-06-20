import { Resend } from "resend";
import { logger } from "@/lib/utils/logger";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL ?? "noreply@ethos.kr";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? "";

export async function sendNewInquiryNotification(inquiry: {
  name: string;
  email: string;
  phone: string;
  inquiryType: string;
  message: string;
}) {
  if (!resend || !ADMIN_EMAIL) return { success: false, reason: "not-configured" };

  try {
    const { data, error } = await resend.emails.send({
      from: `ETHOS 알림 <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `[ETHOS] 새 문의 접수 — ${inquiry.name} (${inquiry.inquiryType})`,
      html: `
        <div style="font-family: 'Pretendard', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a3c5f; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #faf6ef; font-size: 20px; margin: 0;">
              <span style="color: #c9a961;">ETHOS</span> 새 문의 접수
            </h1>
          </div>
          <div style="background: #faf6ef; padding: 32px; border: 1px solid #e8e0d4; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 100px;">이름</td>
                <td style="padding: 8px 0; color: #1a3c5f; font-weight: 600;">${inquiry.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">이메일</td>
                <td style="padding: 8px 0;">${inquiry.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">전화</td>
                <td style="padding: 8px 0;">${inquiry.phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">유형</td>
                <td style="padding: 8px 0;">${inquiry.inquiryType}</td>
              </tr>
            </table>
            <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e8e0d4;">
              <p style="margin: 0; font-size: 14px; color: #374151; white-space: pre-wrap;">${inquiry.message}</p>
            </div>
            <div style="margin-top: 24px; text-align: center;">
              <a href="https://adminofficemvp2.vercel.app/admin/inquiries" style="display: inline-block; background: #1a3c5f; color: #faf6ef; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                관리자 페이지에서 확인
              </a>
            </div>
          </div>
        </div>
      `,
    });

    if (error) return { success: false, reason: error.message };
    return { success: true, id: data?.id };
  } catch (err) {
    logger.error("Failed to send email notification:", err);
    return { success: false, reason: "send-error" };
  }
}
