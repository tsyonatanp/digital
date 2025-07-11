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
  // הוספת state למזג אוויר
  const [weatherData, setWeatherData] = useState<{ condition: string; temp: string }>({ condition: '', temp: '' })

  // Resolve params (could be Promise or object)
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await Promise.resolve(params)
      setResolvedParams(resolved)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (!resolvedParams) return

    const fetchData = async () => {
      try {
        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', resolvedParams.id)
          .single()

        if (userError) {
          console.error('Error fetching user:', userError.message)
          return
        }

        if (!userData) {
          console.error('User not found')
          return
        }

        console.log('User data:', userData) // לבדיקה
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
        const { data: styleData, error: styleError } = await supabase
          .from('styles')
          .select('*')
          .eq('user_id', resolvedParams.id)
          .single()

        if (styleError) {
          console.error('Error fetching style:', styleError)
        }

        setStyle(styleData)

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

  // החלפת useEffect של מזג האוויר
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // בניית מחרוזת מיקום על בסיס נתוני המשתמש
        let location = 'Tel-Aviv' // ברירת מחדל
        if (user && user.street_name) {
          // נשתמש ברחוב בלבד מכיוון שאין שדה עיר
          location = user.street_name
        }
        
        console.log('Fetching weather for location:', location)
        const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=%C|%t&lang=he`)
        const data = await response.text()
        console.log('Weather data received:', data)
        const [condition, temp] = data.split('|')
        setWeatherData({ condition, temp: temp.trim() })
      } catch (error) {
        console.error('Error fetching weather:', error)
      }
    }

    if (user) { // רק אם יש נתוני משתמש
      fetchWeather()
      const weatherInterval = setInterval(fetchWeather, 30 * 60 * 1000) // עדכון כל 30 דקות

      return () => clearInterval(weatherInterval)
    }
  }, [user])

  // הוספת useEffect לטעינת סקריפט מזג האוויר
  useEffect(() => {
    const loadWeatherWidget = () => {
      const existingScript = document.getElementById('weather-widget-script')
      if (existingScript) {
        document.body.removeChild(existingScript)
      }

      const script = document.createElement('script')
      script.id = 'weather-widget-script'
      script.src = 'https://app3.weatherwidget.org/js/?id=ww_168a241545936'
      script.async = true
      document.body.appendChild(script)
    }

    // טעינה מחדש של הווידג'ט כשהקומפוננטה מתמונטת
    loadWeatherWidget()

    return () => {
      const script = document.getElementById('weather-widget-script')
      if (script) {
        document.body.removeChild(script)
      }
    }
  }, [])

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
      <div className="h-screen flex">
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
          <div className="mt-8 w-full text-center">
            <div className="text-2xl font-bold mb-2">
              מזג האוויר ב{user?.street_name ? user.street_name : 'תל אביב'}
            </div>
            <div className="text-xl">{weatherData.condition}</div>
            <div className="text-3xl font-bold mt-2">{weatherData.temp}</div>
          </div>
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
    </div>
  )
} 