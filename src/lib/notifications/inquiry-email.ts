import type { InquiryType, LanguageCode, UrgencyLevel } from "@/types/inquiry";
import { inquiryTypeLabels, toLocale, urgencyLabels } from "@/types/inquiry";

type InquiryEmailNotificationInput = {
  id: string;
  contactName: string;
  organizationName?: string | null;
  email: string;
  phone?: string | null;
  title: string;
  description: string;
  requestedOutcome?: string | null;
  inquiryType: InquiryType;
  urgencyLevel: UrgencyLevel;
  preferredLanguage: LanguageCode;
  generatedReceiptMessage: string;
};

type SendEmailInput = {
  to: string[];
  subject: string;
  text: string;
  html: string;
};

function getEmailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY?.trim(),
    fromEmail: process.env.RESEND_FROM_EMAIL?.trim(),
    fromName: process.env.RESEND_FROM_NAME?.trim() || "Admin Office",
    notificationTo:
      process.env.INQUIRY_NOTIFICATION_TO?.split(",")
        .map((entry) => entry.trim())
        .filter(Boolean) ?? [],
    sendConfirmation: process.env.SEND_INQUIRY_CONFIRMATION === "true"
  };
}

function buildFromHeader(fromName: string, fromEmail: string) {
  return `${fromName} <${fromEmail}>`;
}

async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  const config = getEmailConfig();

  if (!config.apiKey || !config.fromEmail || to.length === 0) {
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: buildFromHeader(config.fromName, config.fromEmail),
      to,
      subject,
      text,
      html
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to send email: ${response.status} ${body}`);
  }
}

function buildAdminNotification(input: InquiryEmailNotificationInput): SendEmailInput | null {
  const config = getEmailConfig();
  if (config.notificationTo.length === 0) return null;

  const locale = toLocale(input.preferredLanguage);
  const inquiryTypeLabel = inquiryTypeLabels[input.inquiryType][locale];
  const urgencyLabel = urgencyLabels[input.urgencyLevel][locale];
  const organizationLine = input.organizationName ? `회사명: ${input.organizationName}\n` : "";
  const phoneLine = input.phone ? `전화번호: ${input.phone}\n` : "";
  const outcomeLine = input.requestedOutcome ? `원하는 결과: ${input.requestedOutcome}\n` : "";
  const text = [
    `새 상담 접수가 등록되었습니다.`,
    ``,
    `접수번호: ${input.id}`,
    `이름: ${input.contactName}`,
    organizationLine.trimEnd(),
    `이메일: ${input.email}`,
    phoneLine.trimEnd(),
    `문의 유형: ${inquiryTypeLabel}`,
    `긴급도: ${urgencyLabel}`,
    `제목: ${input.title}`,
    outcomeLine.trimEnd(),
    ``,
    `상세 내용`,
    input.description
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17222d">
      <h2 style="margin:0 0 16px">새 상담 접수 알림</h2>
      <p><strong>접수번호:</strong> ${input.id}</p>
      <p><strong>이름:</strong> ${input.contactName}</p>
      ${input.organizationName ? `<p><strong>회사명:</strong> ${input.organizationName}</p>` : ""}
      <p><strong>이메일:</strong> ${input.email}</p>
      ${input.phone ? `<p><strong>전화번호:</strong> ${input.phone}</p>` : ""}
      <p><strong>문의 유형:</strong> ${inquiryTypeLabel}</p>
      <p><strong>긴급도:</strong> ${urgencyLabel}</p>
      <p><strong>제목:</strong> ${input.title}</p>
      ${input.requestedOutcome ? `<p><strong>원하는 결과:</strong> ${input.requestedOutcome}</p>` : ""}
      <div style="margin-top:16px;padding:16px;border:1px solid #d7dfe6;border-radius:10px;background:#f8fafc">
        <p style="margin:0 0 8px"><strong>상세 내용</strong></p>
        <p style="margin:0;white-space:pre-wrap">${input.description}</p>
      </div>
    </div>
  `;

  return {
    to: config.notificationTo,
    subject: `[상담 접수] ${input.contactName} - ${input.title}`,
    text,
    html
  };
}

function buildClientConfirmation(input: InquiryEmailNotificationInput): SendEmailInput | null {
  const config = getEmailConfig();
  if (!config.sendConfirmation) return null;

  const locale = toLocale(input.preferredLanguage);
  const subject =
    locale === "en" ? "Your inquiry has been received" : "상담 접수가 완료되었습니다";
  const text =
    locale === "en"
      ? [
          `Hello ${input.contactName},`,
          ``,
          `Your inquiry has been submitted successfully.`,
          `Reference number: ${input.id}`,
          ``,
          input.generatedReceiptMessage,
          ``,
          `Thank you.`
        ].join("\n")
      : [
          `${input.contactName}님,`,
          ``,
          `상담 접수가 완료되었습니다.`,
          `접수번호: ${input.id}`,
          ``,
          input.generatedReceiptMessage,
          ``,
          `문의주셔서 감사합니다.`
        ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17222d">
      <h2 style="margin:0 0 16px">${subject}</h2>
      <p>${locale === "en" ? `Hello ${input.contactName},` : `${input.contactName}님,`}</p>
      <p>${locale === "en" ? "Your inquiry has been submitted successfully." : "상담 접수가 완료되었습니다."}</p>
      <p><strong>${locale === "en" ? "Reference number" : "접수번호"}:</strong> ${input.id}</p>
      <div style="margin-top:16px;padding:16px;border:1px solid #d7dfe6;border-radius:10px;background:#f8fafc">
        <p style="margin:0;white-space:pre-wrap">${input.generatedReceiptMessage}</p>
      </div>
    </div>
  `;

  return {
    to: [input.email],
    subject,
    text,
    html
  };
}

export async function sendInquiryNotificationEmails(input: InquiryEmailNotificationInput) {
  const messages = [buildAdminNotification(input), buildClientConfirmation(input)].filter(
    (value): value is SendEmailInput => Boolean(value)
  );

  if (messages.length === 0) return;

  await Promise.all(messages.map((message) => sendEmail(message)));
}
