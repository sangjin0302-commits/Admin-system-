import type { CaseStage } from "@generated/prisma-client/client";

import { buildWorkQueueMessageDraft } from "@/lib/message-templates/work-queue";
import { prisma } from "@/lib/prisma/client";
import type { WorkQueueItem, WorkQueueSeverity, WorkQueueSnapshot } from "@/lib/work-queue/types";

const DUE_SOON_DAYS = 3;
const QUOTE_FOLLOW_UP_DAYS = 3;

function startOfDay(date: Date) {
  const cloned = new Date(date);
  cloned.setHours(0, 0, 0, 0);
  return cloned;
}

function daysFromToday(target: Date) {
  const ms = startOfDay(target).getTime() - startOfDay(new Date()).getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function addDays(date: Date, days: number) {
  const cloned = new Date(date);
  cloned.setDate(cloned.getDate() + days);
  return cloned;
}

function severityRank(severity: WorkQueueSeverity) {
  return {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
  }[severity];
}

function sortItems(items: WorkQueueItem[]) {
  return items.sort((left, right) => {
    const severityDiff = severityRank(right.severity) - severityRank(left.severity);
    if (severityDiff !== 0) return severityDiff;

    if (left.dueDate && right.dueDate) {
      return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
    }

    if (left.dueDate) return -1;
    if (right.dueDate) return 1;
    return left.title.localeCompare(right.title, "ko-KR");
  });
}

function classifyItem(item: WorkQueueItem) {
  if (!item.dueDate) return "followUp" as const;

  const days = daysFromToday(new Date(item.dueDate));
  if (days < 0) return "overdue" as const;
  if (days === 0) return "today" as const;
  if (days <= DUE_SOON_DAYS) return "soon" as const;
  return "followUp" as const;
}

function getCaseActionByStage(stage: CaseStage) {
  if (stage === "CONTRACT_PREPARATION") return "계약 및 제출 준비 상태를 확인해 주세요.";
  if (stage === "SUPPLEMENT_REQUESTED") return "보완 요청 항목의 문서 수령/재제출을 우선 점검해 주세요.";
  if (stage === "SUBMITTED") return "제출 결과 회신 여부를 확인하고 다음 단계 메모를 갱신해 주세요.";
  return "사건 진행 단계에 맞는 후속 조치를 확인해 주세요.";
}

export async function getWorkQueueSnapshot(): Promise<WorkQueueSnapshot> {
  const [cases, sentQuotes, acceptedQuotes] = await Promise.all([
    prisma.caseRecord.findMany({
      include: {
        inquiry: true,
        documents: {
          include: {
            files: {
              select: {
                id: true,
                isCurrentVersion: true
              }
            }
          }
        },
        supplementRequests: {
          where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
          include: {
            submissionPackage: {
              select: { packageNumber: true }
            }
          },
          orderBy: [{ requestedAt: "desc" }]
        },
        followUpActions: {
          where: { status: "PENDING" },
          orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
        }
      }
    }),
    prisma.quote.findMany({
      where: { status: "SENT" },
      include: {
        inquiry: true
      }
    }),
    prisma.quote.findMany({
      where: { status: "ACCEPTED" },
      include: {
        inquiry: true,
        contractDraft: true,
        caseRecord: {
          include: {
            _count: {
              select: {
                submissionPackages: true
              }
            }
          }
        }
      }
    })
  ]);

  const items: WorkQueueItem[] = [];

  for (const record of cases) {
    const deadlineEntries = [
      { key: "dueDate", label: "일반 예정일", value: record.dueDate },
      { key: "filingDeadline", label: "제출 마감", value: record.filingDeadline },
      { key: "supplementDeadline", label: "보완 마감", value: record.supplementDeadline },
      { key: "stayExpirationDate", label: "체류 만료일", value: record.stayExpirationDate },
      { key: "internalDeadline", label: "내부 마감", value: record.internalDeadline }
    ];

    for (const deadline of deadlineEntries) {
      if (!deadline.value) continue;
      const days = daysFromToday(deadline.value);
      if (days > DUE_SOON_DAYS) continue;

      const type = days < 0 ? "DEADLINE_OVERDUE" : "DEADLINE_DUE_SOON";
      const severity =
        type === "DEADLINE_OVERDUE"
          ? deadline.key === "stayExpirationDate"
            ? "CRITICAL"
            : "HIGH"
          : deadline.key === "stayExpirationDate"
            ? "HIGH"
            : "MEDIUM";

      items.push({
        id: `${type}:${record.id}:${deadline.key}`,
        type,
        title:
          type === "DEADLINE_OVERDUE"
            ? `${record.caseNumber} ${deadline.label} 경과`
            : `${record.caseNumber} ${deadline.label} 임박`,
        severity,
        relatedEntityType: "CASE",
        relatedEntityId: record.id,
        relatedInquiryId: record.inquiryId,
        dueDate: deadline.value.toISOString(),
        recommendedAction: getCaseActionByStage(record.currentStage),
        messageDraft: buildWorkQueueMessageDraft(type, {
          contactName: record.inquiry.contactName,
          inquiryTitle: record.inquiry.title,
          caseNumber: record.caseNumber,
          dueLabel: deadline.label,
          dueDate: deadline.value.toISOString()
        }),
        href: `/admin/inquiries/${record.inquiryId}`
      });
    }

    const missingDocs = record.documents.filter(
      (doc) => doc.isRequired && !doc.isReceived && !doc.files.some((file) => file.isCurrentVersion)
    );

    if (missingDocs.length > 0) {
      items.push({
        id: `MISSING_DOCUMENTS:${record.id}`,
        type: "MISSING_DOCUMENTS",
        title: `${record.caseNumber} 필수서류 누락 ${missingDocs.length}건`,
        severity: record.currentStage === "SUPPLEMENT_REQUESTED" ? "HIGH" : "MEDIUM",
        relatedEntityType: "CASE",
        relatedEntityId: record.id,
        relatedInquiryId: record.inquiryId,
        dueDate: record.supplementDeadline ? record.supplementDeadline.toISOString() : null,
        recommendedAction: "누락 서류 요청 안내문 발송 후 수령 상태를 확인해 주세요.",
        messageDraft: buildWorkQueueMessageDraft("MISSING_DOCUMENTS", {
          contactName: record.inquiry.contactName,
          inquiryTitle: record.inquiry.title,
          caseNumber: record.caseNumber,
          missingDocuments: missingDocs.map((doc) => doc.label)
        }),
        href: `/admin/inquiries/${record.inquiryId}`
      });
    }

    for (const supplement of record.supplementRequests) {
      const dueDateIso = supplement.dueDate ? supplement.dueDate.toISOString() : null;
      const dueDays = supplement.dueDate ? daysFromToday(supplement.dueDate) : null;
      const severity =
        dueDays !== null && dueDays < 0
          ? "CRITICAL"
          : dueDays !== null && dueDays <= DUE_SOON_DAYS
            ? "HIGH"
            : "MEDIUM";

      items.push({
        id: `SUPPLEMENT_PENDING:${supplement.id}`,
        type: "SUPPLEMENT_PENDING",
        title: `${record.caseNumber} 보완 요청 대응 (${supplement.status})`,
        severity,
        relatedEntityType: "SUPPLEMENT",
        relatedEntityId: supplement.id,
        relatedInquiryId: record.inquiryId,
        dueDate: dueDateIso,
        recommendedAction: "보완 항목 충족 여부를 확인하고 재제출 패키지 준비를 진행해 주세요.",
        messageDraft: buildWorkQueueMessageDraft("SUPPLEMENT_PENDING", {
          contactName: record.inquiry.contactName,
          inquiryTitle: record.inquiry.title,
          caseNumber: record.caseNumber,
          supplementSummary: supplement.summary,
          dueDate: dueDateIso ?? undefined
        }),
        href: `/admin/inquiries/${record.inquiryId}`
      });
    }

    for (const action of record.followUpActions) {
      const type = action.type;
      const severity =
        type === "REVIEW_REQUEST"
          ? "MEDIUM"
          : type === "REFERRAL_CHECK"
            ? "LOW"
            : "MEDIUM";

      items.push({
        id: `${type}:${action.id}`,
        type,
        title: action.title,
        severity,
        relatedEntityType: "CASE",
        relatedEntityId: record.id,
        relatedInquiryId: record.inquiryId,
        dueDate: action.dueDate ? action.dueDate.toISOString() : null,
        recommendedAction:
          type === "REVIEW_REQUEST"
            ? "사건 종결 후 후기 요청 메시지를 복사하고 회신 여부를 확인해 주세요."
            : type === "REFERRAL_CHECK"
              ? "추천 가능 고객인지 확인하고 소개 요청 문구를 검토해 주세요."
              : "재의뢰 가능성이 있는 고객에게 안부 메시지를 보내고 후속 일정을 확인해 주세요.",
        messageDraft: action.messageDraft,
        href: `/admin/inquiries/${record.inquiryId}`
      });
    }
  }

  for (const quote of sentQuotes) {
    const followUpDueDate = addDays(quote.updatedAt, QUOTE_FOLLOW_UP_DAYS);
    if (daysFromToday(followUpDueDate) > 0) continue;

    items.push({
      id: `QUOTE_FOLLOW_UP:${quote.id}`,
      type: "QUOTE_FOLLOW_UP",
      title: `견적 후속 확인 필요 (${quote.inquiry.contactName})`,
      severity: daysFromToday(followUpDueDate) < 0 ? "HIGH" : "MEDIUM",
      relatedEntityType: "QUOTE",
      relatedEntityId: quote.id,
      relatedInquiryId: quote.inquiryId,
      dueDate: followUpDueDate.toISOString(),
      recommendedAction: "견적 수락/거절 여부를 확인하고 상담 후속 메시지를 전달해 주세요.",
      messageDraft: buildWorkQueueMessageDraft("QUOTE_FOLLOW_UP", {
        contactName: quote.inquiry.contactName,
        inquiryTitle: quote.inquiry.title,
        quoteRangeText:
          quote.totalMin === quote.totalMax
            ? `${quote.totalMin.toLocaleString("ko-KR")}원`
            : `${quote.totalMin.toLocaleString("ko-KR")}원 ~ ${quote.totalMax.toLocaleString("ko-KR")}원`
      }),
      href: `/admin/inquiries/${quote.inquiryId}`
    });
  }

  for (const quote of acceptedQuotes) {
    const caseRecord = quote.caseRecord;
    const noContract = !quote.contractDraft;
    const noCase = !caseRecord;
    const noPostCaseAction =
      caseRecord?.currentStage === "CONTRACT_PREPARATION" &&
      caseRecord._count.submissionPackages === 0;

    if (!noContract && !noCase && !noPostCaseAction) continue;

    const recommendedAction = noContract
      ? "계약 초안을 생성하고 특약/납입 구조를 확인해 주세요."
      : noCase
        ? "사건 레코드를 생성해 진행 단계와 기한을 설정해 주세요."
        : "제출 패키지 또는 서류수집 후속 작업을 시작해 주세요.";

    items.push({
      id: `CONTRACT_PENDING:${quote.id}`,
      type: "CONTRACT_PENDING",
      title: `${quote.inquiry.contactName} 수락건 후속조치 필요`,
      severity: "HIGH",
      relatedEntityType: "QUOTE",
      relatedEntityId: quote.id,
      relatedInquiryId: quote.inquiryId,
      dueDate: addDays(quote.updatedAt, 1).toISOString(),
      recommendedAction,
      messageDraft: buildWorkQueueMessageDraft("CONTRACT_PENDING", {
        contactName: quote.inquiry.contactName,
        inquiryTitle: quote.inquiry.title
      }),
      href: `/admin/inquiries/${quote.inquiryId}`
    });

  }

  const sections: WorkQueueSnapshot["sections"] = {
    today: [],
    soon: [],
    overdue: [],
    followUp: []
  };

  for (const item of items) {
    const bucket = classifyItem(item);
    sections[bucket].push(item);
  }

  sections.today = sortItems(sections.today);
  sections.soon = sortItems(sections.soon);
  sections.overdue = sortItems(sections.overdue);
  sections.followUp = sortItems(sections.followUp);

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      today: sections.today.length,
      soon: sections.soon.length,
      overdue: sections.overdue.length,
      followUp: sections.followUp.length,
      total: items.length
    },
    sections
  };
}
