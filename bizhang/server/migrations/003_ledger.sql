-- Persist the first POST response, including after later edits or soft deletion.
CREATE TABLE transaction_requests (
 user_id bigint NOT NULL REFERENCES users,
 idempotency_key uuid NOT NULL,
 response jsonb NOT NULL,
 PRIMARY KEY(user_id,idempotency_key)
);
