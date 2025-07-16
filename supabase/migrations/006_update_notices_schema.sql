-- Update notices table schema to match the application
ALTER TABLE notices 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS content TEXT;

-- Update existing records to use title and content
UPDATE notices 
SET title = message_text, 
    content = message_text 
WHERE title IS NULL;

-- Make title and content NOT NULL after migration
ALTER TABLE notices 
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN content SET NOT NULL;

-- Rename end_date to expires_at for consistency
ALTER TABLE notices 
RENAME COLUMN end_date TO expires_at;

-- Update priority to use string values
ALTER TABLE notices 
ALTER COLUMN priority TYPE VARCHAR(20);

-- Update existing priority values
UPDATE notices 
SET priority = CASE 
    WHEN priority = 1 THEN 'low'
    WHEN priority = 2 THEN 'medium'
    WHEN priority = 3 THEN 'high'
    ELSE 'medium'
END;

-- Add constraint for priority values
ALTER TABLE notices 
ADD CONSTRAINT notices_priority_check 
CHECK (priority IN ('low', 'medium', 'high')); 