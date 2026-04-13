type IntegrationPayload = {
  inquiryId: string;
  summary: string;
  inquiryType: string;
  urgencyLevel: string;
};

export interface ExternalIntegration {
  key: string;
  afterInquiryCreated(payload: IntegrationPayload): Promise<void>;
}

function createNoopIntegration(key: string): ExternalIntegration {
  return {
    key,
    async afterInquiryCreated() {
      return;
    }
  };
}

export const integrationRegistry: ExternalIntegration[] = [
  createNoopIntegration("google-sheets"),
  createNoopIntegration("notion"),
  createNoopIntegration("email"),
  createNoopIntegration("alimtalk")
];
