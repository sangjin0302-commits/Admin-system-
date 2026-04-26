const assert = require("node:assert/strict");

const {
  BRIDGE_REVIEW_FALLBACK_TEXT,
  hasBridgeMojibake,
  sanitizeBridgeReviewOutput,
  normalizeBridgeText,
  normalizeBridgeTextWithFallback
} = require("./lawbot-bridge-text-normalizer.ts");

const FORBIDDEN_MOJIBAKE_PATTERN = /(ìë¬¸|ë²|ì¡°|[ìëíÂ]|\u0085|\uFFFD)/;
const HANGUL_PATTERN = /[\uac00-\ud7a3]/;

function assertNoMojibake(value: string) {
  assert.equal(FORBIDDEN_MOJIBAKE_PATTERN.test(value), false);
}

function assertFallbackOrRecoveredKorean(value: string, fallback: string) {
  assertNoMojibake(value);
  const isFallback = value === fallback;
  const hasHangul = HANGUL_PATTERN.test(value);
  assert.equal(isFallback || hasHangul, true);
}

function run() {
  const productionLikeSample1 =
    "\u00ec\u00eb\u00ac\u00b8 \u00ed\u00ec\u00b8 1: \u00eb\u00af\u00bc\u00ec ..."; // "ìë¬¸ íì¸ 1: ë¯¼ì ..."
  const productionLikeSample2 = "\u00eb\u00b2\u00eb..."; // "ë²ë..."
  const productionLikeSample3 = "\u00ec\u00a1\u00b0\u00eb\u00ac\u00b8"; // "ì¡°ë¬¸"
  const productionLikeSample4 = "\u0085";
  const productionLikeSample5 = "\u00c2";

  assert.equal(hasBridgeMojibake(productionLikeSample1), true);
  assert.equal(hasBridgeMojibake(productionLikeSample2), true);
  assert.equal(hasBridgeMojibake(productionLikeSample3), true);
  assert.equal(hasBridgeMojibake(productionLikeSample4), true);
  assert.equal(hasBridgeMojibake(productionLikeSample5), true);

  const repaired = normalizeBridgeText(productionLikeSample3);
  if (repaired) {
    assertNoMojibake(repaired);
  }

  const fallbackMustVerify = normalizeBridgeTextWithFallback(
    productionLikeSample1,
    BRIDGE_REVIEW_FALLBACK_TEXT.mustVerify
  );
  const fallbackMustVerifySources = normalizeBridgeTextWithFallback(
    productionLikeSample2,
    BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification
  );
  const fallbackRisk = normalizeBridgeTextWithFallback(
    productionLikeSample4,
    BRIDGE_REVIEW_FALLBACK_TEXT.riskFlag
  );

  assertFallbackOrRecoveredKorean(
    fallbackMustVerify,
    BRIDGE_REVIEW_FALLBACK_TEXT.mustVerify
  );
  assertFallbackOrRecoveredKorean(
    fallbackMustVerifySources,
    BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification
  );
  assertFallbackOrRecoveredKorean(fallbackRisk, BRIDGE_REVIEW_FALLBACK_TEXT.riskFlag);

  const forcedSanitized = sanitizeBridgeReviewOutput({
    result: {
      reviewSignals: {
        mustVerify: [productionLikeSample1],
        mustVerifySources: [productionLikeSample2],
        riskFlags: [productionLikeSample3],
        legalAxisClues: [
          { id: productionLikeSample2, label: productionLikeSample3, sourceHint: productionLikeSample1 }
        ],
        reviewerAttentionPanel: { items: [{ label: productionLikeSample1 }] },
        reviewerPatternReviewPanel: { items: [{ sampleLabels: [productionLikeSample2] }] },
        operatorAssistPanel: { items: [{ action: productionLikeSample3 }] },
        sourceVerificationChecklist: {
          items: [
            {
              id: productionLikeSample2,
              sourceLabel: productionLikeSample1,
              sourceCitation: productionLikeSample2,
              notes: `${productionLikeSample3} ${productionLikeSample4} ${productionLikeSample5}`
            }
          ]
        }
      },
      reviewQueue: {
        documentDrafts: [{ mustVerifySources: [productionLikeSample2], riskFlags: [productionLikeSample3] }],
        messageDrafts: [{ mustVerifySources: [productionLikeSample1], riskFlags: [productionLikeSample4] }]
      }
    }
  });

  assertFallbackOrRecoveredKorean(
    forcedSanitized.result.reviewSignals.mustVerify[0],
    BRIDGE_REVIEW_FALLBACK_TEXT.mustVerify
  );
  assertFallbackOrRecoveredKorean(
    forcedSanitized.result.reviewSignals.mustVerifySources[0],
    BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification
  );
  assertFallbackOrRecoveredKorean(
    forcedSanitized.result.reviewSignals.riskFlags[0],
    BRIDGE_REVIEW_FALLBACK_TEXT.riskFlag
  );
  assertFallbackOrRecoveredKorean(
    forcedSanitized.result.reviewSignals.legalAxisClues[0].label,
    BRIDGE_REVIEW_FALLBACK_TEXT.generic
  );
  assertFallbackOrRecoveredKorean(
    forcedSanitized.result.reviewSignals.legalAxisClues[0].sourceHint,
    BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification
  );
  assertFallbackOrRecoveredKorean(
    forcedSanitized.result.reviewSignals.reviewerAttentionPanel.items[0].label,
    BRIDGE_REVIEW_FALLBACK_TEXT.generic
  );
  assertFallbackOrRecoveredKorean(
    forcedSanitized.result.reviewSignals.reviewerPatternReviewPanel.items[0].sampleLabels[0],
    BRIDGE_REVIEW_FALLBACK_TEXT.generic
  );
  assertFallbackOrRecoveredKorean(
    forcedSanitized.result.reviewSignals.operatorAssistPanel.items[0].action,
    BRIDGE_REVIEW_FALLBACK_TEXT.generic
  );
  assertFallbackOrRecoveredKorean(
    forcedSanitized.result.reviewSignals.sourceVerificationChecklist.items[0].sourceLabel,
    BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification
  );
  assertFallbackOrRecoveredKorean(
    forcedSanitized.result.reviewSignals.sourceVerificationChecklist.items[0].sourceCitation,
    BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification
  );
  assertFallbackOrRecoveredKorean(
    forcedSanitized.result.reviewSignals.sourceVerificationChecklist.items[0].notes,
    BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification
  );
  assertFallbackOrRecoveredKorean(
    forcedSanitized.result.reviewQueue.documentDrafts[0].mustVerifySources[0],
    BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification
  );
  assertFallbackOrRecoveredKorean(
    forcedSanitized.result.reviewQueue.documentDrafts[0].riskFlags[0],
    BRIDGE_REVIEW_FALLBACK_TEXT.riskFlag
  );
  assertFallbackOrRecoveredKorean(
    forcedSanitized.result.reviewQueue.messageDrafts[0].mustVerifySources[0],
    BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification
  );
  assertFallbackOrRecoveredKorean(
    forcedSanitized.result.reviewQueue.messageDrafts[0].riskFlags[0],
    BRIDGE_REVIEW_FALLBACK_TEXT.riskFlag
  );

  console.log("lawbot-bridge-text-normalizer-test-ok");
}

run();
