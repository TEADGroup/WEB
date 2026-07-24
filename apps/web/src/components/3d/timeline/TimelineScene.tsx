'use client';

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useTimelineProjects, build2DTimelinePath } from './TimelineData';
import { TimelinePathSVG } from './TimelinePathSVG';
import { ProjectCard } from './ProjectCard';
import type { FeaturedProject } from './TimelineData';

interface TimelineSceneProps {
  onHoveredProject?: (p: FeaturedProject | null) => void;
}

export function TimelineScene({ onHoveredProject }: TimelineSceneProps) {
  const { projects } = useTimelineProjects();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // ─── Pan & Zoom state ───
  const [zoom, setZoom] = useState(0.6);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  // ─── Entrance state ───
  const [entered, setEntered] = useState(false);

  // ─── Continuous float offset (works at any zoom) ───
  const floatOffsets = useRef<{ y: number }[]>([]);
  const [floatCycle, setFloatCycle] = useState(0);

  const timeline = useMemo(
    () => build2DTimelinePath(projects),
    [projects],
  );

  const hoveredProject = useMemo(
    () => projects.find((p) => p.id === hoveredId) ?? null,
    [hoveredId, projects],
  );
  useEffect(() => { onHoveredProject?.(hoveredProject); }, [hoveredProject, onHoveredProject]);

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  // ─── Pan handlers ───
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
    e.preventDefault();
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ─── Wheel zoom — chỉ zoom khi nhấn Ctrl, không chặn scroll web ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      // Zoom on Ctrl+Wheel only — doesn't block normal scrolling
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoom((prev) => Math.max(0.2, Math.min(2.5, prev + delta)));
    };

    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // ─── Intersection Observer for entrance ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el || entered) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [entered]);

  // ─── Continuous float animation ───
  useEffect(() => {
    const nodes = timeline.nodes;
    if (!nodes.length) return;

    // Init random offsets for each card
    if (floatOffsets.current.length !== nodes.length) {
      floatOffsets.current = nodes.map(() => ({
        y: Math.random() * 8 + 3, // random amplitude 3-11px
      }));
    }

    let frameId: number;
    let start = performance.now();
    const animate = (now: number) => {
      const t = (now - start) / 1000;
      // Cycle through 0→2π every ~4 seconds
      setFloatCycle(Math.sin(t * 1.5));
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [timeline.nodes.length]);

  if (!projects.length || !timeline.nodes.length) return null;

  const { nodes, years, pathD, totalWidth, totalHeight } = timeline;

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none cursor-grab active:cursor-grabbing overflow-hidden rounded-2xl"
      style={{ minHeight: 550 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* ─── Premium glass zoom/pan controls ─── */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 backdrop-blur-xl border border-white/30 text-slate-700 text-lg font-bold shadow-lg shadow-slate-200/50 hover:bg-white hover:shadow-brand-blue/10 hover:border-brand-blue/20 transition-all duration-200 active:scale-95"
          title="Phóng to"
        >
          +
        </button>
        <div className="flex h-9 items-center justify-center rounded-xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg shadow-slate-200/50 px-2">
          <span className="text-xs font-bold text-slate-500 tabular-nums">{Math.round(zoom * 100)}%</span>
        </div>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.2, z - 0.15))}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 backdrop-blur-xl border border-white/30 text-slate-700 text-lg font-bold shadow-lg shadow-slate-200/50 hover:bg-white hover:shadow-brand-blue/10 hover:border-brand-blue/20 transition-all duration-200 active:scale-95"
          title="Thu nhỏ"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => { setZoom(0.6); setPan({ x: 0, y: 0 }); }}
          className="flex h-9 items-center justify-center rounded-xl bg-white/70 backdrop-blur-xl border border-white/30 text-slate-600 text-xs font-semibold shadow-lg shadow-slate-200/50 hover:bg-white hover:shadow-brand-blue/10 hover:border-brand-blue/20 transition-all duration-200 active:scale-95 px-3"
          title="Reset"
        >
          <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
          Reset
        </button>
      </div>

      {/* ─── Canvas ─── */}
      <div
        className="relative origin-top-left"
        style={{
          width: totalWidth,
          height: totalHeight,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* SVG path */}
        <TimelinePathSVG
          nodes={nodes}
          years={years}
          pathD={pathD}
          totalWidth={totalWidth}
          totalHeight={totalHeight}
          hoveredId={hoveredId}
          onHover={handleHover}
        />

        {/* Cards with stagger entrance + continuous float */}
        {nodes.map((node, i) => {
          const delay = entered ? i * 60 : 600;
          const amplitude = floatOffsets.current[i]?.y ?? 5;
          const floatY = entered ? Math.sin(floatCycle * 1.3 + i * 1.7) * amplitude : 0;
          const entranceY = entered ? 0 : (node.side === 'top' ? -30 : 30);

          return (
            <div
              key={`card-${node.project.id}`}
              className="absolute"
              style={{
                left: node.cardX,
                top: node.cardY,
                width: 280,
                opacity: entered ? 1 : 0,
                transform: `translateY(${entranceY + floatY}px)`,
                transition: entered
                  ? 'none'
                  : `
                    opacity 0.6s ease-out ${delay}ms,
                    transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms
                  `,
                pointerEvents: entered ? 'auto' : 'none',
              }}
            >
              <ProjectCard
                project={node.project}
                side={node.side}
              />
            </div>
          );
        })}
      </div>

      {/* ─── Floating hint ─── */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-slate-900/60 backdrop-blur-md px-5 py-2 text-xs text-white/60 pointer-events-none whitespace-nowrap border border-white/10 shadow-xl transition-opacity duration-700"
        style={{ opacity: entered ? 0.7 : 0 }}
      >
        🖱 Kéo để di chuyển · Ctrl + Lăn chuột để phóng to/thu nhỏ
      </div>
    </div>
  );
}
