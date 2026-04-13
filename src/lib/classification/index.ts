import { RuleBasedInquiryClassifier } from "./rule-based-classifier";
import type { InquiryClassifier } from "./types";

let classifier: InquiryClassifier = new RuleBasedInquiryClassifier();

export function getInquiryClassifier() {
  return classifier;
}

export function setInquiryClassifier(nextClassifier: InquiryClassifier) {
  classifier = nextClassifier;
}
