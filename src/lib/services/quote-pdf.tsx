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

interface QuoteLineItemData {
  id: string;
  label: string;
  description: string | null;
  kind: string;
  amountMin: number;
  amountMax: number;
  sortOrder: number;
  isManual: boolean;
}

interface QuoteAdjustmentData {
  id: string;
  label: string;
  description: string | null;
  optionType: string;
  flatAmount: number | null;
  percentRate: number | null;
  computedMin: number;
  computedMax: number;
  isVat: boolean;
  sortOrder: number;
  isManual: boolean;
}

interface PaymentPlanData {
  id: string;
  stageKind: string;
  percentage: number;
  dueText: string;
  amountMin: number;
  amountMax: number;
  sortOrder: number;
}

interface InquiryData {
  contactName: string;
  email: string;
  phone: string | null;
  title: string;
  description: string;
}

export interface QuoteData {
  id: string;
  inquiryId: string;
  caseMatterId: string | null;
  status: string;
  rangeMode: boolean;
  serviceBaseMin: number;
  serviceBaseMax: number;
  subtotalMin: number;
  subtotalMax: number;
  vatAmountMin: number;
  vatAmountMax: number;
  totalMin: number;
  totalMax: number;
  consultFee: number;
  successFeeRestricted: boolean;
  draftNotes: string | null;
  calculationSummary: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  inquiry: InquiryData;
  lineItems: QuoteLineItemData[];
  adjustments: QuoteAdjustmentData[];
  paymentPlans: PaymentPlanData[];
}

// ── Colours ────────────────────────────────────────────────────────────

const NAVY = "#1a3c5f";
const GOLD = "#c9a961";
const LIGHT_NAVY = "#2a5580";
const BORDER = "#cdd5de";
const SECTION_BG = "#f4f6f8";
const WHITE = "#ffffff";
const TEXT_PRIMARY = "#1a1a1a";
const TEXT_SECONDARY = "#555555";

// ── Helpers ────────────────────────────────────────────────────────────

function formatWon(amount: number): string {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

function formatRange(
  min: number,
  max: number,
  rangeMode: boolean,
): string {
  if (rangeMode && min !== max) {
    return `${formatWon(min)} ~ ${formatWon(max)}`;
  }
  return formatWon(min);
}

function formatDate(iso: string | Date): string {
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return String(iso);
  }
}

function shortId(id: string): string {
  return id.length > 8 ? id.slice(0, 8).toUpperCase() : id.toUpperCase();
}

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

  // Table
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: NAVY,
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 4,
  },
  colNo: {
    width: 30,
    fontSize: 8,
    textAlign: "center",
  },
  colLabel: {
    flex: 1,
    fontSize: 9,
    paddingHorizontal: 4,
  },
  colAmount: {
    width: 160,
    fontSize: 9,
    textAlign: "right",
    paddingRight: 4,
  },
  colHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: TEXT_SECONDARY,
  },

  // Adjustment rows
  adjRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 4,
  },
  adjLabel: {
    flex: 1,
    fontSize: 9,
    paddingHorizontal: 8,
  },
  adjDesc: {
    fontSize: 7,
    color: TEXT_SECONDARY,
    marginTop: 1,
  },
  adjAmount: {
    width: 160,
    fontSize: 9,
    textAlign: "right",
    paddingRight: 4,
  },

  // Summary totals
  totalRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  totalLabel: {
    flex: 1,
    fontSize: 9,
  },
  totalValue: {
    width: 180,
    fontSize: 9,
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: NAVY,
  },
  grandTotalLabel: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  grandTotalValue: {
    width: 180,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
    textAlign: "right",
  },

  // Payment plan table
  payHeader: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: NAVY,
    paddingBottom: 4,
    marginBottom: 4,
  },
  payRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 4,
  },
  payStage: {
    width: 100,
    fontSize: 9,
    paddingHorizontal: 4,
  },
  payPercent: {
    width: 60,
    fontSize: 9,
    textAlign: "center",
  },
  payDue: {
    flex: 1,
    fontSize: 9,
    paddingHorizontal: 4,
  },
  payAmount: {
    width: 160,
    fontSize: 9,
    textAlign: "right",
    paddingRight: 4,
  },

  // Validity note
  validityNote: {
    marginTop: 8,
    fontSize: 8,
    color: TEXT_SECONDARY,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
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

  // Description under label
  descText: {
    fontSize: 7,
    color: TEXT_SECONDARY,
    marginTop: 1,
  },

  noData: {
    fontSize: 9,
    color: TEXT_SECONDARY,
    fontStyle: "italic",
    padding: 10,
  },
});

// ── Components ────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
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

// ── Main document ─────────────────────────────────────────────────────

