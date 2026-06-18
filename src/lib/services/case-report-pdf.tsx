import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import React from "react";

// ── Types ──────────────────────────────────────────────────────────────

export interface CaseReportData {
  title: string;
  caseNo: string | null;
  status: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  matterType: string;
  category: string;
  priority: string;
  riskLevel: string;
  assignedTo: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  nextActionAt: string | null;
  events: { date: string; type: string; message: string }[];
  documents: { name: string; status: string; required: boolean }[];
}

// ── Colours ────────────────────────────────────────────────────────────

const NAVY = "#1a3c5f";
const LIGHT_NAVY = "#2a5580";
const BORDER = "#cdd5de";
const SECTION_BG = "#f4f6f8";
const WHITE = "#ffffff";
const TEXT_PRIMARY = "#1a1a1a";
const TEXT_SECONDARY = "#555555";
const ACCENT_GREEN = "#2e7d32";
const ACCENT_RED = "#c62828";

// ── Styles ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: TEXT_PRIMARY,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: NAVY,
  },
  brandName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  brandSub: {
    fontSize: 8,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  reportTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  reportDate: {
    fontSize: 8,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },

  // Section
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    backgroundColor: NAVY,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 0,
  },
  sectionBody: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: BORDER,
    padding: 10,
    backgroundColor: WHITE,
  },

  // Info table
  infoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    minHeight: 22,
  },
  infoLabel: {
    width: 120,
    backgroundColor: SECTION_BG,
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: TEXT_SECONDARY,
  },
  infoValue: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 9,
  },

  // Two-column info
  infoColumns: {
    flexDirection: "row",
  },
  infoColumn: {
    flex: 1,
  },

  // Events timeline
  eventRow: {
    flexDirection: "row",
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  eventDate: {
    width: 80,
    fontSize: 8,
    color: TEXT_SECONDARY,
    fontFamily: "Helvetica-Bold",
  },
  eventType: {
    width: 90,
    fontSize: 8,
    color: LIGHT_NAVY,
    fontFamily: "Helvetica-Bold",
  },
  eventMessage: {
    flex: 1,
    fontSize: 8,
  },

  // Documents checklist
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  docCheck: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
  },
  docCheckFilled: {
    backgroundColor: ACCENT_GREEN,
    borderColor: ACCENT_GREEN,
  },
  docCheckMark: {
    color: WHITE,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  docName: {
    flex: 1,
    fontSize: 9,
  },
  docStatus: {
    width: 80,
    fontSize: 8,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  docRequired: {
    width: 40,
    fontSize: 7,
    textAlign: "center",
    color: TEXT_SECONDARY,
  },

  // Status badge
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: TEXT_SECONDARY,
  },

  // Summary
  summaryText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: TEXT_PRIMARY,
  },

  noData: {
    fontSize: 9,
    color: TEXT_SECONDARY,
    fontStyle: "italic",
    padding: 10,
  },
});

// ── Status helpers ─────────────────────────────────────────────────────

const COMPLETED_STATUSES = new Set([
  "APPROVED",
  "RECEIVED",
  "NOT_APPLICABLE",
]);

function statusColor(status: string): string {
  if (COMPLETED_STATUSES.has(status)) return ACCENT_GREEN;
  if (["REJECTED", "NEEDS_FIX"].includes(status)) return ACCENT_RED;
  return LIGHT_NAVY;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return iso;
  }
}

// ── Components ─────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value ?? "-"}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionTitle}>{title}</Text>;
}

// ── Main document ──────────────────────────────────────────────────────

