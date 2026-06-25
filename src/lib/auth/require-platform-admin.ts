import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { isPlatformAdminEmail } from "@/lib/auth/platform-admin";

/**
 * Server-only guard for /api/admin/* routes.
 *
 * Resolves the authenticated user from the request cookies and confirms
 * their email is on the PLATFORM_ADMIN_EMAILS allow-list. Returns the
 * user on success, or null — callers respond 403 on null. The middleware
 * already blocks the /admin pages, but every admin API re-checks here so
 * the privileged service-role operations can never run for a non-admin,
 * regardless of how the route is reached.
 */
export async function requirePlatformAdmin(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPlatformAdminEmail(user.email)) return null;
  return user;
}
