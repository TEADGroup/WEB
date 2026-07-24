/**
 * Route-level loading skeleton.
 * Hiển thị ngay khi SSR streaming bắt đầu, giúp user thấy trang đang load
 * thay vì màn hình trắng trong ~5-6 giây.
 */
export default function Loading() {
  return (
    <div
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8"
      aria-label="Page loading"
    >
      {/* Hero skeleton */}
      <div className="flex min-h-[60vh] flex-col justify-center gap-6">
        <div className="h-16 w-64 animate-pulse rounded-lg bg-slate-200/60" />
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200/50" />
        <div className="h-12 w-full max-w-xl animate-pulse rounded bg-slate-200/40" />
        <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200/50" />
      </div>

      {/* Section skeleton */}
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-2xl bg-slate-100/60"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
