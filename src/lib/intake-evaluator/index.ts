import { RuleBasedIntakeEvaluator } from "./rule-based-intake-evaluator";
import type { IntakeEvaluator } from "./types";

let evaluator: IntakeEvaluator = new RuleBasedIntakeEvaluator();

export function getIntakeEvaluator() {
  return evaluator;
}

export function setIntakeEvaluator(nextEvaluator: IntakeEvaluator) {
  evaluator = nextEvaluator;
}

export type { IntakeEvaluationInput, IntakeEvaluationResult, IntakeEvaluator } from "./types";
