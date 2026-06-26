import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardSkeletonProps {
  className?: string;
}

export function StatCardSkeleton({ className }: StatCardSkeletonProps) {
  return (
    <div className={cn('terminal-panel p-4 space-y-2', className)}>
      <Skeleton className="h-3 w-24 bg-muted" />
      <Skeleton className="h-6 w-32 bg-muted" />
      <Skeleton className="h-3 w-16 bg-muted" />
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3 border-b border-border/50">
          <Skeleton className="h-4 w-8 bg-muted shrink-0" />
          <Skeleton className="h-4 w-32 bg-muted" />
          <Skeleton className="h-4 w-20 bg-muted ml-auto" />
          <Skeleton className="h-4 w-16 bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function FeedItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2 border-b border-border/30">
      <Skeleton className="w-8 h-8 rounded-sm bg-muted shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <Skeleton className="h-3 w-32 bg-muted" />
        <Skeleton className="h-2.5 w-20 bg-muted" />
      </div>
      <Skeleton className="h-4 w-16 bg-muted shrink-0" />
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="w-full animate-pulse" style={{ height }}>
      <Skeleton className="w-full h-full bg-muted/50 rounded-sm" />
    </div>
  );
}
