/**
 * Platform-admin allow-list (pure helpers, no server imports).
 *
 * Platform admins are the SaaS operators — a cross-tenant "god mode"
 * that is distinct from the per-account `owner/admin/agent/viewer`
 * roles (those are scoped to a single tenant by RLS). Membership is an
 * env-var allow-list so there's no migration and admins can be added by
 * editing one variable:
 *
 *   PLATFORM_ADMIN_EMAILS=me@example.com,partner@example.com
 *
 * Kept free of any `next/headers` / server-client imports so it can be
 * imported from both middleware (edge runtime) and route handlers.
 * Unset → nobody is a platform admin (safe default: the panel is
 * simply unreachable).
 */
export function platformAdminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return platformAdminEmails().includes(email.toLowerCase());
}
