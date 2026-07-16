'use client';

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type Variant = 'cabinet' | 'circuit';

/**
 * Loads a GLB, auto-centers + scales it to a fixed size (so arbitrary downloaded
 * models always fit the card), and slowly rotates it.
 */
function GltfModel({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  const ref = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = 2.4 / maxDim;
    root.scale.setScalar(s);
    root.position.set(-center.x * s, -center.y * s, -center.z * s);
  }, [scene]);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.5;
  });

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

/** Procedural control cabinet (for the "Control cabinets" card). */
function MiniCabinet() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.5;
  });
  const ledColors = ['#00A651', '#FF3333', '#33B5FF', '#0099FF'];
  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[1.4, 1.8, 0.6]} />
        <meshStandardMaterial color="#0F1D33" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.31]}>
        <boxGeometry args={[1.2, 1.6, 0.02]} />
        <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.4, 0.33]}>
        <boxGeometry args={[0.9, 0.4, 0.02]} />
        <meshStandardMaterial color="#0099FF" emissive="#0099FF" emissiveIntensity={0.6} />
      </mesh>
      {[-0.4, -0.2, 0, 0.2].map((x, i) => (
        <mesh key={i} position={[x, -0.4, 0.33]}>
          <sphereGeometry args={[0.04, 10, 10]} />
          <meshStandardMaterial color={ledColors[i]} emissive={ledColors[i]} emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Procedural circuit board + particles (for the "PLC / SCADA" card). */
function MiniCircuit() {
  const points = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const n = 150;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 5;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    return arr;
  }, []);
  useFrame((_, dt) => {
    if (points.current) points.current.rotation.y += dt * 0.3;
  });
  return (
    <>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#0099FF" size={0.06} sizeAttenuation transparent opacity={0.8} depthWrite={false} />
      </points>
      <mesh>
        <boxGeometry args={[0.7, 0.7, 0.12]} />
        <meshStandardMaterial color="#0F1D33" emissive="#0099FF" emissiveIntensity={0.35} metalness={0.6} roughness={0.4} />
      </mesh>
    </>
  );
}

function Scene({ src, variant }: { src?: string; variant?: Variant }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 40 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1} />
      <pointLight position={[-3, 2, 2]} intensity={1.3} color="#0099FF" />
      <Suspense fallback={null}>
        {src ? (
          <GltfModel src={src} />
        ) : variant === 'cabinet' ? (
          <MiniCabinet />
        ) : (
          <MiniCircuit />
        )}
      </Suspense>
    </Canvas>
  );
}

/**
 * Card 3D viewer. Mounts its Canvas only when scrolled near the viewport
 * (IntersectionObserver) so off-screen cards cost nothing. Renders either a
 * downloaded GLB (`src`) or a procedural `variant`.
 */
export function ModelViewer({
  src,
  variant,
  className,
}: {
  src?: string;
  variant?: Variant;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {inView ? <Scene src={src} variant={variant} /> : null}
    </div>
  );
}
