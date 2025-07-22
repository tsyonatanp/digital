-- Add missing columns to styles table
-- This script adds the missing columns that the application expects

-- Add user_id column if it doesn't exist
ALTER TABLE styles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add background_color column if it doesn't exist
ALTER TABLE styles ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#FFFFFF';

-- Add text_color column if it doesn't exist
ALTER TABLE styles ADD COLUMN IF NOT EXISTS text_color VARCHAR(7) DEFAULT '#000000';

-- Add layout_type column if it doesn't exist
ALTER TABLE styles ADD COLUMN IF NOT EXISTS layout_type VARCHAR(50) DEFAULT 'standard';

-- Add text_size column if it doesn't exist
ALTER TABLE styles ADD COLUMN IF NOT EXISTS text_size VARCHAR(20) DEFAULT 'normal';

-- Add weather_enabled column if it doesn't exist
ALTER TABLE styles ADD COLUMN IF NOT EXISTS weather_enabled BOOLEAN DEFAULT TRUE;

-- Add news_enabled column if it doesn't exist
ALTER TABLE styles ADD COLUMN IF NOT EXISTS news_enabled BOOLEAN DEFAULT TRUE;

-- Add slide_duration column if it doesn't exist
ALTER TABLE styles ADD COLUMN IF NOT EXISTS slide_duration INTEGER DEFAULT 5000;

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_styles_user_id ON styles(user_id);

-- Enable RLS
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "Users can manage own styles" ON styles;
CREATE POLICY "Users can manage own styles" ON styles
FOR ALL USING (auth.uid() = user_id); 