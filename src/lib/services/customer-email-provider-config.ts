export type CustomerEmailProviderName = "dry-run" | "resend";

export type CustomerEmailProviderConfigEnv = Record<string, string | undefined>;

export type CustomerEmailProviderConfig = {
  provider: CustomerEmailProviderName;
  providerEnabled: boolean;
  realSendEnabled: boolean;
  webhookEnabled: boolean;
  apiKeyConfigured: boolean;
  fromConfigured: boolean;
  replyToConfigured: boolean;
  allowedFromDomainConfigured: boolean;
  fromDomainMatchesAllowedDomain: boolean;
  realProviderCandidate: boolean;
  fallbackProvider: "dry-run";
  blockedReasonCodes: string[];
  sendMaxPerInquiryPerChannel: number | null;
};

export type CustomerEmailProviderImplementationStatus =
  | "stub_only"
  | "not_configured"
  | "disabled";

export type CustomerEmailProviderReadiness = {
  provider: CustomerEmailProviderName;
  providerEnabled: boolean;
  realSendEnabled: boolean;
  dryRunOnly: true;
  externalActionAllowed: false;
  canUseRealProvider: false;
  canSendRealEmail: false;
  blockedReasonCodes: string[];
  hasApiKey: boolean;
  hasFromAddress: boolean;
  hasReplyTo: boolean;
  hasAllowedDomain: boolean;
  fromDomainAllowed: boolean;
  providerImplementationStatus: CustomerEmailProviderImplementationStatus;
};

