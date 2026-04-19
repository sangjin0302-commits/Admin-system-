# Administrative Scrivener Case Management System

## Product Goal
This project is an internal case-management system for a Korean administrative scrivener office.
It is not a simple CRM and not a billing-only product.

Primary flow:
`inquiry intake -> client/case linkage -> consultation/intake -> required documents -> document review/drafting -> submission package -> agency submission -> supplement handling -> closure -> billing follow-up`

## Core Principles
- The central object is case workflow, not payment workflow.
- Billing is an important module, but subordinate to case operations.
- Document lifecycle and submission lifecycle are first-class.
- AI output is internal draft guidance only.
- Final client-facing content always requires human review.

## Security Rules
- Protect admin routes and admin APIs by authentication.
- Never hard-code secrets.
- Use environment variables for all credentials/tokens.
- Do not log sensitive personal identifiers.

## MVP Constraints
- Next.js + TypeScript + Prisma.
- SQLite locally, with PostgreSQL-ready schema evolution path.
- No live payment gateway in v1.
- No mandatory file-upload pipeline in v1 (metadata/external links allowed).

## Quality Bar
- Keep business logic in service modules, not large UI components.
- Prefer small, testable helper modules.
- Run `npm run verify` before finalizing major edits.
