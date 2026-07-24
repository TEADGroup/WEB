'use client';

import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface CurvedPathProps {
  curve: THREE.CatmullRomCurve3;
}

/**
 * Timeline path — line dạng cubic, màu tươi sáng, dễ nhìn.
 * Không dùng JSX <line> (conflict với SVG), build imperative.
 */
export function CurvedPath({ curve }: CurvedPathProps) {
  const groupRef = useRef<THREE.Group>(null!);

  /* Build all line objects imperatively */
  const objects = useMemo(() => {
    if (curve.points.length < 2) return null;

    const group = new THREE.Group();
    const pts = curve.getPoints(100);

    /* Main line — màu xanh sáng */
    const lineGeo1 = new THREE.BufferGeometry().setFromPoints(pts);
    const line1 = new THREE.Line(lineGeo1, new THREE.LineBasicMaterial({
      color: '#33B5FF',
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
    }));
    group.add(line1);

    /* Glow line — lớp mờ phía dưới */
    const line2 = new THREE.Line(lineGeo1, new THREE.LineBasicMaterial({
      color: '#0099FF',
      transparent: true,
      opacity: 0.2,
    }));
    group.add(line2);

    /* Dot dọc path */
    pts.forEach((pos, i) => {
      if (i % 4 !== 0) return;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 8, 8),
        new THREE.MeshBasicMaterial({ color: '#66CCFF', transparent: true, opacity: 0.7 }),
      );
      sphere.position.copy(pos);
      group.add(sphere);
    });

    return group;
  }, [curve]);

  useEffect(() => {
    if (!objects || !groupRef.current) return;
    groupRef.current.add(objects);
    return () => { groupRef.current.remove(objects); };
  }, [objects]);

  return <group ref={groupRef} />;
}
