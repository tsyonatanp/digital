-- Fix styles table structure
-- Add missing columns if they don't exist

-- Check if user_id column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE styles ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Check if background_color column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'background_color'
    ) THEN
        ALTER TABLE styles ADD COLUMN background_color VARCHAR(7) DEFAULT '#FFFFFF';
    END IF;
END $$;

-- Check if text_color column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'text_color'
    ) THEN
        ALTER TABLE styles ADD COLUMN text_color VARCHAR(7) DEFAULT '#000000';
    END IF;
END $$;

-- Check if layout_type column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'layout_type'
    ) THEN
        ALTER TABLE styles ADD COLUMN layout_type VARCHAR(50) DEFAULT 'standard';
    END IF;
END $$;

-- Check if text_size column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'text_size'
    ) THEN
        ALTER TABLE styles ADD COLUMN text_size VARCHAR(20) DEFAULT 'normal';
    END IF;
END $$;

-- Check if weather_enabled column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'weather_enabled'
    ) THEN
        ALTER TABLE styles ADD COLUMN weather_enabled BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Check if news_enabled column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'news_enabled'
    ) THEN
        ALTER TABLE styles ADD COLUMN news_enabled BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Check if slide_duration column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'slide_duration'
    ) THEN
        ALTER TABLE styles ADD COLUMN slide_duration INTEGER DEFAULT 5000;
    END IF;
END $$;

-- Create index on user_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_styles_user_id ON styles(user_id);

-- Enable RLS if not already enabled
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'styles' AND policyname = 'Users can manage own styles'
    ) THEN
        CREATE POLICY "Users can manage own styles" ON styles
        FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_styles_updated_at'
    ) THEN
        CREATE TRIGGER update_styles_updated_at BEFORE UPDATE ON styles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$; 