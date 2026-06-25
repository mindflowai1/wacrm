"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
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

/**
 * Password-reset landing page.
 *
 * Deliberately pre-fetch-proof: the recovery email links straight here
 * with `?token_hash=…&type=recovery` (set in the Supabase "Reset
 * Password" email template), and we DON'T touch the token on load. The
 * one-time token is read from the URL and spent only on form submit —
 * `verifyOtp` opens the recovery session, then `updateUser` sets the
 * new password.
 *
 * Why not the older `?code=` + `/auth/callback` exchange: Gmail and
 * other mail scanners pre-open links to check them, which consumed the
 * single-use code before the user ever clicked (the `auth_expired`
 * bounce). A scanner can't submit a form, so deferring consumption to
 * submit fixes it. `verifyOtp` with a token_hash also needs no PKCE
 * verifier cookie, so the link works from any browser or device.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Read the one-time token from the URL at submit time (never on
    // load) so a link pre-opened by a mail scanner doesn't burn it.
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const otpType = (params.get("type") as EmailOtpType) || "recovery";

    if (!tokenHash) {
      setError("Link inválido. Solicite um novo link de redefinição.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`A senha deve ter pelo menos ${MIN_PASSWORD} caracteres`);
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    // Spend the token now (not on page load) to open the recovery
    // session.
    const { error: otpError } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    });
    if (otpError) {
      setError(
        "Este link expirou ou já foi usado. Solicite um novo link de redefinição.",
      );
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.replace("/dashboard"), 1500);
  };

  // ----- Password updated -----
  if (success) {
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

  // ----- Form -----
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
