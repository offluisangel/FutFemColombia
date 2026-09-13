export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="w-full space-y-6">
        <div className="space-y-2">
          <div className="h-3 w-44 animate-pulse rounded-full bg-[color:var(--color-primary)]/25" />
          <div className="h-9 max-w-full w-72 animate-pulse rounded-xl bg-[color:var(--color-card)]/70" />
          <div className="h-4 max-w-full w-96 animate-pulse rounded-xl bg-[color:var(--color-card)]/60" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[color:var(--color-border)]/35 bg-[color:var(--color-card)]/70 p-5"
            >
              <div className="h-3 w-24 animate-pulse rounded bg-[color:var(--color-muted)]" />
              <div className="mt-3 h-8 w-16 animate-pulse rounded bg-[color:var(--color-muted)]" />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[color:var(--color-border)]/35 bg-[color:var(--color-card)]/70 p-5">
          <div className="mb-4 h-5 w-52 animate-pulse rounded bg-[color:var(--color-muted)]" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-xl bg-[color:var(--color-muted)]/70"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
