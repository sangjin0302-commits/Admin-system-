# Windows spawn EPERM Triage

## Scope
Use this guide when `next`, `prisma`, `tsx`, or `esbuild` fail with `spawn EPERM` on Windows.

This is usually an environment/runtime blocker, not a CaseMatter feature bug.

## Fast gate (must pass first)
1. `npm run preflight:spawn`
2. `npm run preflight:locks`

Interpretation:
- `preflight:spawn RESULT=PASS`: child process creation is available.
- `preflight:spawn RESULT=EPERM_BLOCKED`: do **not** run long commands (`dev`, `build`) yet.

## Safe verification chain
Run:
1. `npm run verify:safe`
2. `npm run verify:safe:strict`

`verify:safe:strict` is important because it rejects Prisma fallback.

## Prisma result semantics
Check output from `prisma-generate-auto`:
- `RESULT=PASS`: generate succeeded normally.
- `RESULT=FALLBACK`: generate failed, existing client reused.
- `RESULT=FAILED`: generate failed and fallback was not accepted.

Treat fallback-only runs as degraded pre-runtime state.

## What to avoid while blocked
- `npm run dev`
- `npm run build`
- watch mode commands
- browser/manual runtime claims

## Human remediation checklist
1. Confirm `node.exe` can create child processes in the current session.
2. Check endpoint protection / execution policy / controlled folder access rules.
3. Retry from a fresh elevated shell.
4. Re-run `npm run preflight:spawn` until `RESULT=PASS`.
5. Only then run strict pre-runtime verification.
