import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
export function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-label="Chargement du tableau de bord">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-5 h-8 w-24" />
            <Skeleton className="mt-3 h-3 w-36" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
        <Card className="p-5">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="mt-5 h-52 w-full" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-4 w-36" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="mt-5 h-9 w-full" />
          ))}
        </Card>
      </div>
      <Card className="p-5">
        <Skeleton className="h-4 w-48" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="mt-4 h-10 w-full" />
        ))}
      </Card>
    </div>
  );
}
