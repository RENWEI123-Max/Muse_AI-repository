ALTER TABLE price_cache ADD COLUMN last_pass_at timestamptz;
CREATE TABLE market_budget(month date PRIMARY KEY,calls integer NOT NULL DEFAULT 0);
GRANT SELECT ON assets TO bizhang_app;
GRANT SELECT,INSERT,UPDATE ON price_cache,market_budget TO bizhang_app;
GRANT SELECT,INSERT,DELETE ON price_ticks,reference_rates TO bizhang_app;
GRANT USAGE,SELECT ON SEQUENCE price_ticks_id_seq,reference_rates_id_seq TO bizhang_app;
