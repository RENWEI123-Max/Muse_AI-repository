CREATE TABLE IF NOT EXISTS filter_pass_purchases (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id),
 idempotency_key TEXT NOT NULL, days INTEGER NOT NULL CHECK(days IN (1,7,30)),
 cost INTEGER NOT NULL CHECK((days=1 AND cost=30) OR (days=7 AND cost=150) OR (days=30 AND cost=480)),
 starts_at TIMESTAMPTZ NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 CHECK(expires_at>starts_at), UNIQUE(user_id,idempotency_key)
);
ALTER TABLE wallet_ledger ADD COLUMN IF NOT EXISTS filter_pass_purchase_id UUID UNIQUE REFERENCES filter_pass_purchases(id);
ALTER TABLE wallet_ledger DROP CONSTRAINT IF EXISTS wallet_ledger_entry_check;
ALTER TABLE wallet_ledger ADD CONSTRAINT wallet_ledger_entry_check CHECK (
 (collection_id IS NOT NULL AND amount=-10 AND payment_reference IS NULL AND filter_pass_purchase_id IS NULL) OR
 (collection_id IS NULL AND amount>0 AND payment_reference IS NOT NULL AND filter_pass_purchase_id IS NULL) OR
 (collection_id IS NULL AND amount IN (-30,-150,-480) AND payment_reference IS NULL AND filter_pass_purchase_id IS NOT NULL));
