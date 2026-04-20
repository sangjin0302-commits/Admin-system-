# CaseMatter Phase 1 Transition Contract

## Purpose
Keep CaseMatter and RequiredDocument transitions deterministic, auditable, and concurrency-safe.

## API: CaseMatter status update

### Endpoint
- `PATCH /api/admin/case-matters/:id/status`

### Request body
```json
{
  "status": "DOCUMENT_COLLECTING",
  "statusChangeNote": "optional string",
  "actorName": "optional string",
  "expectedUpdatedAt": "2026-04-20T10:00:00.000Z"
}
```

### Guardrails
- Invalid transition returns `409` with `code=STATUS_TRANSITION_BLOCKED`.
- Stale write returns `409` with `code=CONCURRENT_UPDATE_CONFLICT` and header `X-Current-Updated-At`.
- Successful transition writes a mandatory `CaseEvent` with `eventType=CASE_STATUS_CHANGED`.

## API: RequiredDocument status update

### Endpoint
- `PATCH /api/admin/case-matters/:id/required-documents/:documentId/status`

### Request body
```json
{
  "status": "REQUESTED",
  "statusChangeNote": "optional string",
  "actorName": "optional string",
  "expectedUpdatedAt": "2026-04-20T10:00:00.000Z"
}
```

### Supported statuses (Phase 1)
- `NEEDED`
- `REQUESTED`
- `RECEIVED`
- `IN_REVIEW`
- `APPROVED`
- `NEEDS_FIX`
- `NOT_APPLICABLE`
- `REJECTED` (read-compatible, transition guarded)

### Guardrails
- Invalid transition returns `409` with `code=STATUS_TRANSITION_BLOCKED`.
- Stale write returns `409` with `code=CONCURRENT_UPDATE_CONFLICT` and header `X-Current-Updated-At`.
- Case/document mismatch fails closed with `409` and `code=CASE_MATTER_MISMATCH`.
- Successful transition writes a mandatory `CaseEvent` with `eventType=REQUIRED_DOCUMENT_STATUS_CHANGED`.

## API: RequiredDocument create

### Endpoint
- `POST /api/admin/case-matters/:id/required-documents`

### Request body
```json
{
  "name": "Applicant identity document",
  "description": "optional string",
  "required": true,
  "dueDate": "2026-04-25",
  "actorName": "optional string",
  "expectedCaseUpdatedAt": "2026-04-20T10:00:00.000Z"
}
```

### Guardrails
- Empty or invalid payload returns `400`.
- Duplicate active document name returns `409` with `code=REQUIRED_DOCUMENT_DUPLICATE`.
- Stale write returns `409` with `code=CONCURRENT_UPDATE_CONFLICT` and header `X-Current-Updated-At`.
- Successful creation writes a mandatory `CaseEvent` with `eventType=REQUIRED_DOCUMENT_CREATED`.

## API: RequiredDocument checklist starter

### Endpoint
- `POST /api/admin/case-matters/:id/required-documents/starter`

### Request body
```json
{
  "expectedCaseUpdatedAt": "2026-04-20T10:00:00.000Z",
  "actorName": "optional string"
}
```

### Behavior
- Adds a minimal starter checklist based on `matterType`.
- Skips starter items that already exist.
- Returns `createdCount` and `skippedCount`.
- Writes `CaseEvent` with `eventType=REQUIRED_DOCUMENT_CHECKLIST_STARTED`.

## Source of truth
- Case transitions: `src/lib/services/case-matter-status-transition-helpers.ts`
- RequiredDocument transitions: `src/lib/services/required-document-status-transition-helpers.ts`
- Service enforcement: `src/lib/services/case-matter-service.ts`
