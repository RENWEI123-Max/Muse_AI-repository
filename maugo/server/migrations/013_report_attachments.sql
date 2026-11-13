ALTER TABLE media_uploads DROP CONSTRAINT IF EXISTS media_uploads_purpose_check;
ALTER TABLE media_uploads ADD CONSTRAINT media_uploads_purpose_check CHECK(purpose IN ('chat','avatar','post','report'));
ALTER TABLE reports ADD COLUMN IF NOT EXISTS attachment_media_id UUID REFERENCES media_uploads(id);

-- Keep evidence metadata/files while reports reference them. Deleting a report
-- does not cascade to media; unreferenced media stays until account cleanup.
