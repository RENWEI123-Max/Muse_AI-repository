ALTER TABLE users ADD COLUMN IF NOT EXISTS is_moderator BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS user_blocks_reverse ON user_blocks(blocked_id,blocker_id);
CREATE TABLE IF NOT EXISTS reports (
 id UUID PRIMARY KEY, reporter_id UUID NOT NULL REFERENCES users(id),
 reported_user_id UUID NOT NULL REFERENCES users(id), message_id UUID,
 category TEXT NOT NULL CHECK(category IN ('spam','harassment','sexual','violence','hate','other')),
 reason TEXT NOT NULL CHECK(length(reason) BETWEEN 1 AND 2000),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processed','rejected')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 action TEXT CHECK(action IN ('none','suspend')), result TEXT,
 handled_by UUID REFERENCES users(id), handled_at TIMESTAMPTZ,
 CHECK(reporter_id<>reported_user_id),
 CHECK((status='pending' AND handled_by IS NULL AND handled_at IS NULL AND action IS NULL AND result IS NULL)
 OR (status<>'pending' AND handled_by IS NOT NULL AND handled_at IS NOT NULL AND action IS NOT NULL AND result IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS reports_queue ON reports(status,created_at DESC,id DESC);
