"use client"

type TeamShieldProps = {
  teamName: string
  shieldUrl?: string
  sizeClassName?: string
  tone?: "primary" | "muted"
}

export function TeamShield({
  teamName,
  shieldUrl,
  sizeClassName = "h-10 w-10",
  tone = "primary",
}: TeamShieldProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${sizeClassName}`}
    >
      {shieldUrl ? (
        <img
          src={shieldUrl}
          alt={teamName}
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : (
        <span
          className={`font-serif font-bold ${
            tone === "primary"
              ? "text-[color:var(--color-primary)]"
              : "text-[color:var(--color-foreground)]/80"
          }`}
        >
          {teamName.charAt(0)}
        </span>
      )}
    </span>
  )
}
