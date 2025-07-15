-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to manage all users
CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (auth.role() = 'service_role'); 