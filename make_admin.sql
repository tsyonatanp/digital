-- הפוך את המשתמש למנהל
UPDATE users 
SET is_super_admin = TRUE 
WHERE email = 's0547274527@gmail.com';

-- בדוק שהעדכון הצליח
SELECT id, email, is_super_admin, is_active, created_at 
FROM users 
WHERE email = 's0547274527@gmail.com'; 