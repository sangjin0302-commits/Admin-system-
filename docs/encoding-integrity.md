# Encoding Integrity Guide

## Why the text was corrupted

This project ran into mixed-encoding drift from three sources:

1. Legacy wrapper files kept large commented blocks that already contained corrupted strings.
2. Multiple edit paths (Windows PowerShell + OneDrive sync + generated wrappers) increased the chance of non-UTF8 round-trips.
3. Some UI text was written in forms that can render literally (for example `\uXXXX` inside JSX text nodes).
4. Intake validation and API fallback messages still referenced legacy files that contained already-broken Korean literals.

The result was intermittent mojibake in UI labels and recovery screens.

## What is now enforced

1. Active user-facing routes are routed to `*-safe` files.
2. `npm run verify` now includes `npm run text:check`.
3. `scripts/check-text-integrity-safe.mjs` blocks known corruption patterns:
   - Replacement character (`U+FFFD`)
   - Suspicious repeated `?` in string literals
   - Literal `\uXXXX` escapes in JSX text nodes
4. Intake payload parsing now normalizes and sanitizes text (Unicode escape decode, NFC normalize, replacement-char cleanup).
5. `.editorconfig` and `.gitattributes` now enforce UTF-8 + LF defaults.

## Working rules

1. Keep user-facing Korean strings in safe files and prefer escaped Unicode when a file has a history of corruption.
2. Do not reintroduce large commented legacy blocks into route wrappers.
3. Always run `npm run verify` before push.
