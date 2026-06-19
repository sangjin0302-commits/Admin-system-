"use client";

import { Badge } from "@/components/ui/badge";
import { FieldGroup } from "@/components/ui/field";
import {
  getLocalizedIntakeCategoryLabel,
  type IntakeCategory,
  type IntakeCategoryDetailField,
  type IntakeCategoryDisplayLocale
} from "@/types/intake-category";

import { CategoryField, StepHeader } from "./intake-step-shared";
import type { CategoryFieldGroup, GetCommonSubtypeDisplay, IntakeFormCopy } from "../intake-types";

export function IntakeStepDetails({
  copy,
  locale,
  selectedCategory,
  selectedCivilPetitionSubtype,
  categoryFieldGroups,
  civilPetitionSubtypeFieldGroups,
  categoryDetails,
  updateCategoryDetail,
  isRequiredCategoryField,
  getCategoryGuidance,
  getCommonSubtypeDisplay
}: {
  copy: IntakeFormCopy;
  locale: IntakeCategoryDisplayLocale;
  selectedCategory: IntakeCategory;
  selectedCivilPetitionSubtype: string | undefined;
  categoryFieldGroups: CategoryFieldGroup[];
  civilPetitionSubtypeFieldGroups: CategoryFieldGroup[];
  categoryDetails: Record<string, string>;
  updateCategoryDetail: (key: string, value: string) => void;
  isRequiredCategoryField: (
    category: IntakeCategory,
    field: IntakeCategoryDetailField
  ) => boolean;
  getCategoryGuidance: (category: IntakeCategory, locale: IntakeCategoryDisplayLocale) => string;
  getCommonSubtypeDisplay: GetCommonSubtypeDisplay;
}) {
  return (
    <section className="space-y-4 border-t border-line pt-6">
      <StepHeader step={3} title={copy.step3Title} description={copy.step3Description} />
      <div className="rounded-md border border-line bg-surface-muted p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{getLocalizedIntakeCategoryLabel(selectedCategory, locale)}</Badge>
          <span className="text-sm text-text-muted">
            {getCategoryGuidance(selectedCategory, locale)}
          </span>
        </div>
      </div>
      <div className="space-y-5">
        {categoryFieldGroups.map((group) => (
          <div key={group.groupKey} className="space-y-3">
            <h4 className="text-sm font-semibold text-text-strong">
              {copy.fieldGroups[group.groupKey]}
            </h4>
            <FieldGroup>
              {group.fields.map((field) => (
                <CategoryField
                  key={field.key}
                  category={selectedCategory}
                  field={field}
                  required={isRequiredCategoryField(selectedCategory, field)}
                  value={categoryDetails[field.key] ?? ""}
                  onChange={(value) => updateCategoryDetail(field.key, value)}
                  locale={locale}
                  copy={copy}
                />
              ))}
            </FieldGroup>
          </div>
        ))}
      </div>
      {selectedCategory === "civil_petition" && selectedCivilPetitionSubtype ? (
        <div className="space-y-4 border-t border-line pt-5">
          <div>
            <p className="ui-kicker">
              {getCommonSubtypeDisplay(selectedCivilPetitionSubtype, locale)} {copy.extraQuestionsSuffix}
            </p>
            <p className="mt-2 text-sm text-text-muted">{copy.extraQuestionsDescription}</p>
          </div>
          <div className="space-y-5">
            {civilPetitionSubtypeFieldGroups.map((group) => (
              <div key={group.groupKey} className="space-y-3">
                <h4 className="text-sm font-semibold text-text-strong">
                  {copy.fieldGroups[group.groupKey]}
                </h4>
                <FieldGroup>
                  {group.fields.map((field) => (
                    <CategoryField
                      key={field.key}
                      category={selectedCategory}
                      field={field}
                      value={categoryDetails[field.key] ?? ""}
                      onChange={(value) => updateCategoryDetail(field.key, value)}
                      locale={locale}
                      copy={copy}
                    />
                  ))}
                </FieldGroup>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
