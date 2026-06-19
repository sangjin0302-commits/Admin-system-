"use client";

import { Badge } from "@/components/ui/badge";
import {
  getLocalizedIntakeCategoryLabel,
  intakeCategoryValues,
  type IntakeCategory,
  type IntakeCategoryDisplayLocale
} from "@/types/intake-category";

import { StepHeader } from "./intake-step-shared";
import type { IntakeFormCopy } from "../intake-types";

export function IntakeStepCategory({
  copy,
  locale,
  selectedCategory,
  onSelectCategory,
  getCategoryHelp,
  getCategoryGuidance
}: {
  copy: IntakeFormCopy;
  locale: IntakeCategoryDisplayLocale;
  selectedCategory: IntakeCategory | null;
  onSelectCategory: (category: IntakeCategory) => void;
  getCategoryHelp: (category: IntakeCategory, locale: IntakeCategoryDisplayLocale) => string;
  getCategoryGuidance: (category: IntakeCategory, locale: IntakeCategoryDisplayLocale) => string;
}) {
  return (
    <section className="space-y-4">
      <StepHeader step={1} title={copy.step1Title} description={copy.step1Description} />
      <div className="grid gap-3">
        {intakeCategoryValues.map((category) => {
          const selected = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              className={[
                "rounded-md border p-4 text-left transition",
                selected
                  ? "border-primary bg-primary/10 text-text-strong"
                  : "border-line bg-surface text-text hover:border-primary/50"
              ].join(" ")}
              onClick={() => onSelectCategory(category)}
            >
              <span className="block text-base font-semibold">
                {getLocalizedIntakeCategoryLabel(category, locale)}
              </span>
              <span className="mt-1 block text-sm text-text-muted">
                {getCategoryHelp(category, locale)}
              </span>
            </button>
          );
        })}
      </div>
      {selectedCategory ? (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-text-muted">{copy.selectedCategory}</span>
            <Badge>{getLocalizedIntakeCategoryLabel(selectedCategory, locale)}</Badge>
          </div>
          <p className="mt-2 text-sm text-text-muted">
            {getCategoryGuidance(selectedCategory, locale)}
          </p>
        </div>
      ) : null}
    </section>
  );
}
