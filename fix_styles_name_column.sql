-- Fix styles table - Add name column
-- This script adds the missing name column that is required for creating styles

-- Add name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'name'
    ) THEN
        ALTER TABLE styles ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT 'סגנון מותאם אישית';
    END IF;
END $$;

-- Update existing records to have a default name if they don't have one
UPDATE styles 
SET name = 'סגנון מותאם אישית' 
WHERE name IS NULL OR name = '';

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'styles' AND column_name = 'name'; 