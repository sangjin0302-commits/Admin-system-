/**
 * Reusable JSON-LD structured data components for SEO.
 * Renders Schema.org markup as <script type="application/ld+json">.
 */

/* ------------------------------------------------------------------ */
/*  LocalBusinessJsonLd — for home / about pages & root layout        */
/* ------------------------------------------------------------------ */

const LOCAL_BUSINESS_DATA = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  name: "ETHOS 행정사사무소",
  description:
    "비자/체류, 행정심판, 계약서·사실조사, 인허가 업무. 절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를.",
  url: "https://adminofficemvp2.vercel.app",
  address: {
    "@type": "PostalAddress",
    addressCountry: "KR",
    addressLocality: "서울특별시",
  },
  areaServed: {
    "@type": "Country",
    name: "KR",
  },
  serviceType: [
    "비자/외국인 체류",
    "행정심판",
    "계약서·사실조사",
    "인허가",
    "법인 설립",
  ],
};

export function LocalBusinessJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_DATA) }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  ServiceJsonLd — for individual service detail pages               */
/* ------------------------------------------------------------------ */

interface ServiceJsonLdProps {
  name: string;
  description: string;
  url: string;
}

export function ServiceJsonLd({ name, description, url }: ServiceJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url,
    provider: {
      "@type": "LegalService",
      name: "ETHOS 행정사사무소",
      url: "https://adminofficemvp2.vercel.app",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
