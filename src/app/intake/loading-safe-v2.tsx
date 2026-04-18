import { LoadingState } from "@/components/ui/state-panel";

const KO_TITLE = "\uC811\uC218 \uD654\uBA74\uC744 \uC900\uBE44\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.";
const KO_DESCRIPTION = "\uC0C1\uB2F4 \uC811\uC218 \uD3FC\uC744 \uBD88\uB7EC\uC624\uACE0 \uC788\uC2B5\uB2C8\uB2E4.";

export default function IntakeLoadingSafeV2() {
  return <LoadingState title={KO_TITLE} description={KO_DESCRIPTION} rows={4} />;
}
