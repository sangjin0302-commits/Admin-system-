import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import { prisma } from "@/lib/prisma/client";
import { readMarketingSnapshot } from "@/lib/services/marketing-sync-service";
import { listInquiries } from "@/lib/services/inquiry-service";
import { formatDateTime } from "@/lib/utils";
import {
  inquiryStatusLabels,
  inquiryTypeLabels,
  languageCodeLabels,
  urgencyLabels,
  type InquiryStatus
} from "@/types/inquiry";

export const dynamic = "force-dynamic";

type InquiryListItem = Awaited<ReturnType<typeof listInquiries>>[number];

async function safeListInquiries() {
  try {
    return await listInquiries();
  } catch (error) {
    console.error("Failed to load inquiries for admin dashboard", error);
    return [] as InquiryListItem[];
  }
}

async function safeReadMarketingSnapshot() {
  try {
    return await readMarketingSnapshot();
  } catch (error) {
    console.error("Failed to load marketing snapshot for admin dashboard", error);
    return null;
  }
}

async function safeCount<T>(label: string, task: Promise<T>, fallback: T) {
  try {
    return await task;
  } catch (error) {
    console.error(`Failed to load ${label} for admin dashboard`, error);
    return fallback;
  }
}

function isWithinDays(date: Date | null | undefined, days: number) {
  if (!date) return false;
  const now = new Date();
  const distance = date.getTime() - now.getTime();
  return distance >= 0 && distance <= days * 24 * 60 * 60 * 1000;
}

