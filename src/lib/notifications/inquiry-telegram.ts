import type { InquiryType, LanguageCode, UrgencyLevel } from "@/types/inquiry";
import { inquiryTypeLabels, toLocale, urgencyLabels } from "@/types/inquiry";

type InquiryTelegramNotificationInput = {
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
};

function getTelegramConfig() {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN?.trim(),
    chatId: process.env.TELEGRAM_CHAT_ID?.trim(),
    adminAppUrl: process.env.ADMIN_APP_URL?.trim()
  };
}

function escapeTelegramMarkdown(value: string) {
  return value.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

function clipText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function buildTelegramMessage(input: InquiryTelegramNotificationInput) {
  const locale = toLocale(input.preferredLanguage);
  const inquiryTypeLabel = inquiryTypeLabels[input.inquiryType][locale];
  const urgencyLabel = urgencyLabels[input.urgencyLevel][locale];
  const config = getTelegramConfig();
  const summary = clipText(input.description.replace(/\s+/g, " ").trim(), 300);
  const lines = [
    "새 상담 접수 알림",
    "",
    `접수번호: ${input.id}`,
    `이름: ${input.contactName}`,
    input.organizationName ? `회사명: ${input.organizationName}` : null,
    `이메일: ${input.email}`,
    input.phone ? `전화번호: ${input.phone}` : null,
    `문의 유형: ${inquiryTypeLabel}`,
    `긴급도: ${urgencyLabel}`,
    `제목: ${input.title}`,
    input.requestedOutcome ? `원하는 결과: ${input.requestedOutcome}` : null,
    "",
    "상세 내용",
    summary,
    config.adminAppUrl ? `${config.adminAppUrl.replace(/\/$/, "")}/admin/inquiries` : null
  ]
    .filter(Boolean)
    .map((line) => escapeTelegramMarkdown(String(line)));

  return lines.join("\n");
}

export async function sendTelegramMessage(text: string) {
  const config = getTelegramConfig();
  if (!config.botToken || !config.chatId) {
    return;
  }

  const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: config.chatId,
      text,
      parse_mode: "MarkdownV2",
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to send Telegram notification: ${response.status} ${body}`);
  }
}

export async function sendInquiryTelegramNotification(input: InquiryTelegramNotificationInput) {
  await sendTelegramMessage(buildTelegramMessage(input));
}
