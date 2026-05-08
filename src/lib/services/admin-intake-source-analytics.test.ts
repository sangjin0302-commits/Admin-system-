import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildIntakeSourceAnalytics,
  buildIntakeSourceAnalyticsWhere,
  parseIntakeSourceAnalyticsFilters,
  type IntakeSourceAnalyticsRecord
} from "@/lib/services/admin-intake-source-analytics";

const root = process.cwd();
const now = new Date("2026-05-08T00:00:00.000Z");

const records: IntakeSourceAnalyticsRecord[] = [
  {
    id: "inquiry-1",
    createdAt: new Date("2026-05-07T00:00:00.000Z"),
    updatedAt: new Date("2026-05-07T01:00:00.000Z"),
    contactName: "<script>alert(1)</script>",
    publicTrackingCode: "20260507-FC-0001-AA",
    intakeSource: "autosns",
    intakeChannel: "naver",
    intakePracticeArea: "middle_east_admin_business",
    intakeContentId: "mic_1",
    intakePackageId: "pkg_1"
  },
  {
    id: "inquiry-2",
    createdAt: new Date("2026-04-25T00:00:00.000Z"),
    updatedAt: new Date("2026-04-25T01:00:00.000Z"),
    contactName: "Tracked Client",
    publicTrackingCode: "20260425-VI-0002-BB",
    intakeSource: "autosns",
    intakeChannel: "blog",
    intakePracticeArea: "visa_stay",
    intakeContentId: "mic_2",
    intakePackageId: "pkg_1"
  },
  {
    id: "inquiry-3",
    createdAt: new Date("2026-03-01T00:00:00.000Z"),
    updatedAt: new Date("2026-03-01T01:00:00.000Z"),
    contactName: "Direct Client",
    publicTrackingCode: null,
    intakeSource: "website",
    intakeChannel: null,
    intakePracticeArea: null,
    intakeContentId: null,
    intakePackageId: null
  }
];

const analytics = buildIntakeSourceAnalytics(records, now);
assert.equal(analytics.summary.totalCount, 3);
assert.equal(analytics.summary.trackedCount, 2);
assert.equal(analytics.summary.autosnsCount, 2);
assert.equal(analytics.summary.untrackedCount, 1);
assert.equal(analytics.summary.recent7DayCount, 1);
assert.equal(analytics.summary.recent30DayCount, 2);

assert.deepEqual(
  analytics.sourceCounts.map((row) => [row.label, row.count]),
  [
    ["autosns", 2],
    ["website", 1]
  ]
);
assert.equal(analytics.channelCounts.some((row) => row.label === "데이터 없음" && row.count === 1), true);
assert.equal(analytics.practiceAreaCounts.some((row) => row.label === "middle_east_admin_business"), true);
assert.equal(analytics.contentCounts.some((row) => row.contentId === "mic_1" && row.channel === "naver"), true);
assert.equal(analytics.packageCounts.some((row) => row.label === "pkg_1" && row.count === 2), true);

const firstRecent = analytics.recentItems[0];
assert.equal(firstRecent.detailHref, "/admin/inquiries/inquiry-1");
assert.equal(firstRecent.publicTrackingCode, "20260507-FC-0001-AA");
assert.equal(firstRecent.contactName, "<script>alert(1)</script>");
assert.equal(JSON.stringify(firstRecent).includes("inquiryId"), false);
assert.equal(JSON.stringify(firstRecent).includes("caseId"), false);
assert.equal(JSON.stringify(firstRecent).includes("communicationLogs"), false);
assert.equal(JSON.stringify(firstRecent).includes("intakeLandingUrl"), false);

const filters = parseIntakeSourceAnalyticsFilters({
  dateFrom: "2026-05-01",
  dateTo: "2026-05-08",
  source: " autosns ",
  channel: "naver",
  practice_area: "middle_east_admin_business",
  content_id: "mic_1",
  package_id: "pkg_1"
});
assert.equal(filters.dateFrom?.toISOString(), "2026-05-01T00:00:00.000Z");
assert.equal(filters.dateTo?.toISOString(), "2026-05-08T23:59:59.999Z");
assert.equal(filters.source, "autosns");
assert.equal(filters.channel, "naver");
assert.equal(filters.practiceArea, "middle_east_admin_business");
assert.equal(filters.contentId, "mic_1");
assert.equal(filters.packageId, "pkg_1");

const where = buildIntakeSourceAnalyticsWhere(filters);
assert.equal(where.intakeSource, "autosns");
assert.equal(where.intakeChannel, "naver");
assert.equal(where.intakePracticeArea, "middle_east_admin_business");
assert.equal(where.intakeContentId, "mic_1");
assert.equal(where.intakePackageId, "pkg_1");
assert.ok(where.createdAt);

const pagePath = join(root, "src/app/admin/intake-sources/page.tsx");
assert.equal(existsSync(pagePath), true);
const pageSource = readFileSync(pagePath, "utf8");
assert.match(pageSource, /접수 유입 분석/);
assert.match(pageSource, /Auto-Sns 및 외부 콘텐츠/);
assert.match(pageSource, /getAdminIntakeSourceAnalytics/);
assert.match(pageSource, /name="dateFrom"/);
assert.match(pageSource, /name="dateTo"/);
assert.match(pageSource, /name="source"/);
assert.match(pageSource, /name="channel"/);
assert.match(pageSource, /name="practice_area"/);
assert.match(pageSource, /name="content_id"/);
assert.match(pageSource, /name="package_id"/);
assert.match(pageSource, /\/admin\/inquiries/);
assert.equal(pageSource.includes("dangerouslySetInnerHTML"), false);
assert.equal(pageSource.includes("intakeLandingUrl"), false);
assert.equal(pageSource.includes("RESEND_API_KEY"), false);
assert.equal(pageSource.includes("client-message-service"), false);
assert.equal(pageSource.includes("run-lawbot-workflow"), false);

const middlewareSource = readFileSync(join(root, "middleware.ts"), "utf8");
assert.match(middlewareSource, /pathname\.startsWith\("\/admin"\)/);
assert.equal(middlewareSource.includes("/admin/intake-sources"), false);
const adminListPageSource = readFileSync(join(root, "src/app/admin/inquiries/page.tsx"), "utf8");
assert.match(adminListPageSource, /\/admin\/intake-sources/);
assert.match(adminListPageSource, /접수 유입 분석/);

console.log("admin intake source analytics tests passed");
