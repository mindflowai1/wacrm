"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditCard, Loader2, CheckCircle2, AlertCircle, Gift } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SettingsPanelHead } from "./settings-panel-head";
import { isSubscriptionActive } from "@/lib/stripe/subscription";

interface SubRow {
  status: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  manual_access: boolean | null;
}

export function BillingPanel() {
  const supabase = createClient();
  const { accountId, canEditSettings } = useAuth();

  const [sub, setSub] = useState<SubRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("account_subscriptions")
        .select("status, current_period_end, stripe_customer_id, manual_access")
        .eq("account_id", accountId)
        .maybeSingle();
      if (!cancelled) {
        setSub((data as SubRow | null) ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId, supabase]);

  const comp = sub?.manual_access === true;
  const subActive = isSubscriptionActive(sub?.status);

  async function go(path: string, kind: "checkout" | "portal") {
    setBusy(kind);
    try {
      const res = await fetch(path, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.url) {
        toast.error(json.error || "Falha ao abrir a Stripe");
        setBusy(null);
        return;
      }
      window.location.href = json.url;
    } catch {
      toast.error("Falha ao conectar com a Stripe");
      setBusy(null);
    }
  }

  const periodLabel = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("pt-BR")
    : null;

  return (
    <section className="max-w-2xl animate-in fade-in-50 duration-200">
      <SettingsPanelHead
        title="Assinatura"
        description="Gerencie o plano e o pagamento da sua conta. O pagamento é processado com segurança pela Stripe."
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CreditCard className="size-4 text-primary" />
            Plano
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Assine para liberar o acesso, ou gerencie a assinatura
            existente (trocar cartão, ver faturas, cancelar).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <>
              {/* Status */}
              <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
                {comp ? (
                  <>
                    <Gift className="size-4 text-primary" />
                    <span className="text-foreground">
                      Acesso de cortesia liberado
                    </span>
                  </>
                ) : subActive ? (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span className="text-foreground">
                      Assinatura ativa
                      {periodLabel ? (
                        <span className="text-muted-foreground">
                          {" "}
                          · renova em {periodLabel}
                        </span>
                      ) : null}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-4 text-amber-500" />
                    <span className="text-foreground">
                      {sub?.status === "past_due"
                        ? "Pagamento pendente"
                        : "Sem assinatura ativa"}
                    </span>
                  </>
                )}
              </div>

              {canEditSettings ? (
                <div className="flex flex-wrap gap-2">
                  {!subActive && (
                    <Button
                      onClick={() => go("/api/billing/checkout", "checkout")}
                      disabled={busy !== null}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {busy === "checkout" ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Abrindo...
                        </>
                      ) : (
                        "Assinar"
                      )}
                    </Button>
                  )}
                  {sub?.stripe_customer_id && (
                    <Button
                      variant="outline"
                      onClick={() => go("/api/billing/portal", "portal")}
                      disabled={busy !== null}
                      className="border-border text-foreground hover:bg-muted"
                    >
                      {busy === "portal" ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Abrindo...
                        </>
                      ) : (
                        "Gerenciar assinatura"
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Apenas administradores da conta podem gerenciar a
                  assinatura.
                </p>
              )}

              {comp && !subActive ? (
                <p className="text-xs text-muted-foreground">
                  Sua conta está liberada manualmente — não é necessário
                  assinar.
                </p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
