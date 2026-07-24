# PHASE 5 PLAN — TEA Group Website Nâng Cấp Toàn Diện

> Ngày: 2026-07-20
> Mục tiêu: Biến TEA Group website thành một **web "giả 3D" sống động** qua **video background + CSS effect + scroll animation**, nội dung **Industry 4.0 chính xác**, luôn **cập nhật thông tin kỹ thuật**, với **animation đẳng cấp** và **hiệu suất tối ưu**.
>
> **Triết lý**: Không dùng WebGL/Three.js/3D model thật. Dùng **video MP4 background + CSS 3D transforms + scroll reveals** để tạo illusion 3D — giống phong cách [controleur.ca](https://controleur.ca/controle-financier-mensuel/).

---

## 🗺 KIẾN TRÚC MỚI (ĐÃ LOẠI BỎ 3D MODEL)

```
src/
├── components/
│   ├── video/                        # [MỚI] Video backgrounds
│   │   ├── VideoBackground.tsx       #   Component video nền chuẩn
│   │   └── VideoHero.tsx             #   Hero video full-viewport
│   │
│   ├── home/
│   │   ├── sections/
│   │   │   ├── HeroSection.tsx       # ✨ NÂNG CẤP: video hero + overlay
│   │   │   ├── PainPointsSection.tsx #   Giữ + nâng cấp hover effect
│   │   │   ├── SolutionsSection.tsx  # ✨ NÂNG CẤP: card 3D CSS tilt
│   │   │   ├── Industry4Section.tsx  #   [MỚI] Section Công nghệ 4.0
│   │   │   ├── AboutSection.tsx      # ✨ NÂNG CẤP: video thay 3D scenes
│   │   │   ├── StatsSection.tsx      #   Giữ + micro-animation
│   │   │   ├── TestimonialsSection.tsx# Giữ + nâng cấp
│   │   │   ├── BlogSection.tsx      #   [MỚI] Blog preview section
│   │   │   └── ContactSection.tsx    #   Giữ
│   │   ├── HomeClient.tsx           # ✨ THÊM Industry4 + Blog
│   │   └── data.tsx                 # ✨ THÊM Industry 4.0 data
│   │
│   ├── ui/                           # [MỚI] UI micro-interactions
│   │   ├── Card3D.tsx               #   Card với CSS 3D hover (dùng use3DTilt)
│   │   ├── MagneticButton.tsx       #   Button chạy theo chuột
│   │   ├── TextReveal.tsx           #   Text hiện từng chữ
│   │   ├── SmoothScroll.tsx         #   Lenis smooth scroll
│   │   └── AnimatedCounter.tsx      #   Counter động
│   │
│   └── blog/                        # [MỚI] Blog
│       ├── BlogCard.tsx
│       └── BlogDetail.tsx
│
├── hooks/
│   ├── use3DTilt.ts                 # ✅ DÙNG LẠI (core cho Card3D)
│   ├── useScrollParallax.ts         # ✅ DÙNG LẠI
│   └── useScrollDirection.ts        # ✅ DÙNG LẠI
│
├── lib/
│   └── blogs.ts                     # [MỚI] Blog Supabase client
│
├── locales/
│   ├── en.json                      # ✨ THÊM keys
│   └── vi.json                      # ✨ THÊM keys
│
└── app/
    └── [locale]/
        ├── page.tsx                 # ✨ THÊM blog fetch
        └── blog/
            └── [slug]/
                └── page.tsx         # [MỚI] Blog detail

public/
├── videos/                           # [MỚI] Video backgrounds
│   ├── hero-factory.mp4             #   Hero background (Pexels)
│   ├── hero-factory-poster.jpg      #   Poster image
│   ├── automation-line.mp4          #   Solutions section
│   ├── control-cabinet.mp4          #   Control Cabinet section
│   ├── robotics-lab.mp4             #   Industry 4.0 section
│   └── about-manufacturing.mp4      #   About section
└── images/
    ├── blog/                        # Blog images
    └── industry4/                   # Industry 4.0 images
```

---

## 📹 NGUỒN VIDEO BACKGROUND (PEXELS FREE LICENSE)

Tất cả video từ **Pexels.com** — free cho commercial use, không cần attribution.

### Hero Section (full-viewport background)
| Video | URL | Res | Dùng cho |
|---|---|---|---|
| High-Tech Automated Manufacturing Process | https://www.pexels.com/video/high-tech-automated-manufacturing-process-32386569/ | 2560×1440 @50fps | **Hero** — chính, tổng quan factory automation |
| Industrial Machinery in Automated Factory | https://www.pexels.com/video/industrial-machinery-in-automated-factory-30243440/ | 2730×1440 @25fps | **Hero** — dự phòng, máy móc chi tiết |

### Solutions Section (card backgrounds)
| Video | URL | Res | Dùng cho |
|---|---|---|---|
| Automated Industrial Production Line | https://www.pexels.com/video/automated-industrial-production-line-in-action-32386533/ | 2560×1440 @50fps | **Line Automation** |
| Industrial Conveyor System with Red Lights | https://www.pexels.com/video/industrial-conveyor-system-with-red-lights-32386531/ | 2560×1440 @100fps | **Conveyor/Sorting** |
| Automated Solar Panel Production Line | https://www.pexels.com/video/automated-solar-panel-production-line-32386606/ | 2560×1440 @100fps | **System Integration** |
| Close-Up of Machinery in Manufacturing | https://www.pexels.com/video/close-up-of-machinery-in-manufacturing-process-32386567/ | 2560×1440 @50fps | **Control Cabinet** |
| High-Tech Robotic Manufacturing Process | https://www.pexels.com/video/high-tech-robotic-manufacturing-process-32386614/ | 2560×1440 @100fps | **Industry 4.0** |

### About Section
| Video | URL | Res | Dùng cho |
|---|---|---|---|
| Advanced Robotics in Automated Factory | https://www.pexels.com/video/advanced-robotics-in-automated-factory-32386590/ | ~1440p | **About Hero** |

---

## 🎯 PHASE 5.1 — CÀI ĐẶT DEPENDENCIES

### File: `apps/web/package.json` [CẬP NHẬT]
**Chỉ thêm:**
```json
{
  "react-lenis": "^1.2.0",            // Smooth scroll (DUY NHẤT)
  "react-intersection-observer": "^9.13.0"  // Lazy load video
}
```

> **Ghi chú**: KHÔNG cần `@react-three/postprocessing`, `three-stdlib`, `leva` nữa. Giữ `gsap`, `framer-motion`, `@react-three/fiber` (cho các scene hiện tại, sẽ cải tiến sau).

### File: `apps/web/next.config.ts` [CẬP NHẬT]
```ts
optimizePackageImports: ['lucide-react', 'framer-motion'],
```

---

## 🎬 PHASE 5.2 — VIDEO BACKGROUND SYSTEM

### 5.2.1 File: `src/components/video/VideoBackground.tsx` [MỚI]

**Component video background chuẩn** — dùng cho tất cả section:

```tsx
interface VideoBackgroundProps {
  src: string;
  poster?: string;         // Fallback image
  overlay?: boolean;       // Gradient overlay?
  overlayColor?: string;   // Tint color
  opacity?: number;        // Video opacity (0-1)
  blendMode?: 'overlay' | 'screen' | 'multiply';
  className?: string;
  /** Video fill mode */
  fit?: 'cover' | 'contain';
}

// Cấu trúc:
// <div className="absolute inset-0 overflow-hidden">
//   <video
//     autoPlay muted loop playsInline
//     poster={poster}
//     className={`w-full h-full object-${fit}`}
//     style={{ opacity }}
//   />
//   {overlay && <div className="absolute inset-0" style={{ background: gradient }} />}
// </div>

// Thông số kỹ thuật:
const VIDEO_PROPS = {
  autoPlay: true,
  muted: true,
  loop: true,
  playsInline: true,
  preload: 'metadata' as const,
  loading: 'lazy' as const,
};
```

### 5.2.2 File: `src/components/video/VideoHero.tsx` [MỚI]

**Hero video full-viewport** — dùng cho HeroSection:

```tsx
interface VideoHeroProps {
  src: string;
  poster?: string;
  children: ReactNode;     // Nội dung overlay
}

// Kiến trúc:
// <section className="relative h-screen w-full overflow-hidden">
//   <video ... />                           // Background video
//   <div className="absolute inset-0">       // Gradient overlay
//     {/* Gradient từ màu nền → transparent */}
//     {/* Linear-gradient như hero hiện tại */}
//   </div>
//   <div className="relative z-10">          // Content
//     {children}
//   </div>
// </section>
```

### 5.2.3 Tải Video từ Pexels

Danh sách video cần tải về `public/videos/`:

| # | File name | URL Pexels | Kích thước | Dùng cho |
|---|---|---|---|---|
| 1 | `hero-factory.mp4` | https://www.pexels.com/video/high-tech-automated-manufacturing-process-32386569/ | ~50MB | Hero section |
| 2 | `automation-line.mp4` | https://www.pexels.com/video/automated-industrial-production-line-in-action-32386533/ | ~50MB | Solutions: Line Automation |
| 3 | `conveyor-system.mp4` | https://www.pexels.com/video/industrial-conveyor-system-with-red-lights-32386531/ | ~80MB | Solutions: Conveyor |
| 4 | `solar-production.mp4` | https://www.pexels.com/video/automated-solar-panel-production-line-32386606/ | ~50MB | Solutions: Integration |
| 5 | `machinery-closeup.mp4` | https://www.pexels.com/video/close-up-of-machinery-in-manufacturing-process-32386567/ | ~50MB | Solutions: Cabinet |
| 6 | `robotics-lab.mp4` | https://www.pexels.com/video/high-tech-robotic-manufacturing-process-32386614/ | ~50MB | Industry 4.0 |
| 7 | `about-factory.mp4` | https://www.pexels.com/video/advanced-robotics-in-automated-factory-32386590/ | ~50MB | About section |

> **Cần tải thủ công** từ Pexels → save vào `public/videos/`. Mỗi video kèm `poster.jpg` (thumbnail từ Pexels).

---

## 🃏 PHASE 5.3 — CSS 3D EFFECTS & MICRO-INTERACTIONS

### 5.3.1 File: `src/hooks/use3DTilt.ts` [DÙNG LẠI]

✅ **Giữ nguyên.** Hook đã hoàn chỉnh. Dùng cho tất cả card.

### 5.3.2 File: `src/components/ui/Card3D.tsx` [MỚI]

**Card với 3D CSS hover effect** — dùng `use3DTilt` hook CÓ SẴN:

```tsx
interface Card3DProps {
  children: ReactNode;
  max?: number;           // Default: 8 (độ nghiêng)
  perspective?: number;   // Default: 800
  scale?: number;         // Default: 1.02 (phóng to khi hover)
  speed?: number;         // Default: 400 (ms)
  className?: string;
  glowColor?: string;     // Màu glow khi hover
  shadowDepth?: 'sm' | 'md' | 'lg';
}

// Kiến trúc:
// <div ref={ref} className="group relative transition-all duration-300">
//   {/* Shadow layer — đổ bóng động */}
//   <div className="absolute inset-0 rounded-2xl transition-shadow duration-300
//     group-hover:shadow-2xl group-hover:shadow-{glowColor}/20" />
//   
//   {/* Content layer — 3D tilt */}
//   <div className="relative rounded-2xl bg-white/70 backdrop-blur-sm
//     border border-slate-200/60 overflow-hidden">
//     {/* Optional: top accent bar với gradient */}
//     <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r {color}" />
//     {children}
//   </div>
// </div>

// Hiệu ứng hover:
// 1. Card nghiêng theo chuột (use3DTilt hook)
// 2. Shadow tăng: group-hover:shadow-2xl
// 3. Border sáng: group-hover:border-{color}/30
// 4. TranslateY: -2px (nâng lên)
// 5. Glow color: box-shadow với màu brand

// Áp dụng cho:
// - Solution cards
// - Pain point cards
// - Stat cards
// - Industry 4.0 cards
// - Blog cards
```

### 5.3.3 File: `src/components/ui/MagneticButton.tsx` [MỚI]

**Button với magnetic hover** — button "chạy theo" chuột:

```tsx
interface MagneticButtonProps {
  children: ReactNode;
  strength?: number;      // 0.1 - 0.5, default 0.2
  radius?: number;        // px, default 120
  className?: string;
  as?: 'button' | 'a';
  href?: string;
}

// Dùng framer-motion:
// onMouseMove: tính offset từ center → apply translate
// onMouseLeave: spring về vị trí gốc (type: spring, stiffness: 300)
// Hiệu ứng nhẹ, chỉ 2-3px dịch chuyển — không quá đà
```

### 5.3.4 File: `src/components/ui/TextReveal.tsx` [MỚI]

**Text reveal on scroll** — chữ xuất hiện từng chữ:

```tsx
interface TextRevealProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  delay?: number;
  className?: string;
}

// Dùng GSAP ScrollTrigger:
// Mỗi chữ là <span> riêng
// Từ opacity: 0, y: 20 → opacity: 1, y: 0
// Stagger: 0.03s giữa các chữ
// Trigger khi scroll đến section
```

### 5.3.5 File: `src/components/ui/AnimatedCounter.tsx` [MỚI]

**Counter animation** — tách từ StatsSection:

```tsx
interface AnimatedCounterProps {
  value: string;          // "120+", "15+", etc
  label: string;
  icon: LucideIcon;
  duration?: number;      // Default: 2.4
  delay?: number;
  suffix?: string;
}

// Dùng GSAP: gsap.to(obj, { val: num })
// onUpdate: cập nhật textContent
// ScrollTrigger: start 'top 88%'
```

### 5.3.6 File: `src/components/ui/SmoothScroll.tsx` [MỚI]

**Lenis smooth scroll** — thay thế CSS `scroll-behavior: smooth`:

```tsx
export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    }}>
      {children}
    </ReactLenis>
  );
}
```

### 5.3.7 Scroll Animation Parameters cho từng Section

| Section | Effect | Stagger | Duration | Easing | Trigger |
|---|---|---|---|---|---|
| Hero | Video bg + text fade-in | entries: 0.05→0.9s | 0.5-1.0s | power3.out | on mount |
| PainPoints | Card fade-up + 3D tilt | 0.15s | 0.6s | power3.out | top 78% |
| Solutions | Card fade-up + 3D tilt + glow | 0.12s | 0.6s | power3.out | top 78% |
| Industry4 | Card fade-up staggered | 0.08s | 0.5s | power3.out | top 75% |
| About | Content fade + parallax | 0.2s | 0.65s | back.out(1.4) | top 75% |
| Stats | Counter + card fade | 0.14s | 0.6s | back.out(1.3) | top 78% |
| Testimonials | Carousel fade | 0.45s | 0.6s | power3.out | top 78% |
| Blog | Card staggered | 0.1s | 0.5s | power3.out | top 75% |
| Contact | Timeline offset | -0.2s | 0.55s | power3.out | top 78% |

---

## 🌐 PHASE 5.4 — INDUSTRY 4.0 SECTION [MỚI]

### 5.4.1 File: `src/components/home/sections/Industry4Section.tsx`

**Layout** (8 cards grid 4×2):
```
┌──────────────────────────────────────────┐
│  "INDUSTRY 4.0" / "Smart Factory Tech"  │
│                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │ IIoT  │ │Digital│ │  AI  │ │Cloud │    │
│  │       │ │ Twin  │ │Pred. │ │SCADA │    │
│  └──────┘ └──────┘ └──────┘ └──────┘    │
│                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │  5G   │ │  AR  │ │OPC UA│ │Cyber │    │
│  │Factory │ │Main. │ │ MQTT │ │Safety│    │
│  └──────┘ └──────┘ └──────┘ └──────┘    │
│                                          │
│  Video background: robotics-lab.mp4       │
│  (opacity 0.15, blend mode: overlay)     │
└──────────────────────────────────────────┘
```

**Mỗi card dùng `Card3D` wrapper** với hiệu ứng:
- Hover: translateY(-4px) + shadow tăng + glow border
- Icon: scale(1.1) + color shift
- Background: gradient theo màu brand của từng card

**Data structure — 8 cards:**

| # | Icon | titleVi | titleEn | Brand color |
|---|---|---|---|---|
| 1 | `Radio` | IIoT & Industrial IoT | IIoT & Industrial IoT | `#0099FF` |
| 2 | `Monitor` | Digital Twin | Digital Twin | `#00A651` |
| 3 | `Cpu` | AI Predictive Maintenance | AI Predictive Maintenance | `#FF3333` |
| 4 | `Cloud` | Cloud SCADA & Web HMI | Cloud SCADA & Web HMI | `#FF6600` |
| 5 | `Wifi` | 5G & Private Network | 5G & Private Network | `#9933FF` |
| 6 | `Eye` | AR Maintenance & Vision AI | AR Maintenance & Vision AI | `#00CCBB` |
| 7 | `Radio` | OPC UA & MQTT | OPC UA & MQTT | `#0099FF` |
| 8 | `Shield` | Cybersecurity & OT Security | Cybersecurity & OT Security | `#FF3333` |

### 5.4.2 File: `src/components/home/data.tsx` [CẬP NHẬT]

**Thêm:**
- `industry4Data: Industry4Item[]` — 8 items như trên
- Icons mới: `Cloud`, `Wifi`, `Shield`, `Eye` từ lucide-react

### 5.4.3 File: `src/components/home/HomeClient.tsx` [CẬP NHẬT]

Chèn `Industry4Section` giữa Solutions và About:
```tsx
{/* ═══════ INDUSTRY 4.0 ═══════ */}
<Industry4Section locale={locale} />
```

---

## 📝 PHASE 5.5 — BLOG & KNOWLEDGE BASE

### 5.5.1 Supabase Schema — `supabase/migrations/0005_blog_schema.sql`

```sql
CREATE TYPE blog_category AS ENUM (
  'technology', 'case-study', 'technical-guide', 'industry-news', 'company-news'
);

CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  category blog_category NOT NULL DEFAULT 'technology',
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL,
  excerpt_vi TEXT NOT NULL,
  excerpt_en TEXT NOT NULL,
  content_vi TEXT NOT NULL,
  content_en TEXT NOT NULL,
  featured_image TEXT,
  tags TEXT[],
  reading_time_minutes INTEGER DEFAULT 5,
  author_name TEXT DEFAULT 'TEA Group',
  meta_title_vi TEXT,
  meta_title_en TEXT,
  meta_description_vi TEXT,
  meta_description_en TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  view_count INTEGER DEFAULT 0
);

CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_published_blog" ON blog_posts
  FOR SELECT TO anon USING (status = 'published');

CREATE POLICY "admin_all_blog" ON blog_posts
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');
```

### 5.5.2 File: `apps/web/src/lib/blogs.ts` [MỚI]

Server functions:
- `getPublishedPosts(locale, category?, limit?)` → BlogPost[]
- `getPostBySlug(slug)` → BlogPost | null
- `incrementViewCount(postId)` → void (client-side)

### 5.5.3 File: `src/app/[locale]/page.tsx` [CẬP NHẬT]

```tsx
const [projectsResult, sectionsResult, blogResult] = await Promise.all([
  supabase.from('projects').select('...'),
  supabase.from('project_sections').select('...'),
  supabase.from('blog_posts').select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3),
]);
return <HomeClient ... blogPosts={blogResult.data || []} />;
```

### 5.5.4 File: `src/components/home/sections/BlogSection.tsx` [MỚI]

**Props**: `blogPosts: BlogPost[]` (3 posts mới nhất)

**Layout**:
- PageHeader: "Knowledge" / "Kiến thức"
- 3 blog cards (grid 3 columns)
- Mỗi card: `Card3D` wrapper + featured image + category badge + title + excerpt + date + "Read more"

### 5.5.5 File: `src/app/[locale]/blog/[slug]/page.tsx` [MỚI]

Server component:
- Fetch post by slug
- Render: featured image, title, author, date, category badge, content (HTML), share buttons
- SEO: meta_title, meta_description, og:image

### 5.5.6 Chủ đề Blog (25 topics đã research sẵn)

**Technical Guides:**
1. "IEC 61131-3 Programming Languages Compared"
2. "Setting Up OPC UA Between Siemens PLC and SCADA"
3. "How to Design IEC 61439-Compliant Control Panels"
4. "Profinet vs EtherNet/IP vs Modbus TCP: Decision Framework"
5. "Edge Computing Architecture for Smart Factories"
6. "Virtual Commissioning with Digital Twins"
7. "Industrial Robot Programming: RAPID vs KRL vs TP"

**Case Studies:**
8. "29% Production Cost Reduction with Smart Factory"
9. "Predictive Maintenance ROI: Real Numbers"
10. "MES/ERP Integration at a Vietnamese Plant"
11. "SCADA Modernization: Legacy to Cloud"
12. "Control Cabinet Retrofit to IEC 61439"

**Industry News:**
13. "Vietnam's Industry 4.0 Readiness Report"
14. "Robot Density in ASEAN: Vietnam's Position"
15. "5G in Manufacturing: When for Vietnam?"
16. "The Automation Skills Gap in Vietnam"
17. "OT Cybersecurity: Growing Threats"
18. "Low-Code MES Platforms Rise"

**Technology Explainers:**
19. "Digital Twins Explained: DTP, DTI, DTA"
20. "IIoT vs Industry 4.0 vs Smart Manufacturing"
21. "What Is TSN and Why It Matters"
22. "Predictive vs Preventive vs Reactive Maintenance"
23. "ISA-95 Automation Pyramid from L0 to L4"
24. "Collaborative Robots vs Industrial Robots"
25. "The Digital Thread: Sensor to ERP"

---

## 🖼 PHASE 5.6 — HÌNH ẢNH & ASSETS

### 5.6.1 Ảnh từ Unsplash cho Industry 4.0

Tải về `public/images/industry4/`:

| File | Tìm kiếm | Kích thước |
|---|---|---|
| `smart-factory.jpg` | "smart factory technology" | 1920×1080 |
| `digital-twin.jpg` | "digital twin dashboard" | 1200×800 |
| `iot-dashboard.jpg` | "iot data dashboard" | 1200×800 |
| `ai-industry.jpg` | "AI manufacturing robot" | 1200×800 |
| `engineer-plc.jpg` | "engineer programming PLC" | 800×1200 |
| `control-room.jpg` | "industrial control room" | 1920×1080 |

### 5.6.2 GIF → WebM Conversion

Chuyển các GIF hiện tại sang WebM (giảm ~80%):

| File cũ (GIF) | File mới (WebM) |
|---|---|
| `control-cabinet.gif` | `control-cabinet.webm` |
| `plc-scada.gif` | `plc-scada.webm` |
| `automation.gif` | `automation.webm` |
| `factory-line.gif` | `factory-line.webm` |
| `engineering.gif` | `engineering.webm` |
| `about-custom.gif` | `about-custom.webm` |
| `about-engineering.gif` | `about-engineering.webm` |
| `about-quality.gif` | `about-quality.webm` |
| `about-support.gif` | `about-support.webm` |

---

## 🎨 PHASE 5.7 — THEME & STYLING

### 5.7.1 File: `src/styles/globals.css` [CẬP NHẬT]

**Thêm keyframes:**
```css
/* Video overlay pulse */
@keyframes overlay-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.7; }
}

/* Card glow */
@keyframes card-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(0,153,255,0.1); }
  50% { box-shadow: 0 0 30px rgba(0,153,255,0.2); }
}

/* Data flow (cho Industry 4.0) */
@keyframes data-flow {
  0% { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}

/* Gradient shift cho hero overlay */
@property --overlay-pos {
  syntax: '<percentage>';
  initial-value: 0%;
  inherits: false;
}
@keyframes overlay-shift {
  0% { --overlay-pos: 0%; }
  50% { --overlay-pos: 100%; }
  100% { --overlay-pos: 0%; }
}
```

**Thêm dark mode CSS variables:**
```css
:root {
  /* Light theme (giữ nguyên) */
  --surface-base: #FFFFFF;
  --surface-card: rgba(255,255,255,0.30);
  --text-primary: #1E293B;
  --text-secondary: #64748B;
}

[data-theme="dark"] {
  --surface-base: #0A1626;
  --surface-card: rgba(10,22,38,0.60);
  --text-primary: #E2E8F0;
  --text-secondary: #94A3B8;
}
```

### 5.7.2 File: `tailwind.config.ts` [CẬP NHẬT]

**Thêm animations:**
```ts
keyframes: {
  // ... existing 8 keyframes
  'card-glow': {
    '0%, 100%': { boxShadow: '0 0 20px rgba(0,153,255,0.1)' },
    '50%': { boxShadow: '0 0 30px rgba(0,153,255,0.2)' },
  },
  'data-flow': {
    '0%': { backgroundPosition: '0% 0%' },
    '100%': { backgroundPosition: '200% 0%' },
  },
},
animation: {
  // ... existing 8 animations
  'card-glow': 'card-glow 4s ease-in-out infinite',
  'data-flow': 'data-flow 3s linear infinite',
},
```

---

## 🏗 PHASE 5.8 — SECTION NÂNG CẤP

### 5.8.1 File: `src/components/home/HeroSection.tsx` [NÂNG CẤP]

**Thay đổi:**
- Thêm `VideoHero` với video factory background
- Gradient overlay giống hero hiện tại (giữ video mask)
- Giữ nguyên text content + CTAs
- Thêm `TextReveal` cho title
- Thêm `MagneticButton` cho CTAs
- Các geo shapes + dots vẫn giữ (CSS float animation)

**Cấu trúc mới:**
```tsx
<section className="relative w-full overflow-hidden" style={{ minHeight: '100dvh' }}>
  {/* Video background */}
  <VideoHero src="/videos/hero-factory.mp4" poster="/videos/hero-factory-poster.jpg">
    {/* Gradient overlay mask (giống hiện tại) */}
  </VideoHero>

  {/* Geometric decorations (giữ nguyên) */}
  <div className="hero-geo-overlay">...</div>

  {/* Text content (giữ nguyên) */}
  <div className="relative z-10 mx-auto ...">
    <Image logo />
    <TextReveal text={t('heroTitle')} as="h1" />
    <p className="hero-subtitle">...</p>
    <MagneticButton>Cta</MagneticButton>
  </div>
</section>
```

### 5.8.2 File: `src/components/home/SolutionsSection.tsx` [NÂNG CẤP]

**Thay đổi:**
- Mỗi card dùng `Card3D` wrapper (hover 3D tilt + glow)
- Thêm video background nhẹ cho card chính
- Giữ nguyên layout 5-column grid
- Giữ nguyên gear decorations

### 5.8.3 File: `src/components/home/AboutSection.tsx` [CẬP NHẬT]

**Thay đổi:**
- Thay 4 scene R3F bằng `Card3D` + image background
- Giữ nguyên GSAP animations
- Giữ nguyên text content + bullets

### 5.8.4 Component Tree Mới

```tsx
<main>
  <SmoothScroll>                              {/* Lenis */}
    <HeroSection>                             {/* Video background + geo overlay */}
    <PainPointsSection />                     {/* Card3D wrapper mới */}
    <SolutionsSection>                        {/* Card3D wrapper mới */}
    <Industry4Section>                        {/* [MỚI] 8 cards */}
    <AboutSection>                            {/* Card3D + images */}
    <StatsSection />                          {/* AnimatedCounter */}
    <TestimonialsSection />                   {/* Giữ, thêm effect */}
    <BlogSection posts={posts} />             {/* [MỚI] Blog preview */}
    <ContactSection />                        {/* Giữ nguyên */}
  </SmoothScroll>
</main>
```

---

## 🌙 PHASE 5.9 — DYNAMIC THEME (DARK MODE)

### 5.9.1 File: `src/components/theme/ThemeProvider.tsx` [KHÔI PHỤC]

- useTimeOfDay() tính phase từ Asia/Ho_Chi_Minh
- CSS variables đổi theo phase
- localStorage['tea-theme'] cho manual override
- data-theme attribute trên <html>

### 5.9.2 Dark Mode CSS

```css
[data-theme="dark"] {
  --surface-base: #0A1626;
  --surface-card: rgba(10,22,38,0.60);
  --text-primary: #E2E8F0;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
}
```

### 5.9.3 No-Flash Script

Khôi phục inline script trong `<head>`:
```tsx
<script dangerouslySetInnerHTML={{
  __html: `(function(){
    var t=localStorage.getItem('tea-theme')||'auto';
    if(t==='dark'||(t==='auto'&&window.matchMedia('(prefers-color-scheme:dark)').matches))
      document.documentElement.setAttribute('data-theme','dark');
    else document.documentElement.setAttribute('data-theme','light');
  })()`
}} />
```

---

## 📄 PHASE 5.10 — i18n LOCALE UPDATES

### Thêm vào `en.json` và `vi.json`:

**Industry4 namespace:**
```json
{
  "Industry4": {
    "eyebrow": "Industry 4.0",
    "title": "Smart Factory Technologies",
    "subtitle": "Digital transformation solutions for modern manufacturing.",
    "cta": "Learn more →"
  }
}
```

**Blog namespace:**
```json
{
  "Blog": {
    "eyebrow": "Knowledge",
    "title": "Technical Blog",
    "subtitle": "Industry insights, technical guides, and company updates.",
    "readMore": "Read more",
    "viewAll": "All articles",
    "category": {
      "technology": "Technology",
      "case-study": "Case Study",
      "technical-guide": "Technical Guide",
      "industry-news": "Industry News",
      "company-news": "Company News"
    },
    "readingTime": "{{minutes}} min read",
    "publishedAt": "Published on {{date}}"
  }
}
```

---

## 📋 TỔNG KẾT THAY ĐỔI

### Files MỚI (15 files):
```
src/components/video/VideoBackground.tsx
src/components/video/VideoHero.tsx
src/components/ui/Card3D.tsx
src/components/ui/MagneticButton.tsx
src/components/ui/TextReveal.tsx
src/components/ui/SmoothScroll.tsx
src/components/ui/AnimatedCounter.tsx
src/components/home/sections/Industry4Section.tsx
src/components/home/sections/BlogSection.tsx
src/lib/blogs.ts
src/app/[locale]/blog/[slug]/page.tsx
supabase/migrations/0005_blog_schema.sql
public/videos/hero-factory.mp4
public/videos/automation-line.mp4
(Thêm 5 video nữa → 7 total)
```

### Files CẬP NHẬT (12 files):
```
apps/web/package.json                   — Thêm react-lenis, intersection-observer
apps/web/next.config.ts                 — optimizePackageImports
apps/web/src/styles/globals.css          — Keyframes + dark mode
apps/web/tailwind.config.ts              — Animations
apps/web/src/components/home/HeroSection.tsx — Video thay 3D
apps/web/src/components/home/SolutionsSection.tsx — Card3D wrapper
apps/web/src/components/home/AboutSection.tsx — Image thay R3F
apps/web/src/components/home/HomeClient.tsx — Thêm sections
apps/web/src/components/home/data.tsx   — Thêm Industry4 data
apps/web/src/app/[locale]/page.tsx     — Thêm blog fetch
apps/web/src/locales/en.json            — Keys mới
apps/web/src/locales/vi.json            — Keys mới
```

### Files GIỮ NGUYÊN (quan trọng):
```
src/hooks/use3DTilt.ts                  — ✅ Core cho Card3D
src/hooks/useScrollParallax.ts          — ✅ Dùng lại
src/hooks/useScrollDirection.ts         — ✅ Dùng lại
src/components/3d/AnimatedScenes.tsx     — ✅ Giữ (cho About, tùy chọn)
src/components/layout/*                 — ✅ Giữ nguyên
src/i18n/*                              — ✅ Giữ nguyên
src/middleware.ts                       — ✅ Giữ nguyên
packages/shared/src/*                   — ✅ Giữ nguyên
```

### Files ĐÃ LOẠI BỎ (không cần):
```
src/components/3d/models/RobotArm.tsx        — ❌ KHÔNG còn
src/components/3d/models/ControlCabinet.tsx   — ❌ KHÔNG còn
src/components/3d/models/ConveyorLine.tsx     — ❌ KHÔNG còn
src/components/3d/models/CircuitBoard3D.tsx   — ❌ KHÔNG còn
src/components/3d/models/GearSystem.tsx       — ❌ KHÔNG còn
src/components/3d/effects/ParticleField.tsx   — ❌ KHÔNG còn
src/components/3d/effects/DataFlow.tsx        — ❌ KHÔNG còn
src/components/3d/SceneWrapper.tsx            — ❌ KHÔNG còn
src/components/3d/SceneTransition.tsx         — ❌ KHÔNG còn
src/components/ui/TiltCard.tsx                — ❌ Merge vào Card3D
```

---

## ⏱ ƯỚC TÍNH THỜI GIAN

| Batch | Files | Thời gian | Ghi chú |
|---|---|---|---|
| 1 — Foundation | 4 files | 0.5 ngày | Cài deps + VideoBackground + CSS |
| 2 — UI Components | 5 files | 1 ngày | Card3D, MagneticButton, TextReveal, Counter, SmoothScroll |
| 3 — Section Nâng cấp | 6 files | 1.5 ngày | Hero, Solutions, About, Industry4, BlogSection, HomeClient |
| 4 — Blog System | 5 files | 1.5 ngày | Migration, lib, pages, locales |
| 5 — Dark Mode + Polish | 4 files | 0.5 ngày | ThemeProvider + CSS + NoFlash |
| **Tổng** | **24 files** | **~5 ngày** | **Giảm từ 15 ngày xuống 5 ngày** |

---

## ✅ CRITERIA HOÀN THÀNH

1. **Video Backgrounds**: 7 video Pexels loop mượt, lazy load, poster fallback
2. **Card 3D Hover**: `use3DTilt` hook hoạt động trên tất cả card
3. **Magnetic Buttons**: CTA chạy nhẹ theo chuột
4. **Text Reveal**: Heading xuất hiện từng chữ khi scroll
5. **Smooth Scroll**: Lenis mượt, không conflict GSAP
6. **Industry 4.0 Section**: 8 cards, có DataFlow animation
7. **Blog System**: DB, API, preview trên home, detail page
8. **Dark Mode**: Day/night auto + manual toggle
9. **i18n**: VI + EN cho mọi content mới
10. **TypeScript**: `pnpm typecheck` clean
11. **Tốc độ**: < 5s load, 90+ Lighthouse, video lazy load
