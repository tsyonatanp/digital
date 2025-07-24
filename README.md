# 🧾 לוח מודעות דיגיטלית לבניינים

מערכת תצוגה דיגיטלית על גבי טלוויזיה (יחס 16:9) המחוברת לסטרימר אנדרואיד, המציגה תוכן ייעודי לכל בניין לפי פרטי הזדהות, בניהול מלא של ועד הבית דרך ממשק מובייל.

## 🎯 תכונות עיקריות

### 📺 תצוגת לוח (TV Display)
- **קרוסלה אוטומטית** - שקפים מתחלפים כל מספר שניות
- **הודעות ועד** - טקסט דינמי עם תזמון
- **תמונות** - עד 50 תמונות לקרוסלה עם תזמון
- **חדשות חיצוניות** - תצוגת כותרות מ-RSS
- **בר תחתון** - מזג אוויר, שעון חי, תאריך עברי ולועזי

### 📱 ממשק ניהול (Mobile)
- **הרשמה והתחברות** - מערכת אימות מאובטחת
- **ניהול הודעות** - הוספה, עריכה, מחיקה ותזמון
- **ניהול תמונות** - העלאה בודדת או מרובה
- **עיצוב אישי** - בחירה מסגנונות מוגדרים מראש
- **פרטי ניהול** - עדכון חברת ניהול ואנשי קשר

### 🔐 אבטחה והרשאות
- **אימות משתמשים** - מייל + סיסמה
- **הרשאות מבודדות** - כל ועד רואה רק את הנתונים שלו
- **מנהל-על** - גישה לכל הנתונים
- **שם רחוב נעול** - לא ניתן לשינוי לאחר רישום

## 🛠️ טכנולוגיות

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Framer Motion** - Animations
- **Lucide React** - Icons

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL** - Database
- **Supabase Auth** - Authentication
- **Supabase Storage** - File storage

### APIs & Integrations
- **OpenWeatherMap API** - Weather data
- **RSS feeds** - News content

## 🚀 התקנה והפעלה

### דרישות מקדימות
- Node.js 18+
- npm או yarn
- חשבון Supabase
- חשבון Vercel (אופציונלי)

### התקנה

1. **Clone הפרויקט**
```bash
git clone https://github.com/your-username/digital-notice-board.git
cd digital-notice-board
```

2. **התקנת dependencies**
```bash
npm install
```

3. **הגדרת environment variables**
```bash
cp env.example .env.local
```

ערוך את הקובץ `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Weather API
OPENWEATHER_API_KEY=your_openweather_api_key

# Vercel
VERCEL_URL=your_vercel_url
```

4. **הגדרת מסד נתונים**
```bash
# הרצת migrations
npm run db:migrate

# הזנת נתוני התחלה (אופציונלי)
npm run db:seed
```

5. **הפעלת הפרויקט**
```bash
npm run dev
```

הפרויקט יהיה זמין בכתובת: `http://localhost:3000`

## 📱 שימוש במערכת

### הרשמה ראשונית
1. גש לכתובת המערכת
2. לחץ על "הרשמה חדשה"
3. מלא את פרטי הבניין:
   - אימייל וסיסמה
   - שם רחוב (לא ניתן לשינוי בהמשך)
   - מספר בניין
   - חברת ניהול
4. לחץ על "הרשם"

### ניהול תוכן
1. **הודעות** - הוסף הודעות עם תזמון התחלה וסיום
2. **תמונות** - העלה תמונות (עד 50) עם תזמון
3. **עיצוב** - בחר סגנון תצוגה וצבעים
4. **פרטי ניהול** - עדכן פרטי קשר

### תצוגת לוח
- פתח דפדפן בסטרימר Android TV
- גש לכתובת: `/tv/[building-id]`
- הלוח יציג את התוכן בקרוסלה אוטומטית

## 🎨 סגנונות עיצוב

