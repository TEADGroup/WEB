---
paths:
  - "index.html"
  - "dashboard/index.html"
  - "assets/css/main.css"
  - "assets/css/dashboard.css"
  - "assets/js/main.js"
---
# Responsive / mobile

- **`index.html` navbar**: the fixed navbar carries icon buttons (lang, theme, admin, dashboard, hamburger). On screens `≤ 560px` the **admin & dashboard** icon buttons are hidden and instead appear as `nav-mobile-only` links inside the hamburger dropdown, so the bar never overflows.
- **`index.html` mobile menu** (`main.js`) closes on: link click, click outside, and `Escape`; it toggles `aria-expanded` on the hamburger and locks body scroll while open.
- **`index.html` form/footer**: form inputs use `font-size: 16px` to prevent iOS Safari's auto-zoom-on-focus. `.footer-links` uses `flex-wrap` so the links reflow on narrow screens instead of overflowing.
- **`dashboard/index.html` header overflow gotcha** (verified on iPhone 14, 390px): the sticky header `.top-inner` is `display:flex; flex-wrap:wrap` and was `height:64px` fixed. It holds brand + live badge + clock + 4 action buttons — too wide for one phone row, so `.top-actions` wrapped to a 2nd line and overflowed the 64px box ("lệch xuống dưới"). The fix (in `dashboard.css`, `≤ 560px`): switch to `min-height` (never clip), shrink `.live` to just its pulsing dot (`.live #liveText { display:none }`), and hide `#homeBtn` (redundant — the TEA logo and the footer "Về trang chủ" link both go home). **When adding any element to the dashboard header, budget the ≤560px width or it will wrap/overflow again.** Pause + language + theme buttons stay at 40px for touch.
