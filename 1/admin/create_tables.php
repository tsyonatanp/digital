<?php
require_once 'config.php';

// יצירת הטבלאות
if (create_tables()) {
    echo "הטבלאות נוצרו בהצלחה";
} else {
    echo "שגיאה ביצירת הטבלאות";
} 