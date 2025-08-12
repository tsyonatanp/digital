# פתיחת מערכת לוחות מודעות דיגיטליים
Write-Host "פתיחת מערכת לוחות מודעות דיגיטליים..." -ForegroundColor Green
Write-Host ""

# פתיחת מערכת הניהול
Write-Host "פתיחת מערכת הניהול..." -ForegroundColor Yellow
Start-Process "http://localhost/shabanim1/admin/"

# פתיחת לוח המודעות הראשי
Write-Host "פתיחת לוח המודעות הראשי..." -ForegroundColor Yellow
Start-Process "http://localhost/shabanim1/index.html"

Write-Host ""
Write-Host "המערכת נפתחה בדפדפן!" -ForegroundColor Green
Write-Host ""
Write-Host "פרטי התחברות למערכת הניהול:" -ForegroundColor Cyan
Write-Host "שם משתמש: admin" -ForegroundColor White
Write-Host "סיסמה: Ts123qwe!@#" -ForegroundColor White
Write-Host ""

Read-Host "לחץ Enter לסיום" 