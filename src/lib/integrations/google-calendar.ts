import { prisma } from "@/lib/prisma/client";

type CalendarUpsertPayload = {
  action: "upsert";
  sourceType: "case-deadline" | "case-followup";
  sourceId: string;
  eventId?: string | null;
  title: string;
  description?: string;
  date: string;
};

type CalendarDeletePayload = {
  action: "delete";
  sourceType: "case-deadline" | "case-followup";
  sourceId: string;
  eventId?: string | null;
};

type CalendarWebhookPayload = CalendarUpsertPayload | CalendarDeletePayload;

function getCalendarConfig() {
  return {
    enabled: process.env.GOOGLE_CALENDAR_SYNC_ENABLED?.trim() === "true",
    webhookUrl: process.env.GOOGLE_CALENDAR_WEBHOOK_URL?.trim(),
    webhookToken: process.env.GOOGLE_CALENDAR_WEBHOOK_TOKEN?.trim(),
    adminAppUrl: process.env.ADMIN_APP_URL?.trim()
  };
}

async function postCalendarWebhook(payload: CalendarWebhookPayload) {
  const config = getCalendarConfig();
  if (!config.enabled || !config.webhookUrl || !config.webhookToken) {
    return null;
  }

  const response = await fetch(config.webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json"
    },
    body: JSON.stringify({
      ...payload,
      token: config.webhookToken
    })
  });

  if (!response.ok) {
    throw new Error(`Google Calendar webhook failed: ${response.status}`);
  }

  return (await response.json()) as { eventId?: string };
}

function buildCaseUrl(inquiryId: string) {
  const adminAppUrl = getCalendarConfig().adminAppUrl;
  if (!adminAppUrl) return "";
  return `${adminAppUrl.replace(/\/$/, "")}/admin/inquiries/${inquiryId}/case`;
}

async function syncCaseDeadline(
  caseId: string,
  inquiryId: string,
  caseNumber: string,
  contactName: string,
  field:
    | "dueDate"
    | "filingDeadline"
    | "supplementDeadline"
    | "stayExpirationDate"
    | "internalDeadline"
    | "nextFollowUpDate",
  label: string,
  eventIdField:
    | "googleCalendarDueEventId"
    | "googleCalendarFilingEventId"
    | "googleCalendarSupplementEventId"
    | "googleCalendarStayExpirationEventId"
    | "googleCalendarInternalDeadlineEventId"
    | "googleCalendarNextFollowUpEventId",
  value: Date | null
) {
  const record = await prisma.caseRecord.findUniqueOrThrow({
    where: { id: caseId },
    select: {
      [eventIdField]: true
    }
  });

  const currentEventId = String(record[eventIdField] ?? "");

  if (!value) {
    if (!currentEventId) return;

    await postCalendarWebhook({
      action: "delete",
      sourceType: "case-deadline",
      sourceId: `${caseId}:${field}`,
      eventId: currentEventId
    });

    await prisma.caseRecord.update({
      where: { id: caseId },
      data: {
        [eventIdField]: null
      }
    });
    return;
  }

  const response = await postCalendarWebhook({
    action: "upsert",
    sourceType: "case-deadline",
    sourceId: `${caseId}:${field}`,
    eventId: currentEventId || null,
    title: `[${caseNumber}] ${label}`,
    description: `${contactName}\n${buildCaseUrl(inquiryId)}`.trim(),
    date: value.toISOString()
  });

  if (response?.eventId && response.eventId !== currentEventId) {
    await prisma.caseRecord.update({
      where: { id: caseId },
      data: {
        [eventIdField]: response.eventId
      }
    });
  }
}

export async function syncCaseCalendarEvents(caseId: string) {
  const config = getCalendarConfig();
  if (!config.enabled || !config.webhookUrl || !config.webhookToken) {
    return;
  }

  const record = await prisma.caseRecord.findUniqueOrThrow({
    where: { id: caseId },
    include: {
      inquiry: {
        select: {
          id: true,
          contactName: true
        }
      }
    }
  });

  await syncCaseDeadline(
    caseId,
    record.inquiryId,
    record.caseNumber,
    record.inquiry.contactName,
    "dueDate",
    "사건 일반 일정",
    "googleCalendarDueEventId",
    record.dueDate
  );
  await syncCaseDeadline(
    caseId,
    record.inquiryId,
    record.caseNumber,
    record.inquiry.contactName,
    "filingDeadline",
    "제출 마감",
    "googleCalendarFilingEventId",
    record.filingDeadline
  );
  await syncCaseDeadline(
    caseId,
    record.inquiryId,
    record.caseNumber,
    record.inquiry.contactName,
    "supplementDeadline",
    "보완 마감",
    "googleCalendarSupplementEventId",
    record.supplementDeadline
  );
  await syncCaseDeadline(
    caseId,
    record.inquiryId,
    record.caseNumber,
    record.inquiry.contactName,
    "stayExpirationDate",
    "체류 만료",
    "googleCalendarStayExpirationEventId",
    record.stayExpirationDate
  );
  await syncCaseDeadline(
    caseId,
    record.inquiryId,
    record.caseNumber,
    record.inquiry.contactName,
    "internalDeadline",
    "내부 마감",
    "googleCalendarInternalDeadlineEventId",
    record.internalDeadline
  );
  await syncCaseDeadline(
    caseId,
    record.inquiryId,
    record.caseNumber,
    record.inquiry.contactName,
    "nextFollowUpDate",
    "다음 후속 일정",
    "googleCalendarNextFollowUpEventId",
    record.nextFollowUpDate
  );
}

export async function syncFollowUpCalendarEvent(followUpId: string) {
  const config = getCalendarConfig();
  if (!config.enabled || !config.webhookUrl || !config.webhookToken) {
    return;
  }

  const action = await prisma.followUpAction.findUniqueOrThrow({
    where: { id: followUpId },
    include: {
      case: {
        include: {
          inquiry: {
            select: {
              id: true,
              contactName: true
            }
          }
        }
      }
    }
  });

  if (!action.dueDate || action.status !== "PENDING") {
    if (!action.googleCalendarEventId) return;

    await postCalendarWebhook({
      action: "delete",
      sourceType: "case-followup",
      sourceId: action.id,
      eventId: action.googleCalendarEventId
    });

    await prisma.followUpAction.update({
      where: { id: action.id },
      data: { googleCalendarEventId: null }
    });
    return;
  }

  const response = await postCalendarWebhook({
    action: "upsert",
    sourceType: "case-followup",
    sourceId: action.id,
    eventId: action.googleCalendarEventId,
    title: `[${action.case.caseNumber}] 후속조치 - ${action.title}`,
    description: `${action.case.inquiry.contactName}\n${buildCaseUrl(action.case.inquiry.id)}`.trim(),
    date: action.dueDate.toISOString()
  });

  if (response?.eventId && response.eventId !== action.googleCalendarEventId) {
    await prisma.followUpAction.update({
      where: { id: action.id },
      data: { googleCalendarEventId: response.eventId }
    });
  }
}
