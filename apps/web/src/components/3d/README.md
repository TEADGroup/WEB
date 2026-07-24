# 🎮 3D Components (React Three Fiber)

**Purpose:** React Three Fiber (R3F) 3D scenes và components

---

## 📋 Overview

Thư mục này chứa **tất cả 3D components** sử dụng React Three Fiber:
- Hero 3D scene (gears, robot arm, controller, particles)
- Solution card 3D models (BrainStem, CesiumMilkTruck, ChronographWatch)
- 3D utilities và helpers

---

## 🎯 Available Scenes

```
3d/
├── hero/                      # Hero 3D scene
│   ├── HeroScene.tsx         # Main hero scene
│   ├── Gear.tsx              # Animated gears
│   ├── RobotArm.tsx          # Robot arm model
│   ├── Controller.tsx         # Controller model
│   └── Particles.tsx         # Circuit particles
│
├── solutions/                 # Solution card 3D models
│   ├── BrainStem.tsx         # BrainStem model
│   ├── CesiumMilkTruck.tsx   # Milk truck model
│   └── ChronographWatch.tsx  # Watch model
│
└── utils/                     # 3D utilities
    ├── use-three.ts          # R3F hooks
    └── helpers.tsx           # Helper components
```

---

## ⚡ Critical Pattern (READ THIS!)

```typescript
'use client';  // ← REQUIRED for all 3D components

import dynamic from 'next/dynamic';

const Scene3D = dynamic(() => import('./Scene3D'), { 
  ssr: false,  // ← REQUIRED - R3F cannot SSR
  loading: () => <div>Loading...</div>
});

export default function Scene3DWrapper() {
  return <Scene3D />;
}
```

**Why this pattern?**
1. `'use client'` - R3F requires client-side rendering
2. `ssr: false` - R3F cannot run on server (browser APIs)
3. `dynamic()` - Lazy-load 3D components (better performance)

---

## 🎨 R3F + drei Usage

```typescript
'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <OrbitControls />
      {/* Your 3D objects here */}
    </Canvas>
  );
}
```

---

## 📦 Dependencies

```json
{
  "@react-three/fiber": "^9.x",
  "@react-three/drei": "^10.x",
  "three": "^0.185.x"
}
```

---

## ⚠️ Gotchas

### 1. Client-side only
```typescript
// ❌ WRONG - In server component
export default function Page() {
  return <HeroScene />;  // 💥 CRASH
}

// ✅ RIGHT - In client component
'use client';
export default function HeroScene() {
  return <Canvas>...</Canvas>;
}
```

### 2. Dynamic import required
```typescript
// ❌ WRONG - Direct import in Next 15
import { HeroScene } from './components/3d/HeroScene';

// ✅ RIGHT - Dynamic import
const HeroScene = dynamic(() => import('./components/3d/HeroScene'), {
  ssr: false
});
```

### 3. Performance
- ⚠️ **Lazy-load 3D components** - use dynamic imports
- ⚠️ **Limit scene complexity** - too many objects = lag
- ⚠️ **Use Suspense** - show loading states

---

## 🎨 3D Models

### Model Sources
- **Hero scene:** Custom models (gear, robot arm, controller)
- **Solution cards:** From Sketchfab (BrainStem, CesiumMilkTruck, ChronographWatch)

### Model Formats
- `.glb` / `.gltf` - Preferred format (smaller, faster)
- `.fbx` - Can be converted to GLTF

### Model Optimization
- ⚠️ **Compress textures** - use tinypng or similar
- ⚠️ **Reduce polygon count** - target < 50k polygons
- ⚠️ **Use Draco compression** - for large models

---

## 🔧 Common Patterns

### Loading Models
```typescript
import { useGLTF } from '@react-three/drei';

function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}
```

### Animation
```typescript
import { useFrame } from '@react-three/fiber';

function AnimatedMesh() {
  const meshRef = useRef();
  
  useFrame((state) => {
    meshRef.current.rotation.y = state.clock.elapsedTime;
  });
  
  return <mesh ref={meshRef}>...</mesh>;
}
```

### Interactivity
```typescript
import { useState } from 'react';
import { useThree } from '@react-three/fiber';

function InteractiveMesh() {
  const [hovered, setHovered] = useState(false);
  const { size } = useThree();
  
  return (
    <mesh
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <meshStandardMaterial color={hovered ? 'red' : 'blue'} />
    </mesh>
  );
}
```

---

## 🔗 Related

- **Parent:** [`../`](../) - All components
- **R3F docs:** https://docs.pmnd.rs/react-three-fiber
- **drei docs:** https://github.com/pmndrs/drei
- **Three.js docs:** https://threejs.org/docs

---

## 📚 Resources

- **R3F Examples:** https://docs.pmnd.rs/react-three-fiber/getting-started/examples
- **drei helpers:** https://github.com/pmndrs/drei#readme
- **3D models:** https://sketchfab.com (free models available)

---

*Last updated: 2026-07-22*
