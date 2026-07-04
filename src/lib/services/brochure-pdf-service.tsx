/**
 * 인쇄용 브로슈어 PDF 생성 서비스.
 *
 * 4-page A4 PDF: (1) Hero, (2) 5대 업무 분야, (3) 절차·비교 테이블, (4) 연락처·QR.
 * navy/gold 브랜드 팔레트. 사이트 설정(전화·이메일·주소)을 자동 반영.
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

import { getSiteSettings } from "./site-settings";

// ── Brand palette (quote-pdf 와 통일) ──────────────────────────────────
const NAVY = "#1a3c5f";
const GOLD = "#c9a961";
const LIGHT_NAVY = "#2a5580";
const CREAM = "#f8f5ee";
const BORDER = "#cdd5de";
const SECTION_BG = "#f4f6f8";
const WHITE = "#ffffff";
const TEXT_PRIMARY = "#1a1a1a";
const TEXT_SECONDARY = "#555555";

const s = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: TEXT_PRIMARY,
  },
  // Hero page
  heroPage: {
    padding: 0,
    fontFamily: "Helvetica",
    color: TEXT_PRIMARY,
  },
  heroTop: {
    backgroundColor: NAVY,
    paddingTop: 90,
    paddingBottom: 90,
    paddingHorizontal: 48,
    color: WHITE,
  },
  heroBrand: {
    fontSize: 12,
    color: GOLD,
    letterSpacing: 3,
    fontFamily: "Helvetica-Bold",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    marginBottom: 12,
    lineHeight: 1.25,
  },
  heroTagline: {
    fontSize: 13,
    color: "#c8d3e0",
    lineHeight: 1.6,
    marginTop: 8,
  },
  heroGoldBar: {
    height: 4,
    width: 80,
    backgroundColor: GOLD,
    marginTop: 24,
    marginBottom: 24,
  },
  heroPhotoBox: {
    height: 260,
    backgroundColor: CREAM,
    borderWidth: 1,
    borderColor: BORDER,
    marginHorizontal: 48,
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  heroPhotoText: {
    fontSize: 9,
    color: TEXT_SECONDARY,
    fontStyle: "italic",
  },
  heroBottomKicker: {
    marginTop: 30,
    paddingHorizontal: 48,
    fontSize: 10,
    color: TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 1.6,
  },

  // 일반 페이지
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: NAVY,
    paddingBottom: 8,
    marginBottom: 24,
  },
  pageHeaderBrand: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  pageHeaderKicker: {
    fontSize: 8,
    color: TEXT_SECONDARY,
    letterSpacing: 1.5,
  },

  h1: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 6,
  },
  h1Kicker: {
    fontSize: 9,
    color: GOLD,
    letterSpacing: 2,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  intro: {
    fontSize: 10,
    color: TEXT_SECONDARY,
    lineHeight: 1.6,
    marginBottom: 18,
  },

  // 5대 업무 카드
  areaCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 4,
    borderLeftColor: GOLD,
    padding: 12,
    marginBottom: 10,
    backgroundColor: WHITE,
  },
  areaTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 4,
  },
  areaDesc: {
    fontSize: 9,
    color: TEXT_PRIMARY,
    lineHeight: 1.5,
  },

  // 절차
  stepRow: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-start",
  },
  stepNum: {
    width: 32,
    height: 32,
    backgroundColor: NAVY,
    color: WHITE,
    textAlign: "center",
    paddingTop: 8,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginRight: 12,
  },
  stepBody: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 9,
    color: TEXT_SECONDARY,
    lineHeight: 1.5,
  },

  // 비교 테이블
  compareTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginTop: 16,
    marginBottom: 8,
  },
  compareHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  compareHeaderCell: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  compareHeaderCellFirst: {
    width: 100,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  compareRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  compareRowAlt: {
    backgroundColor: SECTION_BG,
  },
  compareCellLabel: {
    width: 100,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: TEXT_PRIMARY,
  },
  compareCell: {
    flex: 1,
    fontSize: 9,
    color: TEXT_PRIMARY,
    paddingHorizontal: 4,
  },
  compareCellHighlight: {
    color: NAVY,
    fontFamily: "Helvetica-Bold",
  },

  // 연락처
  contactBox: {
    backgroundColor: NAVY,
    padding: 24,
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  contactLabel: {
    width: 80,
    fontSize: 10,
    color: GOLD,
    fontFamily: "Helvetica-Bold",
  },
  contactValue: {
    flex: 1,
    fontSize: 10,
    color: WHITE,
  },
  qrBlock: {
    marginTop: 20,
    alignItems: "center",
  },
  qrBox: {
    width: 130,
    height: 130,
    borderWidth: 2,
    borderColor: NAVY,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WHITE,
  },
  qrPlaceholder: {
    fontSize: 8,
    color: TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 1.4,
  },
  qrCaption: {
    marginTop: 10,
    fontSize: 9,
    color: TEXT_SECONDARY,
    textAlign: "center",
  },
  qrUrl: {
    marginTop: 4,
    fontSize: 10,
    color: NAVY,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: TEXT_SECONDARY,
  },
});

// ── 데이터 ────────────────────────────────────────────────────────────

const PRACTICE_AREAS: { title: string; desc: string }[] = [
  {
    title: "비자 · 외국인 체류 (Immigration)",
    desc: "체류자격 변경·연장, 영주·귀화, 사증 발급 인정, 재신청·이의신청까지. 주한 대사관 비자 실무 경험과 3개 국어(한·영·아랍어) 응대.",
  },
  {
    title: "행정심판 (Administrative Appeals)",
    desc: "출입국·과징금·영업정지·인허가 거부 등 각종 행정처분에 대한 이의신청·행정심판 청구. 서면·증거 구성부터 심리 대응까지.",
  },
  {
    title: "계약서 · 사실조사 (Contracts & Fact-Finding)",
    desc: "계약서 검토·작성, 진술서·사실확인서, 국내외 사실조사 보고서. 실무에서 바로 쓰이는 문서 품질.",
  },
  {
    title: "인허가 (Licensing)",
    desc: "영업허가·등록·신고, 관계 부처 협의, 요건 미비 시 보완 전략. 인허가 리스크를 사전에 진단합니다.",
  },
  {
    title: "법인 설립 · 운영 (Corporate)",
    desc: "국내·외국인 법인 설립, 정관·규정, 컴플라이언스 문서, 각종 신고. 사업 초기 행정 리스크를 낮춥니다.",
  },
];

const STEPS: { title: string; desc: string }[] = [
  {
    title: "1. 문의 접수 (24시간 이내 회신)",
    desc: "홈페이지·전화·카카오 채널로 문의. 사실관계와 목표를 확인합니다.",
  },
  {
    title: "2. 무료 검토 (영업일 기준)",
    desc: "사안의 쟁점·성공 가능성·예상 절차를 정리해 회신합니다.",
  },
  {
    title: "3. 유료 상담 (수임 시 차감)",
    desc: "구체 전략·비용·일정 협의. 서면 견적서를 함께 드립니다.",
  },
  {
    title: "4. 수임 및 진행 (진행 리포트 제공)",
    desc: "계약·착수금, 정기 진행 리포트, 관계 기관 대응.",
  },
  {
    title: "5. 결과 정리 · 사후 관리",
    desc: "결과 통지·재신청·후속 절차 안내까지 마무리합니다.",
  },
];

const COMPARE_ROWS: { label: string; general: string; ethos: string }[] = [
  { label: "무료 검토",   general: "제한적 · 24시간+", ethos: "영업일 24시간 회신" },
  { label: "다국어 응대", general: "한국어 위주",        ethos: "한 · 영 · 아랍어" },
  { label: "진행 리포트", general: "요청 시",            ethos: "정기 제공" },
  { label: "견적",        general: "구두",              ethos: "서면 견적서 · PDF" },
  { label: "상담료",      general: "고정",              ethos: "수임 시 전액 차감" },
];

// ── 데이터 로드 ───────────────────────────────────────────────────────

interface BrochureData {
  phone: string;
  email: string;
  address: string;
  hours: string;
  homepage: string;
  kakaoUrl: string;
}

function getHomepageUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      new URL(raw);
      return raw;
    } catch {
      /* fallthrough */
    }
  }
  return "https://ethosattorney.com";
}