function CaseReportDocument({ data }: { data: CaseReportData }) {
  const now = formatDate(new Date().toISOString());

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>ETHOS 행정사사무소</Text>
            <Text style={s.brandSub}>Administrative Services Office</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.reportTitle}>사건 보고서 (Case Report)</Text>
            <Text style={s.reportDate}>생성일: {now}</Text>
          </View>
        </View>

        {/* Case Info */}
        <View style={s.section}>
          <SectionHeader title="사건 기본 정보  |  Case Information" />
          <View style={s.sectionBody}>
            <View style={s.infoColumns}>
              <View style={s.infoColumn}>
                <InfoRow label="사건번호 (Case No.)" value={data.caseNo} />
                <InfoRow label="사건명 (Title)" value={data.title} />
                <InfoRow label="업무유형 (Type)" value={data.matterType} />
                <InfoRow label="분류 (Category)" value={data.category} />
                <InfoRow label="상태 (Status)" value={data.status} />
                <InfoRow label="우선순위 (Priority)" value={data.priority} />
              </View>
              <View style={s.infoColumn}>
                <InfoRow label="위험도 (Risk)" value={data.riskLevel} />
                <InfoRow label="담당자 (Assigned)" value={data.assignedTo} />
                <InfoRow label="생성일 (Created)" value={formatDate(data.createdAt)} />
                <InfoRow label="수정일 (Updated)" value={formatDate(data.updatedAt)} />
                <InfoRow label="기한 (Due)" value={data.dueDate ? formatDate(data.dueDate) : null} />
                <InfoRow label="다음조치 (Next)" value={data.nextActionAt ? formatDate(data.nextActionAt) : null} />
              </View>
            </View>
          </View>
        </View>

        {/* Client Info */}
        <View style={s.section}>
          <SectionHeader title="의뢰인 정보  |  Client Information" />
          <View style={s.sectionBody}>
            <InfoRow label="이름 (Name)" value={data.clientName} />
            <InfoRow label="이메일 (Email)" value={data.clientEmail} />
            <InfoRow label="전화 (Phone)" value={data.clientPhone} />
          </View>
        </View>

        {/* Summary */}
        {data.summary && (
          <View style={s.section}>
            <SectionHeader title="사건 요약  |  Case Summary" />
            <View style={s.sectionBody}>
              <Text style={s.summaryText}>{data.summary}</Text>
            </View>
          </View>
        )}

        {/* Documents Checklist */}
        <View style={s.section}>
          <SectionHeader title="필요 서류  |  Required Documents" />
          <View style={s.sectionBody}>
            {data.documents.length === 0 ? (
              <Text style={s.noData}>등록된 서류가 없습니다.</Text>
            ) : (
              <>
                {/* Table header */}
                <View style={[s.docRow, { borderBottomColor: NAVY, borderBottomWidth: 1.5, marginBottom: 6 }]}>
                  <View style={{ width: 14, marginRight: 8 }} />
                  <Text style={[s.docName, { fontFamily: "Helvetica-Bold", fontSize: 8, color: TEXT_SECONDARY }]}>서류명</Text>
                  <Text style={[s.docRequired, { fontFamily: "Helvetica-Bold", fontSize: 7 }]}>필수</Text>
                  <Text style={[s.docStatus, { fontSize: 8, color: TEXT_SECONDARY }]}>상태</Text>
                </View>
                {data.documents.map((doc, i) => {
                  const done = COMPLETED_STATUSES.has(doc.status);
                  return (
                    <View key={i} style={s.docRow}>
                      <View style={[s.docCheck, done ? s.docCheckFilled : {}]}>
                        {done && <Text style={s.docCheckMark}>v</Text>}
                      </View>
                      <Text style={s.docName}>{doc.name}</Text>
                      <Text style={s.docRequired}>{doc.required ? "필수" : "-"}</Text>
                      <Text style={[s.docStatus, { color: statusColor(doc.status) }]}>
                        {doc.status}
                      </Text>
                    </View>
                  );
                })}
              </>
            )}
          </View>
        </View>

        {/* Events Timeline */}
        <View style={s.section} wrap>
          <SectionHeader title="사건 이력  |  Events Timeline" />
          <View style={s.sectionBody}>
            {data.events.length === 0 ? (
              <Text style={s.noData}>등록된 이벤트가 없습니다.</Text>
            ) : (
              <>
                {/* Table header */}
                <View style={[s.eventRow, { borderBottomColor: NAVY, borderBottomWidth: 1.5, marginBottom: 6 }]}>
                  <Text style={[s.eventDate, { color: TEXT_SECONDARY }]}>일시</Text>
                  <Text style={[s.eventType, { color: TEXT_SECONDARY }]}>유형</Text>
                  <Text style={[s.eventMessage, { fontFamily: "Helvetica-Bold", fontSize: 8, color: TEXT_SECONDARY }]}>내용</Text>
                </View>
                {data.events.map((evt, i) => (
                  <View key={i} style={s.eventRow}>
                    <Text style={s.eventDate}>{formatDate(evt.date)}</Text>
                    <Text style={s.eventType}>{evt.type}</Text>
                    <Text style={s.eventMessage}>{evt.message}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>

        {/* Footer with page numbers */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>ETHOS 행정사사무소 | Confidential</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

// ── Public API ─────────────────────────────────────────────────────────

export async function generateCaseReportPdf(
  data: CaseReportData,
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <CaseReportDocument data={data} />,
  );
  return Buffer.from(buffer);
}
