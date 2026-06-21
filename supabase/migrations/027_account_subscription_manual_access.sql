-- ============================================================
-- 027_account_subscription_manual_access
--
-- Operator-granted comp access. When TRUE, the account is entitled
-- regardless of Stripe — for your own account and test/internal
-- accounts that shouldn't pay. Lives on account_subscriptions, which
-- has NO client write policy, so only the operator (service-role /
-- Supabase Studio) can flip it; a regular admin cannot self-grant.
--
-- Entitlement = manual_access OR subscription status in (active,trialing).
--
-- Idempotent — safe to re-run.
-- ============================================================

ALTER TABLE account_subscriptions
  ADD COLUMN IF NOT EXISTS manual_access BOOLEAN NOT NULL DEFAULT false;
