'use client';

import { useRef, useState, useEffect } from 'react';

interface VideoBackgroundProps {
  /** Đường dẫn đến file video (trong public/videos/) */
  src: string;
  /** Fallback image hiển thị khi video chưa load */
  poster?: string;
  /** Hiển thị gradient overlay? */
  overlay?: boolean;
  /** Màu overlay gradient (hai màu, từ trái sang phải) */
  overlayColors?: [string, string];
  /** Opacity của video (0-1) */
  opacity?: number;
  /** CSS blend mode */
  blendMode?: 'overlay' | 'screen' | 'multiply' | 'normal';
  /** object-fit */
  fit?: 'cover' | 'contain';
  /** Class name bổ sung */
  className?: string;
}

/**
 * VideoBackground — component video nền chuẩn cho mọi section.
 *
 * Tính năng:
 * - Lazy load video (chỉ load khi vào viewport)
 * - Poster fallback khi chưa load
 * - Gradient overlay
 * - Blend mode
 * - Opacity control
 *
 * Usage:
 *   <VideoBackground src="/videos/hero-factory.mp4" poster="/videos/hero-factory-poster.jpg" />
 */
export function VideoBackground({
  src,
  poster,
  overlay = true,
  overlayColors = ['#0A1626', 'transparent'],
  opacity = 0.35,
  blendMode = 'overlay',
  fit = 'cover',
  className = '',
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [hasError, setHasError] = useState(false);

  /* ── IntersectionObserver: chỉ load video khi vào viewport ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }, // Load trước 200px khi sắp vào viewport
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  /* ── Play video khi đã load ── */
  useEffect(() => {
    if (!shouldLoad || !videoRef.current || hasError) return;
    videoRef.current.play().catch(() => setHasError(true));
  }, [shouldLoad, hasError]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Video layer */}
      {shouldLoad && !hasError ? (
        <video
          ref={videoRef}
          className={`h-full w-full object-${fit}`}
          style={{ opacity }}
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        /* Fallback: gradient nếu video chưa load hoặc lỗi */
        <div
          className="h-full w-full"
          style={{
            background: `linear-gradient(135deg, ${overlayColors[0]}22, ${overlayColors[1]}11)`,
          }}
        />
      )}

      {/* Gradient overlay */}
      {overlay && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${overlayColors[0]} 0%, ${overlayColors[1]} 50%, ${overlayColors[0]} 100%)`,
            mixBlendMode: blendMode,
          }}
        />
      )}
    </div>
  );
}