async function loadBrochureData(): Promise<BrochureData> {
  let settings: Record<string, string> = {};
  try {
    settings = (await getSiteSettings()) as Record<string, string>;
  } catch {
    settings = {};
  }
  return {
    phone: settings["contact.phone"] || "02-0000-0000",
    email: settings["contact.email"] || "a.attorneyjean@gmail.com",
    address: settings["contact.address"] || "서울 동대문구 (비상주 · 전국 비대면 가능)",
    hours: settings["contact.hours"] || "평일 09:00 - 18:00",
    kakaoUrl: settings["contact.kakaoUrl"] || "",
    homepage: getHomepageUrl(),
  };
}

// ── Components ────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <View style={s.pageHeader}>
      <Text style={s.pageHeaderBrand}>ETHOS 행정사사무소</Text>
      <Text style={s.pageHeaderKicker}>LOGOS · PATHOS · ETHOS</Text>
    </View>
  );
}

function PageFooter({ pageLabel }: { pageLabel: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>ETHOS 행정사사무소 · Administrative Services</Text>
      <Text style={s.footerText}>{pageLabel}</Text>
    </View>
  );
}

function HeroPage() {
  return (
    <Page size="A4" style={s.heroPage}>
      <View style={s.heroTop}>
        <Text style={s.heroBrand}>ETHOS · 행정사사무소</Text>
        <Text style={s.heroTitle}>
          절차에는 이성을,{"\n"}사람에게는 공감을,{"\n"}일에는 신뢰를.
        </Text>
        <View style={s.heroGoldBar} />
        <Text style={s.heroTagline}>
          비자 · 외국인 체류 · 행정심판 · 계약서 · 사실조사 · 인허가 · 법인 설립{"\n"}
          Logos · Pathos · Ethos — 세 가지 원칙으로 함께합니다.
        </Text>
      </View>

      <View style={s.heroPhotoBox}>
        <Text style={s.heroPhotoText}>[ 대표 사진 · Portrait Photo Placeholder ]</Text>
      </View>

      <Text style={s.heroBottomKicker}>
        본 브로슈어는 ETHOS 행정사사무소의 업무 소개용 자료입니다.{"\n"}
        상세 절차·비용은 상담 시 별도 안내드립니다.
      </Text>

      <PageFooter pageLabel="Page 1 / 4" />
    </Page>
  );
}

