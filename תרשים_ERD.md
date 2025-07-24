# 🗂️ תרשים ERD - לוח מודעות דיגיטלית

## 📊 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  🏢 USERS (משתמשים/בניינים)                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PK: id (UUID)                                                      │   │
│  │ email (VARCHAR(255)) UNIQUE                                        │   │
│  │ password_hash (VARCHAR(255))                                       │   │
│  │ street_name (VARCHAR(255))                                         │   │
│  │ building_number (VARCHAR(50))                                      │   │
│  │ management_company (VARCHAR(255))                                  │   │
│  │ contact_person (VARCHAR(255))                                      │   │
│  │ contact_phone (VARCHAR(50))                                        │   │
│  │ contact_email (VARCHAR(255))                                       │   │
│  │ is_super_admin (BOOLEAN)                                           │   │
│  │ created_at (TIMESTAMP)                                             │   │
│  │ updated_at (TIMESTAMP)                                             │   │
│  │ last_login (TIMESTAMP)                                             │   │
│  │ is_active (BOOLEAN)                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                      │
│                                    │ 1:N                                  │
│                                    ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 📢 NOTICES (הודעות)                                                 │   │
│  │ ┌─────────────────────────────────────────────────────────────┐     │   │
│  │ │ PK: id (UUID)                                              │     │   │
│  │ │ FK: user_id (UUID) → users.id                              │     │   │
│  │ │ message_text (TEXT)                                        │     │   │
│  │ │ start_date (TIMESTAMP)                                     │     │   │
│  │ │ end_date (TIMESTAMP)                                       │     │   │
│  │ │ is_active (BOOLEAN)                                        │     │   │
│  │ │ priority (INTEGER)                                         │     │   │
│  │ │ created_at (TIMESTAMP)                                     │     │   │
│  │ │ updated_at (TIMESTAMP)                                     │     │   │
│  │ └─────────────────────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                      │
│                                    │ 1:N                                  │
│                                    ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🖼️ IMAGES (תמונות)                                                  │   │
│  │ ┌─────────────────────────────────────────────────────────────┐     │   │
│  │ │ PK: id (UUID)                                              │     │   │
│  │ │ FK: user_id (UUID) → users.id                              │     │   │
│  │ │ file_name (VARCHAR(255))                                   │     │   │
│  │ │ file_path (VARCHAR(500))                                   │     │   │
│  │ │ file_size (INTEGER)                                        │     │   │
│  │ │ mime_type (VARCHAR(100))                                   │     │   │
│  │ │ display_order (INTEGER)                                    │     │   │
│  │ │ start_date (TIMESTAMP)                                     │     │   │
│  │ │ end_date (TIMESTAMP)                                       │     │   │
│  │ │ is_active (BOOLEAN)                                        │     │   │
│  │ │ created_at (TIMESTAMP)                                     │     │   │
│  │ │ updated_at (TIMESTAMP)                                     │     │   │
│  │ └─────────────────────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                      │
│                                    │ 1:1                                  │
│                                    ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🎨 STYLES (עיצובים)                                                 │   │
│  │ ┌─────────────────────────────────────────────────────────────┐     │   │
│  │ │ PK: id (UUID)                                              │     │   │
│  │ │ FK: user_id (UUID) → users.id                              │     │   │
│  │ │ background_color (VARCHAR(7))                              │     │   │
│  │ │ text_color (VARCHAR(7))                                    │     │   │
│  │ │ layout_type (VARCHAR(50))                                  │     │   │
│  │ │ text_size (VARCHAR(20))                                    │     │   │
│  │ │ weather_enabled (BOOLEAN)                                  │     │   │
│  │ │ news_enabled (BOOLEAN)                                     │     │   │
│  │ │ slide_duration (INTEGER)                                   │     │   │
│  │ │ created_at (TIMESTAMP)                                     │     │   │
│  │ │ updated_at (TIMESTAMP)                                     │     │   │
│  │ └─────────────────────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  🌤️ WEATHER_CACHE (מזג אוויר)                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PK: id (UUID)                                                      │   │
│  │ location (VARCHAR(255))                                            │   │
│  │ weather_data (JSONB)                                               │   │
│  │ expires_at (TIMESTAMP)                                             │   │
│  │ created_at (TIMESTAMP)                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  📰 NEWS_SOURCES (מקורות חדשות)                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PK: id (UUID)                                                      │   │
│  │ name (VARCHAR(255))                                                │   │
│  │ rss_url (VARCHAR(500))                                             │   │
│  │ is_active (BOOLEAN)                                                │   │
│  │ created_at (TIMESTAMP)                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                      │
│                                    │ 1:N                                  │
│                                    ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 📋 NEWS_CACHE (חדשות)                                               │   │
│  │ ┌─────────────────────────────────────────────────────────────┐     │   │
│  │ │ PK: id (UUID)                                              │     │   │
│  │ │ FK: source_id (UUID) → news_sources.id                     │     │   │
│  │ │ title (VARCHAR(500))                                       │     │   │
│  │ │ content (TEXT)                                             │     │   │
│  │ │ url (VARCHAR(500))                                         │     │   │
│  │ │ published_at (TIMESTAMP)                                   │     │   │
│  │ │ expires_at (TIMESTAMP)                                     │     │   │
│  │ │ created_at (TIMESTAMP)                                     │     │   │
│  │ └─────────────────────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔗 קשרים בין הטבלאות

