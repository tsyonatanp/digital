-- Fix database schema for styles table
-- Run this in your Supabase SQL editor

-- First, let's see what columns exist in the styles table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'styles'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
ALTER TABLE styles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE styles ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#FFFFFF';
ALTER TABLE styles ADD COLUMN IF NOT EXISTS text_color VARCHAR(7) DEFAULT '#000000';
ALTER TABLE styles ADD COLUMN IF NOT EXISTS layout_type VARCHAR(50) DEFAULT 'standard';
ALTER TABLE styles ADD COLUMN IF NOT EXISTS text_size VARCHAR(20) DEFAULT 'normal';
ALTER TABLE styles ADD COLUMN IF NOT EXISTS weather_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE styles ADD COLUMN IF NOT EXISTS news_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE styles ADD COLUMN IF NOT EXISTS slide_duration INTEGER DEFAULT 5000;

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_styles_user_id ON styles(user_id);

-- Enable RLS
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "Users can manage own styles" ON styles;
CREATE POLICY "Users can manage own styles" ON styles
FOR ALL USING (auth.uid() = user_id);

-- Show the final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'styles'
ORDER BY ordinal_position; 