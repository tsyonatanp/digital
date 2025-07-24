-- Add email verification tracking fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email_verified_at ON users(email_verified_at);
CREATE INDEX IF NOT EXISTS idx_users_trial_expires_at ON users(trial_expires_at);

-- Update RLS policies to allow trial access
CREATE POLICY IF NOT EXISTS "Users can access during trial period" ON users
  FOR SELECT USING (
    auth.uid() = id AND (
      is_active = TRUE OR 
      (trial_expires_at IS NOT NULL AND trial_expires_at > NOW())
    )
  );

-- Allow users to update their own data during trial
CREATE POLICY IF NOT EXISTS "Users can update during trial" ON users
  FOR UPDATE USING (
    auth.uid() = id AND (
      is_active = TRUE OR 
      (trial_expires_at IS NOT NULL AND trial_expires_at > NOW())
    )
  ); 