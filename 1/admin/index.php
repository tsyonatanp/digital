<?php
require_once 'config.php';
check_auth();

$buildings = get_buildings_list();
$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    switch ($action) {
        case 'create':
            $name = trim($_POST['name'] ?? '');
            $address = trim($_POST['address'] ?? '');
            $password = $_POST['password'] ?? '';
            
            if (empty($name) || empty($address) || empty($password)) {
                $message = '<div class="error">כל השדות חובה</div>';
            } else {
                if (create_building($name, $address, $password)) {
                    $message = '<div class="success">הבניין נוצר בהצלחה</div>';
                } else {
                    $message = '<div class="error">שגיאה ביצירת הבניין</div>';
                }
            }
            break;
            
        case 'delete':
            $building_id = (int)($_POST['building_id'] ?? 0);
            if ($building_id > 0) {
                if (delete_building($building_id)) {
                    $message = '<div class="success">הבניין נמחק בהצלחה</div>';
                } else {
                    $message = '<div class="error">שגיאה במחיקת הבניין</div>';
                }
            }
            break;
    }
    
    // רענון הרשימה
    $buildings = get_buildings_list();
}
?>
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ניהול לוחות מודעות דיגיטליים</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Rubik', sans-serif;
            background: linear-gradient(135deg, #f0f7ff 0%, #e5f4ff 100%);
            min-height: 100vh;
            padding: 2rem;
            margin: 0;
        }
        .content-box {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 1rem;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
            backdrop-filter: blur(10px);
        }
        .content-box h2 {
            font-size: 1.8rem;
            color: #b91c1c;
            font-weight: 700;
            margin-bottom: 1rem;
        }
        .btn {
            transition: transform 0.3s ease, background-color 0.3s ease;
        }
        .btn:hover {
            transform: scale(1.05);
        }
        .buildings-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        .buildings-table th, .buildings-table td {
            padding: 0.75rem;
            text-align: right;
            border-bottom: 1px solid #e5e7eb;
        }
        .buildings-table th {
            background: #f3f4f6;
            font-weight: 600;
        }
        .error {
            color: #dc2626;
            font-weight: 500;
            margin-top: 0.5rem;
        }
        .success {
            color: #16a34a;
            font-weight: 500;
            margin-top: 0.5rem;
        }
        .form-group {
            margin-bottom: 1rem;
        }
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }
        .form-group input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
        }
        .form-group input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
    </style>
</head>
<body>
    <div class="content-box">
        <h2>הוספת בניין חדש</h2>
        <?php echo $message; ?>
        <form method="POST" action="">
            <input type="hidden" name="action" value="create">
            <div class="form-group">
                <label for="name">שם הבניין</label>
                <input type="text" id="name" name="name" required>
            </div>
            <div class="form-group">
                <label for="address">כתובת</label>
                <input type="text" id="address" name="address" required>
            </div>
            <div class="form-group">
                <label for="password">סיסמה</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="btn bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">הוסף בניין</button>
        </form>
    </div>

    <div class="content-box">
        <h2>בניינים קיימים</h2>
        <table class="buildings-table">
            <thead>
                <tr>
                    <th>שם</th>
                    <th>כתובת</th>
                    <th>פעולות</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($buildings as $building): ?>
                <tr>
                    <td><?php echo htmlspecialchars($building['name']); ?></td>
                    <td><?php echo htmlspecialchars($building['address']); ?></td>
                    <td>
                        <a href="../<?php echo htmlspecialchars($building['name']); ?>/edit.html" class="btn bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">ניהול</a>
                        <form method="POST" action="" class="inline-block" onsubmit="return confirm('האם אתה בטוח שברצונך למחוק את הבניין הזה?');">
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="building_id" value="<?php echo $building['id']; ?>">
                            <button type="submit" class="btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">מחק</button>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <div class="content-box">
        <a href="logout.php" class="btn bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">התנתק</a>
    </div>
</body>
</html> 