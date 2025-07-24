-- Add admin fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_is_super_admin ON users(is_super_admin);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Update RLS policies to allow admins to view all users
CREATE POLICY IF NOT EXISTS "Admins can view all users" ON users
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_super_admin = TRUE
    )
  );

-- Allow admins to update user status
CREATE POLICY IF NOT EXISTS "Admins can update user status" ON users
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_super_admin = TRUE
    )
  );

-- Allow service role to manage all users (for admin operations)
CREATE POLICY IF NOT EXISTS "Service role can manage all users" ON users
  FOR ALL USING (auth.role() = 'service_role'); 