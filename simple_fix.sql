-- Simple fix for styles table
-- Copy and paste this into your Supabase SQL Editor

-- Add user_id column
ALTER TABLE styles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add other missing columns
ALTER TABLE styles ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#FFFFFF';
ALTER TABLE styles ADD COLUMN IF NOT EXISTS text_color VARCHAR(7) DEFAULT '#000000';
ALTER TABLE styles ADD COLUMN IF NOT EXISTS layout_type VARCHAR(50) DEFAULT 'standard';
ALTER TABLE styles ADD COLUMN IF NOT EXISTS text_size VARCHAR(20) DEFAULT 'normal';
ALTER TABLE styles ADD COLUMN IF NOT EXISTS weather_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE styles ADD COLUMN IF NOT EXISTS news_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE styles ADD COLUMN IF NOT EXISTS slide_duration INTEGER DEFAULT 5000;

-- Create index
CREATE INDEX IF NOT EXISTS idx_styles_user_id ON styles(user_id);

-- Enable RLS
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Users can manage own styles" ON styles;
CREATE POLICY "Users can manage own styles" ON styles
FOR ALL USING (auth.uid() = user_id); 