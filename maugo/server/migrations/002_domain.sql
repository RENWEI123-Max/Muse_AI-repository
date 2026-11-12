CREATE TABLE users (
 id UUID PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
 token_hash TEXT NOT NULL UNIQUE, diamonds INTEGER NOT NULL DEFAULT 0 CHECK (diamonds >= 0),
 collected_count INTEGER NOT NULL DEFAULT 0 CHECK (collected_count >= 0), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE conversations (
 id UUID PRIMARY KEY, opener_id UUID NOT NULL REFERENCES users(id), peer_id UUID NOT NULL REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CHECK (opener_id <> peer_id)
);
CREATE UNIQUE INDEX conversations_pair ON conversations (LEAST(opener_id, peer_id), GREATEST(opener_id, peer_id));
CREATE TABLE messages (
 id UUID PRIMARY KEY, conversation_id UUID NOT NULL REFERENCES conversations(id), sender_id UUID NOT NULL REFERENCES users(id),
 kind TEXT NOT NULL CHECK (kind IN ('opening','reply')), content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 200),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX one_opening ON messages(conversation_id) WHERE kind = 'opening';
CREATE TABLE reply_collections (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), reply_id UUID NOT NULL REFERENCES messages(id),
 idempotency_key TEXT NOT NULL, cost INTEGER NOT NULL CHECK (cost IN (0,10)), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(user_id, idempotency_key), UNIQUE(user_id, reply_id)
);
CREATE TABLE wallet_ledger (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), collection_id UUID NOT NULL UNIQUE REFERENCES reply_collections(id),
 amount INTEGER NOT NULL CHECK (amount = -10), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
