import type { Metadata } from "next";

import ConsultContent from "@/components/public/consult-content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Consultation Guide — Free Review · Paid Consultation · Deducted on Engagement | ETHOS",
  description:
    "ETHOS Administrative Attorney Office consultation structure. Review is free; in-depth consultation is paid (KRW 33,000~55,000), fully deducted from the fee upon engagement."
};

export default function EnConsultPage() {
  return <ConsultContent lang="en" />;
}
