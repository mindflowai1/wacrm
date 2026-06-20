-- ============================================================
-- 024_account_ai_agent_toggle
--
-- Master switch for the AI customer-service bot, per account.
-- When TRUE, the webhook forwards inbound messages to the
-- configured AI agent (n8n) for an automated reply; when FALSE
-- (default), inbound messages only land in the inbox and nothing
-- is forwarded.
--
-- Default FALSE so the feature is opt-in: an account never starts
-- auto-replying without an admin explicitly turning it on.
--
-- RLS: no new policy needed. The existing accounts_update policy
-- (migration 017) already restricts writes to admins+, which is
-- exactly who should flip an account-wide automation setting; the
-- accounts_select policy lets every member read it.
--
-- Idempotent — safe to re-run.
-- ============================================================

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS ai_agent_enabled BOOLEAN NOT NULL DEFAULT false;
