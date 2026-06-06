-- Free tier defaults aligned with billing (1 account, 1 copy link for new signups)
ALTER TABLE tc_users ALTER COLUMN account_limit SET DEFAULT 1;
ALTER TABLE tc_users ALTER COLUMN follower_limit SET DEFAULT 1;

COMMENT ON COLUMN tc_users.account_limit IS 'Max linked trading accounts; synced from Stripe subscription quantity on paid plans.';
COMMENT ON COLUMN tc_users.follower_limit IS 'Max copier links; defaults to match account_limit on paid plans.';
