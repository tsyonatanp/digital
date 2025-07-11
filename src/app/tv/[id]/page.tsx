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

  // הוספת useEffect לטעינת ווידג'ט מזג האוויר
  useEffect(() => {
    const loadWeatherWidget = () => {
      // מסיר ווידג'ט קיים אם יש
      const existingWidget = document.getElementById('weatherwidget-io-js')
      if (existingWidget) {
        document.body.removeChild(existingWidget)
      }
      
      // מסיר div קיים אם יש
      const existingDiv = document.getElementById('ww_168a241545936')
      if (existingDiv) {
        existingDiv.remove()
      }

      // יוצר div חדש לווידג'ט
      const widgetDiv = document.createElement('div')
      widgetDiv.id = 'ww_168a241545936'
      widgetDiv.className = 'weatherwidget-io'
      widgetDiv.setAttribute('data-label_1', 'מזג האוויר')
      widgetDiv.setAttribute('data-label_2', user?.street_name || 'גלבוע')
      widgetDiv.setAttribute('data-theme', 'pure')
      widgetDiv.setAttribute('data-basecolor', '#FFFFFF')
      widgetDiv.setAttribute('data-textcolor', '#000000')
      widgetDiv.setAttribute('data-highcolor', '#FF0000')
      widgetDiv.setAttribute('data-lowcolor', '#0000FF')
      widgetDiv.setAttribute('data-suncolor', '#FFD700')
      widgetDiv.setAttribute('data-mooncolor', '#CCCCCC')
      widgetDiv.setAttribute('data-cloudcolor', '#CCCCCC')
      widgetDiv.setAttribute('data-cloudfill', '#FFFFFF')
      widgetDiv.setAttribute('data-raincolor', '#0066CC')
      widgetDiv.setAttribute('data-snowcolor', '#FFFFFF')
      
      // מוסיף את הDiv למיקום הנכון
      const weatherContainer = document.getElementById('weather-container')
      if (weatherContainer) {
        weatherContainer.appendChild(widgetDiv)
      }

      // יוצר ומוסיף את הסקריפט
      const script = document.createElement('script')
      script.id = 'weatherwidget-io-js'
      script.src = 'https://weatherwidget.io/js/widget.min.js'
      script.async = true
      document.body.appendChild(script)
    }

    // טעינה מחדש של הווידג'ט כשהקומפוננטה מתמונטת
    const timer = setTimeout(loadWeatherWidget, 100)

    return () => {
      clearTimeout(timer)
      const script = document.getElementById('weatherwidget-io-js')
      if (script) {
        document.body.removeChild(script)
      }
    }
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
          <div id="weather-container" className="mt-8 w-full text-center">
            {/* הווידג'ט יטען כאן אוטומטית */}
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