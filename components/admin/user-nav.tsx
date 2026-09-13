"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function UserNav() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        setEmail(user?.email ?? null);
      });
  }, []);

  return (
    <div className="mt-auto border-t border-[color:var(--color-border)]/30 p-3">
      {email ? (
        <>
          <div className="mb-2 truncate rounded-lg border border-[color:var(--color-border)]/30 bg-[color:var(--color-card)]/45 px-3 py-2 font-mono text-[11px] text-[color:var(--color-foreground)]/70">
            {email}
          </div>
          <form action="/admin/logout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[color:var(--color-foreground)]/70 transition-colors hover:bg-[color:var(--color-card)]/50 hover:text-[color:var(--color-foreground)]"
            >
              <LogOut size={14} /> Cerrar sesión
            </button>
          </form>
          <Link
            href="/"
            className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[color:var(--color-foreground)]/60 transition-colors hover:bg-[color:var(--color-card)]/50 hover:text-[color:var(--color-foreground)]"
          >
            <Globe size={14} /> Sitio público
          </Link>
        </>
      ) : (
        <p className="px-1 font-mono text-xs text-[color:var(--color-foreground)]/55">
          Sesión no iniciada
        </p>
      )}
    </div>
  );
}
