# Admin System Agent Rules

## Purpose
This repository is a safety-sensitive internal case-management system for a Korean administrative scrivener office.

Do not optimize only for "feature works". Preserve:
- contract compatibility
- policy gates
- fail-closed behavior
- environment safety
- testability

## Required outcome model
Every integration path should distinguish:
- `success`
- `skipped_by_policy`
- `failed`

Expected policy blocks are not runtime failures.

## Minimal-change workflow
Before editing:
1. Identify touched contract/policy/env boundary.
2. Make the smallest safe patch.
3. Avoid unrelated refactors.

During editing:
1. Update contract docs when payload shape changes.
2. Keep fail-closed defaults for missing critical fields.
3. Add reason codes for blocked/failed paths.
4. Keep backward compatibility unless explicitly requested.

After editing:
1. Run at least `npm run text:check` and `npm run typecheck`.
2. Report what remains unverified.

## Non-negotiable guards
- Do not log secrets/tokens.
- Do not weaken admin/auth safety checks.
- Do not auto-enable risky automation by default.
- Any public-facing or persistence action should have final policy guard right before execution.

## Environment discipline
When adding/changing env flags:
1. Update parser/validation.
2. Update `.env.example`.
3. Document valid presets and conflicting combinations.

## Contract docs location
Keep contract docs under:
- `docs/contracts/*.md`
