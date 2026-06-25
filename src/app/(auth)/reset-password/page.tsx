"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, CheckCircle, Loader2, ArrowLeft } from "lucide-react";

// Mirror the minimum enforced in settings → password-form.tsx so the
// rule is the same wherever a password is set.
const MIN_PASSWORD = 8;

type Phase = "checking" | "ready" | "invalid" | "success";

/**
 * Password-reset landing page.
 *
 * The recovery email (default Supabase template) links here via
 * `resetPasswordForEmail({ redirectTo: '/reset-password' })`. The
 * browser Supabase client processes the recovery `?code=` on load
 * (detectSessionInUrl) using the PKCE verifier from browser storage and
 * fires a session. We do this on the CLIENT — not a server route —
 * because the verifier cookie's SameSite can keep it from reaching the
 * server, which is what made the earlier `/auth/callback` exchange
 * bounce with `auth_expired`. Client-side JS reads the verifier
 * regardless, so this just works with no SMTP / template changes.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION / PASSWORD_RECOVERY once
    // the URL is processed; getSession covers a session that landed
    // before the listener attached. All setState here runs in async
    // callbacks (never synchronously in the effect body).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setPhase((p) => (p === "checking" ? "ready" : p));
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPhase((p) => (p === "checking" ? "ready" : p));
    });

    // No session within a few seconds → the link is bad or already used.
    const timer = setTimeout(() => {
      setPhase((p) => (p === "checking" ? "invalid" : p));
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD) {
      setError(`A senha deve ter pelo menos ${MIN_PASSWORD} caracteres`);
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setPhase("success");
    setLoading(false);
    setTimeout(() => router.replace("/dashboard"), 1500);
  };

  // ----- Establishing the recovery session -----
  if (phase === "checking") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Validando o link…</p>
      </div>
    );
  }

  // ----- No valid recovery session -----
  if (phase === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
              <MessageSquare className="h-6 w-6 text-red-400" />
            </div>
            <CardTitle className="text-xl text-foreground">
              Link inválido ou expirado
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Este link de redefinição não é mais válido. Solicite um novo
              para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/forgot-password">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Solicitar novo link
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ----- Password updated -----
  if (phase === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl text-foreground">
              Senha redefinida
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Pronto! Estamos te levando para o painel...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ----- Form (phase === "ready") -----
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl text-foreground">Nova senha</CardTitle>
          <CardDescription className="text-muted-foreground">
            Escolha uma nova senha para sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-muted-foreground">
                Nova senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Pelo menos 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={MIN_PASSWORD}
                required
                className="border-border bg-muted text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm" className="text-muted-foreground">
                Confirme a nova senha
              </Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Repita a senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={MIN_PASSWORD}
                required
                className="border-border bg-muted text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar nova senha"
              )}
            </Button>
          </form>

          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
