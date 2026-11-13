-- Durable permission ledger. Message IDs deliberately have no FK to deletable history.
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS opening_message_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ;
UPDATE conversations v SET opening_message_id=COALESCE(
 (SELECT id FROM messages WHERE conversation_id=v.id AND kind='opening'), gen_random_uuid())
WHERE opening_message_id IS NULL;
UPDATE conversations v SET unlocked_at=(SELECT MIN(created_at) FROM messages
 WHERE conversation_id=v.id AND kind='reply' AND sender_id=v.peer_id)
WHERE unlocked_at IS NULL;
ALTER TABLE conversations ALTER COLUMN opening_message_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS conversations_opening_message ON conversations(opening_message_id);
-- Existing conversations_pair uniquely indexes LEAST/GREATEST(opener_id,peer_id).
CREATE TABLE IF NOT EXISTS user_blocks (
 blocker_id UUID NOT NULL REFERENCES users(id), blocked_id UUID NOT NULL REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(blocker_id,blocked_id),
 CHECK(blocker_id <> blocked_id)
);
