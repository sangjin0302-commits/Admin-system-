import type { InquiryType } from "@/types/inquiry";
import {
  buildMessagePreview,
  generatePreparationGuidance,
  generateReceiptMessage
} from "@/lib/message-templates/service";
import { getInquiryReceiptCode } from "@/lib/services/inquiry-receipt-code";
import type { InquiryMessageInputDraft } from "@/lib/services/inquiry-create-types";

export async function buildFinalizedMessageArtifacts(
  created: { id: string; createdAt: Date; inquiryType: string },
  messageInputDraft: InquiryMessageInputDraft
) {
  const finalizedMessageInput = {
    ...messageInputDraft,
    inquiryId: await getInquiryReceiptCode({
      id: created.id,
      createdAt: created.createdAt,
      inquiryType: created.inquiryType as InquiryType
    })
  };

  return {
    guidance: generatePreparationGuidance(finalizedMessageInput),
    receiptMessage: generateReceiptMessage(finalizedMessageInput),
    preview: buildMessagePreview(finalizedMessageInput)
  };
}
