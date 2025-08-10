-- הסרת שדות מיותרים מטבלת ההודעות
ALTER TABLE notices 
DROP COLUMN IF EXISTS priority,
DROP COLUMN IF EXISTS expires_at;

-- עדכון הודעת ברירת מחדל
COMMENT ON TABLE notices IS 'טבלת הודעות ועד פשוטה ללא עדיפות ותאריך תפוגה';
