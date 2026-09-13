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
        <div className="md:hidden px-4 py-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <section className="pt-28 md:pt-20 pb-4 px-4 md:px-8">
        <div className="container mx-auto">
          <div className="flex flex-col items-center text-center mb-6">
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-14 w-72 mb-2" />
            <Skeleton className="h-4 w-96 mt-3" />
          </div>
        </div>
      </section>

      {/* Tabs + content skeleton */}
      <section className="px-4 md:px-8 pb-12">
        <div className="container mx-auto max-w-4xl mx-auto">
          <Skeleton className="h-10 w-80 rounded-full mb-4" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </section>
    </main>
  )
}