function normalizeEnvValue(value: string | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

function normalizeBoolean(value: string | undefined) {
  return normalizeEnvValue(value)?.toLowerCase() === "true";
}

function normalizeProvider(value: string | undefined): CustomerEmailProviderName {
  const normalized = normalizeEnvValue(value)?.toLowerCase();
  return normalized === "resend" ? "resend" : "dry-run";
}

function getEmailDomain(value: string | null) {
  const emailLike = value?.match(/<([^<>@\s]+@[^<>@\s]+)>/)?.[1] ?? value;
  const domain = emailLike?.split("@")[1]?.replace(/[>\s]/g, "").toLowerCase() ?? "";
  return domain || null;
}

function parsePositiveInteger(value: string | undefined) {
  const normalized = normalizeEnvValue(value);
  if (!normalized) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parseCustomerEmailProviderConfig(
  env: CustomerEmailProviderConfigEnv = {}
): CustomerEmailProviderConfig {
  const provider = normalizeProvider(env.EMAIL_PROVIDER);
  const providerEnabled = normalizeBoolean(env.EMAIL_PROVIDER_ENABLED);
  const realSendEnabled = normalizeBoolean(env.EMAIL_REAL_SEND_ENABLED);
  const webhookEnabled = normalizeBoolean(env.EMAIL_WEBHOOK_ENABLED);
  const apiKeyConfigured = Boolean(normalizeEnvValue(env.RESEND_API_KEY));
  const from = normalizeEnvValue(env.EMAIL_FROM);
  const replyTo = normalizeEnvValue(env.EMAIL_REPLY_TO);
  const allowedFromDomain = normalizeEnvValue(env.EMAIL_ALLOWED_FROM_DOMAIN)?.toLowerCase();
  const fromDomain = getEmailDomain(from);
  const fromDomainMatchesAllowedDomain = Boolean(
    fromDomain && allowedFromDomain && fromDomain === allowedFromDomain
  );

  const blockedReasonCodes: string[] = [];
  if (provider !== "resend") blockedReasonCodes.push("EMAIL_PROVIDER_DRY_RUN_DEFAULT");
  if (!providerEnabled) blockedReasonCodes.push("EMAIL_PROVIDER_NOT_ENABLED");
  if (!realSendEnabled) blockedReasonCodes.push("EMAIL_REAL_SEND_NOT_ENABLED");
  if (provider === "resend" && !apiKeyConfigured) blockedReasonCodes.push("RESEND_API_KEY_MISSING");
  if (provider === "resend" && !from) blockedReasonCodes.push("EMAIL_FROM_MISSING");
  if (provider === "resend" && !allowedFromDomain) {
    blockedReasonCodes.push("EMAIL_ALLOWED_FROM_DOMAIN_MISSING");
  }
  if (provider === "resend" && from && allowedFromDomain && !fromDomainMatchesAllowedDomain) {
    blockedReasonCodes.push("EMAIL_FROM_DOMAIN_NOT_ALLOWED");
  }

  const realProviderCandidate = Boolean(
    provider === "resend" &&
      providerEnabled &&
      realSendEnabled &&
      apiKeyConfigured &&
      from &&
      allowedFromDomain &&
      fromDomainMatchesAllowedDomain
  );

  if (realProviderCandidate) {
    blockedReasonCodes.push("REAL_RESEND_PROVIDER_NOT_IMPLEMENTED");
  }

  return {
    provider,
    providerEnabled,
    realSendEnabled,
    webhookEnabled,
    apiKeyConfigured,
    fromConfigured: Boolean(from),
    replyToConfigured: Boolean(replyTo),
    allowedFromDomainConfigured: Boolean(allowedFromDomain),
    fromDomainMatchesAllowedDomain,
    realProviderCandidate,
    fallbackProvider: "dry-run",
    blockedReasonCodes,
    sendMaxPerInquiryPerChannel: parsePositiveInteger(
      env.EMAIL_SEND_MAX_PER_INQUIRY_PER_CHANNEL
    )
  };
}

function buildReadinessBlockedReasons(config: CustomerEmailProviderConfig) {
  const blockedReasonCodes: string[] = [];

  if (!config.providerEnabled) blockedReasonCodes.push("PROVIDER_DISABLED");
  if (!config.realSendEnabled) blockedReasonCodes.push("REAL_SEND_DISABLED");
  if (config.provider === "resend" && !config.apiKeyConfigured) {
    blockedReasonCodes.push("API_KEY_MISSING");
  }
  if (config.provider === "resend" && !config.fromConfigured) {
    blockedReasonCodes.push("FROM_ADDRESS_MISSING");
  }
  if (config.provider === "resend" && !config.allowedFromDomainConfigured) {
    blockedReasonCodes.push("ALLOWED_DOMAIN_MISSING");
  }
  if (
    config.provider === "resend" &&
    config.fromConfigured &&
    config.allowedFromDomainConfigured &&
    !config.fromDomainMatchesAllowedDomain
  ) {
    blockedReasonCodes.push("FROM_DOMAIN_NOT_ALLOWED");
  }
  if (config.provider === "resend" && config.realProviderCandidate) {
    blockedReasonCodes.push("PROVIDER_IMPLEMENTATION_STUB_ONLY");
  }

  return blockedReasonCodes;
}

function getProviderImplementationStatus(
  config: CustomerEmailProviderConfig
): CustomerEmailProviderImplementationStatus {
  if (config.realProviderCandidate) return "stub_only";
  if (config.provider !== "resend" || !config.providerEnabled) return "not_configured";
  return "disabled";
}

export function buildCustomerEmailProviderReadiness(
  env: CustomerEmailProviderConfigEnv = {}
): CustomerEmailProviderReadiness {
  const config = parseCustomerEmailProviderConfig(env);

  return {
    provider: config.provider,
    providerEnabled: config.providerEnabled,
    realSendEnabled: config.realSendEnabled,
    dryRunOnly: true,
    externalActionAllowed: false,
    canUseRealProvider: false,
    canSendRealEmail: false,
    blockedReasonCodes: buildReadinessBlockedReasons(config),
    hasApiKey: config.apiKeyConfigured,
    hasFromAddress: config.fromConfigured,
    hasReplyTo: config.replyToConfigured,
    hasAllowedDomain: config.allowedFromDomainConfigured,
    fromDomainAllowed: config.fromDomainMatchesAllowedDomain,
    providerImplementationStatus: getProviderImplementationStatus(config)
  };
}
