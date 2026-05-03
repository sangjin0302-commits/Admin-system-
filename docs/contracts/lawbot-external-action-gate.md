# Lawbot External Action Gate Contract

## Current Completed Scope

The completed production scope is limited to review and internal approval.

- Read-only Lawbot review is available for admin users.
- Internal approval is available for approval-pending Lawbot review results.
- Internal approval updates the inquiry, linked case record, and Lawbot draft records to `APPROVED`.
- Approval keeps `approvalGate.externalActionAllowed=false`.
- Approval does not send messages, submit documents, file agency packages, or call any external action adapter.

## Non-Goals

This contract does not authorize or implement external execution.

- No send.
- No submit.
- No external action.
- No auto-send.
- No auto-submit.
- No production external adapter call as part of approval.
- No coupling between message send and document submission.

## State Model

Lawbot bridge workflow states remain internal workflow states unless a later external action gate explicitly says otherwise.

- `APPROVAL_PENDING`: drafts exist and require manual review before approval.
- `APPROVED`: internal approval is complete only.
- `REVISION_REQUESTED`: operator asked for changes before approval or external readiness.
- `BLOCKED`: workflow is intentionally stopped by policy, missing data, or operator judgment.
- `CLOSED`: workflow is complete and no further Lawbot bridge action is expected.

`APPROVED` does not mean ready to send or submit. It means the internal review result and draft metadata were approved for the next internal preparation step. External execution still requires a separate gate, separate confirmations, and a separate audit entry.

## Message Send Flow Proposal

Message sending must be modeled separately from document submission.

- The send flow targets `MessageDraft` records only.
- The send flow must not operate on `DocumentDraft` records.
- The first implementation should be dry-run/readiness focused.
- The first adapter boundary should be no-op or dry-run only.
- Real email, SMS, AlimTalk, or other outbound adapters should be attached only after a separate approval milestone.
- Lawbot message send status must not be mixed with `QuoteStatus.SENT`; quote sending belongs to the quotation domain.

A safe first send milestone should answer: which approved Lawbot message draft would be sent, to whom, through which channel, with what content, and why it is still blocked from real external dispatch.

## Submission Flow Proposal

Document submission must be modeled through case filing objects, not by directly submitting `DocumentDraft` records.

- `DocumentDraft` is an internal draft source and should not be treated as a filing record by itself.
- Submission preparation should create or update `SubmissionPackage` records.
- Agency-facing submission execution should be represented by `AgencySubmission` records.
- `CaseMatter.status` should remain the operational case status source:
  - `READY_TO_SUBMIT`: package/readiness work is expected before agency submission.
  - `SUBMITTED`: an agency submission has been recorded.
  - `WAITING_AGENCY`: an agency response is pending after submission.
- The first implementation should focus on package preparation and readiness validation.
- Real agency submission should require a later external execution gate.

A safe first submit milestone should answer: which case matter is being prepared, which documents belong to the package, which agency/method is intended, and why no real filing action has happened yet.

## External Action Gate Requirements

External execution is fail-closed by default.

- `externalActionAllowed=false` by default.
- Internal approval must not set `externalActionAllowed=true`.
- No send or submit action may set `externalActionAllowed=true` before its own final confirmation step.
- Send and submit must have separate gates.
- Approval and external execution are different stages.
- Every gate must distinguish `success`, `skipped_by_policy`, and `failed` outcomes.
- The final policy guard must run immediately before any public-facing or persistence action that represents external execution.
- Missing critical fields must block execution instead of defaulting to a permissive action.

## Required Operator Confirmations

Send confirmations:

- `recipientConfirmed`
- `channelConfirmed`
- `messageContentReviewed`
- `noSensitiveLeakConfirmed`
- `finalSendConfirmed`

Submit confirmations:

- `agencyConfirmed`
- `documentSetReviewed`
- `attachmentsConfirmed`
- `filingMethodConfirmed`
- `finalSubmitConfirmed`

Each confirmation should be explicit, boolean, and validated server-side. A missing or false confirmation must return a validation error and must not mutate external execution state.

## Audit Requirements

Short term, `Inquiry.communicationLogs` may be reused for append-only audit entries, as the approval flow already does.

Required event types:

- `lawbot_message_send_prepared`
- `lawbot_message_send_confirmed`
- `lawbot_submission_package_prepared`
- `lawbot_agency_submission_confirmed`

Each audit entry should include at minimum:

- event type
- source surface
- operator note or reason
- confirmed checks snapshot
- target ids
- previous and next internal state
- external action result or dry-run result
- timestamp
- `externalActionAllowed` value at the time of the event

Long term, add a dedicated `OperatorActionLog` table for normalized audit history. That table should capture operator identity, request id, target entity type/id, confirmation snapshot, before/after state, external adapter result, and failure reason code.

## Safety Risks

- Treating `APPROVED` as send-ready or submit-ready can accidentally bypass the external action gate.
- Combining `MessageDraft` execution and `DocumentDraft` submission can blur responsibilities and make audits unreliable.
- Reusing `QuoteStatus.SENT` for Lawbot message sending can corrupt quotation workflow semantics.
- Attaching a real outbound or filing adapter too early can turn a readiness feature into an external execution feature.
- Weak audit logs can make it impossible to reconstruct who approved, prepared, confirmed, or executed an action.
- Missing final server-side confirmations can allow UI bugs or stale clients to execute unsafe actions.

## Recommended Implementation Order

1. Add a send readiness dry-run API for approved `MessageDraft` records.
2. Add send readiness UI that cannot dispatch real messages.
3. Add a submit package preparation dry-run API based on `SubmissionPackage` and `AgencySubmission` readiness.
4. Add submit readiness UI that cannot file real submissions.
5. Create a dedicated test inquiry flow for repeatable `APPROVAL_PENDING` to readiness validation.
6. Add real external execution only after a separate approval milestone and a second contract update.
