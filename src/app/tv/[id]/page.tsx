'use client'

import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { Database } from '../../../lib/supabase'

type User = Database['public']['Tables']['users']['Row']
type Notice = Database['public']['Tables']['notices']['Row']
type Image = Database['public']['Tables']['images']['Row']
type Style = Database['public']['Tables']['styles']['Row']

interface TVDisplayProps {
  params: Promise<{
    id: string
  }>
}

interface NewsItem {
  title: string;
  link: string;
  source: string;
}

export default function TVDisplayPage({ params }: TVDisplayProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [style, setStyle] = useState<Style | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [news, setNews] = useState<NewsItem[]>([])
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0)
  const clickCount = useRef(0)
  const lastClickTime = useRef(0)

  // Resolve params (could be Promise or object)
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await Promise.resolve(params)
      setResolvedParams(resolved)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (!resolvedParams) {
      console.log('⏳ ממתין ל-resolvedParams...')
      return
    }

    const fetchData = async () => {
      try {
        console.log('🚀 התחלת טעינת נתונים עבור ID:', resolvedParams.id)
        
        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', resolvedParams.id)
          .single()

        if (userError) {
          console.error('❌ שגיאה באחזור משתמש:', {
            message: userError.message,
            details: userError.details,
            hint: userError.hint,
            code: userError.code,
            user_id: resolvedParams.id
          })
          return
        }

        if (!userData) {
          console.error('❌ משתמש לא נמצא עבור ID:', resolvedParams.id)
          return
        }

        console.log('✅ נתוני משתמש נטענו:', userData)
        setUser(userData)

        // Fetch active images
        const { data: imagesData, error: imagesError } = await supabase
          .from('images')
          .select('*')
          .eq('user_id', resolvedParams.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true })

        if (imagesError) {
          console.error('Error fetching images:', imagesError)
        }

        setImages(imagesData || [])

        // Fetch style
        let styleData = null;
        let styleError = null;
        try {
          const { data, error } = await supabase
            .from('styles')
            .select('*')
            .eq('user_id', resolvedParams.id)
            .single();
          styleData = data;
          styleError = error;
        } catch (err) {
          styleError = err;
        }

        if (styleData) {
          setStyle(styleData);
                 } else {
           // ברירת מחדל
           setStyle({
             background_color: '#FFFFFF',
             text_color: '#000000',
             slide_duration: 5000
           } as any);
         }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams])

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!style || images.length === 0) return

    // Auto-advance image slides
    const slideTimer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }, style.slide_duration || 5000)

    return () => clearInterval(slideTimer)
  }, [images.length, style])

  useEffect(() => {
    // Auto-advance news items
    const newsTimer = setInterval(() => {
      if (news.length > 0) {
        setCurrentNewsIndex((prev) => (prev + 1) % news.length)
      }
    }, 5000) // Change news every 5 seconds

    return () => clearInterval(newsTimer)
  }, [news.length])

  useEffect(() => {
    // Fetch news data
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news')
        const data = await response.json()
        setNews(data)
      } catch (error) {
        console.error('Error fetching news:', error)
      }
    }

    fetchNews()
    // Fetch news every 5 minutes
    const newsRefreshTimer = setInterval(fetchNews, 5 * 60 * 1000)

    return () => clearInterval(newsRefreshTimer)
  }, [])

  useEffect(() => {
    // איפוס הדגל בכל טעינה
    localStorage.removeItem('skipAutoRedirect')
  }, [])

  // הוספת state למזג האוויר
  const [weatherData, setWeatherData] = useState({
    current: 'שמשי 22°C',
    forecast: [
      { day: 'ה', icon: '⛅', high: '27', low: '19' },
      { day: 'ו', icon: '🌧️', high: '24', low: '20' },
      { day: 'ש', icon: '🌧️', high: '26', low: '21' },
      { day: 'א', icon: '☀️', high: '28', low: '22' },
      { day: 'ב', icon: '☀️', high: '30', low: '23' },
      { day: 'ג', icon: '⛅', high: '29', low: '22' },
      { day: 'ד', icon: '☀️', high: '31', low: '24' }
    ]
  })

  // הוספת useEffect לקבלת מזג אוויר אמיתי
  useEffect(() => {
    if (!user) return
    
    const fetchWeather = async () => {
      try {
        const location = 'תל אביב' // תמיד תל אביב
        const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`)
        const data = await response.json()
        
        const current = `${data.current_condition[0].weatherDesc[0].value} ${data.current_condition[0].temp_C}°C`
        
        const forecast = data.weather.slice(0, 7).map((day: any, index: number) => {
          const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
          const today = new Date().getDay()
          const dayIndex = (today + index) % 7
          
          let icon = '☀️'
          const code = parseInt(day.hourly[0].weatherCode)
          if (code >= 200 && code < 300) icon = '⛈️'
          else if (code >= 300 && code < 600) icon = '🌧️'
          else if (code >= 600 && code < 700) icon = '❄️'
          else if (code >= 700 && code < 800) icon = '🌫️'
          else if (code === 800) icon = '☀️'
          else if (code > 800) icon = '⛅'
          
          return {
            day: dayNames[dayIndex],
            icon,
            high: day.maxtempC,
            low: day.mintempC
          }
        })
        
        setWeatherData({ current, forecast })
      } catch (error) {
        console.error('Error fetching weather:', error)
        // השאר ברירת מחדל
      }
    }

    fetchWeather()
    // עדכון כל 30 דקות
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user])

  const handleSecretClick = () => {
    const now = Date.now()
    if (now - lastClickTime.current < 1000) {
      clickCount.current++
    } else {
      clickCount.current = 1
    }
    lastClickTime.current = now
    if (clickCount.current >= 10) {
      localStorage.setItem('skipAutoRedirect', '1')
      setTimeout(() => {
        localStorage.removeItem('skipAutoRedirect')
      }, 10 * 60 * 1000)
      alert('מצב עקיפה הופעל ל-10 דקות!')
      clickCount.current = 0
    }
  }

  const formatHebrewDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    return date.toLocaleDateString('he-IL', options)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-2xl">טוען...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-2xl">בניין לא נמצא</div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundColor: style?.background_color || '#FFFFFF',
        color: style?.text_color || '#000000'
      }}
      onClick={handleSecretClick}
    >
      <div className="flex" style={{ height: 'calc(100vh - 12rem)' }}>
        {/* Right Column - Welcome Text & Clock (28%) */}
        <div className="p-4 flex flex-col items-center border-l" style={{ width: '28%' }}>
          <h1 className="text-4xl font-bold mb-8 text-center">
            ברוכים הבאים
            <br />
            {user?.street_name} {user?.building_number}
          </h1>
          <div className="text-6xl font-bold mb-4 text-center">
            {formatTime(currentTime)}
          </div>
          <div className="text-2xl text-center mb-8">
            {formatHebrewDate(currentTime)}
          </div>
          {user?.welcome_text && (
            <div className="mt-4 text-xl text-center">
              {user.welcome_text}
            </div>
          )}
        </div>

        {/* Center Column - Image Carousel (44%) */}
        <div className="h-full flex items-center justify-center" style={{ width: '44%' }}>
          {images.length > 0 ? (
            <img
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${images[currentImageIndex].filename}`}
              alt="תמונת בניין"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-center text-2xl">
              אין תמונות להצגה
            </div>
          )}
        </div>

        {/* Left Column - News Feed (28%) */}
        <div className="p-4 flex flex-col items-center border-r overflow-y-auto" style={{ width: '28%' }}>
          <NewsColumn news={news} />
        </div>
      </div>

      {/* Weather Widget - Full Width at Bottom */}
      <div className="w-full h-40 relative overflow-hidden flex items-center justify-center px-1 text-white mt-4">
        <WeatherWidget />
      </div>
    </div>
  )
} 

