"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "@/components/admin/admin-nav";
import { UserNav } from "@/components/admin/user-nav";

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <Link
        href="/admin"
        onClick={onNavigate}
        className="border-b border-[color:var(--color-border)]/30 px-5 py-4"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-primary)]">
          Panel administrador
        </p>
        <p className="mt-1 font-serif text-xl font-black uppercase tracking-tight text-[color:var(--color-foreground)]">
          Admin Liga F
        </p>
      </Link>

      <nav className="flex-1 space-y-1 p-3">
        {ADMIN_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-[color:var(--color-primary)]/35 bg-[color:var(--color-primary)]/12 text-[color:var(--color-primary)]"
                  : "border-transparent text-[color:var(--color-foreground)]/70 hover:border-[color:var(--color-border)]/40 hover:bg-[color:var(--color-card)]/45 hover:text-[color:var(--color-foreground)]",
              )}
            >
              <item.icon
                size={16}
                className={cn(
                  active ? "" : "opacity-70 group-hover:opacity-100",
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <UserNav />
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-72 shrink-0 p-4 lg:block">
        <div className="h-full overflow-hidden rounded-2xl border border-[color:var(--color-border)]/35 bg-[color:var(--color-card)]/65 shadow-sm backdrop-blur-sm">
          <SidebarContent
            pathname={pathname}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-[color:var(--color-border)]/25 bg-[color:var(--color-background)]/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-primary)]">
              Panel administrador
            </p>
            <p className="font-serif text-xl font-black uppercase leading-none text-[color:var(--color-foreground)]">
              Admin Liga F
            </p>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="rounded-full" suppressHydrationWarning>
                <Menu size={18} />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[86vw] border-[color:var(--color-border)]/35 bg-[color:var(--color-background)] p-0"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Menú administrador</SheetTitle>
              </SheetHeader>
              <SidebarContent
                pathname={pathname}
                onNavigate={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}
