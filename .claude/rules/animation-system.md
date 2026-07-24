---
paths:
  - "assets/css/base.css"
  - "assets/css/main.css"
  - "assets/js/main.js"
---
# Animation system

The mandate that every section must animate on scroll lives in `mandatory-workflow.md`; this rule covers the mechanism.

- Stats counters animate 0 → `data-target` via `requestAnimationFrame`, triggered once by an `IntersectionObserver` (`threshold: 0.5`).
- **Reveal** (`.reveal`, `IntersectionObserver` `threshold: 0.12`, one-shot): starts at `opacity:0` + a transform, settles to `.visible`. Direction variants `.reveal.from-left / .from-right / .from-up / .from-scale / .from-blur` set the initial transform/filter; section headings carry one for variety. **`.reveal.visible` must stay defined last** (same specificity) so it wins over the variant.
- **Stagger**: in `revealObs`, before adding `.visible`, a `transition-delay` is set from the element's index among its `.reveal` siblings (`:scope > .reveal`) — so grid children (`.grid-3`, `.gallery`, `.grid-2`, `.stats`, `.protocol-row`) cascade instead of appearing at once. Capped at ~540ms.
- **Hero (`#home`)** is above the fold, so it uses a load-in entrance (`@keyframes heroIn` with staggered `animation-delay`) instead of a scroll trigger.
- **Parallax orbs**: `onScroll` sets a `--py` CSS var on each `.orb`; the `@keyframes float1/2/3` incorporate `var(--py)` into their translate, so parallax composes with the ambient float (an inline `transform` would be overridden by the running animation — that's why it routes through the variable). Pointer devices only (`(hover: hover)`).
- `onScroll` does four jobs: navbar `.scrolled`, active nav link, scroll-progress bar width, and the orb parallax above.
- `@media (prefers-reduced-motion: reduce)` neutralizes reveal/hero/orb/shimmer motion for accessibility — preserve this guard when editing motion.
