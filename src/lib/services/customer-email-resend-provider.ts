import {
  validateCustomerEmailProviderInput,
  type CustomerEmailProvider,
  type CustomerEmailProviderInput,
  type CustomerEmailProviderResult
} from "@/lib/services/customer-email-provider";

export const CUSTOMER_EMAIL_PROVIDER_RESEND_STUB_NAME = "resend-disabled";

export function buildDisabledResendCustomerEmailProviderResult(): CustomerEmailProviderResult {
  return {
    providerName: CUSTOMER_EMAIL_PROVIDER_RESEND_STUB_NAME,
    providerCalled: false,
    dryRunOnly: true,
    externalActionAllowed: false,
    status: "FAILED",
    failureReasonCode: "PROVIDER_IMPLEMENTATION_STUB_ONLY"
  };
}

export function createDisabledResendCustomerEmailProvider(): CustomerEmailProvider {
  return {
    async sendEmail(input: CustomerEmailProviderInput) {
      validateCustomerEmailProviderInput(input);
      return buildDisabledResendCustomerEmailProviderResult();
    }
  };
}
