-- Public discovery fields; city options remain a mock source (see discovery.ts).
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT 'Reader';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER CHECK(age BETWEEN 18 AND 120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT CHECK(gender IN ('male','female','other'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS filter_pass_expires_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS discovery_batches (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), filters JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS discovery_seen (
 user_id UUID NOT NULL REFERENCES users(id), opening_message_id UUID NOT NULL,
 batch_id UUID NOT NULL REFERENCES discovery_batches(id), position INTEGER NOT NULL,
 PRIMARY KEY(user_id,opening_message_id), UNIQUE(batch_id,position)
);
CREATE TABLE IF NOT EXISTS discovery_response_seen (
 user_id UUID NOT NULL REFERENCES users(id), message_id UUID NOT NULL,
 PRIMARY KEY(user_id,message_id)
);
