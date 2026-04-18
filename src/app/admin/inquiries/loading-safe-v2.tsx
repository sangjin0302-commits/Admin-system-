import { LoadingState } from "@/components/ui/state-panel";

const KO_TITLE = "\uBB38\uC758 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.";
const KO_DESCRIPTION =
  "\uC6B0\uC120\uC21C\uC704, \uC791\uC5C5 \uD050, \uD544\uD130 \uACB0\uACFC\uB97C \uC815\uB9AC\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.";

export default function AdminInquiryListLoadingSafeV2() {
  return <LoadingState title={KO_TITLE} description={KO_DESCRIPTION} rows={5} />;
}
