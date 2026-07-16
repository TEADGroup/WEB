'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';

/**
 * Stylized controller / control cabinet with a glowing screen and blinking LEDs.
 * Procedural for now — swap for a real GLB via useGLTF later (path reserved at
 * /models3d/controller.glb) without changing the rest of the scene.
 */
export function Controller() {
  const led1 = useRef<THREE.MeshStandardMaterial>(null!);
  const led2 = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (led1.current) led1.current.emissiveIntensity = 0.5 + (Math.sin(t * 4) * 0.5 + 0.5);
    if (led2.current) led2.current.emissiveIntensity = 0.5 + (Math.sin(t * 4 + 1.6) * 0.5 + 0.5);
  });

  return (
    <group position={[0.1, 1.0, -0.3]} rotation={[0, -0.5, 0]}>
      {/* cabinet body */}
      <mesh>
        <boxGeometry args={[1.0, 1.4, 0.5]} />
        <meshStandardMaterial color="#0F1D33" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* front panel */}
      <mesh position={[0, 0, 0.26]}>
        <boxGeometry args={[0.9, 1.3, 0.02]} />
        <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* screen */}
      <mesh position={[0, 0.35, 0.28]}>
        <boxGeometry args={[0.7, 0.35, 0.02]} />
        <meshStandardMaterial color="#0099FF" emissive="#0099FF" emissiveIntensity={0.7} />
      </mesh>
      {/* status LEDs (two blink, one steady) */}
      <mesh position={[-0.3, -0.4, 0.28]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial ref={led1} color="#00A651" emissive="#00A651" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.15, -0.4, 0.28]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial ref={led2} color="#FF3333" emissive="#FF3333" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, -0.4, 0.28]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#33B5FF" emissive="#33B5FF" emissiveIntensity={0.85} />
      </mesh>
    </group>
  );
}
