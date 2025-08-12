<?php
require_once 'admin/config.php';

// קבלת שם הבניין מהנתיב
$path_parts = explode('/', $_SERVER['REQUEST_URI']);
$building_name = $path_parts[count($path_parts) - 2]; // שם התיקייה של הבניין

// חיבור לבסיס הנתונים
$conn = get_db_connection();

// קבלת מזהה הבניין
$stmt = $conn->prepare("SELECT id FROM buildings WHERE name = ?");
$stmt->bind_param("s", $building_name);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    die("בניין לא נמצא");
}
$building = $result->fetch_assoc();
$building_id = $building['id'];

// טיפול בבקשות POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // בדיקת סיסמה
    $password = $_POST['password'] ?? '';
    $stmt = $conn->prepare("SELECT password FROM buildings WHERE id = ?");
    $stmt->bind_param("i", $building_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $building = $result->fetch_assoc();
    
    if (!password_verify($password, $building['password'])) {
        die("סיסמה שגויה");
    }

    // שמירת הודעה
    if (isset($_POST['message'])) {
        $message = trim($_POST['message']);
        if (!empty($message)) {
            $mode = $_POST['message_mode'] ?? 'append';
            
            if ($mode === 'overwrite') {
                // מחיקת כל ההודעות הקודמות
                $stmt = $conn->prepare("DELETE FROM messages WHERE building_id = ?");
                $stmt->bind_param("i", $building_id);
                $stmt->execute();
            }
            
            // הוספת ההודעה החדשה
            $stmt = $conn->prepare("INSERT INTO messages (building_id, content) VALUES (?, ?)");
            $stmt->bind_param("is", $building_id, $message);
            $stmt->execute();
        }
    }
    
    // שמירת פרסומת
    if (isset($_FILES['ad_image'])) {
        $ad_type = $_POST['ad_type'] ?? '';
        if (!in_array($ad_type, ['top', 'bottom'])) {
            die("סוג פרסומת לא תקין");
        }
        
        $mode = $_POST["ad_{$ad_type}_mode"] ?? 'append';
        
        if ($mode === 'overwrite') {
            // מחיקת כל הפרסומות הקודמות מסוג זה
            $stmt = $conn->prepare("DELETE FROM ads WHERE building_id = ? AND type = ?");
            $stmt->bind_param("is", $building_id, $ad_type);
            $stmt->execute();
        }
        
        // טיפול בהעלאת התמונה
        $file = $_FILES['ad_image'];
        if ($file['error'] === UPLOAD_ERR_OK) {
            $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
            if (!in_array($file['type'], $allowed_types)) {
                die("סוג קובץ לא נתמך");
            }
            
            // יצירת תיקיית uploads אם לא קיימת
            $upload_dir = "uploads/{$building_name}";
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            // שמירת התמונה
            $filename = uniqid() . '_' . basename($file['name']);
            $filepath = "{$upload_dir}/{$filename}";
            
            if (move_uploaded_file($file['tmp_name'], $filepath)) {
                // שמירת נתיב התמונה בבסיס הנתונים
                $stmt = $conn->prepare("INSERT INTO ads (building_id, type, image_path) VALUES (?, ?, ?)");
                $stmt->bind_param("iss", $building_id, $ad_type, $filepath);
                $stmt->execute();
            } else {
                die("שגיאה בשמירת הקובץ");
            }
        } else {
            die("שגיאה בהעלאת הקובץ");
        }
    }
    
    echo "OK";
    exit;
}

// קריאת הודעות
if (isset($_GET['read'])) {
    $stmt = $conn->prepare("SELECT content FROM messages WHERE building_id = ? ORDER BY created_at DESC");
    $stmt->bind_param("i", $building_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $messages = [];
    while ($row = $result->fetch_assoc()) {
        $messages[] = $row['content'];
    }
    
    header('Content-Type: application/json');
    echo json_encode($messages);
    exit;
}

$conn->close();
?>