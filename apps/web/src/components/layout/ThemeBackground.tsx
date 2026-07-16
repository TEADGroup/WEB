/**
 * Empty fixed layer behind everything (`-z-10`). The gradient itself lives on
 * <body> (CSS) and the variables are driven by <ThemeProvider> — this component
 * no longer holds theme state. Phase 2 will mount the particle/circuit canvas
 * inside this layer.
 */
export function ThemeBackground() {
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10" />;
}
