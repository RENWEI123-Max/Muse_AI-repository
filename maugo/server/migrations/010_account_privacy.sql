ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
-- Content storage for exports; publishing routes are not part of B9.
CREATE TABLE IF NOT EXISTS user_posts (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id),
 content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS media_deletion_queue (
 media_id UUID PRIMARY KEY, queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS account_deletion_challenges (
 user_id UUID PRIMARY KEY REFERENCES users(id), challenge_hash TEXT NOT NULL,
 session_hash TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL
);
