import { Skeleton } from '@/components/ui/skeleton';

export default function ContactsLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] -m-6 p-6 space-y-4 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Tabs + Actions */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex gap-1">
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 rounded-lg border bg-white overflow-hidden">
        {/* Table Header */}
        <div className="flex gap-4 p-4 bg-muted/30 border-b">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Table Rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border/50">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2 items-center">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
