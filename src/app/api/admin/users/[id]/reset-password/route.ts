import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/auth/require-platform-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/admin/users/[id]/reset-password
 *
 * Sets a user's password directly via the GoTrue Admin API — no email,
 * so it's immune to the link-scanner problem that breaks the email reset
 * flow. Body: { password: string } (min 6 chars). Platform-admin only.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requirePlatformAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    password?: unknown;
  } | null;
  const password =
    body && typeof body.password === "string" ? body.password : "";

  if (password.length < 6) {
    return NextResponse.json(
      { error: "A senha deve ter pelo menos 6 caracteres" },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin().auth.admin.updateUserById(id, {
    password,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Lightweight audit trail until a dedicated table exists.
  console.warn(
    `[admin] ${admin.email} redefiniu a senha do usuário ${id}`,
  );
  return NextResponse.json({ ok: true });
}
