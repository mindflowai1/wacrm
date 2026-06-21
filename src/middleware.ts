import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAccountEntitled } from '@/lib/stripe/subscription'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Auth pages - redirect to dashboard if already logged in.
  // Exception: when an invite token is in the query string we
  // send the already-signed-in user to /join/<token> instead so
  // they can accept the invitation in one click. Without this,
  // a forwarded invite link to someone who's already signed in
  // would silently drop them on /dashboard.
  if (user && (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup' ||
    request.nextUrl.pathname === '/forgot-password'
  )) {
    const url = request.nextUrl.clone()
    const inviteToken = request.nextUrl.searchParams.get('invite')
    if (
      inviteToken &&
      (request.nextUrl.pathname === '/login' ||
        request.nextUrl.pathname === '/signup')
    ) {
      url.pathname = `/join/${encodeURIComponent(inviteToken)}`
      url.search = ''
    } else {
      url.pathname = '/dashboard'
      url.search = ''
    }
    return NextResponse.redirect(url)
  }

  // Protected pages - redirect to login if not authenticated
  const protectedPaths = ['/dashboard', '/inbox', '/contacts', '/pipelines', '/broadcasts', '/automations', '/settings']
  if (!user && protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // API routes that need auth (not webhooks)
  if (!user && request.nextUrl.pathname.startsWith('/api/whatsapp/') &&
      !request.nextUrl.pathname.includes('/webhook')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ============================================================
  // Billing gate
  //
  // Block the operational app for accounts that aren't entitled (no
  // active subscription AND no comp access), funnelling them to the
  // subscription page. Deliberately:
  //   - leaves /settings reachable so they can subscribe / manage account
  //   - never touches webhooks or other API routes
  //   - is skipped entirely when Stripe isn't configured (so a deploy
  //     without billing keeps working)
  //   - FAILS OPEN on any query error — a transient DB hiccup must never
  //     lock everyone out of the app
  //
  // One RLS-scoped query: account_subscriptions returns only the caller's
  // account row, so no explicit account filter is needed.
  // ============================================================
  const billingConfigured = !!(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID
  )
  const gatedPaths = [
    '/dashboard',
    '/inbox',
    '/contacts',
    '/pipelines',
    '/broadcasts',
    '/automations',
    '/flows',
  ]
  if (
    user &&
    billingConfigured &&
    gatedPaths.some(
      (p) =>
        request.nextUrl.pathname === p ||
        request.nextUrl.pathname.startsWith(`${p}/`),
    )
  ) {
    const { data: sub, error } = await supabase
      .from('account_subscriptions')
      .select('status, manual_access')
      .maybeSingle()
    // Only redirect on a clean "not entitled" read. Any error (or thrown
    // exception caught by the runtime) leaves the user through — fail open.
    if (!error && !isAccountEntitled(sub)) {
      const url = request.nextUrl.clone()
      url.pathname = '/settings'
      url.search = ''
      url.searchParams.set('tab', 'billing')
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
