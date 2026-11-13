ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS profile_avatars (
 user_id UUID NOT NULL REFERENCES users(id),
 media_id UUID NOT NULL REFERENCES media_uploads(id) ON DELETE CASCADE,
 position INTEGER NOT NULL CHECK(position BETWEEN 0 AND 7),
 removed_at TIMESTAMPTZ,
 PRIMARY KEY(user_id,media_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS profile_avatars_slot ON profile_avatars(user_id,position) WHERE removed_at IS NULL;
