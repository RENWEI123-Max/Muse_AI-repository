-- Persist the first POST response, including after later edits or soft deletion.
CREATE TABLE transaction_requests (
 user_id bigint NOT NULL REFERENCES users,
 idempotency_key uuid NOT NULL,
 response jsonb NOT NULL,
 PRIMARY KEY(user_id,idempotency_key)
);
GRANT SELECT,INSERT,UPDATE ON transactions, transaction_requests TO bizhang_app;
GRANT USAGE,SELECT ON SEQUENCE transactions_id_seq TO bizhang_app;
