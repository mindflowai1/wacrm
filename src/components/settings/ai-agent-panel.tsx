"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bot, Loader2, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SettingsPanelHead } from "./settings-panel-head";

const PROMPT_PLACEHOLDER = `Ex.: Você é o atendente virtual da Loja X.
- Tom: cordial e objetivo, trate por "você".
- O que fazemos: ...
- Produtos / serviços: ...
- Horário de atendimento: ...
- Quando não souber responder, ofereça encaminhar para um humano.`;

/**
 * AI customer-service settings (account-wide).
 *
 * Two parts, both writing straight to `accounts` via the RLS-scoped
 * client (accounts_update / 017 restricts writes to admins+, so
 * non-admins get read-only controls):
 *   - master switch  → ai_agent_enabled (migration 024)
 *   - agent persona  → ai_agent_name + ai_system_prompt (migration 025),
 *     pushed to the n8n agent in the webhook forward so one generic
 *     workflow answers as each account's own assistant.
 */
export function AiAgentPanel() {
  const supabase = createClient();
  const { accountId, account, canEditSettings, profileLoading, refreshProfile } =
    useAuth();

  const enabled = account?.ai_agent_enabled ?? false;
  const [savingToggle, setSavingToggle] = useState(false);

  // Persona fields — local editable state, synced from the account.
  const [name, setName] = useState(account?.ai_agent_name ?? "");
  const [prompt, setPrompt] = useState(account?.ai_system_prompt ?? "");
  const [savingPersona, setSavingPersona] = useState(false);

  useEffect(() => {
    // Sync the editable form from the account once it resolves and after
    // a save round-trips through refreshProfile. Intentional state sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(account?.ai_agent_name ?? "");
    setPrompt(account?.ai_system_prompt ?? "");
  }, [account?.ai_agent_name, account?.ai_system_prompt]);

  const personaDirty =
    name !== (account?.ai_agent_name ?? "") ||
    prompt !== (account?.ai_system_prompt ?? "");

  const readOnly = !canEditSettings || profileLoading;

  async function handleToggle(next: boolean) {
    if (!accountId || savingToggle) return;
    setSavingToggle(true);
    const { error } = await supabase
      .from("accounts")
      .update({ ai_agent_enabled: next })
      .eq("id", accountId);
    if (error) {
      toast.error("Falha ao atualizar o atendimento por IA");
      setSavingToggle(false);
      return;
    }
    await refreshProfile();
    setSavingToggle(false);
    toast.success(
      next ? "Atendimento por IA ativado" : "Atendimento por IA desativado",
    );
  }

  async function handleSavePersona() {
    if (!accountId || !personaDirty || savingPersona) return;
    setSavingPersona(true);
    const { error } = await supabase
      .from("accounts")
      .update({
        ai_agent_name: name.trim() || null,
        ai_system_prompt: prompt.trim() || null,
      })
      .eq("id", accountId);
    if (error) {
      toast.error("Falha ao salvar a persona do agente");
      setSavingPersona(false);
      return;
    }
    await refreshProfile();
    setSavingPersona(false);
    toast.success("Persona do agente salva");
  }

  return (
    <section className="max-w-2xl space-y-4 animate-in fade-in-50 duration-200">
      <SettingsPanelHead
        title="Atendimento por IA"
        description="Ative o atendimento automático e defina a persona do agente. Quando ativo, as mensagens recebidas são respondidas pela IA — e você assume manualmente a qualquer momento pela inbox."
      />

      {/* Master switch */}
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
              {savingToggle ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : null}
              <Switch
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={readOnly || savingToggle}
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

      {/* Agent persona */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="size-4 text-primary" />
            Persona do agente
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Define como a IA responde nesta conta — nome, tom, contexto do
            negócio, produtos e regras. É enviado ao seu fluxo no n8n a cada
            mensagem.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Nome do agente</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Assistente da Loja X"
              disabled={readOnly}
              className="bg-muted text-foreground"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-muted-foreground">
              Instruções (system prompt)
            </Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={PROMPT_PLACEHOLDER}
              disabled={readOnly}
              className="min-h-44 bg-muted font-mono text-xs text-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Descreva o tom, o que a empresa faz, produtos, horários e o que
              fazer quando não souber responder. É a “personalidade” do agente.
            </p>
          </div>

          {canEditSettings ? (
            <Button
              onClick={handleSavePersona}
              disabled={savingPersona || !personaDirty}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {savingPersona ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar persona"
              )}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Apenas administradores da conta podem alterar isto.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
