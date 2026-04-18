import { LoadingState } from "@/components/ui/state-panel";

const KO_TITLE = "\uAD00\uB9AC\uC790 \uD654\uBA74\uC744 \uC900\uBE44\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.";
const KO_DESCRIPTION =
  "\uBB38\uC758, \uACAC\uC801, \uC0AC\uAC74, \uC5F0\uB3D9 \uC0C1\uD0DC\uB97C \uBD88\uB7EC\uC624\uACE0 \uC788\uC2B5\uB2C8\uB2E4.";

export default function AdminLoadingSafeV2() {
  return <LoadingState title={KO_TITLE} description={KO_DESCRIPTION} rows={4} />;
}
