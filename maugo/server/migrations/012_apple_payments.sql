-- Retain transaction identities even if an account later clears its private ledger.
CREATE TABLE IF NOT EXISTS apple_transactions (
 transaction_id TEXT PRIMARY KEY,
 user_id UUID REFERENCES users(id), product_id TEXT, diamonds INTEGER, balance INTEGER,
 refunded BOOLEAN NOT NULL DEFAULT false,
 CHECK ((user_id IS NULL AND product_id IS NULL AND diamonds IS NULL AND balance IS NULL AND refunded)
   OR (user_id IS NOT NULL AND product_id IS NOT NULL AND diamonds>0 AND balance>=0))
);
ALTER TABLE wallet_ledger ADD COLUMN IF NOT EXISTS apple_refund_transaction_id TEXT UNIQUE REFERENCES apple_transactions(transaction_id);
ALTER TABLE wallet_ledger DROP CONSTRAINT IF EXISTS wallet_ledger_entry_check;
ALTER TABLE wallet_ledger ADD CONSTRAINT wallet_ledger_entry_check CHECK (
 (collection_id IS NOT NULL AND amount=-10 AND payment_reference IS NULL AND filter_pass_purchase_id IS NULL AND apple_refund_transaction_id IS NULL) OR
 (collection_id IS NULL AND amount>0 AND payment_reference IS NOT NULL AND filter_pass_purchase_id IS NULL AND apple_refund_transaction_id IS NULL) OR
 (collection_id IS NULL AND amount IN (-30,-150,-480) AND payment_reference IS NULL AND filter_pass_purchase_id IS NOT NULL AND apple_refund_transaction_id IS NULL) OR
 (collection_id IS NULL AND amount<0 AND payment_reference IS NULL AND filter_pass_purchase_id IS NULL AND apple_refund_transaction_id IS NOT NULL)
);
