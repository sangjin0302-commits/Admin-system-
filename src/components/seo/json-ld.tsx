/**
 * schema.org JSON-LD 컴포넌트들 — Google 리치 결과 + 행정사 LegalService 마크업.
 *
 * 사용:
 *   import { OrganizationJsonLd, LegalServiceJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
 *   <OrganizationJsonLd />
 *   <LegalServiceJsonLd serviceName="비자/체류" />
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ethosattorney.com";
const ORG_NAME = "ETHOS 행정사사무소";
const ORG_PHONE = process.env.NEXT_PUBLIC_OFFICE_PHONE ?? "+82-2-0000-0000";
const ORG_EMAIL = process.env.NEXT_PUBLIC_OFFICE_EMAIL ?? "a.attorneyjean@gmail.com";
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
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.svg`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: ORG_PHONE,
        contactType: "customer support",
        email: ORG_EMAIL,
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
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: `${ORG_NAME} — ${serviceName}`,
    description,
    url: url ?? SITE_URL,
    areaServed: { "@type": "Country", name: "Korea" },
    priceRange: "₩33,000~₩55,000 검토 무료 · 수임 시 차감",
    availableLanguage: ["Korean", "English", "Arabic"],
    provider: {
      "@type": "ProfessionalService",
      name: ORG_NAME,
      url: SITE_URL,
      knowsLanguage: KNOWS_LANGUAGES,
      sameAs: SAME_AS
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: ORG_ADDRESS_LOCALITY,
      addressRegion: ORG_ADDRESS_REGION,
      addressCountry: ORG_ADDRESS_COUNTRY,
    },
    telephone: ORG_PHONE,
  });
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `${SITE_URL}${it.url}`,
    })),
  });
}

export function PersonJsonLd() {
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Jean",
    alternateName: "행정사 Jean",
    jobTitle: "행정사 (Administrative Attorney)",
    worksFor: {
      "@type": "Organization",
      name: ORG_NAME,
      url: SITE_URL
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
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: imageUrl,
    url: url.startsWith("http") ? url : `${SITE_URL}${url}`,
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
        url: `${SITE_URL}/icon-512.svg`,
      },
    },
  });
}
