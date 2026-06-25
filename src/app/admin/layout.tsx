import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck, ArrowLeft } from "lucide-react";

/**
 * Standalone shell for the platform-admin panel. Lives outside the
 * (dashboard) route group so it doesn't inherit the tenant sidebar/chrome
 * or the per-account AuthProvider. Access is gated in middleware to the
 * PLATFORM_ADMIN_EMAILS allow-list.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-sm font-semibold leading-tight">
                Painel Admin
              </h1>
              <p className="text-xs text-muted-foreground">
                Controle de plataforma
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
