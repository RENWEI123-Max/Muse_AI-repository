ALTER TABLE user_posts ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'only_me' CHECK (visibility IN ('everyone','friends','only_me'));
CREATE TABLE IF NOT EXISTS post_attachments (
 post_id UUID NOT NULL REFERENCES user_posts(id) ON DELETE CASCADE,
 media_id UUID NOT NULL REFERENCES media_uploads(id) ON DELETE CASCADE,
 position INTEGER NOT NULL CHECK(position BETWEEN 0 AND 5),
 PRIMARY KEY(post_id,media_id), UNIQUE(post_id,position)
);
CREATE INDEX IF NOT EXISTS user_posts_timeline ON user_posts(created_at DESC,id DESC);
CREATE TABLE IF NOT EXISTS image_cards (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id),
 media_id UUID NOT NULL REFERENCES media_uploads(id) ON DELETE CASCADE,
 type TEXT NOT NULL CHECK(type IN ('portrait','physique','outfit','life')),
 is_primary BOOLEAN NOT NULL DEFAULT false,
 position INTEGER NOT NULL CHECK(position BETWEEN 0 AND 7),
 visibility TEXT NOT NULL DEFAULT 'everyone' CHECK(visibility IN ('everyone','friends','only_me')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(user_id,position), UNIQUE(user_id,media_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS image_cards_primary ON image_cards(user_id) WHERE is_primary;
