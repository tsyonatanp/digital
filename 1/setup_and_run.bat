@echo off
echo ========================================
echo התקנה והרצה של מערכת לוחות מודעות דיגיטליים
echo ========================================
echo.

echo בדיקת PHP...
php --version >nul 2>&1
if %errorlevel% neq 0 (
    echo PHP לא מותקן במערכת
    echo.
    echo אנא התקן XAMPP או WAMP כדי להריץ את המערכת
    echo.
    echo אפשרויות התקנה:
    echo 1. XAMPP: https://www.apachefriends.org/download.html
    echo 2. WAMP: https://www.wampserver.com/en/
    echo.
    echo לאחר ההתקנה, הרץ שוב את הקובץ הזה
    pause
    exit /b 1
)

echo PHP מותקן - ממשיכים...
echo.

echo בדיקת MySQL...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo MySQL לא מותקן או לא זמין
    echo אנא ודא שהשרת MySQL פועל
    pause
    exit /b 1
)

echo MySQL זמין - ממשיכים...
echo.

echo יצירת בסיס הנתונים...
mysql -u root -e "CREATE DATABASE IF NOT EXISTS digital_bulletin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo הרצת סקריפט יצירת הטבלאות...
cd admin
php create_tables.php
cd ..

echo.
echo ========================================
echo המערכת מוכנה להרצה!
echo ========================================
echo.
echo כדי לגשת למערכת הניהול:
echo 1. ודא ששרת ה-web (Apache) פועל
echo 2. פתח בדפדפן: http://localhost/shabanim1/admin/
echo 3. התחבר עם:
echo    שם משתמש: admin
echo    סיסמה: Ts123qwe!@#
echo.
echo כדי לגשת ללוח המודעות של בניין:
echo http://localhost/shabanim1/index.html?building=שם_הבניין
echo.
pause 