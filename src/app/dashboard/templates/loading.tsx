import { Skeleton } from '@/components/ui/skeleton';

export default function TemplatesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-14 w-40 rounded-full" />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>

      {/* Template Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-[20px] border-0 bg-white shadow-sm overflow-hidden">
            {/* Image placeholder */}
            <Skeleton className="w-full h-48" />

            <div className="p-4 space-y-4">
              {/* Header: Icon + Title */}
              <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>

              {/* Message preview */}
              <Skeleton className="h-16 w-full rounded-2xl" />

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
