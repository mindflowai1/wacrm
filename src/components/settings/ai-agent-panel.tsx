"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bot, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SettingsPanelHead } from "./settings-panel-head";

/**
 * AI customer-service master switch (account-wide).
 *
 * Flips `accounts.ai_agent_enabled` (migration 024). When on, the
 * webhook forwards inbound messages to the configured AI agent (n8n)
 * for an automated reply; when off, messages only land in the inbox.
 *
 * Writes go straight to `accounts` via the RLS-scoped client — the
 * `accounts_update` policy (017) already restricts that to admins+, so
 * non-admins see a disabled, read-only switch. Mirrors DealsSettings.
 */
export function AiAgentPanel() {
  const supabase = createClient();
  const { accountId, account, canEditSettings, profileLoading, refreshProfile } =
    useAuth();

  const enabled = account?.ai_agent_enabled ?? false;
  const [saving, setSaving] = useState(false);

  async function handleToggle(next: boolean) {
    if (!accountId || saving) return;
    setSaving(true);
    const { error } = await supabase
      .from("accounts")
      .update({ ai_agent_enabled: next })
      .eq("id", accountId);
    if (error) {
      toast.error("Falha ao atualizar o atendimento por IA");
      setSaving(false);
      return;
    }
    // Pull the new value back into the auth context so the switch and
    // any consumer reflect it without a full reload.
    await refreshProfile();
    setSaving(false);
    toast.success(
      next ? "Atendimento por IA ativado" : "Atendimento por IA desativado",
    );
  }

  return (
    <section className="max-w-2xl animate-in fade-in-50 duration-200">
      <SettingsPanelHead
        title="Atendimento por IA"
        description="Quando ativado, as mensagens recebidas são encaminhadas ao seu fluxo de IA (n8n) para resposta automática. Desligue a qualquer momento para atender manualmente."
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Bot className="size-4 text-primary" />
            Bot de atendimento
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Liga ou desliga o encaminhamento das conversas para a IA. Não
            afeta o envio manual pelo inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/40 px-4 py-3">
            <div className="min-w-0">
              <Label className="text-foreground">
                {enabled ? "Ativado" : "Desativado"}
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {enabled
                  ? "A IA responde automaticamente as novas mensagens."
                  : "As mensagens ficam só no inbox, sem resposta automática."}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {saving ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : null}
              <Switch
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={!canEditSettings || profileLoading || saving}
                aria-label="Ativar atendimento por IA"
              />
            </div>
          </div>
          {!canEditSettings ? (
            <p className="text-xs text-muted-foreground">
              Apenas administradores da conta podem alterar isto.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
