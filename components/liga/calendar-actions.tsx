"use client";

import { useId, useRef, useState } from "react";
import { CalendarPlus, Check, Copy, X } from "lucide-react";

type CalendarSubscriptionProps = {
  href: string;
  label?: string;
};

export function CalendarSubscription({
  href,
  label = "Suscribirse al calendario",
}: CalendarSubscriptionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const instructionsId = `${useId()}-calendar-instructions`;

  async function copyFeedUrl() {
    let didCopy = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(href);
        didCopy = true;
      }
    } catch {
      didCopy = false;
    }

    if (!didCopy) {
      const previousFocus = document.activeElement;
      const textArea = document.createElement("textarea");
      textArea.value = href;
      textArea.setAttribute("readonly", "");
      textArea.setAttribute("aria-hidden", "true");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      (panelRef.current ?? document.body).appendChild(textArea);
      textArea.select();
      try {
        didCopy = document.execCommand("copy");
      } catch {
        didCopy = false;
      }
      textArea.remove();
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus({ preventScroll: true });
      }
    }

    setCopied(didCopy);
    setCopyError(!didCopy);
  }

  return (
    <div className="min-w-0">
      <button
        type="button"
        popoverTarget={instructionsId}
        aria-expanded={isOpen}
        aria-controls={instructionsId}
        aria-label={label}
        className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border border-[color:var(--color-primary)]/35 bg-[color:var(--color-primary)]/10 px-3.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-primary)] transition-colors hover:bg-[color:var(--color-primary)] hover:text-[color:var(--color-primary-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)]"
      >
        <CalendarPlus size={13} aria-hidden="true" />
        {label}
      </button>
      <div
        ref={panelRef}
        id={instructionsId}
        popover="auto"
        role="dialog"
        aria-labelledby={instructionsId + "-title"}
        aria-describedby={instructionsId + "-description"}
        onToggle={(event) => {
          const open = event.newState === "open";
          setIsOpen(open);
          if (!open) {
            setCopied(false);
            setCopyError(false);
          }
        }}
        className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-3xl border border-b-0 border-[color:var(--color-border)]/40 bg-[color:var(--color-background)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-left text-[color:var(--color-foreground)] shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop:bg-black/60 animate-in fade-in slide-in-from-bottom-8 duration-200 motion-reduce:animate-none sm:inset-0 sm:m-auto sm:h-fit sm:max-w-md sm:rounded-3xl sm:border-b sm:pb-5 sm:shadow-2xl sm:slide-in-from-bottom-0 sm:zoom-in-95"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              id={instructionsId + "-title"}
              className="font-serif text-xl font-bold leading-tight"
            >
              Agrega el calendario
            </h3>
            <p
              id={instructionsId + "-description"}
              className="mt-1 text-sm leading-5 text-[color:var(--color-foreground-muted)]"
            >
              Copia este enlace y pegalo en tu app de calendario como
              suscripción.
            </p>
          </div>
          <button
            type="button"
            popoverTarget={instructionsId}
            popoverTargetAction="hide"
            aria-label="Cerrar"
            className="-mr-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[color:var(--color-foreground-muted)] transition-colors hover:bg-[color:var(--color-muted)]/30 hover:text-[color:var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4 rounded-2xl border border-[color:var(--color-border)]/30 bg-[color:var(--color-muted)]/20 p-3">
          <code className="block select-all break-all font-mono text-xs leading-5 text-[color:var(--color-foreground)]/85">
            {href}
          </code>
          <button
            type="button"
            onClick={copyFeedUrl}
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--color-primary)] px-4 py-2 text-sm font-semibold text-[color:var(--color-primary-foreground)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)]"
          >
            {copied ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <Copy size={16} aria-hidden="true" />
            )}
            {copied ? "Enlace copiado" : "Copiar enlace"}
          </button>
        </div>
        <p className="mt-4 text-xs leading-5 text-[color:var(--color-foreground-muted)]">

         El calendario se actualiza automáticamente cuando cambian los partidos.
        </p>
        <span
          role="status"
          className="mt-1 block min-h-5 text-xs text-[color:var(--color-foreground)]"
        >
          {copied
            ? "Enlace copiado."
            : copyError
              ? "No se pudo copiar. Mantené presionado el enlace para copiarlo."
              : ""}
        </span>
      </div>
    </div>
  );
}
