-- ============================================================
-- 025_account_ai_agent_config
--
-- Per-account AI agent persona, pushed to the n8n agent in the
-- webhook forward payload so one generic workflow can answer as
-- each client's own assistant.
--
--   ai_agent_name   — display/identity of the assistant (optional)
--   ai_system_prompt — the system message: tone, business context,
--                      products, rules, FAQ. Drives how the agent
--                      replies for this account.
--
-- Both nullable (no persona configured yet → the n8n side falls back
-- to its own default). RLS unchanged: accounts_update (017) already
-- limits writes to admins+, accounts_select lets members read.
--
-- Idempotent — safe to re-run.
-- ============================================================

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS ai_agent_name TEXT,
  ADD COLUMN IF NOT EXISTS ai_system_prompt TEXT;
