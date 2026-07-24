'use client';

import * as THREE from 'three';

interface YearMarkerProps {
  year: number;
  position: THREE.Vector3;
  isActive?: boolean;
}

/**
 * Mốc năm — sáng, rõ, kèm chấm tròn.
 */
export function YearMarker({ year, position, isActive = false }: YearMarkerProps) {
  const color = isActive ? '#0099FF' : '#33B5FF';

  return (
    <group position={position}>
      {/* Circle marker */}
      <mesh>
        <circleGeometry args={[0.3, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Border */}
      <mesh>
        <ringGeometry args={[0.28, 0.32, 24]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Connecting line down to year text */}
      <mesh>
        <cylinderGeometry args={[0.01, 0.01, 0.5, 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
        <primitive object={new THREE.Vector3(0, -0.25, 0)} />
      </mesh>
    </group>
  );
}
