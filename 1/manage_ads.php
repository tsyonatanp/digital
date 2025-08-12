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

function resize_image($source, $destination, $target_width = 1152, $target_height = 694) {
    $info = getimagesize($source);
    if (!$info) {
        return false;
    }
    list($orig_width, $orig_height) = $info;
    $mime = $info['mime'];

    // יצירת תמונה חדשה בגודל 1152x694
    $canvas = imagecreatetruecolor($target_width, $target_height);

    // טיפול בשקיפות עבור PNG
    if ($mime === 'image/png') {
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
        imagefill($canvas, 0, 0, $transparent);
    } else {
        // רקע לבן עבור JPEG ו-GIF
        $white = imagecolorallocate($canvas, 255, 255, 255);
        imagefill($canvas, 0, 0, $white);
    }

    // טעינת התמונה המקורית
    switch ($mime) {
        case 'image/jpeg':
            $source_img = imagecreatefromjpeg($source);
            break;
        case 'image/png':
            $source_img = imagecreatefrompng($source);
            break;
        case 'image/gif':
            $source_img = imagecreatefromgif($source);
            break;
        default:
            return false;
    }

    if (!$source_img) {
        return false;
    }

    // שינוי גודל התמונה ל-1152x694 ללא שמירה על יחס
    imagecopyresampled(
        $canvas,
        $source_img,
        0,
        0,
        0,
        0,
        $target_width,
        $target_height,
        $orig_width,
        $orig_height
    );

    // שמירת התמונה
    switch ($mime) {
        case 'image/jpeg':
            imagejpeg($canvas, $destination, 85); // איכות 85 עבור JPEG
            break;
        case 'image/png':
            imagepng($canvas, $destination, 1); // דחיסה מינימלית עבור PNG
            break;
        case 'image/gif':
            imagegif($canvas, $destination);
            break;
    }

    // שחרור זיכרון
    imagedestroy($source_img);
    imagedestroy($canvas);
    return true;
}

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

    // טיפול בהעלאת תמונה
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
    
    // טיפול במחיקת פרסומת
    if (isset($_POST['action']) && $_POST['action'] === 'delete') {
        $file_path = $_POST['file_path'] ?? '';
        if (empty($file_path)) {
            die("נתיב קובץ חסר");
        }
        
        // מחיקת הפרסומת מבסיס הנתונים
        $stmt = $conn->prepare("DELETE FROM ads WHERE building_id = ? AND image_path = ?");
        $stmt->bind_param("is", $building_id, $file_path);
        $stmt->execute();
        
        // מחיקת הקובץ מהשרת
        if (file_exists($file_path)) {
            unlink($file_path);
        }
    }
    
    echo "OK";
    exit;
}

// קריאת פרסומות
if (isset($_GET['list'])) {
    $ad_type = $_GET['list'];
    if (!in_array($ad_type, ['top', 'bottom'])) {
        die("סוג פרסומת לא תקין");
    }
    
    $stmt = $conn->prepare("SELECT image_path FROM ads WHERE building_id = ? AND type = ? ORDER BY created_at DESC");
    $stmt->bind_param("is", $building_id, $ad_type);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $ads = [];
    while ($row = $result->fetch_assoc()) {
        $ads[] = [
            'path' => $row['image_path'],
            'name' => basename($row['image_path'])
        ];
    }
    
    header('Content-Type: application/json');
    echo json_encode($ads);
    exit;
}

$conn->close();
?>