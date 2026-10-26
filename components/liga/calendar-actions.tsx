"use client";

import { useState } from "react";
import { CalendarPlus, Copy } from "lucide-react";

type CalendarSubscriptionProps = {
  href: string;
  label?: string;
};

export function CalendarSubscription({
  href,
  label = "Suscribirse al calendario",
}: CalendarSubscriptionProps) {
  const [copyStatus, setCopyStatus] = useState("");
  const subscriptionHref = href.startsWith("https://")
    ? `webcal://${href.slice("https://".length)}`
    : href;
  const feedHref = href.startsWith("webcal://")
    ? `https://${href.slice("webcal://".length)}`
    : href;

  async function copyFeedUrl() {
    let copied = false;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(feedHref);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (!copied) {
      const textArea = document.createElement("textarea");
      textArea.value = feedHref;
      textArea.setAttribute("readonly", "");
      textArea.setAttribute("aria-hidden", "true");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      }
      document.body.removeChild(textArea);
    }

    setCopyStatus(
      copied
        ? "Enlace HTTPS copiado. Pegalo en tu aplicación de calendario."
        : "No se pudo copiar el enlace HTTPS. Intentá nuevamente.",
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={subscriptionHref}
        aria-label={label}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--color-primary)]/35 bg-[color:var(--color-primary)]/10 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-primary)] transition-colors hover:bg-[color:var(--color-primary)] hover:text-[color:var(--color-primary-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)]"
      >
        <CalendarPlus size={13} aria-hidden="true" />
        {label}
      </a>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={copyFeedUrl}
          aria-label="Copiar enlace HTTPS del calendario"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--color-border)]/35 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-foreground-muted)] transition-colors hover:border-[color:var(--color-primary)]/50 hover:text-[color:var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)]"
        >
          <Copy size={13} aria-hidden="true" />
          Copiar enlace HTTPS
        </button>
        <span role="status" aria-live="polite" className="sr-only">
          {copyStatus}
        </span>
      </div>
    </div>
  );
}
