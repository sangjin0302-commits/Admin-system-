# Document Lab Readiness Runbook

## 1. Purpose

This runbook defines how operators should interpret `/admin/document-lab` readiness status and checklist values for the HWP/HWPX public form automation pipeline.

Core rules:

- Readiness does not mean document generation is available.
- Readiness is an internal operations signal for automation preparation.
- Document generation, download, upload, and CaseMatter connection remain separate future stages.
- Customer sending, agency submission, and AI-only legal judgment are not part of this workflow.

## 2. Readiness Status Definitions

### needs_source

Meaning:

- The original HWP/HWPX source asset still needs to be collected.
- Official source verification is not complete.

Next actions:

- Download the original file from the official site.
- Store the original in `00_original_hwp`.
- Do not store files that contain real customer personal data.
- Record the official source and retrieval date.

### needs_mapping

Meaning:

- Required input mapping is missing or incomplete.
- Placeholder candidates are not ready.

Next actions:

- Define `requiredFields`.
- Review `optionalFields` candidates.
- Confirm that sensitive identifiers are excluded from default field design.

### needs_conversion_test

Meaning:

- HWP/HWPX/DOCX/HTML/PDF conversion still needs verification.
- A working copy may exist, but layout and placeholder behavior are not proven.

Next actions:

- Compare the original HWP with the HWPX working copy.
- Compare DOCX/HTML candidates if used.
- Create and review PDF preview output in a non-customer test flow.
- Check tables, merged cells, page count, line breaks, and input boxes.

### needs_review

Meaning:

- The template needs official source, risk, or scope review.
- High-risk templates require explicit admin review before further automation work.

Next actions:

- Confirm official form freshness.
- Review business scope and submission agency requirements.
- Confirm that AI-only legal judgment is not being used.
- Keep the template out of generation or submission flows.

### ready_candidate

Meaning:

- The template may be considered for the next Document Lab experiment.
- This does not mean it can generate, download, send, or submit documents.

Next actions:

- Register as an admin-only preview experiment candidate.
- Test sample placeholder replacement with non-customer data only.
- Keep export and CaseMatter integration disabled until separately approved.

### manual_only

Meaning:

- The template is not currently an automation candidate.
- Manual preparation remains the operational path.

Next actions:

- Record why the template remains manual.
- Keep it excluded from generation and export planning unless status changes.

## 3. Checklist Meaning

### source_file_collected

Meaning:

- The original official form source is available as an asset candidate.

Completion criteria:

- Official source file is collected.
- Source is stored separately from working copies.

Forbidden:

- Using customer-filled files as source assets.
- Treating an unofficial repost as verified source.

Evidence:

- Folder location, official source name, and collection date.

### official_source_verified

Meaning:

- Official source and current version have been checked.

Completion criteria:

- Official agency source is identified.
- Latest verification date is recorded.

Forbidden:

- Marking complete based only on a blog, copied file, or old internal attachment.

Evidence:

- Official source name and latest verified date.

### working_copy_prepared

Meaning:

- A working candidate exists for controlled template experiments.

Completion criteria:

- HWPX, DOCX, or HTML candidate is selected for future runtime testing.

Forbidden:

- Editing the original source file directly.

Evidence:

- Working copy status and candidate format.

### required_fields_mapped

Meaning:

- Required placeholders are defined.

Completion criteria:

- Required fields are listed in registry metadata.
- Field names are safe, stable, and not customer-specific.

Forbidden:

- Adding passport number, alien registration number, full address, or raw sensitive identifiers as default required fields.

Evidence:

- `requiredFields` review.

### optional_fields_mapped

Meaning:

- Optional placeholder candidates are identified.

Completion criteria:

- Optional fields are listed when useful.
- Missing optional fields do not block readiness unless the form depends on them.

Forbidden:

- Hiding required data inside optional fields.

Evidence:

- `optionalFields` review.

### conversion_tested

Meaning:

- Conversion has been checked beyond basic file opening.

Completion criteria:

- Tables, merged cells, page count, line breaks, and input areas remain usable.

Forbidden:

