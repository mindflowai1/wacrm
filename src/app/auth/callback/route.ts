import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * Auth code-exchange handler.
 *
 * Supabase email links (password recovery, and any future
 * email-confirmation flow) bounce the user here with a one-time
 * `?code=`. We exchange it for a session server-side (PKCE) and then
 * forward to `next` — e.g. `/reset-password` for the recovery flow.
 *
 * Without this route those links 404, which is exactly what happened to
 * the "esqueci a senha" flow: forgot-password/page.tsx points the email
 * at `/auth/callback?next=/reset-password`, but the route never existed.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'
  // Only honour same-site relative paths. An absolute URL in `next`
  // would let a crafted email link open-redirect off our domain.
  const next = rawNext.startsWith('/') ? rawNext : '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_link`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    // Code already used, expired, or no matching verifier cookie.
    return NextResponse.redirect(`${origin}/login?error=auth_expired`)
  }

  // Behind Vercel's proxy `origin` can resolve to the internal host;
  // prefer the forwarded host so the redirect lands on the user-facing
  // domain (crm.mindflowdigital.com.br) rather than the *.vercel.app one.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const baseUrl =
    process.env.NODE_ENV === 'development' || !forwardedHost
      ? origin
      : `https://${forwardedHost}`

  return NextResponse.redirect(`${baseUrl}${next}`)
}
