import { Skeleton } from "@/components/ui/skeleton";

export function EditorSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="mb-6 h-10 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-[460px] w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
