ALTER TABLE user_posts ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Life' CHECK (category IN ('Life','Portrait','Style','Outfit'));
