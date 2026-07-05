/**
 * 수료증 PDF 생성 — ETHOS 브랜드 팔레트 (navy/gold).
 * brochure-pdf-service의 패턴을 재사용.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";

const NAVY = "#1a3c5f";
const GOLD = "#c9a961";
const CREAM = "#f8f5ee";
const BORDER = "#cdd5de";

const s = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 60,
    fontFamily: "Helvetica",
    backgroundColor: CREAM,
  },
  frame: {
    borderWidth: 4,
    borderColor: GOLD,
    borderStyle: "solid",
    padding: 40,
    height: "100%",
    backgroundColor: "#ffffff",
  },
  brand: {
    fontSize: 12,
    color: GOLD,
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    color: NAVY,
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
    marginBottom: 40,
  },
  bodyIntro: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  learnerName: {
    fontSize: 24,
    color: NAVY,
    textAlign: "center",
    marginBottom: 30,
    fontWeight: "bold",
  },
  courseName: {
    fontSize: 16,
    color: NAVY,
    textAlign: "center",
    marginBottom: 30,
  },
  footer: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    borderTopStyle: "solid",
    paddingTop: 16,
  },
  footerBlock: {
    fontSize: 10,
    color: "#555",
  },
  seal: {
    fontSize: 10,
    color: GOLD,
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 20,
  },
});

export interface CertificateData {
  learnerName: string;
  courseName: string;
  issuedAt: Date;
  certificateNo: string;
  officeName?: string;
  representativeName?: string;
}

function CertificateDocument({ data }: { data: CertificateData }) {
  const issued = data.issuedAt.toISOString().slice(0, 10);
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", orientation: "landscape", style: s.page },
      React.createElement(
        View,
        { style: s.frame },
        React.createElement(Text, { style: s.brand }, "ETHOS · CERTIFICATE OF COMPLETION"),
        React.createElement(Text, { style: s.title }, "수료증"),
        React.createElement(Text, { style: s.subtitle }, `Certificate No. ${data.certificateNo}`),
        React.createElement(Text, { style: s.bodyIntro }, "다음 과정을 성실히 이수하였음을 증명합니다."),
        React.createElement(Text, { style: s.learnerName }, data.learnerName),
        React.createElement(Text, { style: s.courseName }, `< ${data.courseName} >`),
        React.createElement(
          View,
          { style: s.footer },
          React.createElement(
            View,
            { style: s.footerBlock },
            React.createElement(Text, null, `발급일: ${issued}`),
            React.createElement(Text, null, `발급기관: ${data.officeName ?? "행정사 사무소 ETHOS"}`)
          ),
          React.createElement(
            View,
            { style: s.footerBlock },
            React.createElement(Text, null, `대표: ${data.representativeName ?? "-"}`),
            React.createElement(Text, null, "직인 (인)")
          )
        ),
        React.createElement(Text, { style: s.seal }, "LOGOS · PATHOS · ETHOS")
      )
    )
  );
}

export async function generateCertificatePdf(data: CertificateData): Promise<Buffer> {
  // renderToBuffer expects a Document root element; our factory returns the same tree.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(React.createElement(CertificateDocument, { data }) as any);
}
