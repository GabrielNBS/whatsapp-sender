import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function TemplatesLoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Card key={idx} className="overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-[20px] flex flex-col p-0 gap-0">
          {/* Media area skeleton */}
          <Skeleton className="w-full h-48 rounded-t-[20px]" />
          
          <CardContent className="p-4 flex-1 flex flex-col gap-4">
            {/* Header skeleton */}
            <div className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>

            {/* Content preview skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>

            {/* Actions skeleton */}
            <div className="flex items-center justify-between pt-2 mt-auto">
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
export default TemplatesLoadingSkeleton;
