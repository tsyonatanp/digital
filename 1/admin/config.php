<?php
session_start();

// הגדרות אבטחה
define('ADMIN_USERNAME', 'admin');
define('ADMIN_PASSWORD', 'Ts123qwe!@#');

// הגדרות חיבור לבסיס הנתונים
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'digital_bulletin');

// הגדרות מערכת
define('MAX_BUILDINGS', 100);
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif']);

// פונקציות עזר

// חיבור לבסיס הנתונים
function get_db_connection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    $conn->set_charset("utf8mb4");
    return $conn;
}

// בדיקת התחברות
function check_auth() {
    if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
        header('Location: login.php');
        exit;
    }
}

// קבלת רשימת בניינים
function get_buildings_list() {
    $conn = get_db_connection();
    $result = $conn->query("SELECT * FROM buildings ORDER BY name");
    $buildings = [];
    while ($row = $result->fetch_assoc()) {
        $buildings[] = $row;
    }
    $conn->close();
    return $buildings;
}

// יצירת בניין חדש
function create_building($name, $address, $password) {
    $conn = get_db_connection();
    
    // בדיקה אם הבניין כבר קיים
    $stmt = $conn->prepare("SELECT id FROM buildings WHERE name = ?");
    $stmt->bind_param("s", $name);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        $conn->close();
        return false;
    }
    
    // יצירת הבניין
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO buildings (name, address, password) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $name, $address, $hashed_password);
    $success = $stmt->execute();
    
    $conn->close();
    return $success;
}

// מחיקת בניין
function delete_building($id) {
    $conn = get_db_connection();
    
    // מחיקת כל ההודעות והפרסומות של הבניין
    $stmt = $conn->prepare("DELETE FROM messages WHERE building_id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    
    $stmt = $conn->prepare("DELETE FROM ads WHERE building_id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    
    // מחיקת הבניין
    $stmt = $conn->prepare("DELETE FROM buildings WHERE id = ?");
    $stmt->bind_param("i", $id);
    $success = $stmt->execute();
    
    $conn->close();
    return $success;
}

// יצירת טבלאות אם לא קיימות
function create_tables() {
    $conn = get_db_connection();
    
    // טבלת בניינים
    $conn->query("CREATE TABLE IF NOT EXISTS buildings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        address TEXT,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    // טבלת הודעות
    $conn->query("CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        building_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
    )");
    
    // טבלת פרסומות
    $conn->query("CREATE TABLE IF NOT EXISTS ads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        building_id INT NOT NULL,
        type ENUM('top', 'bottom') NOT NULL,
        image_path VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
    )");
    
    $conn->close();
}

// יצירת הטבלאות בטעינת הקובץ
create_tables();
?> 