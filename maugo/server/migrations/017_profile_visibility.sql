ALTER TABLE users ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'everyone' CHECK (visibility IN ('everyone','friends','only_me'));
