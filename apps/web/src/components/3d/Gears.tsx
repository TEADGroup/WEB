'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';

interface GearProps {
  radius: number;
  teeth: number;
  thickness: number;
  color: string;
  speed: number;
  position: [number, number, number];
}

function Gear({ radius, teeth, thickness, color, speed, position }: GearProps) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * speed;
  });

  return (
    <group ref={ref} position={position} rotation={[Math.PI / 2.4, 0, 0]}>
      {/* disc */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, thickness, 36]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* hub */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.25, radius * 0.25, thickness * 1.3, 20]} />
        <meshStandardMaterial color="#0A1626" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* teeth */}
      {Array.from({ length: teeth }).map((_, i) => {
        const a = (i / teeth) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * radius, Math.sin(a) * radius, 0]}
            rotation={[0, 0, a]}
          >
            <boxGeometry args={[radius * 0.2, radius * 0.4, thickness * 1.2]} />
            <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

export function Gears() {
  return (
    <group>
      <Gear radius={1.15} teeth={14} thickness={0.25} color="#0099FF" speed={0.5} position={[-1.7, 0.5, 0]} />
      <Gear radius={0.75} teeth={10} thickness={0.22} color="#00A651" speed={-0.85} position={[-0.5, 1.5, 0.4]} />
      <Gear radius={0.55} teeth={8} thickness={0.2} color="#FF3333" speed={1.15} position={[-0.3, -0.7, -0.5]} />
    </group>
  );
}
