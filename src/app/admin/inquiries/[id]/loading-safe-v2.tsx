import { LoadingState } from "@/components/ui/state-panel";

const KO_TITLE = "\uC0AC\uAC74 \uC0C1\uC138\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.";
const KO_DESCRIPTION =
  "\uACE0\uAC1D \uC0AC\uAC74, Lawbot \uACB0\uACFC, \uACAC\uC801 \uC6CC\uD06C\uC2A4\uD398\uC774\uC2A4\uB97C \uC900\uBE44\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.";

export default function AdminInquiryDetailLoadingSafeV2() {
  return <LoadingState title={KO_TITLE} description={KO_DESCRIPTION} rows={6} />;
}
