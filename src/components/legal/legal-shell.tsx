import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared chrome for the public legal pages (/termos, /privacidade).
 * Plain server component — static content, no auth, readable column.
 */
export function LegalShell({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <Link
          href="/"
          className="text-sm text-primary transition-colors hover:text-primary/80"
        >
          ← Voltar
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: {updated}
        </p>
        {intro ? (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {intro}
          </p>
        ) : null}

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>

        <footer className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          <Link href="/termos" className="text-primary hover:text-primary/80">
            Termos de Uso
          </Link>
          <span className="mx-2">·</span>
          <Link
            href="/privacidade"
            className="text-primary hover:text-primary/80"
          >
            Política de Privacidade
          </Link>
        </footer>
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
