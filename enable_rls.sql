-- הפעל RLS מחדש על טבלת users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- בדוק שהפעלת RLS הצליחה
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users'; 