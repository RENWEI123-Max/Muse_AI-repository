CREATE TABLE IF NOT EXISTS feedback (
 id UUID PRIMARY KEY,
 user_id UUID NOT NULL REFERENCES users(id),
 content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000 AND content ~ '\S'),
 type TEXT CHECK (char_length(type) <= 50),
 contact TEXT CHECK (char_length(contact) <= 200),
 status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','resolved')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS feedback_user_created_at ON feedback(user_id,created_at);
