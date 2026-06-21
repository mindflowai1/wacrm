// Pure helpers shared by client + server. No Stripe import here so it's
// safe to use in client components.

/** Stripe subscription statuses that grant access to the app. */
export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;

/** Whether a subscription status currently entitles the account. */
export function isSubscriptionActive(
  status: string | null | undefined,
): boolean {
  return (
    !!status &&
    (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status)
  );
}

/**
 * Whether an account is entitled to use the app. True when the operator
 * granted comp access (`manual_access`) OR there's an active/trialing
 * Stripe subscription. A null row (never subscribed, no comp) → false.
 */
export function isAccountEntitled(
  sub:
    | { status?: string | null; manual_access?: boolean | null }
    | null
    | undefined,
): boolean {
  if (!sub) return false;
  return sub.manual_access === true || isSubscriptionActive(sub.status);
}
