CREATE TABLE IF NOT EXISTS media_uploads (
 id UUID PRIMARY KEY, uploader_id UUID NOT NULL REFERENCES users(id),
 purpose TEXT NOT NULL CHECK(purpose IN ('chat','avatar','post')),
 conversation_id UUID REFERENCES conversations(id),
 kind TEXT NOT NULL CHECK(kind IN ('image','audio','video')),
 mime_type TEXT NOT NULL, size_bytes INTEGER NOT NULL CHECK(size_bytes>0 AND
 ((kind='video' AND size_bytes<31457280) OR (kind IN ('image','audio') AND size_bytes<10485760))),
 original_name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 CHECK((purpose='chat')=(conversation_id IS NOT NULL)), CHECK(purpose<>'avatar' OR kind='image')
);
CREATE INDEX IF NOT EXISTS media_uploads_owner ON media_uploads(uploader_id,created_at);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_id UUID REFERENCES media_uploads(id);
