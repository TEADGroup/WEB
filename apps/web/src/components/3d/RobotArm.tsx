'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';

/** Simple articulated arm that sways at the shoulder + elbow. */
export function RobotArm() {
  const shoulder = useRef<THREE.Group>(null!);
  const elbow = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (shoulder.current) shoulder.current.rotation.z = Math.sin(t * 0.8) * 0.35 - 0.25;
    if (elbow.current) elbow.current.rotation.z = Math.sin(t * 1.1 + 1) * 0.45;
  });

  return (
    <group position={[1.7, -0.7, 0]}>
      {/* base */}
      <mesh position={[0, -1.1, 0]}>
        <cylinderGeometry args={[0.5, 0.62, 0.3, 24]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>

      <group ref={shoulder} position={[0, -0.85, 0]}>
        {/* upper arm */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.16, 0.18, 1.4, 16]} />
          <meshStandardMaterial color="#0099FF" metalness={0.6} roughness={0.35} />
        </mesh>
        {/* shoulder joint */}
        <mesh position={[0, 1.3, 0]}>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshStandardMaterial color="#33B5FF" emissive="#0099FF" emissiveIntensity={0.3} metalness={0.5} roughness={0.4} />
        </mesh>

        <group ref={elbow} position={[0, 1.3, 0]}>
          {/* forearm */}
          <mesh position={[0.5, 0.25, 0]} rotation={[0, 0, -0.9]}>
            <cylinderGeometry args={[0.13, 0.15, 1.1, 16]} />
            <meshStandardMaterial color="#00A651" metalness={0.6} roughness={0.35} />
          </mesh>
          {/* end effector */}
          <mesh position={[1.05, 0.6, 0]}>
            <boxGeometry args={[0.18, 0.18, 0.3]} />
            <meshStandardMaterial color="#FF3333" emissive="#FF3333" emissiveIntensity={0.3} metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
