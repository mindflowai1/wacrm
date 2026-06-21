// ============================================================
// POST /api/billing/webhook  — Stripe → wacrm
//
// The source of truth for billing state. Stripe signs every event; we
// verify with STRIPE_WEBHOOK_SECRET, then mirror the subscription's
// status + period end onto account_subscriptions (service-role write,
// which is the ONLY way that table is written — clients can't).
//
// No user auth: the signature IS the auth. Reads the raw body so the
// signature matches the exact bytes Stripe signed.
// ============================================================

import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/flows/admin-client";

export const runtime = "nodejs";

/**
 * Read the current-period end from a subscription, tolerant to Stripe
 * API-version differences (the field moved between the subscription and
 * its items across versions). Returns an ISO string or null.
 */
function periodEndIso(sub: Stripe.Subscription): string | null {
  const s = sub as unknown as {
    current_period_end?: number;
    items?: { data?: Array<{ current_period_end?: number }> };
  };
  const raw = s.current_period_end ?? s.items?.data?.[0]?.current_period_end;
  return typeof raw === "number" ? new Date(raw * 1000).toISOString() : null;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig ?? "", secret);
  } catch (err) {
    console.warn(
      "[stripe-webhook] signature verification failed:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (err) {
    console.error("[stripe-webhook] handler error:", err);
    // 500 so Stripe retries (with backoff) — important for the
    // checkout.session.completed write that unlocks a paying account.
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event) {
  const db = supabaseAdmin();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const accountId =
        session.client_reference_id || session.metadata?.account_id || null;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (!accountId || !customerId) return;

      let status: string | null = null;
      let periodEnd: string | null = null;
      if (subscriptionId) {
        const sub = await getStripe().subscriptions.retrieve(subscriptionId);
        status = sub.status;
        periodEnd = periodEndIso(sub);
      }

      await db.from("account_subscriptions").upsert({
        account_id: accountId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId ?? null,
        status,
        current_period_end: periodEnd,
      });
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      // Resolve the account by the customer id we stored at checkout.
      const { data: row } = await db
        .from("account_subscriptions")
        .select("account_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      let accountId = row?.account_id as string | undefined;
      // Fallback: the account id we put on the customer's metadata.
      if (!accountId) {
        const customer = await getStripe().customers.retrieve(customerId);
        if (!("deleted" in customer)) {
          accountId = customer.metadata?.account_id;
        }
      }
      if (!accountId) return;

      await db.from("account_subscriptions").upsert({
        account_id: accountId,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        status:
          event.type === "customer.subscription.deleted"
            ? "canceled"
            : sub.status,
        current_period_end: periodEndIso(sub),
      });
      break;
    }

    default:
      // Other events are ignored.
      break;
  }
}
