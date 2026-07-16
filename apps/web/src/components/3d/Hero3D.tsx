'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Scene is client-only (R3F touches window); import dynamically with ssr:false.
// This dynamic() call is allowed because Hero3D itself is a Client Component
// (Next 15 forbids ssr:false inside a Server Component).
const Scene = dynamic(() => import('./Scene').then((m) => m.Scene), {
  ssr: false,
  loading: () => <HeroPoster />,
});

/** Static placeholder shown before hydration / when WebGL is off / reduced motion. */
function HeroPoster() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 grid place-items-center"
      style={{
        background:
          'radial-gradient(circle at 60% 40%, rgba(0,153,255,0.25), transparent 60%)',
      }}
    />
  );
}

/**
 * 3D hero mount point. Renders the live R3F scene unless the user prefers
 * reduced motion (or JS/WebGL is unavailable), in which case a static poster
 * is shown for comfort and performance.
 */
export function Hero3D() {
  const [mounted, setMounted] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!mounted || reduce) return <HeroPoster />;
  return (
    <div className="pointer-events-none absolute inset-0 -z-0">
      <Scene />
    </div>
  );
}
