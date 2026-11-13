-- Reuse conversation_preferences.following and messages for relationships and letters.
CREATE TABLE IF NOT EXISTS post_likes (
 user_id UUID NOT NULL REFERENCES users(id),
 post_id UUID NOT NULL REFERENCES user_posts(id) ON DELETE CASCADE,
 PRIMARY KEY(user_id,post_id)
);
CREATE INDEX IF NOT EXISTS post_likes_post ON post_likes(post_id);
CREATE TABLE IF NOT EXISTS image_card_likes (
 user_id UUID NOT NULL REFERENCES users(id),
 image_card_id UUID NOT NULL REFERENCES image_cards(id) ON DELETE CASCADE,
 PRIMARY KEY(user_id,image_card_id)
);
CREATE INDEX IF NOT EXISTS image_card_likes_card ON image_card_likes(image_card_id);
-- One latest successful visit per viewer/profile pair; self views are not visits.
CREATE TABLE IF NOT EXISTS profile_visits (
 visitor_id UUID NOT NULL REFERENCES users(id),
 profile_id UUID NOT NULL REFERENCES users(id),
 visited_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(visitor_id,profile_id), CHECK(visitor_id<>profile_id)
);
CREATE INDEX IF NOT EXISTS profile_visits_profile ON profile_visits(profile_id,visited_at DESC);
