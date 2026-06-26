import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildCustomerEmailProviderReadiness } from "@/lib/services/customer-email-provider-config";
import {
  buildCustomerEmailProviderReadinessViewModel,
  CUSTOMER_EMAIL_PROVIDER_READINESS_FORBIDDEN_TOKENS
} from "@/lib/services/customer-email-provider-readiness-ui-model";

const emptyReadiness = buildCustomerEmailProviderReadiness({});
const emptyViewModel = buildCustomerEmailProviderReadinessViewModel(emptyReadiness);

assert.equal(emptyViewModel.provider, "dry-run");
assert.equal(emptyViewModel.dryRunOnlyLabel, "true");
assert.equal(emptyViewModel.canSendRealEmailLabel, "false");
assert.equal(emptyViewModel.canUseRealProviderLabel, "false");
assert.equal(emptyViewModel.externalActionAllowedLabel, "false");
assert.equal(emptyViewModel.blockedReasonLabels.includes("이메일 provider가 비활성화되어 있습니다."), true);
assert.equal(emptyViewModel.blockedReasonLabels.includes("실제 이메일 발송 플래그가 꺼져 있습니다."), true);

const enabledLikeViewModel = buildCustomerEmailProviderReadinessViewModel(
  buildCustomerEmailProviderReadiness({
    EMAIL_PROVIDER: "resend",
    EMAIL_PROVIDER_ENABLED: "true",
    EMAIL_REAL_SEND_ENABLED: "true",
    RESEND_API_KEY: "configured",
    EMAIL_FROM: "notice@example.com",
    EMAIL_REPLY_TO: "reply@example.com",
    EMAIL_ALLOWED_FROM_DOMAIN: "example.com"
  })
);

assert.equal(enabledLikeViewModel.provider, "resend");
assert.equal(enabledLikeViewModel.hasApiKeyLabel, "true");
assert.equal(enabledLikeViewModel.hasFromAddressLabel, "true");
assert.equal(enabledLikeViewModel.hasReplyToLabel, "true");
assert.equal(enabledLikeViewModel.hasAllowedDomainLabel, "true");
assert.equal(enabledLikeViewModel.fromDomainAllowedLabel, "true");
assert.equal(enabledLikeViewModel.canSendRealEmailLabel, "false");
assert.equal(enabledLikeViewModel.providerImplementationStatus, "stub_only");
assert.equal(
  enabledLikeViewModel.blockedReasonLabels.includes(
    "실제 provider 구현이 아직 비활성/stub 상태입니다."
  ),
  true
);

const serialized = JSON.stringify(enabledLikeViewModel);
for (const forbidden of [
  "configured",
  "notice@example.com",
  "reply@example.com",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_REPLY_TO",
  "EMAIL_ALLOWED_FROM_DOMAIN"
]) {
  assert.equal(serialized.includes(forbidden), false, `Secret/raw env leaked: ${forbidden}`);
}

const root = process.cwd();
const componentSource = readFileSync(
  join(root, "src/components/admin/customer-email-provider-readiness-card.tsx"),
  "utf8"
);
const centerSource = readFileSync(
  join(root, "src/components/admin/inquiry-communication-center.tsx"),
  "utf8"
);
const logSource = readFileSync(
  join(root, "src/components/admin/inquiry-communication-log-panel.tsx"),
  "utf8"
);

assert.match(componentSource, /이메일 발송 설정 상태/);
assert.match(componentSource, /현재 실제 이메일 발송은 비활성화되어 있습니다/);
assert.match(componentSource, /실제 이메일은 발송되지 않습니다/);
assert.match(componentSource, /SMS\/알림톡 발송도 제공되지 않습니다/);
assert.match(componentSource, /Dry-run only/);
assert.match(componentSource, /실제 이메일 발송 가능/);
assert.match(componentSource, /externalActionAllowed/);
assert.match(componentSource, /blockedReasonLabels/);
assert.match(centerSource, /CustomerEmailProviderReadinessCard/);
assert.equal(logSource.includes("CustomerEmailProviderReadinessCard"), false);

for (const forbidden of CUSTOMER_EMAIL_PROVIDER_READINESS_FORBIDDEN_TOKENS) {
  assert.equal(componentSource.includes(forbidden), false, `Forbidden source token: ${forbidden}`);
}
for (const forbidden of [
  "이메일 보내기",
  "SMS 보내기",
  "알림톡 보내기",
  "client-message-service",
  "dispatchInitialClientMessage",
  "providerCalled: true",
  "externalActionAllowed: true",
  "fetch("
]) {
  assert.equal(componentSource.includes(forbidden), false, `Forbidden UI source: ${forbidden}`);
}

console.log("customer email provider readiness UI model tests passed");
