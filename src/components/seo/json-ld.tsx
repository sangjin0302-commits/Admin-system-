/**
 * schema.org JSON-LD 컴포넌트들 — Google 리치 결과 + 행정사 LegalService 마크업.
 *
 * 사용:
 *   import { OrganizationJsonLd, LegalServiceJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
 *   <OrganizationJsonLd />
 *   <LegalServiceJsonLd serviceName="비자/체류" />
 */

import { getSiteUrl } from "@/lib/utils/site-url";

const ORG_NAME = "ETHOS 행정사사무소";

/** env는 호출 시점에 읽는다 — 모듈 레벨 const는 빌드 캐시가 빈 값을 고정시킬 수 있음. */
function getOrgPhone(): string {
  return process.env.NEXT_PUBLIC_OFFICE_PHONE ?? "+82-2-0000-0000";
}
function getOrgEmail(): string {
  return process.env.NEXT_PUBLIC_OFFICE_EMAIL ?? "a.attorneyjean@gmail.com";
}

const ORG_ADDRESS_LOCALITY = "Seoul";
const ORG_ADDRESS_REGION = "Dongdaemun-gu";
const ORG_ADDRESS_COUNTRY = "KR";
const KNOWS_LANGUAGES = ["ko-KR", "en-US", "ar-SA"];
const SAME_AS = [
  "https://m.expert.naver.com/expert/profile/home?storeId=100060507",
  "https://www.linkedin.com/in/kareem-sangjin-ji-052419212"
];

function jsonLdScript(data: unknown) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  const siteUrl = getSiteUrl();
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    url: siteUrl,
    logo: `${siteUrl}/icon-512.svg`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: getOrgPhone(),
        contactType: "customer support",
        email: getOrgEmail(),
        availableLanguage: ["Korean", "English", "Arabic"],
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: ORG_ADDRESS_LOCALITY,
      addressRegion: ORG_ADDRESS_REGION,
      addressCountry: ORG_ADDRESS_COUNTRY,
    },
    knowsLanguage: KNOWS_LANGUAGES,
    sameAs: SAME_AS,
  });
}

export function LegalServiceJsonLd({
  serviceName,
  description,
  url,
}: {
  serviceName: string;
  description?: string;
  url?: string;
}) {
  const siteUrl = getSiteUrl();
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: `${ORG_NAME} — ${serviceName}`,
    description,
    url: url ?? siteUrl,
    areaServed: { "@type": "Country", name: "Korea" },
    priceRange: "₩33,000~₩55,000 검토 무료 · 수임 시 차감",
    availableLanguage: ["Korean", "English", "Arabic"],
    provider: {
      "@type": "ProfessionalService",
      name: ORG_NAME,
      url: siteUrl,
      knowsLanguage: KNOWS_LANGUAGES,
      sameAs: SAME_AS
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: ORG_ADDRESS_LOCALITY,
      addressRegion: ORG_ADDRESS_REGION,
      addressCountry: ORG_ADDRESS_COUNTRY,
    },
    telephone: getOrgPhone(),
  });
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const siteUrl = getSiteUrl();
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `${siteUrl}${it.url}`,
    })),
  });
}

export function PersonJsonLd() {
  const siteUrl = getSiteUrl();
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Jean",
    alternateName: "행정사 Jean",
    jobTitle: "행정사 (Administrative Attorney)",
    worksFor: {
      "@type": "Organization",
      name: ORG_NAME,
      url: siteUrl
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: ORG_ADDRESS_LOCALITY,
      addressRegion: ORG_ADDRESS_REGION,
      addressCountry: ORG_ADDRESS_COUNTRY
    },
    knowsLanguage: KNOWS_LANGUAGES,
    knowsAbout: [
      "Visa and Immigration Law",
      "Administrative Appeals",
      "Contract Drafting and Review",
      "License and Permit Procedures",
      "Company Formation for Foreign Founders"
    ],
    alumniOf: {
      "@type": "EducationalOrganization",
      name: "Hankuk University of Foreign Studies — Graduate School of Interpretation and Translation"
    },
    sameAs: SAME_AS
  });
}

export function FAQJsonLd({
  qa,
}: {
  qa: Array<{ question: string; answer: string }>;
}) {
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.answer,
      },
    })),
  });
}

export function EventJsonLd({
  name,
  description,
  performerName = "Jean",
  organizerName = "KISED — Korea Institute of Startup & Entrepreneurship Development",
  eventStatus = "EventScheduled",
  attendanceMode = "MixedEventAttendanceMode"
}: {
  name: string;
  description?: string;
  performerName?: string;
  organizerName?: string;
  eventStatus?: "EventScheduled" | "EventCancelled" | "EventPostponed" | "EventRescheduled";
  attendanceMode?: "OfflineEventAttendanceMode" | "OnlineEventAttendanceMode" | "MixedEventAttendanceMode";
}) {
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    description,
    eventStatus: `https://schema.org/${eventStatus}`,
    eventAttendanceMode: `https://schema.org/${attendanceMode}`,
    location: {
      "@type": "Place",
      name: "Seoul, Korea",
      address: {
        "@type": "PostalAddress",
        addressLocality: ORG_ADDRESS_LOCALITY,
        addressCountry: ORG_ADDRESS_COUNTRY
      }
    },
    performer: { "@type": "Person", name: performerName },
    organizer: { "@type": "Organization", name: organizerName }
  });
}

export function ArticleJsonLd({
  title,
  description,
  url,
  imageUrl,
  publishedAt,
  modifiedAt,
  authorName,
}: {
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  publishedAt?: string | Date;
  modifiedAt?: string | Date;
  authorName?: string;
}) {
  const siteUrl = getSiteUrl();
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: imageUrl,
    url: url.startsWith("http") ? url : `${siteUrl}${url}`,
    datePublished: publishedAt
      ? new Date(publishedAt).toISOString()
      : undefined,
    dateModified: modifiedAt ? new Date(modifiedAt).toISOString() : undefined,
    author: {
      "@type": "Organization",
      name: authorName ?? ORG_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icon-512.svg`,
      },
    },
  });
}
