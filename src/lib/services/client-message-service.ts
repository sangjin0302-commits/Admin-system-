import type { ClientMessagePreview } from "@/lib/message-templates/types";

export interface ClientMessageChannelAdapter {
  key: string;
  sendInitialMessage(payload: {
    inquiryId: string;
    preview: ClientMessagePreview;
  }): Promise<void>;
}

function createNoopAdapter(key: string): ClientMessageChannelAdapter {
  return {
    key,
    async sendInitialMessage() {
      return;
    }
  };
}

// Mock boundary: replace these adapters with real email / SMS / AlimTalk integrations later.
export const clientMessageAdapters: ClientMessageChannelAdapter[] = [
  createNoopAdapter("email"),
  createNoopAdapter("sms"),
  createNoopAdapter("alimtalk")
];

export async function dispatchInitialClientMessage(payload: {
  inquiryId: string;
  preview: ClientMessagePreview;
}) {
  await Promise.allSettled(
    clientMessageAdapters.map((adapter) => adapter.sendInitialMessage(payload))
  );
}
