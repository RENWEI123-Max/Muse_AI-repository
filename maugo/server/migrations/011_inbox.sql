-- Per-viewer visibility never changes the durable conversation permission ledger.
CREATE TABLE conversation_preferences (
 user_id UUID NOT NULL REFERENCES users(id), conversation_id UUID NOT NULL REFERENCES conversations(id),
 remark TEXT NOT NULL DEFAULT '', pinned BOOLEAN NOT NULL DEFAULT false,
 muted BOOLEAN NOT NULL DEFAULT false, hidden BOOLEAN NOT NULL DEFAULT false,
 following BOOLEAN NOT NULL DEFAULT false, background TEXT NOT NULL DEFAULT '', bubble TEXT NOT NULL DEFAULT '',
 read_at TIMESTAMPTZ, cleared_at TIMESTAMPTZ, PRIMARY KEY(user_id,conversation_id)
);
CREATE INDEX inbox_message_order ON messages(conversation_id,created_at,id);