function AreasPage() {
  return (
    <Page size="A4" style={s.page}>
      <PageHeader />
      <Text style={s.h1Kicker}>PRACTICE AREAS</Text>
      <Text style={s.h1}>5대 업무 분야</Text>
      <Text style={s.intro}>
        행정 문제 뒤에 있는 사람의 마음까지 함께 헤아립니다. 아래 5개 분야를 중심으로,
        문의부터 결과 정리까지 하나의 창구에서 도와드립니다.
      </Text>

      {PRACTICE_AREAS.map((a) => (
        <View key={a.title} style={s.areaCard}>
          <Text style={s.areaTitle}>{a.title}</Text>
          <Text style={s.areaDesc}>{a.desc}</Text>
        </View>
      ))}

      <PageFooter pageLabel="Page 2 / 4" />
    </Page>
  );
}

function ProcessPage() {
  return (
    <Page size="A4" style={s.page}>
      <PageHeader />
      <Text style={s.h1Kicker}>HOW WE WORK</Text>
      <Text style={s.h1}>절차 소개</Text>
      <Text style={s.intro}>
        문의 접수부터 사후 관리까지, 각 단계마다 서면으로 결과를 공유합니다.
      </Text>

      {STEPS.map((step) => (
        <View key={step.title} style={s.stepRow}>
          <Text style={s.stepNum}>{step.title.charAt(0)}</Text>
          <View style={s.stepBody}>
            <Text style={s.stepTitle}>{step.title}</Text>
            <Text style={s.stepDesc}>{step.desc}</Text>
          </View>
        </View>
      ))}

      <Text style={s.compareTitle}>일반 행정사 사무소 vs ETHOS</Text>
      <View style={s.compareHeader}>
        <Text style={s.compareHeaderCellFirst}>항목</Text>
        <Text style={s.compareHeaderCell}>일반</Text>
        <Text style={s.compareHeaderCell}>ETHOS</Text>
      </View>
      {COMPARE_ROWS.map((row, i) => (
        <View
          key={row.label}
          style={i % 2 === 0 ? [s.compareRow, s.compareRowAlt] : s.compareRow}
        >
          <Text style={s.compareCellLabel}>{row.label}</Text>
          <Text style={s.compareCell}>{row.general}</Text>
          <Text style={[s.compareCell, s.compareCellHighlight]}>{row.ethos}</Text>
        </View>
      ))}

      <PageFooter pageLabel="Page 3 / 4" />
    </Page>
  );
}