// קומפוננטת עמודת חדשות מעוצבת עם קרוסלה לכל קבוצה
function NewsColumn({ news }) {
  // קיבוץ לפי מקור
  const grouped = news.reduce((acc, item) => {
    const key = item.source || 'אחר';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // סדר הצגה מועדף
  const order = ['ynet', 'ONE', 'גלובס']; // ynet למעלה, ONE באמצע, גלובס למטה
  const sourceTitles = {
    ynet: 'ynet - חדשות חמות',
    ONE: 'ONE - עדכוני ספורט',
    'גלובס': 'גלובס - כלכלה ומסחר',
  };

  // אינדקס נוכחי לכל קבוצה
  const [indexes, setIndexes] = useState({ ynet: 0, ONE: 0, 'גלובס': 0 });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIndexes(prev => {
        const next = { ...prev };
        order.forEach(src => {
          const arr = grouped[src] || [];
          next[src] = arr.length > 0 ? (prev[src] + 1) % arr.length : 0;
        });
        return next;
      });
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [news.length]);

  return (
    <div className="w-full space-y-8">
      {order.map((src) => (
        <div key={src} className="min-h-24 flex flex-col justify-center">
          <div className="text-xl font-bold text-red-700 mb-2 flex items-center justify-between">
            <span>{sourceTitles[src]}</span>
            <span className="flex-1 border-b-2 border-red-200 ml-2"></span>
          </div>
          <div className="flex items-center min-h-[2.5em]">
            {grouped[src]?.length ? (
              <>
                <span className="mt-2 mr-2 text-xs text-blue-400">•</span>
                <span className="text-base font-bold text-gray-900" style={{fontWeight: 500}}>
                  {grouped[src][indexes[src]]?.title}
                </span>
              </>
            ) : (
              <span className="text-gray-400">אין עדכונים</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// קומפוננטת ווידג'ט מזג אוויר חיצוני
function WeatherWidget() {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // מנקה קודם כל ווידג'ט קודם
    if (widgetRef.current) {
      widgetRef.current.innerHTML = '';
    }
    // יוצר div עם id
    const div = document.createElement('div');
    div.id = 'ww_4d5960b26d6ed';
    div.setAttribute('v', '1.3');
    div.setAttribute('loc', 'auto');
    div.setAttribute('a', '{"t":"responsive","lang":"he","sl_lpl":1,"ids":[],"font":"Arial","sl_ics":"one_a","sl_sot":"celsius","cl_bkg":"#512DA8","cl_font":"#FFFFFF","cl_cloud":"#FFFFFF","cl_persp":"#81D4FA","cl_sun":"#FFC107","cl_moon":"#FFC107","cl_thund":"#FF5722","cl_odd":"#0000000a","el_nme":3}');
    div.innerHTML = '<a href="https://weatherwidget.org/" id="ww_4d5960b26d6ed_u" target="_blank">Weather widget html</a>';
    widgetRef.current?.appendChild(div);

    // מוסיף סקריפט
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://app3.weatherwidget.org/js/?id=ww_4d5960b26d6ed';
    widgetRef.current?.appendChild(script);

    // ניקוי
    return () => {
      if (widgetRef.current) widgetRef.current.innerHTML = '';
    };
  }, []);

  return (
    <div ref={widgetRef} className="w-full h-full flex items-center justify-center" />
  );
} 