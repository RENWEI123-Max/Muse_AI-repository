-- Store categories and an irreversible summary only; never store request bodies or credentials.
CREATE TABLE IF NOT EXISTS content_filter_hits (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 types TEXT[] NOT NULL,
 content_digest TEXT NOT NULL CHECK(length(content_digest)=64),
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
