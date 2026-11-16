CREATE TABLE users (
  id bigserial PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Singapore',
  display_currency text NOT NULL DEFAULT 'USD' CHECK(display_currency IN ('USD','SGD')),
  daily_summary_enabled boolean NOT NULL DEFAULT true,
  failed_logins integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users,
  token_hash bytea NOT NULL UNIQUE CHECK(octet_length(token_hash)=32),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  device_label text
);

CREATE INDEX ON sessions(user_id);

CREATE TABLE assets(
  symbol text PRIMARY KEY,
  name text NOT NULL,
  display_order integer NOT NULL UNIQUE,
  price_kind text NOT NULL CHECK(price_kind IN ('usdt_quoted','usd_reference')),
  binance_symbol text,
  kraken_pair text,
  coingecko_id text NOT NULL
);

INSERT INTO assets VALUES ('BTC','Bitcoin',1,'usdt_quoted','BTCUSDT',NULL,'bitcoin'),('ETH','Ethereum',2,'usdt_quoted','ETHUSDT',NULL,'ethereum'),('SOL','Solana',3,'usdt_quoted','SOLUSDT',NULL,'solana'),('USDT','Tether',4,'usd_reference',NULL,'USDTZUSD','tether'),('USDC','USD Coin',5,'usd_reference',NULL,'USDCUSD','usd-coin'),('BNB','BNB',6,'usdt_quoted','BNBUSDT',NULL,'binancecoin'),('XRP','XRP',7,'usdt_quoted','XRPUSDT',NULL,'ripple'),('DOGE','Dogecoin',8,'usdt_quoted','DOGEUSDT',NULL,'dogecoin'),('ADA','Cardano',9,'usdt_quoted','ADAUSDT',NULL,'cardano'),('LINK','Chainlink',10,'usdt_quoted','LINKUSDT',NULL,'chainlink');

CREATE TABLE transactions(
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users,
  asset text NOT NULL REFERENCES assets,
  side text NOT NULL CHECK(side IN ('buy','sell','opening')),
  traded_at timestamptz NOT NULL,
  quantity numeric(38,18) NOT NULL CHECK(quantity>0),
  price_usd numeric(38,18) CHECK(price_usd>=0),
  opening_cost_usd numeric(38,18) CHECK(opening_cost_usd>=0),
  fee_amount numeric(38,18) NOT NULL DEFAULT 0 CHECK(fee_amount>=0),
  fee_currency char(3) NOT NULL DEFAULT 'USD' CHECK(fee_currency='USD'),
  note text CHECK(char_length(note)<=200),
  version integer NOT NULL DEFAULT 1,
  idempotency_key uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(user_id,idempotency_key),
  CHECK((side='opening' AND price_usd IS NULL AND opening_cost_usd IS NOT NULL) OR (side IN ('buy','sell') AND price_usd IS NOT NULL AND opening_cost_usd IS NULL))
);

CREATE INDEX ON transactions(user_id,asset,traded_at,id) WHERE deleted_at IS NULL;

CREATE TABLE price_cache(
  asset text PRIMARY KEY REFERENCES assets,
  usd_price numeric(38,18),
  raw_price numeric(38,18),
  raw_quote_ccy text,
  raw_source text,
  raw_source_ts timestamptz,
  ref_rate numeric(38,18),
  ref_source text,
  ref_ts timestamptz,
  change_24h_pct numeric(38,18),
  status text NOT NULL CHECK(status IN ('ok','stale','paused_divergence','unverified')),
  last_check_at timestamptz,
  last_check_diff_pct numeric(38,18),
  consecutive_pass integer NOT NULL DEFAULT 0,
  paused_since timestamptz,
  reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE price_ticks(
  id bigserial PRIMARY KEY,
  source text NOT NULL CHECK(source IN ('binance','kraken','coingecko')),
  asset text NOT NULL REFERENCES assets,
  price numeric(38,18) NOT NULL,
  quote_ccy text NOT NULL,
  source_ts timestamptz NOT NULL,
  fetched_at timestamptz NOT NULL
);

CREATE INDEX ON price_ticks(asset,source,source_ts DESC);

CREATE TABLE reference_rates(
  id bigserial PRIMARY KEY,
  pair text NOT NULL CHECK(pair IN ('USDT/USD','USDC/USD','USD/SGD')),
  rate numeric(38,18) NOT NULL,
  source text NOT NULL,
  source_ts timestamptz,
  fetched_at timestamptz NOT NULL
);

CREATE INDEX ON reference_rates(pair,fetched_at DESC);

CREATE TABLE alert_rules(
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users,
  asset text NOT NULL REFERENCES assets,
  direction text NOT NULL CHECK(direction IN ('above','below')),
  threshold_usd numeric(38,18) NOT NULL CHECK(threshold_usd>0),
  state text NOT NULL CHECK(state IN ('active','disabled')),
  disabled_reason text CHECK(disabled_reason IN ('triggered','manual')),
  generation integer NOT NULL DEFAULT 1,
  last_triggered_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX ON alert_rules(user_id);

CREATE INDEX ON alert_rules(asset) WHERE state='active' AND deleted_at IS NULL;

CREATE TABLE alert_events(
  id bigserial PRIMARY KEY,
  rule_id bigint NOT NULL REFERENCES alert_rules,
  user_id bigint NOT NULL REFERENCES users,
  generation integer NOT NULL,
  trigger_kind text NOT NULL CHECK(trigger_kind IN ('on_create','reached','on_restart')),
  triggered_at timestamptz NOT NULL,
  direction text NOT NULL,
  threshold_usd numeric(38,18) NOT NULL,
  price_usd numeric(38,18) NOT NULL,
  price_source text NOT NULL,
  price_ts timestamptz NOT NULL,
  ref_source text,
  ref_rate numeric(38,18),
  ref_ts timestamptz,
  usd_sgd_rate numeric(38,18),
  fx_ts timestamptz,
  price_sgd numeric(38,18),
  UNIQUE(rule_id,generation)
);

CREATE INDEX ON alert_events(user_id,triggered_at DESC);

CREATE TABLE telegram_outbox(
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users,
  chat_id bigint NOT NULL,
  kind text NOT NULL CHECK(kind IN ('alert','daily_summary','daily_summary_deferred','bind_ok')),
  ref_id bigint NOT NULL,
  dedupe_key text NOT NULL UNIQUE,
  text text NOT NULL,
  status text NOT NULL CHECK(status IN ('pending','sending','sent','failed')),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  next_attempt_at timestamptz,
  last_error text,
  telegram_message_id bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX ON telegram_outbox(status,next_attempt_at);

CREATE TABLE telegram_bindings(
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL UNIQUE REFERENCES users,
  status text NOT NULL CHECK(status IN ('pending','bound','revoked')),
  chat_id bigint UNIQUE,
  bind_token_hash bytea,
  bind_token_expires_at timestamptz,
  tg_username text,
  bound_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE daily_summaries(
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users,
  summary_date date NOT NULL,
  status text NOT NULL CHECK(status IN ('sent','deferred','skipped_stale')),
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  total_value_usd numeric(38,18),
  unrealized_usd numeric(38,18),
  realized_cum_usd numeric(38,18),
  day_pnl_usd numeric(38,18),
  usd_sgd_rate numeric(38,18),
  fx_ts timestamptz,
  fx_stale boolean NOT NULL DEFAULT true,
  payload jsonb,
  UNIQUE(user_id,summary_date)
);

-- Persistent IP windows survive process restarts; no user data or credentials here.

CREATE TABLE auth_ip_limits(
  ip inet PRIMARY KEY,
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL
);