- Treating a file-open success as conversion success.

Evidence:

- Conversion test notes and preview comparison.

### pdf_preview_checked

Meaning:

- PDF preview has been checked for operator review.

Completion criteria:

- Preview output is readable and aligned with the official layout.

Forbidden:

- Using preview output as final export approval.

Evidence:

- PDF preview review note.

### layout_verified

Meaning:

- Layout remains close enough to the official form for future controlled experiments.

Completion criteria:

- Page breaks, tables, cells, and text positions are reviewed.

Forbidden:

- Ignoring layout drift in official submission forms.

Evidence:

- Layout review note.

### risk_reviewed

Meaning:

- Risk, business scope, and official form requirements have been reviewed.

Completion criteria:

- High-risk templates have admin review.
- Agency submission requirements are understood.

Forbidden:

- AI-only legal judgment.
- Customer or agency automation without separate approval.

Evidence:

- Admin review note.

### ready_for_document_lab

Meaning:

- The template can move to a future admin-only preview experiment candidate list.

Completion criteria:

- Required readiness checks are complete.
- Safety guardrails remain active.

Forbidden:

- Treating this as generation, download, send, or submit approval.

Evidence:

- Readiness status and checklist record.

## 4. Folder / Asset Policy

Recommended Google Drive structure:

- `00_original_hwp`
- `01_official_verified`
- `02_template_working_copy`
- `03_conversion_test`
- `04_pdf_preview`
- `90_archive_old_forms`

Rules:

- Do not modify original HWP files.
- Do placeholder work only in working copies.
- Do not store files with real customer information in template folders.
- Record official source and verification date.
- Archive old forms instead of overwriting them.

## 5. Risk Levels

### low

- General internal or common forms.
- Low does not mean customer-ready.

### medium

- Forms that need fact, agency, or submission context review.

### high

- Administrative appeal, stay of execution, refugee, immigration disposition, or similar high-impact forms.

High-risk requirements:

- Business scope review.
- Official form verification.
- Admin review.
- No AI-only drafting or judgment.
- No automatic customer sending.
- No automatic agency submission.

## 6. Pass / Stop Criteria

Pass criteria:

- Official source collected.
- Freshness checked.
- Required fields mapped.
- Conversion tested.
- PDF preview checked.
- Layout verified.
- Risk reviewed.
- No sensitive customer data in template folders.

Stop criteria:

- Real customer information appears in a template asset.
- Official source is unknown.
- Converted layout differs from the original in a material way.
- Sensitive identifier placeholder policy is undefined.
- Business scope review is still needed.
- Form freshness is unknown.
- Agency submission requirements are unknown.

If stop criteria appear, do not move the template into preview, generation, export, or CaseMatter workflows.

## 7. What Readiness Does Not Mean

Readiness does not mean:

- Document generation is available.
- Download is available.
- Agency submission is available.
- Customer sending is available.
- AI made a legal judgment.
- Official form freshness is permanently guaranteed.
- CaseMatter data can be connected.

Readiness only means the internal preparation state is visible to admins.

## 8. QA Checklist

GET-only UI checks:

- `/admin/document-lab` returns 200 for admin-auth.
- `/admin/document-lab` returns 401 without admin auth.
- Readiness summary is visible.
- Filter queries return 200.
- Invalid query falls back without crashing.
- Safety copy is visible.
- Upload, download, generate, send, and submit actions are absent.
- Production mutation count remains zero.

Inventory review:

- Official source is identified.
- Latest verification date is reviewed.
- `requiredFields` are reviewed.
- `riskLevel` is reviewed.
- `conversionStatus` is reviewed.
- High-risk forms have review notes before further work.

## 9. Future Steps

Recommended next steps:

1. Align README and product vision with Document Lab scope.
2. Add official source verification workflow.
3. Define sample placeholder mapping.
4. Prototype HTML preview with non-customer sample data.
5. Research HWPX/DOCX conversion test scripts.
6. Design `TemplateRegistry` schema.
7. Design `GeneratedDocument` and `AuditLog`.
8. Add a CaseMatter read-only documents tab after preview safety is proven.
