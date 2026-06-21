// ============================================================
// POST /api/billing/checkout
//
// Creates a Stripe Checkout Session (subscription mode) for the
// caller's account and returns the hosted-checkout URL. Card data
// never touches our app — Stripe handles PCI.
//
// Admin+ only. The account's Stripe customer is created on first use
// and stored in account_subscriptions (service-role write).
// ============================================================

import { NextResponse } from "next/server";

import { requireRole, toErrorResponse } from "@/lib/auth/account";
import { getStripe, isBillingConfigured } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/flows/admin-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isBillingConfigured()) {
      return NextResponse.json(
        { error: "Cobrança não configurada" },
        { status: 503 },
      );
    }

    const ctx = await requireRole("admin");
    const stripe = getStripe();
    const db = supabaseAdmin();

    // Reuse the account's Stripe customer if it exists; create on first use.
    const { data: existing } = await db
      .from("account_subscriptions")
      .select("stripe_customer_id")
      .eq("account_id", ctx.accountId)
      .maybeSingle();

    let customerId = existing?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: ctx.account.name,
        metadata: { account_id: ctx.accountId },
      });
      customerId = customer.id;
      // Service-role upsert (clients can't write this table).
      await db
        .from("account_subscriptions")
        .upsert({ account_id: ctx.accountId, stripe_customer_id: customerId });
    }

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      client_reference_id: ctx.accountId,
      allow_promotion_codes: true,
      success_url: `${origin}/settings?tab=billing&checkout=success`,
      cancel_url: `${origin}/settings?tab=billing&checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Auth errors map cleanly; Stripe/unknown errors collapse to 500
    // (logged) — we never leak Stripe internals to the client.
    return toErrorResponse(err);
  }
}
