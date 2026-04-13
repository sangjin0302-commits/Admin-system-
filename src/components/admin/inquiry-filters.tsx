import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  adminSortLabels,
  adminSortValues,
  inquiryStatusLabels,
  inquiryStatusValues,
  inquiryTypeLabels,
  inquiryTypeValues,
  languageCodeLabels,
  languageCodeValues,
  urgencyLabels,
  urgencyValues,
  type AdminSort,
  type InquiryStatus,
  type InquiryType,
  type LanguageCode,
  type UrgencyLevel
} from "@/types/inquiry";

type InquiryFiltersProps = {
  filters: {
    q?: string;
    inquiryType?: InquiryType;
    status?: InquiryStatus;
    urgency?: UrgencyLevel;
    language?: LanguageCode;
    sort?: AdminSort;
  };
};

export function InquiryFilters({ filters }: InquiryFiltersProps) {
  return (
    <Card className="p-5">
      <form method="get" className="space-y-4">
        <FieldGroup className="md:grid-cols-[1.7fr_1fr_1fr_1fr_1fr_1fr]">
          <Field label="검색">
            <Input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="이름, 이메일, 제목, 회사명, 내용 검색"
            />
          </Field>
          <Field label="문의 유형">
            <Select name="inquiryType" defaultValue={filters.inquiryType ?? ""}>
              <option value="">전체</option>
              {inquiryTypeValues
                .filter((value) => value !== "UNKNOWN")
                .map((value) => (
                  <option key={value} value={value}>
                    {inquiryTypeLabels[value].ko}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="상태">
            <Select name="status" defaultValue={filters.status ?? ""}>
              <option value="">전체</option>
              {inquiryStatusValues.map((value) => (
                <option key={value} value={value}>
                  {inquiryStatusLabels[value].ko}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="긴급도">
            <Select name="urgency" defaultValue={filters.urgency ?? ""}>
              <option value="">전체</option>
              {urgencyValues.map((value) => (
                <option key={value} value={value}>
                  {urgencyLabels[value].ko}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="언어">
            <Select name="language" defaultValue={filters.language ?? ""}>
              <option value="">전체</option>
              {languageCodeValues.map((value) => (
                <option key={value} value={value}>
                  {languageCodeLabels[value].ko}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="정렬">
            <Select name="sort" defaultValue={filters.sort ?? "latest"}>
              {adminSortValues.map((value) => (
                <option key={value} value={value}>
                  {adminSortLabels[value].ko}
                </option>
              ))}
            </Select>
          </Field>
        </FieldGroup>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary">
            적용
          </Button>
          <Link
            href="/admin/inquiries"
            className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
          >
            초기화
          </Link>
        </div>
      </form>
    </Card>
  );
}
