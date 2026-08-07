import type { Metadata } from "next";

import { ContractServiceRoute } from "@/components/public/service-route-contract";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contract / Investigation — ETHOS Administrative Attorney Office",
  description: "Contract review and drafting, dispute fact-finding, and investigation report preparation."
};

export default function EnContractPage() {
  return <ContractServiceRoute lang="en" />;
}
