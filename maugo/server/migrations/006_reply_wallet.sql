-- Collection existence means one successful unlock; retries never consume quota.
ALTER TABLE reply_collections ADD COLUMN IF NOT EXISTS collection_count INTEGER NOT NULL DEFAULT 1 CHECK(collection_count=1);
ALTER TABLE reply_collections ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ;
UPDATE reply_collections SET unlocked_at=created_at WHERE unlocked_at IS NULL;
ALTER TABLE reply_collections ALTER COLUMN unlocked_at SET DEFAULT clock_timestamp();
ALTER TABLE reply_collections ALTER COLUMN unlocked_at SET NOT NULL;
CREATE INDEX IF NOT EXISTS reply_collections_daily ON reply_collections(user_id,created_at);
-- Preserve old deductions while allowing verified payment credits.
ALTER TABLE wallet_ledger ALTER COLUMN collection_id DROP NOT NULL;
ALTER TABLE wallet_ledger DROP CONSTRAINT IF EXISTS wallet_ledger_amount_check;
ALTER TABLE wallet_ledger ADD COLUMN IF NOT EXISTS balance_after INTEGER CHECK(balance_after>=0);
ALTER TABLE wallet_ledger ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE wallet_ledger DROP CONSTRAINT IF EXISTS wallet_ledger_entry_check;
ALTER TABLE wallet_ledger ADD CONSTRAINT wallet_ledger_entry_check CHECK (
 (collection_id IS NOT NULL AND amount=-10 AND payment_reference IS NULL) OR
 (collection_id IS NULL AND amount>0 AND payment_reference IS NOT NULL));
CREATE UNIQUE INDEX IF NOT EXISTS wallet_payment_reference ON wallet_ledger(payment_reference);
-- Bind even alternate retry keys to the original reply.
CREATE TABLE IF NOT EXISTS reply_collection_requests (
 user_id UUID NOT NULL REFERENCES users(id), idempotency_key TEXT NOT NULL,
 collection_id UUID NOT NULL REFERENCES reply_collections(id),
 PRIMARY KEY(user_id,idempotency_key)
);
INSERT INTO reply_collection_requests(user_id,idempotency_key,collection_id)
 SELECT user_id,idempotency_key,id FROM reply_collections ON CONFLICT DO NOTHING;