### סגנון סטנדרטי
- רקע: לבן (#FFFFFF)
- טקסט: שחור (#000000)
- גופן: Arial, 24px

### סגנון מודרני
- רקע: כחול כהה (#1E3A8A)
- טקסט: לבן (#FFFFFF)
- גופן: Roboto, 28px

### סגנון קלאסי
- רקע: אפור בהיר (#F3F4F6)
- טקסט: אפור כהה (#374151)
- גופן: Times New Roman, 22px

## 🔧 פיתוח

### מבנה תיקיות
```
src/
├── app/              # Next.js App Router
│   ├── api/          # API routes
│   ├── dashboard/    # Dashboard pages
│   ├── login/        # Auth pages
│   ├── register/     # Auth pages
│   └── tv/           # TV display pages
├── components/       # React components
│   └── auth/         # Authentication components
├── lib/              # Utilities and configurations
└── store/            # State management
```

### Scripts זמינים
```bash
# פיתוח
npm run dev

# בנייה
npm run build

# בדיקות
npm run test

# בדיקות E2E
npm run test:e2e

# Linting
npm run lint

# Type checking
npm run type-check

# Database
npm run db:migrate
npm run db:reset
npm run db:seed
```

## 🧪 בדיקות

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 🚀 פריסה

### Staging
```bash
npm run deploy:staging
```

### Production
```bash
npm run deploy:production
```

## 📊 מסד נתונים

### טבלאות ראשיות
- **`users`** - מידע על הוועדים והבניינים
- **`notices`** - הודעות ועד
- **`images`** - תמונות מתוזמנות
- **`styles`** - עיצובים מותאמים לבניין

### טבלאות תמיכה
- **`weather_cache`** - נתוני מזג אוויר
- **`news_sources`** - מקורות חדשות
- **`news_cache`** - חדשות ממוטבעות

## 🔒 אבטחה

### Authentication & Authorization
- JWT tokens
- Row Level Security (RLS)
- Role-based access control
- Session management

### Data Protection
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection

## 📚 תיעוד נוסף

- [אפיון מערכת](../אפיון_מערכת_לוח_מודעות_דיגיטלית.md)
- [מבנה מסד נתונים](../מבנה_מסד_נתונים.md)
- [תרשימי מסכים](../תרשימי_מסכים.md)
- [תרשים ERD](../תרשים_ERD.md)
- [תכנית פיתוח](../תכנית_פיתוח.md)

## 🤝 תרומה לפרויקט

1. Fork הפרויקט
2. צור branch חדש (`git checkout -b feature/amazing-feature`)
3. Commit השינויים (`git commit -m 'Add amazing feature'`)
4. Push ל-branch (`git push origin feature/amazing-feature`)
5. פתח Pull Request

## 📄 רישיון

פרויקט זה מוגן תחת רישיון MIT. ראה קובץ [LICENSE](LICENSE) לפרטים.

## 📞 תמיכה

- **דוא"ל:** support@digital-notice-board.com
- **טלפון:** 03-1234567
- **שעות פעילות:** א'-ה' 9:00-17:00

## 🔄 עדכונים

### גרסה 1.0.0 (2024-01-15)
- השקה ראשונית
- מערכת אימות בסיסית
- ניהול הודעות ותמונות
- תצוגת לוח בסיסית

### גרסה 1.1.0 (מתוכנן)
- אינטגרציה עם מזג אוויר
- תמיכה בחדשות RSS
- שיפורי ביצועים
- תכונות עיצוב נוספות

## 🙏 תודות

תודה לכל התורמים והמשתמשים שתומכים בפרויקט זה! 

## Database Setup

### User Profile Trigger

To automatically create user profiles when users sign up, run this SQL in your Supabase SQL Editor:

```sql
-- Run the migration file
\i migrations/create_user_profile_trigger.sql
```

Or copy the content from `migrations/create_user_profile_trigger.sql` and paste it into the Supabase SQL Editor.

This creates:
1. A trigger function that automatically creates user profiles
2. RLS policies for secure access to user data
3. Automatic profile creation on user signup 