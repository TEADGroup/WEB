'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ProjectNodeProps {
  project: { id: string; company_logo_url?: string; featured_month?: number; title: string };
  position: THREE.Vector3;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}

/**
 * Node dự án — hình tròn trắng, viền xanh, hover → phóng to + glow.
 * Hiển thị tháng, tên dự án phía dưới.
 */
export function ProjectNode({ project, position, isHovered, onHover }: ProjectNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const textRef = useRef<THREE.Sprite>(null!);
  const [canvasTex, setCanvasTex] = useState<THREE.CanvasTexture | null>(null);

  /* Tạo canvas text cho tháng + tên dự án */
  useEffect(() => {
    const month = project.featured_month
      ? new Date(2024, project.featured_month - 1).toLocaleString('en-US', { month: 'short' })
      : '';

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    /* Clear */
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Month text */
    if (month) {
      ctx.fillStyle = '#33B5FF';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(month, 128, 40);
    }

    /* Title */
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    const title = project.title.length > 18 ? project.title.substring(0, 16) + '..' : project.title;
    ctx.fillText(title, 128, 85);

    setCanvasTex(new THREE.CanvasTexture(canvas));
  }, [project]);

  /* Hover animation */
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const target = isHovered ? 1.4 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(target, target, target), delta * 6);
  });

  return (
    <group position={position}>
      {/* Glow ring khi hover */}
      {isHovered && (
        <mesh>
          <circleGeometry args={[0.45, 32]} />
          <meshBasicMaterial color="#0099FF" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* White circle */}
      <mesh
        ref={meshRef}
        onPointerEnter={(e) => { e.stopPropagation(); onHover(project.id); }}
        onPointerLeave={() => onHover(null)}
      >
        <circleGeometry args={[0.22, 32]} />
        <meshBasicMaterial
          color={isHovered ? '#FFFFFF' : '#F8FAFC'}
          transparent
          opacity={isHovered ? 1 : 0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Circle border */}
      <mesh>
        <ringGeometry args={[0.2, 0.22, 32]} />
        <meshBasicMaterial
          color={isHovered ? '#33B5FF' : '#0099FF'}
          transparent
          opacity={isHovered ? 1 : 0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Sprite text — show month + title */}
      {canvasTex && (
        <sprite
          ref={textRef}
          scale={[1.2, 0.6, 1]}
          position={[0, -0.5, 0]}
        >
          <spriteMaterial map={canvasTex} transparent depthTest={false} />
        </sprite>
      )}
    </group>
  );
}
