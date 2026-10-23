import { Skeleton } from '@/components/ui/skeleton'

export default function HabitsLoading() {
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">习惯打卡</h1>
          <p className="text-sm text-muted-foreground mt-1">坚持每一天</p>
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}
