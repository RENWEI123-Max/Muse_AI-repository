ALTER TABLE daily_summaries ADD COLUMN next_retry_at timestamptz;
GRANT SELECT, INSERT, UPDATE ON daily_summaries TO bizhang_app;
GRANT USAGE, SELECT ON SEQUENCE daily_summaries_id_seq TO bizhang_app;
