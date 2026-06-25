import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/auth/require-platform-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * PATCH /api/admin/users/[id] — safe, reversible user controls.
 *
 * Body: { action: 'confirm_email' | 'ban' | 'unban' }
 *   - confirm_email: manually mark the email confirmed (useful when the
 *     signup confirmation email gets eaten by a link scanner).
 *   - ban / unban: block or restore sign-in (reversible, no data loss).
 *
 * Destructive deletion is intentionally NOT exposed here — removing an
 * auth user can orphan tenant data, so that stays a deliberate manual
 * operation. Platform-admin only.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requirePlatformAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
  } | null;
  const action = body && typeof body.action === "string" ? body.action : "";

  const sb = supabaseAdmin();
  let result;

  switch (action) {
    case "confirm_email":
      result = await sb.auth.admin.updateUserById(id, { email_confirm: true });
      break;
    case "ban":
      // GoTrue interprets a long ban_duration as effectively permanent.
      result = await sb.auth.admin.updateUserById(id, {
        ban_duration: "876000h",
      });
      break;
    case "unban":
      result = await sb.auth.admin.updateUserById(id, { ban_duration: "none" });
      break;
    default:
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  console.warn(`[admin] ${admin.email} executou "${action}" no usuário ${id}`);
  return NextResponse.json({ ok: true });
}
