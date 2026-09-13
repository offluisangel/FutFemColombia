"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AdminCard,
  AdminCardContent,
  AdminCardHeader,
} from "@/components/admin/admin-card";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.getUser();
    window.location.assign("/admin");
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] px-4 py-14">
      <div className="mx-auto max-w-md">
        <AdminCard>
          <AdminCardHeader
            title="Iniciar sesión"
            description="Acceso al panel administrador de Liga F."
          />
          <AdminCardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/65"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ligaf.co"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-[color:var(--color-foreground)]/65"
                >
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-[color:var(--color-destructive)]">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-full"
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </AdminCardContent>
        </AdminCard>
      </div>
    </div>
  );
}
