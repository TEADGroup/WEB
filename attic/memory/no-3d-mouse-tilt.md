---
name: no-3d-mouse-tilt
description: Never use mouse-tracking 3D tilt effects — user finds them annoying
metadata:
  type: feedback
---

User explicitly dislikes mouse-tracking 3D card tilt effects (the kind where cards rotate via `mousemove` following the cursor, creating a `rotateX`/`rotateY` based on mouse position). These effects feel jarring and unprofessional.

**Why:** The user finds it distracting and annoying when cards tilt/rotate following the mouse cursor. It creates an unstable, gimmicky feel rather than a professional experience.

**How to apply:** Never use `use3DTilt` or any mouse-tracking `mousemove` → `rotateX/Y` effects. Instead use:
- Subtle `hover:-translate-y-0.5` (gentle lift on hover)
- `hover:shadow-md` (shadow increase on hover)  
- `transition-all duration-300` (smooth, fast transitions)
- Entry animations via GSAP ScrollTrigger (one-time on scroll reveal)
- No `perspective` + `rotateX/Y` driven by mouse position
