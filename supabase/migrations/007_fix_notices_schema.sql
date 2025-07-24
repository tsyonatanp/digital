-- Check current table structure and update accordingly
-- First, let's see what columns exist
DO $$
BEGIN
    -- Add title column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notices' AND column_name = 'title') THEN
        ALTER TABLE notices ADD COLUMN title VARCHAR(255);
    END IF;
    
    -- Add content column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notices' AND column_name = 'content') THEN
        ALTER TABLE notices ADD COLUMN content TEXT;
    END IF;
    
    -- If message_text exists, copy its data to title and content
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notices' AND column_name = 'message_text') THEN
        UPDATE notices SET title = message_text, content = message_text WHERE title IS NULL;
    END IF;
    
    -- Make title and content NOT NULL if they have data
    UPDATE notices SET title = 'הודעה' WHERE title IS NULL;
    UPDATE notices SET content = 'תוכן ההודעה' WHERE content IS NULL;
    
    ALTER TABLE notices ALTER COLUMN title SET NOT NULL;
    ALTER TABLE notices ALTER COLUMN content SET NOT NULL;
    
    -- Rename end_date to expires_at if end_date exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notices' AND column_name = 'end_date') THEN
        ALTER TABLE notices RENAME COLUMN end_date TO expires_at;
    END IF;
    
    -- Update priority to use string values - fix the type comparison issue
    ALTER TABLE notices ALTER COLUMN priority TYPE VARCHAR(20);
    
    -- Update existing priority values with proper type casting
    UPDATE notices 
    SET priority = CASE 
        WHEN priority::text = '1' THEN 'low'
        WHEN priority::text = '2' THEN 'medium'
        WHEN priority::text = '3' THEN 'high'
        WHEN priority::text = 'low' THEN 'low'
        WHEN priority::text = 'medium' THEN 'medium'
        WHEN priority::text = 'high' THEN 'high'
        ELSE 'medium'
    END;
    
    -- Add constraint for priority values if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'notices_priority_check') THEN
        ALTER TABLE notices ADD CONSTRAINT notices_priority_check CHECK (priority IN ('low', 'medium', 'high'));
    END IF;
    
END $$; 