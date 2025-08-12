# מערכת לוחות מודעות דיגיטליים

מערכת לניהול והצגת הודעות ומודעות בבניינים שונים.

## התקנה והרצה מקומית

### דרישות מערכת
- PHP 7.4 או גבוה יותר
- MySQL 5.7 או גבוה יותר
- שרת web (Apache/Nginx)

### אפשרויות התקנה

#### אפשרות 1: XAMPP (מומלץ)
1. הורד והתקן XAMPP מ: https://www.apachefriends.org/download.html
2. הפעל את XAMPP Control Panel
3. הפעל את השירותים Apache ו-MySQL
4. העתק את תיקיית הפרויקט ל: `C:\xampp\htdocs\shabanim1`

#### אפשרות 2: WAMP
1. הורד והתקן WAMP מ: https://www.wampserver.com/en/
2. הפעל את WAMP
3. העתק את תיקיית הפרויקט ל: `C:\wamp64\www\shabanim1`

### הגדרת המערכת

#### שלב 1: הרצת סקריפט ההתקנה
```bash
# הרץ את הקובץ setup_and_run.bat
setup_and_run.bat
```

או באופן ידני:
```bash
# יצירת בסיס הנתונים
mysql -u root -e "CREATE DATABASE IF NOT EXISTS digital_bulletin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# יצירת הטבלאות
cd admin
php create_tables.php
cd ..
```

#### שלב 2: הגדרת תצורה
הקובץ `admin/config.php` כבר מוגדר עם:
- שם משתמש: `admin`
- סיסמה: `Ts123qwe!@#`
- בסיס נתונים: `digital_bulletin`
- מארח: `localhost`

אם אתה צריך לשנות הגדרות אלה, ערוך את הקובץ `admin/config.php`.

### הרצת המערכת

#### גישה למערכת הניהול
1. פתח דפדפן
2. גש ל: `http://localhost/shabanim1/admin/`
3. התחבר עם:
   - שם משתמש: `admin`
   - סיסמה: `Ts123qwe!@#`

#### גישה ללוח המודעות
- `http://localhost/shabanim1/index.html?building=שם_הבניין`

### מבנה המערכת

```
shabanim1/
├── admin/                 # מערכת הניהול
│   ├── config.php        # הגדרות המערכת
│   ├── index.php         # דף הבית של הניהול
│   ├── login.php         # דף התחברות
│   └── upload/           # תיקיית העלאות
├── index.html            # לוח המודעות הראשי
├── edit.html             # עורך הודעות
├── manage_ads.php        # ניהול מודעות
├── save_message.php      # שמירת הודעות
└── Uploads/              # תיקיית קבצים
```

### פונקציונליות

#### מערכת הניהול
- יצירת בניינים חדשים
- ניהול הודעות לכל בניין
- העלאת מודעות (תמונות)
- מחיקת בניינים והודעות

#### לוח המודעות
- הצגת הודעות בזמן אמת
- הצגת מודעות (תמונות)
- רענון אוטומטי
- תמיכה בעברית

### פתרון בעיות

#### שגיאת חיבור לבסיס הנתונים
- ודא שMySQL פועל
- בדוק את פרטי החיבור ב-`admin/config.php`

#### שגיאת PHP
- ודא שPHP מותקן ומוגדר בPATH
- בדוק שגרסת PHP היא 7.4 או גבוה יותר

#### בעיות הרשאות
- ודא שלתיקיית `admin/upload/` יש הרשאות כתיבה
- ודא שלתיקיית `Uploads/` יש הרשאות כתיבה

### אבטחה
- כל הסיסמאות מאוחסנות כגיבוב bcrypt
- נעשה שימוש ב-prepared statements
- כל הקלט מנוקה ומסונן
- ניהול session מאובטח

### תחזוקה
- גיבוי קבוע של בסיס הנתונים
- ניקוי קבצים לא בשימוש
- בדיקת לוגי שגיאות 