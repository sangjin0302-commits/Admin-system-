# Document Template Official Source Verification Runbook

## 1. Purpose

This runbook defines how to verify official source, freshness, reviewer, and review notes before a HWP/HWPX public form enters the Document Lab automation preparation pipeline.

Core rules:

- Do not treat a template as an automation candidate before official source verification.
- Do not use blog, cafe, community, or personal shared files as official originals.
- Preserve original HWP/HWPX files as source assets.
- Use this runbook as the operating standard for the Document Lab `official_source_verified` readiness check.
- Readiness does not mean document generation, download, customer sending, or agency submission is available.

## 2. Official Source Priority

Use this priority order when verifying a form:

1. Statute, regulation, or administrative agency official site.
2. Government portal.
3. Receiving agency official website.
4. National Law Information Center attached form.
5. Hi Korea, Ministry of Justice, Online Administrative Appeals, Open Government Data or Information Disclosure Portal, or Government24.
6. Agency staff-confirmed material, with a separate review note.

Preferred source sites:

- National Law Information Center.
- Online Administrative Appeals.
- Hi Korea.
- Ministry of Justice.
- Information Disclosure Portal.
- Government24.
- Official website of the receiving agency.

Do not use as official source:

- Blog attachments.
- Cafe or community uploads.
- Old private form collections.
- HWP files with unknown source.
- Forms extracted from real customer case files.

If an unofficial file is useful for comparison, keep it out of official source folders and mark it as non-source reference only.

## 3. Verification Fields

Record these fields for each template:

- `templateId`
- Form name.
- Practice area.
- Official source name.
- Official source URL or agency name.
- Original file name.
- Original file format.
- Latest verified date.
- Reviewer.
- Whether it is an official form.
- Form revision date, when available.
- Download location.
- Whether a working copy exists.
- Review memo.
- Whether the form stays manual-only.
- Whether the form is an automation candidate.

Notes:

- Whether to store source URL in code registry is a separate product decision.
- Early operations may use docs, an inventory spreadsheet, or a registry text field.
- Do not put real file paths, private Google Drive links, or customer document links in code.

## 4. Verification Procedure

1. Find official source candidates.
2. Confirm form name, attached form number, and agency name.
3. Confirm file format, such as HWP, HWPX, PDF, DOCX, or HTML.
4. Confirm latest posting date or revision date.
5. Download the official original.
6. Store the original HWP/HWPX in `00_original_hwp`.
7. Classify the official verified copy in `01_official_verified`.
8. Apply the file naming rule.
9. Record latest verified date, reviewer, and source in inventory.
10. Create a separate working copy only after source verification.
11. Treat the Document Lab `official_source_verified` check as a candidate for completion.

Do not edit the original file during this procedure.

## 5. File Naming

Recommended file name pattern:

```text
practice_area__template_id__form_name__source__verified_date.hwp
```

Examples:

- `appeal__admin_appeal_petition__administrative_appeal_petition__lawgo__2026-05-22.hwp`
- `immigration__integrated_application__integrated_application__hikorea__2026-05-22.hwp`
- `disclosure__info_disclosure_request__information_disclosure_request__open_go_kr__2026-05-22.hwp`

Korean short-name examples:

- `행정심판_행정심판청구서_국가법령정보센터_2026-05-22.hwp`
- `출입국_통합신청서_하이코리아_2026-05-22.hwp`

Naming rules:

- Include practice area, template id or short form name, source, and verified date.
- Do not include customer name, resident number, passport number, alien registration number, phone number, or address.
- Do not overwrite older official files; archive them.

## 6. Folder Policy

Recommended Google Drive or storage structure:

- `00_original_hwp`
- `01_official_verified`
- `02_template_working_copy`
- `03_conversion_test`
- `04_pdf_preview`
- `90_archive_old_forms`

Rules:

- Do not modify original source files.
- Do placeholder work only in working copies.
- Do not store real customer information in template folders.
- Do not store personal information or unique identifiers in template source assets.
- Record official source and verification date.
- Move old forms to `90_archive_old_forms`.

## 7. Pass Criteria

`official_source_verified` can pass only when all are true:

- Official source is confirmed.
- Source name is recorded.
- Latest verified date is recorded.
- Reviewer is recorded.
- Original file is stored.
- No real customer information is present.
- Working copy is separated from original.
- Risk level is reviewed.

Passing this check does not approve generation, download, customer sending, or agency submission.

## 8. Stop Criteria

Stop immediately if any of these appear:

- Source is unknown.
- Only unofficial material exists.
- File contains real customer information.
- It is unclear whether the file is an edited original.
- Freshness cannot be verified.
- Agency-specific form differences are found.
- The form is high-risk and business scope review is missing.

When stopped:

- Do not mark `official_source_verified`.
- Do not move the template to ready candidate.
- Do not create a working copy for automation experiments.
- Record the blocker in the review memo.

## 9. Risk-specific Rules

High-risk examples:

- Administrative appeal petition.
- Stay of execution application.
- Refugee status application.
- Immigration disposition explanation or appeal forms.

High-risk requirements:

- Official form verification.
- Business scope review.
- Freshness check.
- Placeholder scope review.
- No AI-only finalization of claim purpose or claim reasons.
- No automatic customer sending.
- No automatic agency submission.

High-risk templates should stay blocked until both source and scope review are recorded.

## 10. Relationship to Document Lab

In Document Lab:

- `official_source_verified` means official source verification is complete.
- `ready_candidate` means a future experiment candidate, not generation availability.
- A template cannot become a ready candidate without source verification.
- `manual_only` means the template is excluded from automation.
- Conversion test remains a separate step.

Document Lab should remain read-only until a separate implementation explicitly adds write workflows.

## 11. QA Checklist

GET-only UI checks:

- `/admin/document-lab` returns 200 for admin-auth.
- Readiness/status display is visible.
- Templates without official source verification are not shown as ready.
- Safety copy remains visible.
- Upload, download, generate, send, and submit actions are absent.

Document review checks:

- Official source is recorded in inventory, docs, or spreadsheet.
- Latest verified date is recorded.
- Reviewer is recorded.
- Old forms are separated into `90_archive_old_forms`.
- High-risk forms have review notes before further automation work.

Production mutation:

- No production mutation is part of this runbook QA.

## 12. Future Implementation Notes

Possible future work:

- Add official source verification fields to template registry metadata.
- Show official source, latest verified date, reviewer, and review memo in `/admin/document-lab`.
- Add read-only verification checklist display.
- Add admin-only verification PATCH only after separate approval.
- Keep download and export disabled until `GeneratedDocument` and `AuditLog` design is approved.
- Keep CaseMatter connection read-only until template verification and preview safety are proven.