### קשרים עיקריים:

1. **USERS → NOTICES** (1:N)
   - משתמש אחד יכול להיות בעל מספר הודעות
   - כל הודעה שייכת למשתמש אחד בלבד

2. **USERS → IMAGES** (1:N)
   - משתמש אחד יכול להיות בעל מספר תמונות
   - כל תמונה שייכת למשתמש אחד בלבד

3. **USERS → STYLES** (1:1)
   - משתמש אחד יכול להיות בעל עיצוב אחד בלבד
   - כל עיצוב שייך למשתמש אחד בלבד

4. **NEWS_SOURCES → NEWS_CACHE** (1:N)
   - מקור חדשות אחד יכול להיות בעל מספר פריטי חדשות
   - כל פריט חדשות שייך למקור אחד בלבד

### קשרים משניים:

- **WEATHER_CACHE** - טבלה עצמאית לאחסון נתוני מזג אוויר
- **NEWS_SOURCES** - טבלה עצמאית לניהול מקורות חדשות

## 📊 אינדקסים מומלצים

### אינדקסים ראשיים:
```sql
-- אינדקסים על מפתחות ראשיים (אוטומטיים)
PRIMARY KEY (id) ON users
PRIMARY KEY (id) ON notices
PRIMARY KEY (id) ON images
PRIMARY KEY (id) ON styles
PRIMARY KEY (id) ON weather_cache
PRIMARY KEY (id) ON news_sources
PRIMARY KEY (id) ON news_cache
```

### אינדקסים משניים:
```sql
-- אינדקסים על מפתחות זרים
CREATE INDEX idx_notices_user_id ON notices(user_id);
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_styles_user_id ON styles(user_id);
CREATE INDEX idx_news_cache_source_id ON news_cache(source_id);

-- אינדקסים על שדות חיפוש
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_street_building ON users(street_name, building_number);
CREATE INDEX idx_notices_active ON notices(is_active, start_date, end_date);
CREATE INDEX idx_images_active ON images(is_active, start_date, end_date);
CREATE INDEX idx_images_order ON images(user_id, display_order);
CREATE INDEX idx_weather_cache_location ON weather_cache(location);
CREATE INDEX idx_weather_cache_expires ON weather_cache(expires_at);
CREATE INDEX idx_news_cache_expires ON news_cache(expires_at);
```

## 🔐 מדיניות אבטחה (RLS)

### מדיניות למשתמשים:
- כל משתמש יכול לראות ולערוך רק את הנתונים שלו
- מנהל-על יכול לגשת לכל הנתונים

### מדיניות לטבלאות:
```sql
-- הפעלת RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

-- מדיניות גישה
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own notices" ON notices
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own images" ON images
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own styles" ON styles
  FOR ALL USING (auth.uid() = user_id);
```

## 📈 תצוגות (Views) שימושיות

### תצוגת תוכן פעיל:
```sql
CREATE VIEW active_content AS
SELECT 
    u.id as user_id,
    u.street_name,
    u.building_number,
    n.message_text,
    n.start_date as notice_start,
    n.end_date as notice_end,
    i.file_path as image_path,
    i.display_order,
    i.start_date as image_start,
    i.end_date as image_end,
    s.background_color,
    s.text_color,
    s.layout_type,
    s.text_size,
    s.slide_duration
FROM users u
LEFT JOIN notices n ON u.id = n.user_id AND n.is_active = TRUE 
    AND (n.end_date IS NULL OR n.end_date > NOW())
LEFT JOIN images i ON u.id = i.user_id AND i.is_active = TRUE 
    AND (i.end_date IS NULL OR i.end_date > NOW())
LEFT JOIN styles s ON u.id = s.user_id
WHERE u.is_active = TRUE;
```

### תצוגת סטטיסטיקות:
```sql
CREATE VIEW user_statistics AS
SELECT 
    u.id,
    u.street_name,
    u.building_number,
    COUNT(n.id) as active_notices,
    COUNT(i.id) as active_images,
    s.layout_type,
    s.text_size
FROM users u
LEFT JOIN notices n ON u.id = n.user_id AND n.is_active = TRUE
LEFT JOIN images i ON u.id = i.user_id AND i.is_active = TRUE
LEFT JOIN styles s ON u.id = s.user_id
WHERE u.is_active = TRUE
GROUP BY u.id, u.street_name, u.building_number, s.layout_type, s.text_size;
``` 