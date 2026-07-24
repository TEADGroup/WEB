# S-Curve Timeline — Vertical Timeline Implementation

**Date:** 2026-07-23
**Status:** Plan ready for approval

## Context

The current project timeline renders as a **horizontal S-Curve** using SVG (left-to-right), with cards above/below the path. The reference design (`image.png`) shows a **vertical S-Curve** (top-to-bottom) with cards alternating left/right, year markers inline on the path, and a cleaner minimal aesthetic. This plan rewrites the timeline to match the reference.

The horizontal timeline already exists at `apps/web/src/components/3d/timeline/`. The work is **refactoring 5 files** — no new dependencies needed.

## Implementation Plan

### Files to modify

| File | What changes |
|------|-------------|
| `TimelineData.tsx` | Rewrite `build2DTimelinePath()` for vertical orientation; add YearMarker type; add `years` to return type |
| `TimelineScene.tsx` | Add ScrollTrigger pin+scrub; inline SVG rendering with progress-driven reveal; compute scroll distance dynamically |
| `TimelinePathSVG.tsx` | Simplify connectors to single horizontal line; add year markers; accept `progress` prop for stroke-dashoffset path animation; vertical gradient |
| `ProjectCard.tsx` | Restyle card to match reference (minimal white card, top accent dot, month/year + location row, title, client, description); add `isVisible` + `side` animation props |
| `FeaturedProjectsSection.tsx` | Minor dark mode adjustments; verify scroll distance works with pinned timeline |

### 1. TimelineData.tsx — Vertical S-Curve Math

**Types:**
- `ProjectNode2D.side`: `'top' | 'bottom'` → `'left' | 'right'`
- New `YearMarker2D { year: number; x: number; y: number }`
- `Timeline2DPath` gains `years: YearMarker2D[]`

**Algorithm (`build2DTimelinePath`):**

```
containerWidth = 1200
PADDING_TOP = 200
PADDING_BOTTOM = 200
STEP_Y = (totalHeight - PADDING_TOP - PADDING_BOTTOM) / max(total-1, 1)
AMPLITUDE = 160  // horizontal swing from center
CENTER_X = 600
CARD_WIDTH = 280
CARD_GAP = 40

For each project (sorted by year desc → month desc):
  t = i / max(total-1, 1)
  angle = t * π * 2
  y = PADDING_TOP + i * STEP_Y
  x = CENTER_X + sin(angle * 1.5) * AMPLITUDE
  side = x < CENTER_X ? 'right' : 'left'  // card on opposite side of curve
  cardX = side === 'left' ? x - CARD_WIDTH - CARD_GAP : x + CARD_GAP
  cardY = y - CARD_HEIGHT/2

Path D: cubic bezier, control points at Y-midpoints:
  C prevX cpY, curX cpY, curX curY

Year markers: group consecutive nodes by featured_year, place midpoint on path
```

**Return type:** `{ nodes, pathD, totalWidth: 1200, totalHeight: ~3600, years }`

### 2. TimelineScene.tsx — ScrollTrigger Pin + Progress

- Dynamically import with `{ ssr: false }` (unchanged)
- Wrap container in `ReactFlowProvider`? No, this is pure SVG now — no React Flow needed
- Add `ScrollTrigger` with `pin: true, scrub: 1.5` pinned to the section
- Compute scroll distance from SVG rendered height:
  ```
  renderedHeight = totalHeight * (containerWidth / totalWidth)
  scrollDistance = renderedHeight - window.innerHeight
  ```
- Drive `progress` (0 → 1) from ScrollTrigger's `onUpdate`
- Render all SVG inline: path, year markers, connectors, nodes, cards (foreignObject)
- **Important:** `TimelinePathSVG` and `ProjectCard` are **re-integrated** — not removed
  - `TimelinePathSVG` receives `progress` prop and handles path + year markers + connectors
  - `ProjectCard` becomes a presentational component rendered inside `<foreignObject>`

### 3. TimelinePathSVG.tsx — Simplified Connectors + Year Markers

- **Connectors:** Single horizontal dashed line from node to card edge (replaces current 3-segment V-H-V)
- **Year markers:** Pill-shaped badge with year number, positioned on the path at year boundaries
- **Progress:** `stroke-dasharray` + `stroke-dashoffset` for path reveal animation
- **Gradient:** Change from `x1="0" y1="0" x2="1" y2="0"` to `x1="0" y1="0" x2="0" y2="1"` for vertical fade

### 4. ProjectCard.tsx — Reference Design

```
┌──────────────────────┐
│ Jun 2026    Binh Duong│ ← month/year + location, brand-blue, 10px
│                        │
│ Hệ thống SCADA ...     │ ← title, bold 13px
│                        │
│ Công ty TNHH XYZ      │ ← client, 11px muted
│                        │
│ Thiết kế, lắp đặt...  │ ← scope, 10px, line-clamp-2
│                        │
│            ●          │ ← blue accent dot top-right
└──────────────────────┘
```

- Accept `isVisible: boolean` and `side: 'left' | 'right'`
- When hidden: `opacity: 0`, `translateX(±20px)` toward center
- When visible: `opacity: 1`, `translateX(0)` — CSS transition 0.6s

### 5. FeaturedProjectsSection.tsx — Section Wrapper

- Keep existing header animation (eyebrow, title, subtitle fade-in via GSAP)
- Add dark mode background gradient (already has light mode)
- Mobile fallback (`MobileTimeline`) remains unchanged
- The `TimelineScene`'s ScrollTrigger handles pinning, no extra DOM spacers needed

## Verification

1. **`pnpm dev`** — start dev server
2. Navigate to `/vi` → scroll to "HÀNH TRÌNH CỦA CHÚNG TÔI" section
3. Verify:
   - Path animates from top as user scrolls (stroke-dashoffset reveal)
   - Nodes appear progressively with fade + slide-up
   - Cards appear on alternating left/right, connected by dashed line
   - Year markers visible on the path
   - Hover states work on nodes/cards (glow ring)
   - Responsive: SVG scales via viewBox
   - Mobile still shows vertical list
   - Dark mode: cards have appropriate background
4. Check console for errors
