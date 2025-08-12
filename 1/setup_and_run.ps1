# Setup and run digital bulletin board system
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup and run digital bulletin board system" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check PHP
Write-Host "Checking PHP..." -ForegroundColor Yellow
try {
    $phpVersion = php --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PHP is installed - continuing..." -ForegroundColor Green
    } else {
        throw "PHP not found"
    }
} catch {
    Write-Host "PHP is not installed on the system" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install XAMPP or WAMP to run the system" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Installation options:" -ForegroundColor Cyan
    Write-Host "1. XAMPP: https://www.apachefriends.org/download.html" -ForegroundColor Cyan
    Write-Host "2. WAMP: https://www.wampserver.com/en/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installation, run this file again" -ForegroundColor Yellow
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host ""

# Check MySQL
Write-Host "Checking MySQL..." -ForegroundColor Yellow
try {
    $mysqlVersion = mysql --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "MySQL is available - continuing..." -ForegroundColor Green
    } else {
        throw "MySQL not found"
    }
} catch {
    Write-Host "MySQL is not installed or not available" -ForegroundColor Red
    Write-Host "Please ensure MySQL server is running" -ForegroundColor Yellow
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host ""

# Create database
Write-Host "Creating database..." -ForegroundColor Yellow
try {
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS digital_bulletin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "Error creating database" -ForegroundColor Red
    }
} catch {
    Write-Host "Error creating database" -ForegroundColor Red
}

# Run table creation script
Write-Host "Running table creation script..." -ForegroundColor Yellow
try {
    Set-Location "admin"
    php create_tables.php
    Set-Location ".."
    Write-Host "Tables created successfully" -ForegroundColor Green
} catch {
    Write-Host "Error creating tables" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "System is ready to run!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To access the management system:" -ForegroundColor Cyan
Write-Host "1. Ensure web server (Apache) is running" -ForegroundColor White
Write-Host "2. Open browser: http://localhost/shabanim1/admin/" -ForegroundColor White
Write-Host "3. Login with:" -ForegroundColor White
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: <SET-ADMIN-PASSWORD-IN-ENV>" -ForegroundColor White
Write-Host ""
Write-Host "To access building bulletin board:" -ForegroundColor Cyan
Write-Host "http://localhost/shabanim1/index.html?building=building_name" -ForegroundColor White
Write-Host ""

# Open browser
$openBrowser = Read-Host "Do you want to open the browser to the management system? (y/n)"
if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
    Start-Process "http://localhost/shabanim1/admin/"
}

Read-Host "Press Enter to finish" 