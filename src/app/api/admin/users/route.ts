import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/auth/require-platform-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/admin/users — every user on the platform (cross-tenant).
 *
 * Merges GoTrue's auth users (email, last sign-in, confirmation, ban)
 * with the profile/account info from the public schema. Platform-admin
 * only; the service-role client bypasses RLS so it sees all tenants.
 */

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  account_role: string | null;
  accounts: { name: string | null } | null;
}

export async function GET() {
  const admin = await requirePlatformAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const sb = supabaseAdmin();

  const { data: list, error: listError } = await sb.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const { data: profiles, error: profileError } = await sb
    .from("profiles")
    .select("user_id, full_name, account_role, accounts(name)");
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const byId = new Map<string, ProfileRow>(
    (profiles as unknown as ProfileRow[]).map((p) => [p.user_id, p]),
  );

  const now = Date.now();
  const users = list.users.map((u) => {
    const p = byId.get(u.id);
    const bannedUntil = (u as { banned_until?: string | null }).banned_until;
    return {
      id: u.id,
      email: u.email ?? null,
      full_name: p?.full_name ?? null,
      account_name: p?.accounts?.name ?? null,
      account_role: p?.account_role ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      email_confirmed: !!u.email_confirmed_at,
      banned: !!bannedUntil && new Date(bannedUntil).getTime() > now,
    };
  });

  // Most recently active first.
  users.sort((a, b) => {
    const ax = a.last_sign_in_at ? Date.parse(a.last_sign_in_at) : 0;
    const bx = b.last_sign_in_at ? Date.parse(b.last_sign_in_at) : 0;
    return bx - ax;
  });

  return NextResponse.json({ users });
}
