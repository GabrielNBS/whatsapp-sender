import { Skeleton } from "@/components/ui/skeleton";

export function SendPageSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-muted/30 -m-6 p-6 overflow-hidden">
      {/* Header Compact */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div>
          <Skeleton className="h-7 w-48 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-40 rounded-full" />
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* WIZARD CONTAINER (Left + Center merged) */}
        <div className="col-span-12 lg:col-span-9 flex flex-col min-h-0">
          <div className="bg-card rounded-xl shadow-lg border border-border flex flex-col h-full overflow-hidden relative">
            {/* Top Bar with Step Indicator */}
            <div className="pt-6 pb-2 px-6 border-b border-border/50 bg-background/50 backdrop-blur-sm z-10">
              <div className="flex justify-between items-center max-w-3xl mx-auto w-full">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex flex-col items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
                <div className="w-full max-w-xl space-y-4 mt-8">
                     <Skeleton className="h-12 w-full rounded-lg" />
                     <Skeleton className="h-12 w-full rounded-lg" />
                     <Skeleton className="h-12 w-full rounded-lg" />
                </div>
            </div>

            {/* Bottom Navigation Bar */}
            <div className="p-6 pt-2 bg-background/50 backdrop-blur-sm z-10 flex justify-between">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>

        {/* RIGHT COL: LOGS (Span 3) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 min-h-0 overflow-hidden">
          <div className="bg-card rounded-xl shadow-lg border border-border flex flex-col min-h-0 flex-1 overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-12" />
            </div>

             {/* Monitor Panel */}
             <div className="p-4 border-b border-border bg-background/50 space-y-3">
                 <Skeleton className="h-16 w-full rounded-md" />
                 <Skeleton className="h-8 w-full rounded-md" />
             </div>

            <div className="p-4 space-y-3 flex-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3 items-start">
                  <Skeleton className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
