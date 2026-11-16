-- The four D2 tables already match architecture 3.8-3.11.
CREATE TABLE alert_requests (
 user_id bigint NOT NULL REFERENCES users,
 idempotency_key uuid NOT NULL,
 response jsonb NOT NULL,
 PRIMARY KEY(user_id,idempotency_key)
);
-- Preserve an auditable failed delivery even when the user has not bound a chat.
ALTER TABLE telegram_outbox ALTER COLUMN chat_id DROP NOT NULL;
ALTER TABLE telegram_outbox ADD COLUMN sending_at timestamptz;
ALTER TABLE telegram_outbox ADD COLUMN lease_id uuid;
CREATE TABLE telegram_chat_slots (
 chat_id bigint PRIMARY KEY,
 next_send_at timestamptz NOT NULL
);
CREATE TABLE telegram_poll_state (
 id integer PRIMARY KEY CHECK(id=1),
 next_offset bigint NOT NULL DEFAULT 0
);
INSERT INTO telegram_poll_state(id) VALUES(1);
CREATE UNIQUE INDEX telegram_bind_token_unique ON telegram_bindings(bind_token_hash) WHERE bind_token_hash IS NOT NULL;
GRANT SELECT,INSERT,UPDATE ON alert_rules,alert_events,telegram_outbox,telegram_bindings,alert_requests,telegram_chat_slots,telegram_poll_state TO bizhang_app;
GRANT USAGE,SELECT ON SEQUENCE alert_rules_id_seq,alert_events_id_seq,telegram_outbox_id_seq,telegram_bindings_id_seq TO bizhang_app;