function QuoteDocument({ data }: { data: QuoteData }) {
  const now = formatDate(new Date().toISOString());
  const sortedLineItems = [...data.lineItems].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const sortedAdjustments = [...data.adjustments].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const sortedPaymentPlans = [...data.paymentPlans].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

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
            <Text style={s.reportTitle}>견적서 (Quotation)</Text>
            <Text style={s.reportDate}>발행일: {now}</Text>
          </View>
        </View>

        {/* Client Info */}
        <View style={s.section}>
          <SectionHeader title="의뢰인 정보  |  Client Information" />
          <View style={s.sectionBody}>
            <InfoRow label="이름 (Name)" value={data.inquiry.contactName} />
            <InfoRow label="이메일 (Email)" value={data.inquiry.email} />
            <InfoRow label="전화 (Phone)" value={data.inquiry.phone} />
          </View>
        </View>

        {/* Quote Reference */}
        <View style={s.section}>
          <SectionHeader title="견적 정보  |  Quote Reference" />
          <View style={s.sectionBody}>
            <InfoRow label="견적번호 (Quote ID)" value={shortId(data.id)} />
            <InfoRow label="상태 (Status)" value={data.status} />
            <InfoRow
              label="생성일 (Created)"
              value={formatDate(data.createdAt)}
            />
            <InfoRow label="문의 제목 (Inquiry)" value={data.inquiry.title} />
          </View>
        </View>

        {/* Line Items */}
        <View style={s.section}>
          <SectionHeader title="항목 내역  |  Line Items" />
          <View style={s.sectionBody}>
            {sortedLineItems.length === 0 ? (
              <Text style={s.noData}>등록된 항목이 없습니다.</Text>
            ) : (
              <>
                <View style={s.tableHeader}>
                  <Text style={[s.colNo, s.colHeaderText]}>No.</Text>
                  <Text style={[s.colLabel, s.colHeaderText]}>
                    항목 (Description)
                  </Text>
                  <Text style={[s.colAmount, s.colHeaderText]}>
                    금액 (Amount)
                  </Text>
                </View>
                {sortedLineItems.map((item, i) => (
                  <View key={item.id} style={s.tableRow}>
                    <Text style={s.colNo}>{i + 1}</Text>
                    <View style={{ flex: 1, paddingHorizontal: 4 }}>
                      <Text style={{ fontSize: 9 }}>{item.label}</Text>
                      {item.description && (
                        <Text style={s.descText}>{item.description}</Text>
                      )}
                    </View>
                    <Text style={s.colAmount}>
                      {formatRange(
                        item.amountMin,
                        item.amountMax,
                        data.rangeMode,
                      )}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>

        {/* Adjustments */}
        {sortedAdjustments.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="조정 항목  |  Adjustments" />
            <View style={s.sectionBody}>
              {sortedAdjustments.map((adj) => (
                <View key={adj.id} style={s.adjRow}>
                  <View style={{ flex: 1, paddingHorizontal: 8 }}>
                    <Text style={{ fontSize: 9 }}>{adj.label}</Text>
                    {adj.description && (
                      <Text style={s.adjDesc}>{adj.description}</Text>
                    )}
                  </View>
                  <Text style={s.adjAmount}>
                    {formatRange(
                      adj.computedMin,
                      adj.computedMax,
                      data.rangeMode,
                    )}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Summary Totals */}
        <View style={s.section}>
          <SectionHeader title="합계  |  Summary" />
          <View
            style={[s.sectionBody, { padding: 0, overflow: "hidden" }]}
          >
            <View style={s.totalRow}>
              <Text style={[s.totalLabel, { fontFamily: "Helvetica-Bold" }]}>
                서비스 기본료 (Service Base Fee)
              </Text>
              <Text style={s.totalValue}>
                {formatRange(
                  data.serviceBaseMin,
                  data.serviceBaseMax,
                  data.rangeMode,
                )}
              </Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>소계 (Subtotal)</Text>
              <Text style={s.totalValue}>
                {formatRange(
                  data.subtotalMin,
                  data.subtotalMax,
                  data.rangeMode,
                )}
              </Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>부가세 (VAT)</Text>
              <Text style={s.totalValue}>
                {formatRange(
                  data.vatAmountMin,
                  data.vatAmountMax,
                  data.rangeMode,
                )}
              </Text>
            </View>
            <View style={s.grandTotalRow}>
              <Text style={s.grandTotalLabel}>합계 (Total)</Text>
              <Text style={s.grandTotalValue}>
                {formatRange(
                  data.totalMin,
                  data.totalMax,
                  data.rangeMode,
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Terms */}
        {sortedPaymentPlans.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="결제 조건  |  Payment Terms" />
            <View style={s.sectionBody}>
              <View style={s.payHeader}>
                <Text style={[s.payStage, s.colHeaderText]}>단계 (Stage)</Text>
                <Text style={[s.payPercent, s.colHeaderText]}>비율 (%)</Text>
                <Text style={[s.payDue, s.colHeaderText]}>
                  납부 시기 (Due)
                </Text>
                <Text style={[s.payAmount, s.colHeaderText]}>
                  금액 (Amount)
                </Text>
              </View>
              {sortedPaymentPlans.map((plan) => (
                <View key={plan.id} style={s.payRow}>
                  <Text style={s.payStage}>{plan.stageKind}</Text>
                  <Text style={s.payPercent}>{plan.percentage}%</Text>
                  <Text style={s.payDue}>{plan.dueText}</Text>
                  <Text style={s.payAmount}>
                    {formatRange(
                      plan.amountMin,
                      plan.amountMax,
                      data.rangeMode,
                    )}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Validity Note */}
        <Text style={s.validityNote}>
          본 견적서는 발행일로부터 30일간 유효합니다.
        </Text>

        {/* Footer with page numbers */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            ETHOS 행정사사무소 | Confidential
          </Text>
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

export async function renderQuotePdf(
  quoteData: QuoteData,
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <QuoteDocument data={quoteData} />,
  );
  return Buffer.from(buffer);
}
