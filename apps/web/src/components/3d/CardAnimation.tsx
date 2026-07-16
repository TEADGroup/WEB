'use client';

import { useRef, useEffect } from 'react';

const THEMES = [
  // 0 — circuit board signals
  {
    draw(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
      ctx.strokeStyle = '#0099FF';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const x = (i / 5) * w;
        const yy = h / 2 + Math.sin(t * 1.2 + i * 1.1) * h * 0.32;
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(x, yy);
        ctx.lineTo(x + 50, yy + Math.cos(t * 0.9 + i * 0.7) * 20);
        ctx.stroke();
      }
    },
  },
  // 1 — pulsing rings
  {
    draw(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
      const cx = w / 2, cy = h / 2;
      for (let r = 0; r < 4; r++) {
        const rad = 30 + r * 25 + Math.sin(t * 0.8 + r) * 12;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${200 + r * 40}, 80%, 55%, ${0.15 + (1 - r / 4) * 0.25})`;
        ctx.lineWidth = 2 - r * 0.3;
        ctx.stroke();
      }
    },
  },
  // 2 — gear / cog rotating
  {
    draw(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
      const cx = w / 2, cy = h / 2, R = 42, r = 18, n = 8;
      ctx.strokeStyle = '#0099FF';
      ctx.lineWidth = 3;
      for (let rot = 0; rot < Math.PI * 2; rot += (Math.PI * 2) / n) {
        const a = rot + t * 0.6;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    },
  },
  // 3 — waves / signal
  {
    draw(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
      ctx.strokeStyle = '#00A651';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x < w; x += 3) {
        const y = h / 2 + Math.sin(x * 0.04 + t * 2) * 20 + Math.sin(x * 0.08 + t * 1.3) * 12;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
  },
  // 4 — moving dots (data flow)
  {
    draw(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
      for (let i = 0; i < 18; i++) {
        const x = ((t * 60 + i * 70) % w);
        const y = h / 2 + Math.sin(x * 0.03 + i) * 28;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${210 + i * 12}, 80%, ${50 + (i % 3) * 15}%)`;
        ctx.fill();
      }
    },
  },
];

interface Props {
  themeIndex: number;
  className?: string;
}

export function CardAnimation({ themeIndex, className = '' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null!);
  const idx = themeIndex % THEMES.length;

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d')!;
    let animId = 0;
    const resize = () => { cvs.width = cvs.clientWidth; cvs.height = cvs.clientHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cvs);

    const start = performance.now();
    const loop = () => {
      const t = (performance.now() - start) / 1000;
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      THEMES[idx].draw(ctx, t, cvs.width, cvs.height);
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, [idx]);

  return <canvas ref={ref} className={`block w-full h-full ${className}`} />;
}
