# 🎥 Video Components

**Purpose:** Video player components

---

## 📋 Overview

Thư mục này chứa **video player components**:
- Video player wrapper
- Video gallery
- Video background
- Video controls

---

## 🎯 Available Components

```
video/
├── VideoPlayer.tsx        # Main video player
├── VideoGallery.tsx       # Video gallery grid
└── VideoBackground.tsx   # Background video
```

---

## 🔧 Usage

### Video Player
```typescript
'use client';
import { VideoPlayer } from '@/components/video/VideoPlayer';

<VideoPlayer
  src="/videos/teaser.mp4"
  poster="/images/video-poster.jpg"
  autoplay={false}
  controls={true}
/>
```

### Video Gallery
```typescript
import { VideoGallery } from '@/components/video/VideoGallery';

<VideoGallery
  videos={[
    { id: 1, src: '/video1.mp4', title: 'Project 1' },
    { id: 2, src: '/video2.mp4', title: 'Project 2' },
  ]}
/>
```

---

## ⚠️ Gotchas

### 1. Client Component Required
```typescript
'use client'; // Video requires client-side
```

### 2. Performance
- ⚠️ **Lazy-load videos** - use loading="lazy"
- ⚠️ **Compress videos** - use modern codecs (H.264, VP9)
- ⚠️ **Poster images** - show poster before video loads

---

## 🔗 Related

- **Parent:** [`../`](../) - All components
- **Upload endpoint:** [`../../app/api/uploads/`](../../app/api/uploads/) - Video upload

---

*Last updated: 2026-07-22*
**Status:** Basic implementation
