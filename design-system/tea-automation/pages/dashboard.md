# Dashboard Page Overrides

> **PROJECT:** TEA Automation
> **Page:** `dashboard/index.html` — live factory monitoring (simulated data)
> **Page Type:** Real-time operations dashboard / data view

> ⚠️ Rules here **override** `design-system/tea-automation/MASTER.md`. Only deviations are documented; for everything else follow the Master.

---

## Density Override — HIGH (9/10)

Dashboard prioritizes information density over marketing whitespace. Replace the Master's spacious scale with a dense scale:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps, KPI inline |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, cell padding |
| `--space-md` | `12px` / `0.75rem` | Standard card padding |
| `--space-lg` | `16px` / `1rem` | Card padding, section gaps |
| `--space-xl` | `24px` / `1.5rem` | Section margins |
| `--space-2xl` | `32px` / `2rem` | Hero/control padding |

- **Max-width:** `1400px` (wider than marketing) — data needs room. Control bar may go full-bleed within container.

## Color Override — Status Semantics

Keep Master dark palette as base. Add a **status color scale** (industrial monitoring convention — green=running, amber=warning, red=fault). Status must pair color with icon + text, never color alone (`color-not-decorative-only`).

| Role | Hex | CSS Variable | Meaning |
|------|-----|--------------|---------|
| Status OK / Running | `#22C55E` | `--status-ok` | Device normal / running |
| Status Warning | `#F59E0B` | `--status-warn` | Above warn threshold |
| Status Fault | `#EF4444` | `--status-fault` | Above fault threshold / stopped |
| Status Info | `#3B82F6` | `--status-info` | Idle / neutral info |

- Apply `--status-*` to dots, badges, chart series, alert rows. Pulse/glow on fault.
- Chart series: accessible palette (not red/green only); supplement with pattern/label (`pattern-texture`, `direct-labeling`).

## Typography Override — Tabular Figures

- KPI values, sensor readings, clock, table numbers: **monospace tabular figures** to prevent layout shift as digits change (`number-tabular`).
  - Use `Inter` with `font-feature-settings: "tnum" 1, "cv01" 1;` OR a mono (JetBrains Mono) for large KPI displays.
- Axis labels: ≥12px, readable scale, auto-skip on small screens (`axis-readability`).

## Component / Layout Overrides

- **Header `.top-inner` (≤560px gotcha — verified):** `min-height` not fixed `height` (never clip when actions wrap). Compact `.live` to dot-only (hide `#liveText`), hide redundant `#homeBtn`. Pause/lang/theme stay ≥40px touch targets. **Budget width before adding any new header element.**
- **Control bar:** group related inputs (threshold, start/stop, report) with `fieldset`-like visual grouping; primary CTA = "Start all" (one primary per view — `primary-action`).
- **Charts:** subtle gridlines (`gridline-subtle`), tooltip on hover (web) / tap (mobile), legend visible near chart, skeleton while data loads (`loading-chart`), empty-data state if none.
- **Tables:** sortable with `aria-sort`, horizontal-scroll fallback on mobile (not layout break), sticky header if long.
- **Alerts list:** aria-live="polite" for screen readers (`aria-live-errors`); fault rows get pulse + icon.

## Motion Override

- Real-time chart updates: smooth data-stream transition (≤200ms), not snap.
- Status change: dot blink / glow pulse for fault; respect `prefers-reduced-motion` (freeze to static color).
- Entrance: keep Master `.reveal` stagger but shorter (30–50ms) given density.
- Sustainability: pause simulation when tab off-screen / `document.hidden`.

## Avoid

- ❌ Wide tables breaking layout (use horizontal scroll / card layout on mobile).
- ❌ Single-row actions only (bulk + per-row).
- ❌ Auto-play high-res video loops.
- ❌ Relying on color alone for device status.