function getLawbotStatus() {
  const hasAnalyzeUrl = Boolean(process.env.LAWBOT_ANALYZE_URL?.trim());
  const hasAnalyzeToken = Boolean(process.env.LAWBOT_ANALYZE_TOKEN?.trim());

  if (hasAnalyzeUrl && hasAnalyzeToken) {
    return {
      label: "\uC2E4\uC5F0\uACB0 \uC900\uBE44 \uC644\uB8CC",
      toneClassName: "bg-success/10 text-success",
      description:
        "\uC0AC\uAC74 \uC0C1\uC138\uC5D0\uC11C \uC2E4\uC81C \uBD84\uC11D \uD638\uCD9C\uACFC \uC2A4\uB0C5\uC0F7 \uC800\uC7A5\uAE4C\uC9C0 \uC774\uC5B4\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    };
  }

  if (hasAnalyzeUrl) {
    return {
      label: "\uC8FC\uC18C\uB9CC \uC5F0\uACB0\uB428",
      toneClassName: "bg-warning/10 text-warning",
      description:
        "\uBD84\uC11D \uC8FC\uC18C\uB294 \uC788\uC9C0\uB9CC \uD1A0\uD070\uC774 \uC5C6\uC5B4 \uC6B4\uC601 \uAE30\uC900\uC5D0\uC11C\uB294 \uC810\uAC80\uC774 \uB354 \uD544\uC694\uD569\uB2C8\uB2E4."
    };
  }

  return {
    label: "\uBBF8\uC5F0\uACB0",
    toneClassName: "bg-danger/10 text-danger",
    description:
      "UI\uC640 \uC800\uC7A5 \uAD6C\uC870\uB294 \uC900\uBE44\uB3FC \uC788\uC9C0\uB9CC \uC2E4\uC81C \uD638\uCD9C\uC740 \uC544\uC9C1 \uAEBC\uC838 \uC788\uC2B5\uB2C8\uB2E4."
  };
}

function getStatusTone(status: InquiryStatus) {
  if (["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(status)) return "quote";
  if (["CONSULTATION_REQUIRED", "WAITING_CONSULTATION"].includes(status)) return "consult";
  if (status === "ON_HOLD") return "risk";
  if (status === "WON") return "won";
  return "default";
}

export default async function AdminDashboardContent() {
  const [inquiries, marketingSnapshot, quoteCount, contractDraftCount, caseCount] = await Promise.all([
    safeListInquiries(),
    safeReadMarketingSnapshot(),
    safeCount("quote count", prisma.quote.count(), 0),
    safeCount("contract draft count", prisma.contractDraft.count(), 0),
    safeCount("case count", prisma.caseRecord.count(), 0)
  ]);

  const activeInquiries = inquiries.filter((item) => item.status !== "CLOSED");
  const urgentCount = activeInquiries.filter(
    (item) => item.urgencyLevel === "CRITICAL" || isWithinDays(item.dueDate, 1)
  ).length;
  const docsPendingCount = activeInquiries.filter(
    (item) => !item.hasPreparedDocuments && item.status !== "WON"
  ).length;
  const responsePendingCount = activeInquiries.filter((item) => item.responsePending).length;
  const quotePendingCount = activeInquiries.filter((item) =>
    ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)
  ).length;
  const consultationCount = activeInquiries.filter((item) =>
    ["CONSULTATION_REQUIRED", "WAITING_CONSULTATION", "PRE_DIAGNOSED"].includes(item.status)
  ).length;
  const operationalRiskIndex =
    urgentCount * 8 + docsPendingCount * 5 + responsePendingCount * 4 + quotePendingCount * 3;
  const operationalHealthScore = Math.max(0, Math.min(100, 100 - operationalRiskIndex));
  const operationalHealthDescription =
    operationalHealthScore >= 80
      ? "\uC6B4\uC601 \uD750\uB984\uC774 \uC548\uC815\uC801\uC785\uB2C8\uB2E4."
      : operationalHealthScore >= 60
        ? "\uC8FC\uC694 \uD56D\uBAA9 \uC810\uAC80\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."
        : "\uAE34\uAE09 \uC21C\uC11C \uC7AC\uC815\uB82C\uACFC \uD6C4\uC18D \uC870\uCE58\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.";

  const dueSoonItems = activeInquiries
    .filter((item) => isWithinDays(item.dueDate, 3))
    .sort((left, right) => (left.dueDate?.getTime() ?? Infinity) - (right.dueDate?.getTime() ?? Infinity))
    .slice(0, 5);
  const nextContactItems = activeInquiries
    .filter((item) => isWithinDays(item.nextContactAt, 3) || item.responsePending)
    .sort((left, right) => (left.nextContactAt?.getTime() ?? Infinity) - (right.nextContactAt?.getTime() ?? Infinity))
    .slice(0, 5);
  const recentIntakes = inquiries.slice(0, 5);

  const pipeline = [
    {
      key: "NEW",
      label: "\uC2E0\uADDC",
      count: activeInquiries.filter((item) => item.status === "NEW").length,
      description: "\uAC00\uC7A5 \uBA3C\uC800 \uD559\uC778\uD558\uB294 \uC811\uC218 \uAD6C\uAC04"
    },
    {
      key: "PRE_DIAGNOSED",
      label: "\uC0AC\uC804\uC9C4\uB2E8",
      count: activeInquiries.filter((item) => item.status === "PRE_DIAGNOSED").length,
      description: "\uCD08\uAE30 \uBD84\uB958\uC640 \uAC80\uD1A0 \uBC29\uD5A5\uC744 \uC815\uB9AC\uD55C \uAD6C\uAC04"
    },
    {
      key: "CONSULTATION_REQUIRED",
      label: "\uC0C1\uB2F4",
      count: activeInquiries.filter((item) =>
        ["CONSULTATION_REQUIRED", "WAITING_CONSULTATION"].includes(item.status)
      ).length,
      description: "\uC0C1\uB2F4 \uC5F0\uACB0 \uB610\uB294 \uC0C1\uB2F4 \uB300\uAE30 \uD750\uB984"
    },
    {
      key: "QUOTE_PENDING",
      label: "\uACAC\uC801",
      count: activeInquiries.filter((item) =>
        ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)
      ).length,
      description: "\uACAC\uC801 \uC791\uC131\u00B7\uAC80\uD1A0\u00B7\uBC1C\uC1A1 \uAD6C\uAC04"
    },
    {
      key: "WON",
      label: "\uC218\uC784",
      count: activeInquiries.filter((item) => item.status === "WON").length,
      description: "\uACC4\uC57D \uB610\uB294 \uC0AC\uAC74 \uC9C4\uD589\uC73C\uB85C \uB118\uC5B4\uAC04 \uAC74"
    },
    {
      key: "ON_HOLD",
      label: "\uBCF4\uB958",
      count: activeInquiries.filter((item) => item.status === "ON_HOLD").length,
      description: "\uC0AC\uC720 \uD655\uC778\uACFC \uC7AC\uC815\uB9AC\uAC00 \uD544\uC694\uD55C \uAC74"
    }
  ];

  const lawbotStatus = getLawbotStatus();
  const marketingStatus = marketingSnapshot
    ? {
        label: "\uC2A4\uB0C5\uC0F7 \uC218\uC2E0 \uC911",
        toneClassName: "bg-success/10 text-success",
        description: `\uCD5C\uADFC \uB9C8\uCF00\uD305 \uB370\uC774\uD130\uAC00 ${formatDateTime(
          marketingSnapshot.received_at ?? marketingSnapshot.generated_at ?? null
        )} \uAE30\uC900\uC73C\uB85C \uC800\uC7A5\uB3FC \uC788\uC2B5\uB2C8\uB2E4.`
      }
    : {
        label: "\uC2A4\uB0C5\uC0F7 \uC5C6\uC74C",
        toneClassName: "bg-warning/10 text-warning",
        description:
          "\uD604\uC7AC\uB294 mock/\uAE30\uBCF8 \uC2E0\uD638 \uC911\uC2EC\uC774\uBA70, \uC2E4\uC2DC\uAC04 market engine \uC5F0\uB3D9\uC740 \uC544\uC9C1 \uC544\uB2D9\uB2C8\uB2E4."
      };

  return (
    <div className="space-y-6">
      <Card className="ui-analysis-hero p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="ui-kicker">\uC5C5\uBB34 \uAD00\uB9AC \uD5C8\uBE0C</p>
              <h2 className="mt-2 ui-page-title">\uAD00\uB9AC\uC790 \uB300\uC2DC\uBCF4\uB4DC</h2>
              <p className="mt-2 max-w-3xl text-sm text-text-muted">
                \uBB38\uC758 \uC811\uC218, \uC0C1\uB2F4 \uC900\uBE44, \uACAC\uC801 \uD6C4\uC18D, \uC0AC\uAC74 \uC9C4\uD589,
                \uBD84\uC11D \uC5D4\uC9C4 \uC5F0\uACB0 \uC0C1\uD0DC\uB97C \uD55C \uD654\uBA74\uC5D0\uC11C \uBCF4\uACE0 \uBC14\uB85C
                \uB2E4\uC74C \uD589\uB3D9\uC73C\uB85C \uB118\uC5B4\uAC08 \uC218 \uC788\uAC8C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/inquiries"
                className="inline-flex items-center justify-center rounded-full border border-primary bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-[#143d5d]"
              >
                \uBB38\uC758 \uBAA9\uB85D \uC5F4\uAE30
              </Link>
              <Link
                href="/admin/integrations"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-border-strong hover:bg-surface-muted"
              >
                \uC5F0\uB3D9 \uC13C\uD130
              </Link>
              <Link
                href="/admin/monitoring"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-border-strong hover:bg-surface-muted"
              >
                \uBAA8\uB2C8\uD130\uB9C1
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="ui-analysis-chip">\uC624\uB298 \uC6B0\uC120 \uD655\uC778 {urgentCount}\uAC74</span>
            <span className="ui-analysis-chip">\uC790\uB8CC \uD655\uC778 \uD544\uC694 {docsPendingCount}\uAC74</span>
            <span className="ui-analysis-chip">\uC751\uB2F5 \uB300\uAE30 {responsePendingCount}\uAC74</span>
            <span className="ui-analysis-chip">\uACAC\uC801 \uD6C4\uC18D {quotePendingCount}\uAC74</span>
          </div>

          <div className="grid gap-3 xl:grid-cols-4">
            <Card className="ui-analysis-panel p-4">
              <p className="ui-kicker">System Core</p>
              <h3 className="mt-3 text-base font-semibold text-text-strong">\uC6B4\uC601 \uAE30\uC900</h3>
              <p className="mt-2 text-sm text-text-muted">
                \uBB38\uC758, \uACAC\uC801, \uACC4\uC57D \uCD08\uC548, \uC0AC\uAC74 \uAD00\uB9AC\uB294 system DB\uB97C \uAE30\uC900\uC73C\uB85C \uC6B4\uC601\uD569\uB2C8\uB2E4.
              </p>
            </Card>

            <Card className="ui-analysis-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="ui-kicker">Lawbot</p>
                  <h3 className="mt-2 text-base font-semibold text-text-strong">\uBC95\uB960 \uBD84\uC11D</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lawbotStatus.toneClassName}`}>
                  {lawbotStatus.label}
                </span>
              </div>
              <p className="mt-3 text-sm text-text-muted">{lawbotStatus.description}</p>
            </Card>

            <Card className="ui-analysis-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="ui-kicker">Market Analyze</p>
                  <h3 className="mt-2 text-base font-semibold text-text-strong">\uC2DC\uC7A5 \uC778\uC0AC\uC774\uD2B8</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${marketingStatus.toneClassName}`}>
                  {marketingStatus.label}
                </span>
              </div>
              <p className="mt-3 text-sm text-text-muted">{marketingStatus.description}</p>
            </Card>

            <Card className="ui-analysis-panel p-4">
              <p className="ui-kicker">Workspace</p>
              <h3 className="mt-3 text-base font-semibold text-text-strong">\uBCC4\uB3C4 \uD654\uBA74 \uC5F0\uACB0</h3>
              <p className="mt-2 text-sm text-text-muted">
                market-analyze \uD504\uB860\uD2B8 \uAD6C\uC870\uB97C \uAE30\uC900\uC73C\uB85C \uC5F0\uB3D9 \uC13C\uD130\uC5D0
                \uC2A4\uD06C\uB9B0 \uC790\uB9AC\uB97C \uBBF8\uB9AC \uB9CC\uB4E4\uC5B4 \uB46C \uC0C1\uD0DC\uC785\uB2C8\uB2E4.
              </p>
            </Card>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <DashboardMetric label="\uBB38\uC758" value={inquiries.length} description="\uB204\uC801 \uC811\uC218\uC640 \uC0AC\uAC74 \uD6C4\uBCF4" />
        <DashboardMetric label="\uACAC\uC801" value={quoteCount} description="\uC0DD\uC131\uB41C \uACAC\uC801 \uBC0F \uD6C4\uC18D \uD750\uB984" />
        <DashboardMetric label="\uACC4\uC57D \uCD08\uC548" value={contractDraftCount} description="\uACC4\uC57D \uBB38\uC548 \uBC0F \uC815\uB9AC \uB2E8\uACC4" />
        <DashboardMetric label="\uC0AC\uAC74" value={caseCount} description="\uC2E4\uC81C \uC9C4\uD589 \uC911\uC778 \uC0AC\uAC74 \uB808\uCF54\uB4DC" />
        <DashboardMetric
          label="\uC6B4\uC601 \uAC74\uC804\uB3C4"
          value={operationalHealthScore}
          description={operationalHealthDescription}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="ui-kicker">\uD30C\uC774\uD504\uB77C\uC778</p>
              <h3 className="mt-2 ui-section-title">\uC0C1\uD0DC\uBCC4 \uC6B4\uC601 \uD750\uB984</h3>
            </div>
            <Link href="/admin/inquiries" className="text-sm font-medium text-primary">
              \uC804\uCCB4 \uBAA9\uB85D \uBCF4\uAE30
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pipeline.map((item) => (
              <Card key={item.key} muted className="p-4">
                <p className="ui-kicker">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold text-text-strong">{item.count}</p>
                <p className="mt-2 text-xs text-text-muted">{item.description}</p>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <p className="ui-kicker">\uC624\uB298\uC758 \uD3EC\uC778\uD2B8</p>
          <h3 className="mt-2 ui-section-title">\uC6B0\uC120 \uD655\uC778 \uC694\uC57D</h3>
          <div className="mt-4 space-y-3 text-sm text-text-muted">
            <p>\u2022 \uAE34\uAE09\u00B7\uB2F9\uC77C \uAE30\uC900\uC73C\uB85C \uBA3C\uC800 \uBCFC \uBB38\uC758\uB294 {urgentCount}\uAC74\uC785\uB2C8\uB2E4.</p>
            <p>\u2022 \uC790\uB8CC \uD655\uBCF4\uAC00 \uBA3C\uC800 \uD544\uC694\uD55C \uBB38\uC758\uB294 {docsPendingCount}\uAC74\uC785\uB2C8\uB2E4.</p>
            <p>\u2022 \uC0C1\uB2F4 \uC5F0\uACB0 \uB610\uB294 \uB300\uAE30 \uD750\uB984\uC740 {consultationCount}\uAC74\uC785\uB2C8\uB2E4.</p>
            <p>\u2022 \uACE0\uAC1D \uD68C\uC2E0 \uB610\uB294 \uB2E4\uC74C \uC5F0\uB77D \uB300\uAE30\uB294 {responsePendingCount}\uAC74\uC785\uB2C8\uB2E4.</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DashboardListCard
          kicker="\uAE30\uD55C \uC784\uBC15"
          title="\uAE30\uD55C \uC784\uBC15 \uBB38\uC758"
          emptyTitle="\uC784\uBC15 \uC77C\uC815\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."
          emptyDescription="3\uC77C \uB0B4 \uD76C\uB9DD \uC77C\uC815 \uB610\uB294 \uAE30\uD55C\uC774 \uC0DD\uAE30\uBA74 \uC5EC\uAE30\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4."
          items={dueSoonItems.map((item) => ({
            id: item.id,
            href: `/admin/inquiries/${item.id}`,
            title: item.title,
            meta: `${urgencyLabels[item.urgencyLevel].ko} / ${formatDateTime(item.dueDate)}`,
            description: `${item.contactName}${item.organizationName ? ` / ${item.organizationName}` : ""}`
          }))}
        />

        <DashboardListCard
          kicker="\uD6C4\uC18D \uC5F0\uB77D"
          title="\uC5F0\uB77D\u00B7\uD68C\uC2E0 \uD655\uC778"
          emptyTitle="\uD6C4\uC18D \uC5F0\uB77D \uB300\uAE30 \uAC74\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."
          emptyDescription="\uC751\uB2F5 \uB300\uAE30\uB098 \uB2E4\uC74C \uC5F0\uB77D \uC77C\uC815\uC774 \uC0DD\uAE30\uBA74 \uC774 \uC601\uC5ED\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4."
          items={nextContactItems.map((item) => ({
            id: item.id,
            href: `/admin/inquiries/${item.id}`,
            title: item.title,
            meta: item.responsePending
              ? "\uACE0\uAC1D \uC751\uB2F5 \uB300\uAE30"
              : `\uB2E4\uC74C \uC5F0\uB77D ${formatDateTime(item.nextContactAt)}`,
            description: `${inquiryStatusLabels[item.status].ko} / ${item.contactName}`
          }))}
        />

        <DashboardListCard
          kicker="\uCD5C\uADFC \uC811\uC218"
          title="\uCD5C\uADFC \uC811\uC218"
          emptyTitle="\uC544\uC9C1 \uC811\uC218\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."
          emptyDescription="\uC0C8 \uBB38\uC758\uAC00 \uC811\uC218\uB418\uBA74 \uAC00\uC7A5 \uCD5C\uADFC \uAC74\uC774 \uC5EC\uAE30\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4."
          items={recentIntakes.map((item) => ({
            id: item.id,
            href: `/admin/inquiries/${item.id}`,
            title: item.title,
            meta: `${inquiryTypeLabels[item.inquiryType].ko} / ${formatDateTime(item.createdAt)}`,
            description: `${item.contactName} / ${languageCodeLabels[item.preferredLanguage].ko}`
          }))}
        />
      </div>

      <Card className="p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="ui-kicker">\uC5F0\uB3D9 \uC5C5\uBB34\uC2E4</p>
            <h3 className="mt-2 ui-section-title">Lawbot / Market Analyze \uC790\uB9AC</h3>
          </div>
          <Link href="/admin/integrations" className="text-sm font-medium text-primary">
            \uC5F0\uB3D9 \uC13C\uD130 \uC5F4\uAE30
          </Link>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <Card muted className="p-4">
            <p className="ui-kicker">Lawbot</p>
            <h4 className="mt-2 text-base font-semibold text-text-strong">\uC0AC\uAC74 \uAE30\uC900 \uBC95\uB960 \uBD84\uC11D \uC790\uB9AC</h4>
            <p className="mt-2 text-sm text-text-muted">
              \uC0AC\uAC74 \uC0C1\uC138\uC5D0\uC11C \uC2E4\uC81C \uBD84\uC11D \uD638\uCD9C, \uC2A4\uB0C5\uC0F7 \uC800\uC7A5, \uC7AC\uBD84\uC11D
              \uBE44\uAD50\uAE4C\uC9C0 \uC5F0\uACB0\uD574 \uB454 \uC0C1\uD0DC\uC785\uB2C8\uB2E4.
            </p>
          </Card>
          <Card muted className="p-4">
            <p className="ui-kicker">Market Analyze</p>
            <h4 className="mt-2 text-base font-semibold text-text-strong">\uBCC4\uB3C4 \uD504\uB860\uD2B8 \uAD6C\uC870 \uBC18\uC601</h4>
            <p className="mt-2 text-sm text-text-muted">
              \uB85C\uCEEC \uAE30\uC900\uC73C\uB85C dashboard, competitors, hot issues, sentiment, services \uD654\uBA74
              \uAD6C\uC131\uC774 \uD655\uC778\uB418\uC5B4 \uC788\uC5B4 system \uC548\uC5D0 \uBCF4\uC5EC\uC904 \uC790\uB9AC\uB97C \uB9CC\uB4E4\uC5B4 \uB454
              \uC0C1\uD0DC\uC785\uB2C8\uB2E4.
            </p>
          </Card>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="ui-kicker">\uCD5C\uADFC \uC8FC\uC694 \uBB38\uC758</p>
            <h3 className="mt-2 ui-section-title">\uBC14\uB85C \uC5F4\uC5B4\uBCFC \uD56D\uBAA9</h3>
          </div>
          <p className="text-sm text-text-muted">\uC0C1\uD0DC\uC640 \uAE34\uAE09\uB3C4\uB97C \uAC19\uC774 \uBCF4\uBA74\uC11C \uBC14\uB85C \uC0C1\uC138 \uD654\uBA74\uC73C\uB85C \uC774\uB3D9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p>
        </div>

        {recentIntakes.length > 0 ? (
          <div className="mt-5 space-y-3">
            {recentIntakes.map((item: InquiryListItem) => (
              <Link
                key={item.id}
                href={`/admin/inquiries/${item.id}`}
                className="block rounded-2xl border border-line bg-surface px-4 py-4 transition hover:border-line-strong hover:bg-surface-muted"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="urgency" urgency={item.urgencyLevel}>
                        {urgencyLabels[item.urgencyLevel].ko}
                      </Badge>
                      <Badge tone="status" status={item.status}>
                        {inquiryStatusLabels[item.status].ko}
                      </Badge>
                    </div>
                    <p className="mt-3 truncate text-base font-semibold text-text-strong">{item.title}</p>
                    <p className="mt-1 truncate text-sm text-text-muted">
                      {item.contactName}
                      {item.organizationName ? ` / ${item.organizationName}` : ""} /{" "}
                      {inquiryTypeLabels[item.inquiryType].ko}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
                    <span className={dashboardToneClassName(getStatusTone(item.status))}>
                      {item.responsePending ? "\uC751\uB2F5 \uB300\uAE30" : "\uC6B4\uC601 \uC9C4\uD589 \uC911"}
                    </span>
                    <span>{formatDateTime(item.updatedAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="\uD45C\uC2DC\uD560 \uCD5C\uADFC \uBB38\uC758\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."
            description="\uACF5\uAC1C \uC811\uC218\uB098 \uB0B4\uBD80 \uB4F1\uB85D\uC774 \uC0DD\uAE30\uBA74 \uCD5C\uADFC \uBB38\uC758 \uCE74\uB4DC\uAC00 \uC5EC\uAE30\uC5D0 \uC815\uB9AC\uB429\uB2C8\uB2E4."
            actionLabel="\uACF5\uAC1C \uC811\uC218 \uC5F4\uAE30"
            actionHref="/intake"
            className="mt-5"
          />
        )}
      </Card>
    </div>
  );
}

function DashboardMetric({
  label,
  value,
  description
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-text-strong">{value}</p>
      <p className="mt-2 text-xs text-text-muted">{description}</p>
    </Card>
  );
}

function DashboardListCard({
  kicker,
  title,
  emptyTitle,
  emptyDescription,
  items
}: {
  kicker: string;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  items: Array<{
    id: string;
    href: string;
    title: string;
    meta: string;
    description: string;
  }>;
}) {
  return (
    <Card className="p-6">
      <p className="ui-kicker">{kicker}</p>
      <h3 className="mt-2 ui-section-title">{title}</h3>
      {items.length > 0 ? (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block rounded-2xl border border-line bg-surface px-4 py-4 transition hover:border-line-strong hover:bg-surface-muted"
            >
              <p className="truncate text-sm font-semibold text-text-strong">{item.title}</p>
              <p className="mt-2 text-xs text-text-muted">{item.meta}</p>
              <p className="mt-1 truncate text-sm text-text">{item.description}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} className="mt-5" />
      )}
    </Card>
  );
}

function dashboardToneClassName(tone: "default" | "consult" | "quote" | "risk" | "won") {
  if (tone === "consult") return "rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success";
  if (tone === "quote") return "rounded-full bg-info/10 px-3 py-1 text-xs font-semibold text-info";
  if (tone === "risk") return "rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning";
  if (tone === "won") return "rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary";
  return "rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-text";
}

