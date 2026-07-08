# Mandatory working rules

These two rules are non-negotiable and override default behavior. This rule has no `paths` gate, so it is **always loaded** at startup (alongside `CLAUDE.md`).

## 1. Screenshot after every major change

Sau mỗi thay đổi lớn, capture a screenshot of the rendered page and visually compare it against the design baseline **before** calling the task done. The baseline is the current approved live site (the last committed state of `index.html`) unless the user provides a design mockup.

Gotcha when diffing: `.reveal` elements start at `opacity:0` and only animate in on scroll, so a static full-page headless screenshot will show them hidden — either capture at a scrolled position or temporarily neutralize the `.reveal` start state when diffing.

## 2. Mọi section cần phải có animation khi scroll

Every `<section>` must animate in on scroll via the `.reveal` + `IntersectionObserver` mechanism. The Hero (`#home`) is above the fold, so it uses a load-in entrance animation (`@keyframes heroIn`) instead of a scroll trigger. When adding a new section, wrap its content in `.reveal`; if it's the first viewport, give it a load-in animation.

Full mechanism (observer thresholds, stagger, parallax, reduced-motion guard): see `animation-system.md`.
