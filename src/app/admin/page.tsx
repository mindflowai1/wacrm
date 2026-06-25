"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  KeyRound,
  MailCheck,
  Ban,
  CircleCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  account_name: string | null;
  account_role: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  banned: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  owner: "Proprietário",
  admin: "Admin",
  agent: "Agente",
  viewer: "Visualizador",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function randomTempPassword(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Reset-password dialog
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Falha ao carregar usuários");
        return;
      }
      setUsers(body.users ?? []);
    } catch {
      setError("Não foi possível conectar ao servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.email, u.full_name, u.account_name]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q)),
    );
  }, [users, search]);

  async function patchUser(user: AdminUser, action: string, okMsg: string) {
    setBusyId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error || "Falha na operação");
        return;
      }
      toast.success(okMsg);
      await load();
    } catch {
      toast.error("Não foi possível conectar ao servidor");
    } finally {
      setBusyId(null);
    }
  }

  function openReset(user: AdminUser) {
    setResetTarget(user);
    setNewPassword(randomTempPassword());
  }

  async function confirmReset() {
    if (!resetTarget) return;
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setResetting(true);
    try {
      const res = await fetch(
        `/api/admin/users/${resetTarget.id}/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: newPassword }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error || "Falha ao redefinir a senha");
        return;
      }
      toast.success(`Senha definida: ${newPassword}`, { duration: 8000 });
      setResetTarget(null);
    } catch {
      toast.error("Não foi possível conectar ao servidor");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Usuários</h2>
        <p className="text-sm text-muted-foreground">
          Todos os usuários da plataforma. Redefina senhas, confirme e-mails e
          bloqueie acessos.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou conta..."
            className="border-border bg-muted pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => load()}
          disabled={loading}
          className="border-border"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Atualizar"
          )}
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Usuário</TableHead>
                <TableHead className="text-muted-foreground">Conta</TableHead>
                <TableHead className="text-muted-foreground">Papel</TableHead>
                <TableHead className="text-muted-foreground">
                  Último acesso
                </TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-muted-foreground">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => {
                  const busy = busyId === u.id;
                  return (
                    <TableRow key={u.id} className="border-border">
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {u.full_name || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {u.email || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.account_name || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.account_role
                          ? ROLE_LABEL[u.account_role] ?? u.account_role
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(u.last_sign_in_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.banned ? (
                            <Badge className="border-red-500/30 bg-red-500/10 text-red-400">
                              Banido
                            </Badge>
                          ) : (
                            <Badge className="border-primary/30 bg-primary/10 text-primary">
                              Ativo
                            </Badge>
                          )}
                          {!u.email_confirmed && (
                            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-400">
                              E-mail não confirmado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReset(u)}
                            disabled={busy}
                            className="border-border"
                            title="Redefinir senha"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            Senha
                          </Button>
                          {!u.email_confirmed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                patchUser(
                                  u,
                                  "confirm_email",
                                  "E-mail confirmado",
                                )
                              }
                              disabled={busy}
                              className="border-border"
                              title="Confirmar e-mail manualmente"
                            >
                              <MailCheck className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {u.banned ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                patchUser(u, "unban", "Usuário desbloqueado")
                              }
                              disabled={busy}
                              className="border-border"
                              title="Desbloquear"
                            >
                              <CircleCheck className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                patchUser(u, "ban", "Usuário bloqueado")
                              }
                              disabled={busy}
                              className="border-red-500/40 text-red-300 hover:bg-red-500/10"
                              title="Bloquear acesso"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reset-password dialog */}
      <Dialog
        open={resetTarget !== null}
        onOpenChange={(open) => {
          if (!open) setResetTarget(null);
        }}
      >
        <DialogContent className="border-border bg-popover sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-popover-foreground">
              Redefinir senha
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Defina uma nova senha para{" "}
              <span className="font-medium text-popover-foreground">
                {resetTarget?.email}
              </span>
              . Sem e-mail — a senha vale na hora. Anote e repasse ao usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <Label htmlFor="new-pass" className="text-muted-foreground">
              Nova senha
            </Label>
            <Input
              id="new-pass"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Pelo menos 6 caracteres"
              className="border-border bg-muted font-mono"
            />
            <button
              type="button"
              onClick={() => setNewPassword(randomTempPassword())}
              className="text-xs text-primary hover:underline"
            >
              Gerar outra
            </button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetTarget(null)}
              className="border-border text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmReset}
              disabled={resetting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {resetting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Definir senha"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
