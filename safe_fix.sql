-- Safe fix for styles table - NO DESTRUCTIVE OPERATIONS
-- This script only ADDS columns if they don't exist - it won't delete anything

-- First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'styles'
ORDER BY ordinal_position;

-- Now add only the missing columns (safe operations)
-- These commands will only add columns if they don't already exist

-- Add user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE styles ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to styles table';
    ELSE
        RAISE NOTICE 'user_id column already exists in styles table';
    END IF;
END $$;

-- Add background_color column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'background_color'
    ) THEN
        ALTER TABLE styles ADD COLUMN background_color VARCHAR(7) DEFAULT '#FFFFFF';
        RAISE NOTICE 'Added background_color column to styles table';
    ELSE
        RAISE NOTICE 'background_color column already exists in styles table';
    END IF;
END $$;

-- Add text_color column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'text_color'
    ) THEN
        ALTER TABLE styles ADD COLUMN text_color VARCHAR(7) DEFAULT '#000000';
        RAISE NOTICE 'Added text_color column to styles table';
    ELSE
        RAISE NOTICE 'text_color column already exists in styles table';
    END IF;
END $$;

-- Add layout_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'layout_type'
    ) THEN
        ALTER TABLE styles ADD COLUMN layout_type VARCHAR(50) DEFAULT 'standard';
        RAISE NOTICE 'Added layout_type column to styles table';
    ELSE
        RAISE NOTICE 'layout_type column already exists in styles table';
    END IF;
END $$;

-- Add text_size column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'text_size'
    ) THEN
        ALTER TABLE styles ADD COLUMN text_size VARCHAR(20) DEFAULT 'normal';
        RAISE NOTICE 'Added text_size column to styles table';
    ELSE
        RAISE NOTICE 'text_size column already exists in styles table';
    END IF;
END $$;

-- Add weather_enabled column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'weather_enabled'
    ) THEN
        ALTER TABLE styles ADD COLUMN weather_enabled BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added weather_enabled column to styles table';
    ELSE
        RAISE NOTICE 'weather_enabled column already exists in styles table';
    END IF;
END $$;

-- Add news_enabled column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'news_enabled'
    ) THEN
        ALTER TABLE styles ADD COLUMN news_enabled BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added news_enabled column to styles table';
    ELSE
        RAISE NOTICE 'news_enabled column already exists in styles table';
    END IF;
END $$;

-- Add slide_duration column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'slide_duration'
    ) THEN
        ALTER TABLE styles ADD COLUMN slide_duration INTEGER DEFAULT 5000;
        RAISE NOTICE 'Added slide_duration column to styles table';
    ELSE
        RAISE NOTICE 'slide_duration column already exists in styles table';
    END IF;
END $$;

-- Create index if it doesn't exist (safe operation)
CREATE INDEX IF NOT EXISTS idx_styles_user_id ON styles(user_id);

-- Enable RLS if not already enabled (safe operation)
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy if it doesn't exist (safe operation)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'styles' AND policyname = 'Users can manage own styles'
    ) THEN
        CREATE POLICY "Users can manage own styles" ON styles
        FOR ALL USING (auth.uid() = user_id);
        RAISE NOTICE 'Created RLS policy for styles table';
    ELSE
        RAISE NOTICE 'RLS policy already exists for styles table';
    END IF;
END $$;

-- Show the final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'styles'
ORDER BY ordinal_position; 