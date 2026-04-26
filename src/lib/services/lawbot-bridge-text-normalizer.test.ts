const assert = require("node:assert/strict");

const {
  hasBridgeMojibake,
  normalizeBridgeText,
  normalizeBridgeTextDeep,
  normalizeBridgeTextWithFallback
} = require("./lawbot-bridge-text-normalizer.ts");

function run() {
  const mojibakeLawArticle = "\u00ec\u00a1\u00b0\u00eb\u00ac\u00b8"; // ì¡°ë¬¸
  const mojibakeMixed = "\u00ec\u00eb\u00ac\u00b8 \u00ed\u00ec\u00b8"; // ìë¬¸ íì¸
  const mojibakeShort = "\u00eb\u00b2\u00eb"; // ë²ë
  const mojibakeWithPrefix = "\u00c2\u00ec\u00a1\u00b0\u00eb\u00ac\u00b8"; // Âì¡°ë¬¸
  const controlCharSample =
    "\u00ec\u00a1\u00b0\u00eb\u00ac\u00b8 \u0085"; // ì¡°ë¬¸ \u0085

  assert.equal(normalizeBridgeText(mojibakeLawArticle), "조문");
  assert.equal(normalizeBridgeText(mojibakeWithPrefix), "조문");
  assert.equal(normalizeBridgeText(controlCharSample), "조문");

  assert.equal(hasBridgeMojibake(mojibakeMixed), true);
  assert.equal(hasBridgeMojibake(mojibakeShort), true);

  assert.equal(
    normalizeBridgeTextWithFallback(mojibakeMixed, "원문 확인 필요"),
    "원문 확인 필요"
  );
  assert.equal(
    normalizeBridgeTextWithFallback(mojibakeShort, "출처 확인 필요"),
    "출처 확인 필요"
  );

  const productionLikeSample1 =
    "\u00ec\u00eb\u00ac\u00b8 \u00ed\u00ec\u00b8 1: \u00eb\u00af\u00bc\u00ec \u00ec\u00b2\u00eb\u00a6\u00ac\u00ec \u00ea\u00b4\u00ad\u00ed ...";
  const productionLikeSample2 =
    "\u00eb\u00b2\u00eb \u00b9\u00ec \u00ec\u00a1\u00ed\u00ec\u00a7\u00eb\u00a7 \u00ec\u00a1\u00b0\u00eb\u00ac\u00b8 ...";
  const productionLikeSample3 =
    "\u00ec\u00ac\u00ec\u00a4\u00ea\u00b4\u00ea\u00b3\u00ec ...";

  assert.equal(hasBridgeMojibake(productionLikeSample1), true);
  assert.equal(hasBridgeMojibake(productionLikeSample2), true);
  assert.equal(hasBridgeMojibake(productionLikeSample3), true);

  const normalized = normalizeBridgeTextDeep({
    reviewSignals: {
      mustVerify: [mojibakeLawArticle, productionLikeSample1],
      mustVerifySources: [mojibakeMixed],
      riskFlags: [mojibakeShort],
      legalAxisClues: [
        { id: `axis_${mojibakeLawArticle}`, label: mojibakeLawArticle, sourceHint: mojibakeMixed }
      ],
      reviewerAttentionPanel: {
        items: [{ label: productionLikeSample2 }]
      },
      reviewerPatternReviewPanel: {
        items: [{ sampleLabels: [mojibakeLawArticle, productionLikeSample3] }]
      },
      operatorAssistPanel: {
        items: [{ action: `${mojibakeWithPrefix} follow-up` }]
      },
      sourceVerificationChecklist: {
        items: [
          {
            id: `src_${mojibakeLawArticle}`,
            sourceLabel: mojibakeMixed,
            sourceCitation: mojibakeWithPrefix,
            notes: controlCharSample
          }
        ]
      }
    },
    reviewQueue: {
      documentDrafts: [{ mustVerifySources: [mojibakeMixed], riskFlags: [mojibakeShort] }],
      messageDrafts: [{ mustVerifySources: [mojibakeWithPrefix], riskFlags: [mojibakeLawArticle] }]
    }
  });

  assert.equal(normalized.reviewSignals.mustVerify[0], "조문");
  assert.equal(normalized.reviewSignals.sourceVerificationChecklist.items[0].notes, "조문");
  assert.equal(normalized.reviewQueue.messageDrafts[0].mustVerifySources[0], "조문");

  console.log("lawbot-bridge-text-normalizer-test-ok");
}

run();
