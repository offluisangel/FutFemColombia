import { CalendarPlus } from "lucide-react";

type CalendarSubscriptionProps = {
  href: string;
  label?: string;
};

export function CalendarSubscription({
  href,
  label = "Suscribirse al calendario",
}: CalendarSubscriptionProps) {
  const subscriptionHref = href.startsWith("https://")
    ? `webcal://${href.slice("https://".length)}`
    : href;

  return (
    <a
      href={subscriptionHref}
      aria-label={label}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--color-primary)]/35 bg-[color:var(--color-primary)]/10 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-primary)] transition-colors hover:bg-[color:var(--color-primary)] hover:text-[color:var(--color-primary-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)]"
    >
      <CalendarPlus size={13} aria-hidden="true" />
      {label}
    </a>
  );
}
