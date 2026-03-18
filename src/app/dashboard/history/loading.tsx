import { Skeleton } from '@/components/ui/skeleton';

export default function HistoryLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      {/* Campaign Rows */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center justify-between gap-3">
              {/* Left: icon + info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-52" />
                </div>
              </div>

              {/* Center: quick metrics */}
              <div className="hidden sm:flex items-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-4 w-6" />
                </div>
              </div>

              {/* Right: progress bar + arrow */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-24 hidden md:block space-y-1">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
                <Skeleton className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  );
}
