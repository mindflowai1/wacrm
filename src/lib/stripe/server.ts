import Stripe from "stripe";

// Lazy singleton — avoids a build-time crash when STRIPE_SECRET_KEY is
// unset (CI / a deploy without billing configured). Throws at call time
// instead, so routes can surface a clean 503.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/** True when the secret key + price are both present. */
export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}
