'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Database } from '../../../lib/supabase'
import { useRef } from 'react'

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
      { day: 'ה', icon: '☀️', high: '30', low: '22' },
      { day: 'ו', icon: '⛅', high: '31', low: '24' },
      { day: 'ש', icon: '☀️', high: '30', low: '22' },
      { day: 'א', icon: '🌧️', high: '29', low: '22' },
      { day: 'ב', icon: '☀️', high: '30', low: '22' },
      { day: 'ג', icon: '☀️', high: '30', low: '23' },
      { day: 'ד', icon: '☀️', high: '30', low: '23' }
    ]
  })

  // הוספת useEffect לקבלת מזג אוויר אמיתי
  useEffect(() => {
    if (!user) return
    
    const fetchWeather = async () => {
      try {
        const location = user.street_name || 'תל אביב'
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
      <div className="flex" style={{ height: 'calc(100vh - 10rem)' }}>
        {/* Right Column - Welcome Text & Clock (25%) */}
        <div className="w-1/4 p-4 flex flex-col items-center justify-center border-l">
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

        {/* Center Column - Image Carousel (50%) */}
        <div className="w-2/4 h-full flex items-center justify-center">
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

        {/* Left Column - News Feed (25%) */}
        <div className="w-1/4 p-4 flex flex-col items-center justify-center border-r">
          <h2 className="text-3xl font-bold mb-6 text-center">חדשות</h2>
          {news.length > 0 ? (
            <div className="text-xl text-center">
              <a href={news[currentNewsIndex].link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {news[currentNewsIndex].title}
              </a>
              <div className="text-sm mt-2 text-gray-600">
                מקור: {news[currentNewsIndex].source}
              </div>
            </div>
          ) : (
            <div className="text-center">
              טוען חדשות...
            </div>
          )}
        </div>
      </div>

      {/* Weather Widget - Full Width at Bottom */}
      <div className="w-full h-40 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden">
        <div className="flex items-center h-full px-6 text-white">
          {/* Current Weather */}
          <div className="flex items-center space-x-4 ml-6">
            <div className="text-right">
              <div className="text-lg font-medium">מזג האוויר ב{user?.street_name || 'תל אביב'}</div>
              <div className="text-2xl font-bold">{weatherData.current}</div>
            </div>
          </div>
          
          {/* Weekly Forecast */}
          <div className="flex flex-1 justify-center items-center space-x-8 mx-8">
            {weatherData.forecast.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-medium mb-1">{day.day}</div>
                <div className="text-2xl mb-1">{day.icon}</div>
                <div className="text-sm">
                  <div className="font-bold">{day.high}°</div>
                  <div className="text-blue-200">{day.low}°</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Current Temperature Large Display */}
          <div className="text-left ml-6">
            <div className="text-6xl font-bold">
              {weatherData.current.match(/\d+/)?.[0] || '22'}°C
            </div>
            <div className="text-lg">☀️</div>
          </div>
        </div>
      </div>
    </div>
  )
} 