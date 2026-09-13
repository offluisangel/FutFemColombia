import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <main className="min-h-screen bg-[color:var(--color-background)]">
      {/* Header placeholder */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[color:var(--color-background)]/95 backdrop-blur-sm border-b border-[color:var(--color-border)]/25">
        <div className="hidden md:flex items-center gap-6 px-6 py-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-28 md:pt-20 pb-8 space-y-8">
        {/* Hero card */}
        <Skeleton className="h-48 w-full rounded-2xl" />
        {/* Description card */}
        <Skeleton className="h-20 w-full rounded-2xl" />
        {/* Stats grid */}
        <Skeleton className="h-32 w-full rounded-2xl" />
        {/* Two-column results + upcoming */}
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </main>
  )
}
