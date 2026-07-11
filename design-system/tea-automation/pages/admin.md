# Admin Page Overrides

> **PROJECT:** TEA Automation
> **Page:** `admin.html` — project editor (password-gated, client-side only)
> **Page Type:** Admin / data-entry editor

> ⚠️ Rules here **override** `design-system/tea-automation/MASTER.md`. Only deviations are documented; for everything else follow the Master.

---

## Density Override — MEDIUM (5/10)

Editor is form-heavy and focused. Between marketing-spacious and dashboard-dense:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Inline gaps |
| `--space-sm` | `8px` / `0.5rem` | Label/input gaps |
| `--space-md` | `16px` / `1rem` | Field padding |
| `--space-lg` | `24px` / `1.5rem` | Field-group gaps |
| `--space-xl` | `32px` / `2rem` | Section margins |

- **Max-width:** narrow `--maxw` (~`960px`) — focused single-column editor, not full-bleed. Keeps form measure readable.

## Color Override

Keep Master dark palette. Add emphasis for destructive actions:

- **Destructive** (delete project / clear): `--color-destructive` (`#EF4444`), visually separated from primary actions, always behind a **confirmation dialog** (`destructive-emphasis`, `confirmation-dialogs`).
- **Active tree node** highlight: accent-tinted left border + subtle bg (`nav-state-active` analog).
- Password gate error: red border + message with recovery path (`error-clarity`).

## Component Overrides

- **Forms:** visible `<label for>` per input (not placeholder-only — `input-labels`), helper text below complex fields (`input-helper-text`), required `*` indicator (`required-indicators`), inline validation **on blur** not keystroke (`inline-validation`), error below field + `role="alert"` (`error-placement`, `aria-live-errors`).
- **Inputs:** `font-size: 16px` (prevent iOS auto-zoom), height ≥44px (`touch-friendly-input`), focus ring visible (`0 0 0 3px` accent tint).
- **Project tree:** clear expand/collapse affordance (chevron rotates), indentation rhythm (8px per level), active-node highlight, edit **data not markup** (rule from `project-tree.md`).
- **Edit modal:** animate from trigger (scale+fade — `modal-motion`), `Esc` to close, **confirm before dismiss if unsaved changes** (`sheet-dismiss-confirm`).
- **Password gate:** show/hide toggle (`password-toggle`), autofocus first field, `autocomplete="current-password"`, error states cause + fix (`error-clarity`).
- **Save feedback:** loading state on save button → success toast (bilingual) → reset (`submit-feedback`, `success-feedback`).

## Motion Override

- Modal: scale 0.96→1 + fade, ~200ms ease-out enter / shorter exit (`exit-faster-than-enter`).
- Tree expand/collapse: height + opacity transition, not instant snap (`state-transition`).
- No parallax / heavy motion here — admin is a tool, keep it calm (`excessive-motion`).
- Respect `prefers-reduced-motion` (instant states).

## Avoid

- ❌ Placeholder-only labels.
- ❌ Delete without confirmation.
- ❌ Validating on every keystroke.
- ❌ Layout-shifting hover on tree rows.
- ❌ Dismissing edit modal with unsaved changes without prompt.
