-- ============================================================
-- 026_account_subscriptions — Stripe billing state per account
--
-- Subscription state lives in its OWN table (not columns on accounts)
-- for a security reason: accounts_update (017) is row-level and lets
-- admins update the whole row, so a billing column on accounts could
-- be self-set to 'active' by a malicious admin. Here there is NO
-- client write policy — only the Stripe webhook (service-role key,
-- bypasses RLS) writes billing state. Members may only read it.
-- Mirrors the service-role-only pattern of automation_pending_executions.
--
-- Idempotent — safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS account_subscriptions (
  account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  -- Mirror of Stripe's subscription.status: trialing | active |
  -- past_due | canceled | unpaid | incomplete | incomplete_expired |
  -- paused. NULL = never subscribed.
  status TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_subscriptions_customer
  ON account_subscriptions(stripe_customer_id);

ALTER TABLE account_subscriptions ENABLE ROW LEVEL SECURITY;

-- Members read their account's subscription (to render billing status).
DROP POLICY IF EXISTS account_subscriptions_select ON account_subscriptions;
CREATE POLICY account_subscriptions_select ON account_subscriptions FOR SELECT
  USING (is_account_member(account_id));

-- No INSERT/UPDATE/DELETE policy on purpose: only the service-role
-- Stripe webhook writes billing state.

DROP TRIGGER IF EXISTS set_updated_at ON account_subscriptions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON account_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
