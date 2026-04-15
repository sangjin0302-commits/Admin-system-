# admin-office-mvp DESIGN.md

## 1. Visual Theme & Atmosphere

- This product is an operations-first administrative office system.
- The interface should feel calm, exact, durable, and trustworthy.
- The target mood is:
  - 70% Linear
  - 20% Notion
  - 10% Vercel
- Avoid flashy startup landing-page aesthetics.
- Avoid heavy gradients, oversized marketing copy, or decorative motion.
- Prioritize information density, fast scanning, and operational confidence.

## 2. Color Palette & Roles

- `canvas`: `#F3F5F7`
  - Primary app background.
- `surface`: `#FFFFFF`
  - Main cards, panels, and sheets.
- `surface-muted`: `#F7F9FB`
  - Secondary grouping surfaces and quiet emphasis zones.
- `surface-raised`: `#FFFFFF`
  - Elevated controls and focused containers.
- `line`: `#D7DEE5`
  - Standard dividers and borders.
- `line-strong`: `#C4CED8`
  - Stronger separators and active framing.
- `text-strong`: `#17212B`
  - Primary headings and high-emphasis values.
- `text`: `#3C4854`
  - Body copy and standard data labels.
- `text-muted`: `#697784`
  - Secondary copy, helper text, and metadata.
- `primary`: `#18486D`
  - Main action color.
- `primary-soft`: `#E8EFF5`
  - Quiet selected-state backgrounds and contextual emphasis.
- `success`: `#2B6B49`
  - Positive completion and closed-loop states.
- `warning`: `#9B6A28`
  - Attention states without looking urgent-red.
- `danger`: `#A14545`
  - Errors and truly blocking states.

## 3. Typography Rules

- Use a neutral Korean-friendly sans stack.
- Keep headings compact and restrained.
- Avoid oversized hero typography.
- Preferred hierarchy:
  - Page title: large, tight, direct
  - Section title: medium, strong
  - Kicker/eyebrow: tiny, uppercase-like tracking, muted
  - Body copy: simple and calm
  - Tables and system details: compact and highly legible

## 4. Component Stylings

### Cards

- Cards are the main compositional unit.
- Default cards should feel crisp, pale, and lightly elevated.
- Use muted cards for grouped sub-sections.
- Prefer border + soft shadow over colored fills.

### Buttons

- Primary buttons should look precise, not loud.
- Secondary buttons should feel tactile and neutral.
- Avoid playful or rounded-pill marketing buttons.

### Badges

- Badges should be compact, status-oriented, and easy to scan.
- They are functional metadata, not decoration.

### Tables and Lists

- Keep row rhythm tight.
- Hover should be subtle.
- Metadata should be easy to scan left-to-right.

## 5. Layout Principles

- Favor a centered operational shell with comfortable whitespace.
- Separate major sections using stacked cards instead of long uninterrupted surfaces.
- Use 2-4 KPI cards at a time.
- Avoid crowded horizontal toolbars unless they are truly necessary.

## 6. Depth & Elevation

- Use very light shadows.
- Most hierarchy should come from contrast, spacing, and border weight.
- Floating elements may use a stronger shadow, but sparingly.

## 7. Do's and Don'ts

### Do

- Keep interfaces calm and workmanlike.
- Make status, deadlines, and next actions instantly legible.
- Prefer neutral surfaces with measured accent use.
- Let dense information feel tidy rather than sparse.

### Don't

- Do not introduce loud gradients or neon accents.
- Do not mimic a marketing homepage.
- Do not use over-rounded, toy-like controls.
- Do not hide important workflow state behind overly minimal styling.

## 8. Responsive Behavior

- Mobile should preserve operational clarity, not desktop fidelity.
- KPI cards may stack vertically.
- Long action rows should wrap cleanly.
- Tables should collapse into card-like list patterns when necessary.

## 9. Project-Specific Notes

- The admin area is the highest-priority surface.
- Inquiry, quote, case, submission, follow-up, and forecasting views must share one visual language.
- Forecasting UI should look like an extension of the operations dashboard, not a separate analytics product.

## 10. UI Improvement Priority

1. Admin home
   - Keep KPI, work queue, and forecasting summary visually consistent.
2. Inquiry list
   - Normalize filters, row rhythm, and summary hierarchy.
3. Inquiry detail sub-routes
   - Align quote, case, and relationship pages under one shared section layout.
4. Dense operational panels
   - Tighten badges, action bars, and deadline metadata without adding noise.
5. Secondary polish
   - Only after the above, refine empty states, loading states, and minor helper surfaces.
