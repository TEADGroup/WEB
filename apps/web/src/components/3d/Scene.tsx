'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import type * as THREE from 'three';

import { useTimeOfDay } from '@/components/theme/ThemeProvider';
import { Gears } from './Gears';
import { RobotArm } from './RobotArm';
import { Controller } from './Controller';
import { CircuitParticles } from './CircuitParticles';

/** Slowly rotates its children to give the scene life. */
function SpinningGroup({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.12;
  });
  return <group ref={ref}>{children}</group>;
}

export function Scene() {
  const { mode } = useTimeOfDay();
  const dark = mode === 'dark';

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 7], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={dark ? 0.35 : 0.85} />
      <directionalLight position={[5, 6, 5]} intensity={dark ? 0.5 : 1.1} />
      <pointLight position={[-5, 2, 3]} intensity={dark ? 2.2 : 0.9} color="#0099FF" />
      <pointLight position={[5, -3, 2]} intensity={dark ? 1.6 : 0.5} color="#FF3333" />

      <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.5}>
        <SpinningGroup>
          <Gears />
          <RobotArm />
          <Controller />
        </SpinningGroup>
      </Float>

      <CircuitParticles color={dark ? '#33B5FF' : '#0099FF'} />
    </Canvas>
  );
}
