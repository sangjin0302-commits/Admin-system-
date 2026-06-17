/**
 * 서비스 상세 페이지 영문 콘텐츠 (lang=en).
 * 슬러그(immigration/appeal/contract/license)별 영문 데이터.
 * ServicePage가 lang === "en" 일 때 한글 데이터 대신 사용.
 */

export type ServiceEnContent = {
  tagline: string;
  description: string;
  whoFor: readonly string[];
  process: readonly { step: string; title: string; desc: string }[];
  documents: readonly string[];
  deadlines: readonly { label: string; value: string }[];
  faq: readonly { q: string; a: string }[];
};

export const SERVICE_EN: Record<string, ServiceEnContent> = {
  immigration: {
    tagline: "Organize your stay in Korea, end to end",
    description:
      "From status changes, extensions, and invitations to permanent residence, naturalization, and removal defense — we handle the full immigration journey, starting with the facts and required documents.",
    whoFor: [
      "Those who need a status change or extension of stay",
      "Those needing a business / investment / employment visa",
      "Those facing a removal or departure order",
      "Those preparing permanent residence or naturalization",
      "Those needing an invitation (certificate of confirmation of visa issuance)",
      "Those who received a supplement request for their stay"
    ],
    process: [
      { step: "01", title: "Review the facts", desc: "Passport, residence card, prior dispositions" },
      { step: "02", title: "Check eligibility", desc: "Compare current vs. target status requirements" },
      { step: "03", title: "Prepare documents", desc: "Required & recommended materials per authority" },
      { step: "04", title: "File & track", desc: "Through filing and supplement responses" }
    ],
    documents: [
      "Passport copy (bio page)",
      "Alien registration card copy",
      "Status evidence (employment certificate, business registration, etc.)",
      "Residence proof (lease, family records, etc.)",
      "Prior disposition / notice (if any)"
    ],
    deadlines: [
      { label: "Extension of stay", value: "From 4 months before expiry until the expiry date" },
      { label: "Status change", value: "Within the current period of stay" },
      { label: "Appeal of removal", value: "Within 14 days of the disposition notice" }
    ],
    faq: [
      { q: "My stay expires soon — is it still possible?", a: "Filing before expiry is the rule. We confirm the feasible scope for your case first." },
      { q: "What are the F-2 change requirements?", a: "Point-system items and documents vary by case; we advise after reviewing the facts." },
      { q: "I received a removal order.", a: "We first check the disposition and notice dates to review the appeal scope and materials." },
      { q: "I'm looking into an employment visa for a foreign worker.", a: "We pre-review industry, role, and qualification requirements, then advise on possible visa types." }
    ]
  },
  appeal: {
    tagline: "From disposition notice to the final ruling",
    description:
      "We review the disposition, notice date, and claim deadline, then organize the grounds and evidence to prepare your administrative appeal through the hearing and ruling.",
    whoFor: [
      "Those who received an unfavorable disposition (suspension, cancellation, etc.)",
      "Those considering an appeal but unsure of the deadline",
      "Those who need help organizing grounds and evidence",
      "Those who received a rejection and want to challenge it",
      "Those who need step-by-step tracking through the ruling"
    ],
    process: [
      { step: "01", title: "Confirm deadline", desc: "Disposition / notice / delivery dates (90-day rule)" },
      { step: "02", title: "Organize grounds", desc: "Legal basis and factual arguments" },
      { step: "03", title: "Compile evidence", desc: "Documents and supporting materials" },
      { step: "04", title: "File & track", desc: "Through claim, hearing, and ruling" }
    ],
    documents: [
      "Disposition notice / written decision",
      "Delivery envelope or notice date evidence",
      "Materials supporting your grounds",
      "Related contracts / records (if any)",
      "Power of attorney (provided after intake)"
    ],
    deadlines: [
      { label: "Appeal claim", value: "Within 90 days of knowing the disposition" },
      { label: "Objection", value: "Per the period stated in the notice" },
      { label: "Supplement", value: "By the deadline given by the authority" }
    ],
    faq: [
      { q: "Has my deadline passed?", a: "We check the notice and delivery dates first to confirm whether a claim is still possible." },
      { q: "Can I win?", a: "Outcomes are never guaranteed. We assess the grounds and evidence realistically before proceeding." },
      { q: "Do I have to attend the hearing?", a: "It depends on the case; we guide you on attendance and statements in advance." },
      { q: "How long does it take?", a: "It varies by authority and case; we share an estimated timeline after reviewing the facts." }
    ]
  },
  contract: {
    tagline: "Clear contracts, verified facts",
    description:
      "Contract review and drafting, dispute fact-finding, and investigation reports — we organize the facts by timeline so you can respond with confidence.",
    whoFor: [
      "Those who need a contract reviewed or drafted",
      "Those who need the facts of a dispute organized",
      "Those who need an investigation/fact-finding report",
      "Those preparing materials for negotiation or proceedings",
      "Those who want risky clauses checked before signing"
    ],
    process: [
      { step: "01", title: "Understand the matter", desc: "Background, parties, and goal" },
      { step: "02", title: "Review & gather", desc: "Contract terms or fact materials" },
      { step: "03", title: "Organize by timeline", desc: "Structure facts and issues" },
      { step: "04", title: "Deliver report", desc: "Review opinion or investigation report" }
    ],
    documents: [
      "Draft or signed contract",
      "Related correspondence (messages, emails)",
      "Materials evidencing the facts",
      "Counterparty information (as known)",
      "Any prior agreements or records"
    ],
    deadlines: [
      { label: "Contract review", value: "Recommended before signing" },
      { label: "Fact-finding", value: "Earlier is better while evidence remains" },
      { label: "Report delivery", value: "Depends on scope; agreed in advance" }
    ],
    faq: [
      { q: "Can you review just one clause?", a: "Yes. Review-only, drafting-only, or combined — we scope to your need." },
      { q: "Is a fact-finding report legally binding?", a: "It is a reference document; we note its purpose and limits clearly." },
      { q: "How long does it take?", a: "It depends on the volume of materials; we estimate after a first look." },
      { q: "Is my information kept confidential?", a: "Yes. Materials are handled under confidentiality and used only for your matter." }
    ]
  },
  corporate: {
    tagline: "From formation to your first permit",
    description:
      "We guide company formation end to end — entity type, articles of incorporation, registration prep — and connect it to the licenses your business needs after launch.",
    whoFor: [
      "Founders deciding between a corporation and a sole proprietorship",
      "Those preparing articles of incorporation and registration",
      "Foreign founders setting up a company in Korea",
      "Those who need post-formation permits/licenses",
      "Those changing capital, directors, or business purpose"
    ],
    process: [
      { step: "01", title: "Entity & structure", desc: "Type, capital, shareholders, purpose" },
      { step: "02", title: "Draft documents", desc: "Articles, consents, registration set" },
      { step: "03", title: "Register", desc: "Court registration & tax/biz filings" },
      { step: "04", title: "Post-setup", desc: "Required permits and next steps" }
    ],
    documents: [
      "Founder ID / corporate seal info",
      "Capital and shareholding plan",
      "Proposed company name & business purpose",
      "Registered office evidence (lease, etc.)",
      "Foreign founder docs (if applicable)"
    ],
    deadlines: [
      { label: "Registration after formation", value: "Within the statutory period after resolution" },
      { label: "Business registration", value: "Within 20 days of starting business" },
      { label: "Post-setup permits", value: "Before commencing the regulated activity" }
    ],
    faq: [
      { q: "Corporation or sole proprietorship?", a: "We compare tax, liability, and credibility for your situation before advising." },
      { q: "Can a foreigner set up a company in Korea?", a: "Yes; we review visa/investment requirements and prepare the formation accordingly." },
      { q: "How long does formation take?", a: "It varies by entity and documents; we share a timeline after the initial review." },
      { q: "Do you handle permits after setup?", a: "Yes — we connect formation directly to the licenses your business needs." }
    ]
  },
  license: {
    tagline: "Permits, supplements, and appeals — together",
    description:
      "Business, construction, food, and medical permits — we handle applications, supplement responses, and appeals, checking permit types and likely supplements in advance.",
    whoFor: [
      "Those applying for a business / facility permit",
      "Those who received a supplement request on a permit",
      "Those whose permit was denied and want to respond",
      "Those who need permit-type and requirement review",
      "Those preparing food, construction, or medical permits"
    ],
    process: [
      { step: "01", title: "Identify permit type", desc: "Applicable permit and requirements" },
      { step: "02", title: "Pre-check feasibility", desc: "Likely supplements and obstacles" },
      { step: "03", title: "Prepare & apply", desc: "Required documents and filing" },
      { step: "04", title: "Respond & appeal", desc: "Supplements and denial responses" }
    ],
    documents: [
      "Business registration / planned location info",
      "Facility / floor plan materials",
      "Qualification or certification evidence",
      "Prior application or disposition (if any)",
      "Other authority-specific materials"
    ],
    deadlines: [
      { label: "Supplement response", value: "By the deadline given by the authority" },
      { label: "Appeal of denial", value: "Within the statutory period after notice" },
      { label: "Renewal", value: "Before the validity period ends" }
    ],
    faq: [
      { q: "Can I get the permit?", a: "We pre-review the permit type and requirements, then advise on feasibility and obstacles." },
      { q: "I received a supplement request.", a: "We check what to supplement and how, then respond step by step." },
      { q: "My application was denied.", a: "We review the denial grounds and notice date to assess the appeal scope." },
      { q: "How long does it take?", a: "It varies by permit type and authority; we share an estimate after review." }
    ]
  }
};