function ContactPage({ data }: { data: BrochureData }) {
  return (
    <Page size="A4" style={s.page}>
      <PageHeader />
      <Text style={s.h1Kicker}>CONTACT</Text>
      <Text style={s.h1}>연락처 · 상담 예약</Text>
      <Text style={s.intro}>
        전화 · 이메일 · 카카오 채널 어디로든 편하게 연락 주세요. 영업일 24시간 이내 회신드립니다.
      </Text>

      <View style={s.contactBox}>
        <View style={s.contactRow}>
          <Text style={s.contactLabel}>Phone</Text>
          <Text style={s.contactValue}>{data.phone}</Text>
        </View>
        <View style={s.contactRow}>
          <Text style={s.contactLabel}>Email</Text>
          <Text style={s.contactValue}>{data.email}</Text>
        </View>
        <View style={s.contactRow}>
          <Text style={s.contactLabel}>Address</Text>
          <Text style={s.contactValue}>{data.address}</Text>
        </View>
        <View style={s.contactRow}>
          <Text style={s.contactLabel}>Hours</Text>
          <Text style={s.contactValue}>{data.hours}</Text>
        </View>
        {data.kakaoUrl ? (
          <View style={s.contactRow}>
            <Text style={s.contactLabel}>Kakao</Text>
            <Text style={s.contactValue}>{data.kakaoUrl}</Text>
          </View>
        ) : null}
      </View>

      <View style={s.qrBlock}>
        <View style={s.qrBox}>
          <Text style={s.qrPlaceholder}>
            [ QR CODE ]{"\n"}
            {data.homepage}
          </Text>
        </View>
        <Text style={s.qrCaption}>스마트폰 카메라로 스캔하면 홈페이지로 이동합니다.</Text>
        <Text style={s.qrUrl}>{data.homepage}</Text>
      </View>

      <PageFooter pageLabel="Page 4 / 4" />
    </Page>
  );
}

function BrochureDocument({ data }: { data: BrochureData }) {
  return (
    <Document>
      <HeroPage />
      <AreasPage />
      <ProcessPage />
      <ContactPage data={data} />
    </Document>
  );
}

// ── Public API ────────────────────────────────────────────────────────

export async function generateBrochurePdf(): Promise<Buffer> {
  const data = await loadBrochureData();
  const buffer = await renderToBuffer(<BrochureDocument data={data} />);
  return Buffer.from(buffer);
}
