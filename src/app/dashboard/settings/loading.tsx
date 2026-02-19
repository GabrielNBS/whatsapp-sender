import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Skeleton className="h-8 w-48" />

      {/* Settings Sections */}
      {[1, 2].map((section) => (
        <div key={section} className="rounded-xl border bg-card p-6 space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-64" />
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
      ))}
    </div>
  );
}
