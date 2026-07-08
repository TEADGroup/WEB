---
paths:
  - "index.html"
  - "assets/css/main.css"
---
# Gallery images

- Remote Unsplash URLs with `referrerpolicy="no-referrer"` and inline `onerror="this.style.display='none'"` so a broken/changed URL degrades to the gradient placeholder rather than a broken-image icon.
- 3D tilt effect is gated behind `window.matchMedia('(hover: hover)')` so it only binds on pointer devices (skips touch).
