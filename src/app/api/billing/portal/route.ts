// ============================================================
// POST /api/billing/portal
//
// Opens the Stripe Billing Portal so the customer can update the card,
// view invoices, or cancel — all Stripe-hosted. Admin+ only; requires
// an existing Stripe customer (i.e. they've started checkout at least
// once).
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
    const db = supabaseAdmin();

    const { data } = await db
      .from("account_subscriptions")
      .select("stripe_customer_id")
      .eq("account_id", ctx.accountId)
      .maybeSingle();

    const customerId = data?.stripe_customer_id as string | undefined;
    if (!customerId) {
      return NextResponse.json(
        { error: "Nenhuma assinatura para gerenciar ainda" },
        { status: 400 },
      );
    }

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/settings?tab=billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return toErrorResponse(err);
  }
}
