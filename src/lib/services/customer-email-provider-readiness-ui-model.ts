import type { CustomerEmailProviderReadiness } from "@/lib/services/customer-email-provider-config";

export const CUSTOMER_EMAIL_PROVIDER_READINESS_FORBIDDEN_TOKENS = [
  "RESEND_API_KEY",
  "EMAIL_FROM=",
  "EMAIL_REPLY_TO=",
  "EMAIL_ALLOWED_FROM_DOMAIN=",
  "client-message-service",
  "dispatchInitialClientMessage",
  "new Resend",
  "resend.emails.send",
  "fetch("
] as const;

export const CUSTOMER_EMAIL_PROVIDER_BLOCKED_REASON_LABELS: Record<string, string> = {
  PROVIDER_DISABLED: "이메일 provider가 비활성화되어 있습니다.",
  REAL_SEND_DISABLED: "실제 이메일 발송 플래그가 꺼져 있습니다.",
  PROVIDER_IMPLEMENTATION_STUB_ONLY:
    "실제 provider 구현이 아직 비활성/stub 상태입니다.",
  API_KEY_MISSING: "provider API key가 설정되지 않았습니다.",
  FROM_ADDRESS_MISSING: "발신자 주소가 설정되지 않았습니다.",
  ALLOWED_DOMAIN_MISSING: "허용 발신 도메인이 설정되지 않았습니다.",
  FROM_DOMAIN_NOT_ALLOWED: "발신자 도메인이 허용 도메인과 일치하지 않습니다."
};

export type CustomerEmailProviderReadinessViewModel = {
  provider: string;
  providerEnabledLabel: string;
  realSendEnabledLabel: string;
  dryRunOnlyLabel: string;
  canUseRealProviderLabel: string;
  canSendRealEmailLabel: string;
  externalActionAllowedLabel: string;
  hasApiKeyLabel: string;
  hasFromAddressLabel: string;
  hasReplyToLabel: string;
  hasAllowedDomainLabel: string;
  fromDomainAllowedLabel: string;
  providerImplementationStatus: CustomerEmailProviderReadiness["providerImplementationStatus"];
  blockedReasonLabels: string[];
  rawBlockedReasonCodes: string[];
};

function boolLabel(value: boolean) {
  return value ? "true" : "false";
}

export function buildCustomerEmailProviderReadinessViewModel(
  readiness: CustomerEmailProviderReadiness
): CustomerEmailProviderReadinessViewModel {
  return {
    provider: readiness.provider,
    providerEnabledLabel: boolLabel(readiness.providerEnabled),
    realSendEnabledLabel: boolLabel(readiness.realSendEnabled),
    dryRunOnlyLabel: boolLabel(readiness.dryRunOnly),
    canUseRealProviderLabel: boolLabel(readiness.canUseRealProvider),
    canSendRealEmailLabel: boolLabel(readiness.canSendRealEmail),
    externalActionAllowedLabel: boolLabel(readiness.externalActionAllowed),
    hasApiKeyLabel: boolLabel(readiness.hasApiKey),
    hasFromAddressLabel: boolLabel(readiness.hasFromAddress),
    hasReplyToLabel: boolLabel(readiness.hasReplyTo),
    hasAllowedDomainLabel: boolLabel(readiness.hasAllowedDomain),
    fromDomainAllowedLabel: boolLabel(readiness.fromDomainAllowed),
    providerImplementationStatus: readiness.providerImplementationStatus,
    blockedReasonLabels:
      readiness.blockedReasonCodes.length > 0
        ? readiness.blockedReasonCodes.map(
            (code) => CUSTOMER_EMAIL_PROVIDER_BLOCKED_REASON_LABELS[code] ?? code
          )
        : ["현재 실제 이메일 발송은 비활성화되어 있습니다."],
    rawBlockedReasonCodes: [...readiness.blockedReasonCodes]
  };
}
