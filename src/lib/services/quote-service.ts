import type { SaveQuoteManualEditsInput } from "@/lib/services/quote-manual-edit-helpers";
import { saveQuoteManualEditsPersistence } from "@/lib/services/quote-manual-edit-persistence-helpers";
import { serializeQuote } from "@/lib/services/quote-serialization-helpers";

export {
  createQuoteDraftForInquiry,
  getQuoteWorkspaceForInquiry,
  recalculateQuoteDraft
} from "@/lib/services/quote-service-draft-helpers";

export async function saveQuoteManualEdits(
  quoteId: string,
  input: SaveQuoteManualEditsInput
) {
  const updated = await saveQuoteManualEditsPersistence(quoteId, input);
  return serializeQuote(updated);
}

export {
  createContractDraftFromQuote,
  exportContractDraftDocument,
  transitionQuoteStatus
} from "@/lib/services/quote-service-workflow-helpers";
