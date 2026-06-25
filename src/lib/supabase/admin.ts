import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for platform-admin operations.
 *
 * Bypasses RLS and exposes the GoTrue Admin API (auth.admin.*). MUST
 * only ever be imported from server code (API route handlers) behind a
 * platform-admin check — never from a client component. The
 * SUPABASE_SERVICE_ROLE_KEY is a non-public env var, so it never ships
 * to the browser.
 *
 * Mirrors the lazy singleton shape of src/lib/flows/admin-client.ts;
 * lives here under supabase/ because the admin panel uses it for user
 * management rather than the flows/automations engines.
 */
let _adminClient: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }
  return _adminClient;
}
