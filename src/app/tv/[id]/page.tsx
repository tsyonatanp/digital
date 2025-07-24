'use client'

import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { Database } from '../../../lib/supabase'
import { 
  Newspaper, 
  Phone, 
  AlertTriangle, 
  Clock, 
  Building,
  MapPin,
  User,
  Calendar,
  RefreshCw
} from 'lucide-react'

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

// הוספת הפונקציות לראש הקובץ
const formatTime = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatHebrewDate = (date: Date) => {
  return date.toLocaleDateString('he-IL-u-ca-hebrew', { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function TVDisplayPage({ params }: TVDisplayProps) {
  useEffect(() => {
    console.log('🖥️ TV Display Page נטען!');
  }, []);
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
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0)
  const [noticePaused, setNoticePaused] = useState(false)
  const [noticeFade, setNoticeFade] = useState(false)
  const clickCount = useRef(0)
  const lastClickTime = useRef(0)
  const [hebrewDate, setHebrewDate] = useState('');
  const [shabbatTimes, setShabbatTimes] = useState({ entry: '', exit: '', parsha: '' });
  
  // הוספת state למוזיקה
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // פונקציה לשליטה במוזיקה
  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      } else {
        audioRef.current.play();
        setIsMusicPlaying(true);
      }
    }
  };

  // פונקציה לרענון קשיח
  const handleHardRefresh = () => {
    window.location.reload();
  };

  // אתחול אודיו
  useEffect(() => {
    audioRef.current = new Audio('/audio/ניגוני הינוקא.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Resolve params
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
        if (!supabase) {
          console.error('❌ Supabase client לא זמין')
          return
        }
        
        // בדוק session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('❌ שגיאה בבדיקת session:', sessionError)
          return
        }
        
        if (!session) {
          console.error('❌ אין session פעיל')
          return
        }
        
        console.log('🚀 התחלת טעינת נתונים עבור ID:', resolvedParams.id)
        console.log('🔐 Session user ID:', session.user.id)
        
        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', resolvedParams.id)
          .single()

        if (userError) {
          console.error('❌ שגיאה באחזור משתמש:', userError)
          console.error('❌ פרטי השגיאה:', {
            message: userError.message,
            details: userError.details,
            hint: userError.hint,
            code: userError.code
          })
          return
        }

        if (!userData) {
          console.error('❌ משתמש לא נמצא עבור ID:', resolvedParams.id)
          return
        }

        console.log('✅ נתוני משתמש נטענו:', userData)
        setUser(userData)

        // Fetch active notices
        const { data: noticesData, error: noticesError } = await supabase
          .from('notices')
          .select('*')
          .eq('user_id', resolvedParams.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (noticesError) {
          console.error('Error fetching notices:', noticesError)
        }

        console.log('✅ הודעות נטענו:', noticesData)
        setNotices(noticesData || [])

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

        // Fetch styles
        const { data: stylesData, error: stylesError } = await supabase
          .from('styles')
          .select('*')
          .eq('user_id', resolvedParams.id)
          .order('created_at', { ascending: false });

        if (stylesError) {
          console.error('Error fetching styles:', stylesError);
        }

        if (stylesData && stylesData.length > 0) {
          setStyle(stylesData[0]);
          console.log('✅ סגנון נטען:', stylesData[0]);
        } else {
          const defaultStyle = {
            background_color: '#FFFFFF',
            text_color: '#000000',
            slide_duration: 5000
          } as any;
          setStyle(defaultStyle);
          console.log('✅ סגנון ברירת מחדל נטען:', defaultStyle);
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
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!style || images.length === 0) return

    const slideTimer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }, style.slide_duration || 5000)

    return () => clearInterval(slideTimer)
  }, [images.length, style])

  useEffect(() => {
    const newsTimer = setInterval(() => {
      if (news.length > 0) {
        setCurrentNewsIndex((prev) => (prev + 1) % news.length)
      }
    }, 5000)

    return () => clearInterval(newsTimer)
  }, [news.length])

  useEffect(() => {
    const noticeTimer = setInterval(() => {
      if (notices.length > 0 && !noticePaused) {
        setNoticeFade(true)
        setTimeout(() => {
          setCurrentNoticeIndex((prev) => (prev + 1) % notices.length)
          setNoticeFade(false)
        }, 300)
      }
    }, 4000)

    return () => clearInterval(noticeTimer)
  }, [notices.length, noticePaused])

  useEffect(() => {
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
    const newsRefreshTimer = setInterval(fetchNews, 10 * 60 * 1000)

    return () => clearInterval(newsRefreshTimer)
  }, [])

  useEffect(() => {
    localStorage.removeItem('skipAutoRedirect')
  }, [])

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

  useEffect(() => {
    if (!user) return
    
    const fetchWeather = async () => {
      try {
        const location = 'תל אביב'
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
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    const fetchHebrewDate = async () => {
      try {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const url = `https://www.hebcal.com/converter?gy=${yyyy}&gm=${mm}&gd=${dd}&g2h=1&cfg=json&strict=1`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.hebrew) {
          setHebrewDate(data.hebrew);
        }
      } catch (e) {
        setHebrewDate('');
      }
    };
    fetchHebrewDate();
  }, []);

  useEffect(() => {
    const fetchShabbatTimes = async () => {
      try {
        console.log('🕯️ Starting to fetch shabbat times...');
        
        const today = new Date();
        const nextFriday = new Date(today);
        nextFriday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7);
        const year = nextFriday.getFullYear();
        const month = String(nextFriday.getMonth() + 1).padStart(2, '0');
        const day = String(nextFriday.getDate()).padStart(2, '0');

        const nextSaturday = new Date(nextFriday);
        nextSaturday.setDate(nextFriday.getDate() + 1);
        const saturdayYear = nextSaturday.getFullYear();
        const saturdayMonth = String(nextSaturday.getMonth() + 1).padStart(2, '0');
        const saturdayDay = String(nextSaturday.getDate()).padStart(2, '0');

        console.log(`📅 Fetching for date range: ${year}-${month}-${day} to ${saturdayYear}-${saturdayMonth}-${saturdayDay}`);
        
        const response = await fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&start=${year}-${month}-${day}&end=${saturdayYear}-${saturdayMonth}-${saturdayDay}&maj=on&min=off&ss=on&mod=off&mf=off&lg=h&le=y&s=on&geo=geoname&geonameid=293397&m=on&s=on&i=on&b=18&M=on&year=h`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📡 Hebcal API response:', data);
        
        const events = data.items || [];
        const candleLighting = events.find((event: any) => event.category === "candles");
        const havdalah = events.find((event: any) => event.category === "havdalah");
        const parsha = events.find((event: any) => event.category === "parashat");

        console.log('🕯️ Found events:', { candleLighting, havdalah, parsha });

        if (candleLighting && havdalah) {
          const entryTime = candleLighting.date.split('T')[1].slice(0, 5);
          const exitTime = havdalah.date.split('T')[1].slice(0, 5);
          const parshaTitle = parsha?.title || "לא נמצאה פרשה";
          
          console.log('✅ Setting shabbat times:', { entryTime, exitTime, parshaTitle });
          
          setShabbatTimes({
            entry: entryTime,
            exit: exitTime,
            parsha: parshaTitle
          });
        } else {
          console.log('⚠️ No candle lighting or havdalah found, using fallback');
          setShabbatTimes({ 
            entry: '19:30', 
            exit: '20:30', 
            parsha: 'פרשת השבוע' 
          });
        }
        
      } catch (e) {
        console.error('❌ Error fetching shabbat times:', e);
        setShabbatTimes({ 
          entry: '19:30', 
          exit: '20:30', 
          parsha: 'פרשת השבוע' 
        });
      }
    };
    
    fetchShabbatTimes();
    
    const dailyTimer = setInterval(fetchShabbatTimes, 86400000);
    
    return () => clearInterval(dailyTimer);
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900 font-hebrew">
        <div className="text-white text-5xl font-bold animate-fade-in">טוען...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900 font-hebrew">
        <div className="text-white text-5xl font-bold animate-fade-in">בניין לא נמצא</div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden font-hebrew"
      style={{
        background: style?.background_color ? 
          `linear-gradient(135deg, ${style.background_color}10, ${style.background_color}20, ${style.background_color}10)` : 
          'linear-gradient(135deg, #f8fafc, #e2e8f0, #f8fafc)',
        color: style?.text_color || '#1f2937',
      }}
      onClick={handleSecretClick}
    >
      {/* Top Bar - Enhanced Design */}
      <div 
        className="w-full shadow-lg px-6 py-4 relative"
        style={{
          background: style?.background_color ? 
            `linear-gradient(135deg, ${style.background_color}, ${style.background_color}DD, ${style.background_color})` : 
            'linear-gradient(135deg, #1d4ed8, #3730a3, #1d4ed8)',
          borderBottom: style?.background_color ? `2px solid ${style.background_color}60` : '2px solid rgba(59, 130, 246, 0.3)'
        }}
      >
        <div className="flex items-center justify-between">
          {/* Left Side - Building Info */}
          <div className="text-4xl font-bold tracking-wide text-white drop-shadow-lg flex items-center">
            ברוכים הבאים {user?.street_name} {user?.building_number}
          </div>
          
          {/* Center - Time with Hebrew Date */}
          <div className="absolute left-1/2 transform -translate-x-1/2 text-4xl md:text-5xl font-bold text-white flex items-center justify-center gap-8">
            <span className="text-2xl font-bold text-white/90">{hebrewDate}</span>
            <span className="text-5xl">{formatTime(currentTime)}</span>
            <span className="text-2xl text-white/80">{currentTime.toLocaleDateString('he-IL')}</span>
          </div>
          
          {/* Right Side - System Info */}
          <div className="text-right">
            <div 
              className="text-2xl font-bold mb-2 animate-pulse"
              style={{
                background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #06b6d4, #10b981, #f59e0b)',
                backgroundSize: '300% 300%',
                animation: 'gradientShift 3s ease-in-out infinite',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              שלג דיגיטל
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 p-6" style={{ height: 'calc(100vh - 6rem - 4rem)' }}>
        {/* Right Column - Management Info & Notices (30%) */}
        <div className="flex flex-col min-h-full" style={{ width: '30%' }}>
          {/* Management Info Card */}
          <div 
            className="px-6 py-4 w-full text-center transition-all duration-500 hover:shadow-2xl relative mb-6"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))',
              color: '#374151',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
              minHeight: '25vh'
            }}
          >
            <div className="flex items-center justify-center mb-6">
              <h3 className="text-5xl font-bold text-gray-800">פרטי ניהול</h3>
            </div>
            
            {user?.management_company && (
              <div className="text-3xl text-gray-700 mb-4 font-semibold">
                חברת ניהול: {user.management_company}
              </div>
            )}
            {user?.management_contact && (
              <div className="text-2xl text-gray-600 mb-4 flex items-center justify-center">
                איש קשר: {user.management_contact}
                <User className="w-8 h-8 ml-2" />
              </div>
            )}
            {user?.management_phone && (
              <div className="text-2xl text-gray-600 flex items-center justify-center">
                טלפון: {user.management_phone}
                <Phone className="w-8 h-8 ml-2" />
              </div>
            )}
          </div>
          
          {/* הודעות ועד */}
          <div className="w-full flex-1 flex flex-col">
            <div className="bg-red-600 text-white px-6 py-4 text-center font-bold tracking-wide text-5xl">
              הודעות ועד
              {notices.length > 0 && noticePaused && (
                <span className="mr-2 text-yellow-300 text-2xl align-middle">⏸️</span>
              )}
            </div>
                          <div 
                className="p-4 flex flex-col justify-center transition-all duration-300 hover:shadow-2xl relative flex-1"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))',
                  color: '#374151',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)'
                }}
              >
              {notices.length > 0 ? (
                <div 
                  className={`text-center transition-opacity duration-300 ${noticeFade ? 'opacity-0' : 'opacity-100'} cursor-pointer`}
                  onClick={() => setNoticePaused(!noticePaused)}
                  title={noticePaused ? "לחץ להפעלת קרוסלה" : "לחץ לעצירת קרוסלה"}
                >
                  <div className="font-bold text-4xl text-gray-800 mb-6 tracking-wide">
                    {notices[currentNoticeIndex]?.title || 'אין כותרת'}
                  </div>
                  <div className="text-gray-700 mb-8 text-3xl leading-relaxed">
                    {notices[currentNoticeIndex]?.content || 'אין תוכן'}
                  </div>
                  {notices[currentNoticeIndex]?.priority === 'high' && (
                    <div className="text-red-600 text-2xl font-bold">⚠️ עדיפות גבוהה</div>
                  )}
                </div>
                              ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-2xl mb-4">אין הודעות להצגה</div>
                    <div className="text-lg">הודעות חדשות יופיעו כאן</div>
                  </div>
                )}
            </div>
          </div>
          
                      {user?.welcome_text && (
              <div className="mt-4 text-2xl text-center font-bold text-blue-800 bg-blue-100 py-4 px-6 shadow-lg">
                {user.welcome_text}
              </div>
            )}
        </div>

        {/* Center Column - Image Carousel (40%) */}
        <div 
          className="h-full flex items-center justify-center transition-all duration-500 relative overflow-hidden" 
          style={{ 
            width: '40%'
          }}
        >
          {images.length > 0 ? (
            <img
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/building-images/${images[currentImageIndex]?.filename}`}
              alt="תמונת בניין"
              className="w-full h-full object-cover"
            />
                      ) : (
              <div className="text-center text-5xl text-gray-700 font-bold bg-white/90 p-12 shadow-lg">אין תמונות להצגה</div>
            )}
        </div>

        {/* Left Column - News Feed & Shabbat Times (30%) */}
        <div className="flex flex-col min-h-full" style={{ width: '30%' }}>
          <div className="flex-1 flex flex-col">
            <NewsColumn news={news} style={style} />
          </div>
          
          {/* Shabbat Times Card */}
          <div 
            className="p-4 w-full relative transition-all duration-500 hover:shadow-2xl mt-6"
            style={{
              background: style?.background_color ? 
                `linear-gradient(135deg, ${style.background_color}, ${style.background_color}DD, ${style.background_color})` : 
                'linear-gradient(135deg, #60a5fa, #3b82f6, #60a5fa)',
              color: '#ffffff',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Top Bar with Clock Icon */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/30">
              <div className="flex items-center">
                <span className="text-white text-3xl font-bold tracking-wide">זמני שבת</span>
              </div>
              <Clock className="w-10 h-10 text-white" />
            </div>
            
            {/* Main Content */}
            <div className="flex items-center justify-between">
              {/* Left Side - Times */}
                              <div className="text-right">
                  {shabbatTimes.parsha ? (
                    <div className="text-white font-bold text-2xl mb-4 tracking-wide">{shabbatTimes.parsha}</div>
                  ) : (
                    <div className="text-white/80 text-xl mb-4">טוען פרשת השבוע...</div>
                  )}
                  {shabbatTimes.entry ? (
                    <div className="text-white/90 text-xl mb-2">כניסת שבת: <span className="font-bold">{shabbatTimes.entry}</span></div>
                  ) : (
                    <div className="text-white/80 text-xl mb-2">טוען זמני שבת...</div>
                  )}
                  {shabbatTimes.exit ? (
                    <div className="text-white/90 text-xl">צאת שבת: <span className="font-bold">{shabbatTimes.exit}</span></div>
                  ) : (
                    <div className="text-white/80 text-xl">טוען זמני שבת...</div>
                  )}
                </div>
              
              {/* Right Side - Animated Candles */}
              <div className="flex items-center justify-center">
                <img 
                  src="/images/shabbat-candles.gif" 
                  alt="נרות שבת מונפשים" 
                  className="w-40 h-24"
                  style={{ filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.5))' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Widget - Bottom Bar */}
      <div 
        className="fixed bottom-0 left-0 w-full h-16 z-40 flex items-center justify-center text-white shadow-lg relative"
        style={{
          background: style?.background_color ? 
            `linear-gradient(135deg, ${style.background_color}, ${style.background_color}DD, ${style.background_color})` : 
            'linear-gradient(135deg, #3730a3, #2563eb, #3730a3)',
          borderTop: style?.background_color ? `2px solid ${style.background_color}60` : '2px solid rgba(59, 130, 246, 0.3)'
        }}
      >
        <WeatherWidget />
        
        {/* Hard Refresh Button */}
        <div className="absolute -top-6 left-6">
          <button
            onClick={handleHardRefresh}
            className="w-12 h-12 rounded-full shadow-lg border-2 border-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-110"
            title="רענון קשיח"
          >
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
          </button>
        </div>
        
        {/* Music Control Button */}
        <div className="absolute -top-6 right-6">
          <button
            onClick={toggleMusic}
            className={`w-12 h-12 rounded-full shadow-lg border-2 border-white transition-all duration-300 hover:scale-110 ${
              isMusicPlaying 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title={isMusicPlaying ? 'עצור מוזיקה' : 'הפעל מוזיקה'}
          >
            <div className="flex items-center justify-center">
              {isMusicPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  )
} 

// קומפוננטת עמודת חדשות מעוצבת עם כרטיסיות נפרדות
function NewsColumn({ news, style }: { news: NewsItem[], style: Style | null }) {
  // קיבוץ לפי מקור
  const grouped = news.reduce((acc: Record<string, NewsItem[]>, item: NewsItem) => {
    const key = item.source || 'אחר';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // סדר הצגה מועדף
  const order = ['ynet', 'ONE', 'גלובס'];
  const sourceTitles: Record<string, string> = {
    ynet: 'ynet - חדשות חמות',
    ONE: 'ONE - עדכוני ספורט',
    'גלובס': 'גלובס - כלכלה ומסחר',
  };

  // אינדקס נוכחי לכל קבוצה
  const [indexes, setIndexes] = useState<Record<string, number>>({ ynet: 0, ONE: 0, 'גלובס': 0 });
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
    }, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [news.length, grouped]);

  return (
    <div className="w-full flex flex-col h-full">
      {order.map((src, index) => (
                  <div 
            key={src} 
            className={`p-4 relative transition-all duration-500 hover:shadow-2xl ${index < order.length - 1 ? 'mb-6' : ''} flex-1`}
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))',
              color: '#374151',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
          <div className="text-2xl font-bold text-red-700 mb-6 border-b-2 border-red-200 pb-4 flex items-center tracking-wide">
            <Newspaper className="w-10 h-10 mr-4" />
            {sourceTitles[src]}
          </div>
          <div className="min-h-[4em] flex items-start">
            {grouped[src]?.length ? (
              <>
                <span className="mt-2 mr-4 text-xl text-blue-500">•</span>
                <span className="text-xl font-medium text-gray-800 leading-relaxed">
                  {grouped[src][indexes[src]]?.title}
                </span>
              </>
            ) : (
              <span className="text-gray-400 text-xl">אין עדכונים</span>
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
    if (widgetRef.current) {
      widgetRef.current.innerHTML = '';
    }
    const div = document.createElement('div');
    div.id = 'ww_4d5960b26d6ed';
    div.setAttribute('v', '1.3');
    div.setAttribute('loc', 'auto');
    div.setAttribute('a', '{"t":"responsive","lang":"he","sl_lpl":1,"ids":[],"font":"Arial","sl_ics":"one_a","sl_sot":"celsius","cl_bkg":"#512DA8","cl_font":"#FFFFFF","cl_cloud":"#FFFFFF","cl_persp":"#81D4FA","cl_sun":"#FFC107","cl_moon":"#FFC107","cl_thund":"#FF5722","cl_odd":"#0000000a","el_nme":3}');
    div.innerHTML = '<a href="https://weatherwidget.org/" id="ww_4d5960b26d6ed_u" target="_blank">Weather widget html</a>';
    widgetRef.current?.appendChild(div);

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://app3.weatherwidget.org/js/?id=ww_4d5960b26d6ed';
    widgetRef.current?.appendChild(script);

    return () => {
      if (widgetRef.current) widgetRef.current.innerHTML = '';
    };
  }, []);

  return (
    <div ref={widgetRef} className="w-full h-full flex items-center justify-center" />
  );
} 