-- מחק את כל ה-policies הקיימים כדי למנוע לולאה אינסופית
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- בטל RLS זמנית
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- הוסף את העמודות החסרות
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- הגדר אותך כמנהל
UPDATE users 
SET is_super_admin = TRUE, is_active = TRUE 
WHERE email = 's0547274527@gmail.com';

-- בדוק שהעדכון הצליח
SELECT id, email, is_super_admin, is_active 
FROM users 
WHERE email = 's0547274527@gmail.com'; 