'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Database } from '../../../lib/supabase'

type User = Database['public']['Tables']['users']['Row']
type Notice = Database['public']['Tables']['notices']['Row']
type Image = Database['public']['Tables']['images']['Row']
type Style = Database['public']['Tables']['styles']['Row']

interface TVDisplayProps {
  params: {
    id: string
  }
}

export default function TVDisplayPage({ params }: TVDisplayProps) {
  const [user, setUser] = useState<User | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [style, setStyle] = useState<Style | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [weather, setWeather] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', params.id)
          .single()

        if (!userData) {
          console.error('User not found')
          return
        }

        setUser(userData)

        // Fetch active notices
        const { data: noticesData } = await supabase
          .from('notices')
          .select('*')
          .eq('user_id', params.id)
          .eq('is_active', true)
          .gte('start_date', new Date().toISOString())
          .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
          .order('priority', { ascending: false })

        setNotices(noticesData || [])

        // Fetch active images
        const { data: imagesData } = await supabase
          .from('images')
          .select('*')
          .eq('user_id', params.id)
          .eq('is_active', true)
          .gte('start_date', new Date().toISOString())
          .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
          .order('display_order', { ascending: true })

        setImages(imagesData || [])

        // Fetch style
        const { data: styleData } = await supabase
          .from('styles')
          .select('*')
          .eq('user_id', params.id)
          .single()

        setStyle(styleData)

        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!style) return

    // Auto-advance slides
    const slideTimer = setInterval(() => {
      const totalSlides = notices.length + images.length
      if (totalSlides > 0) {
        setCurrentSlide((prev) => (prev + 1) % totalSlides)
      }
    }, style.slide_duration || 5000)

    return () => clearInterval(slideTimer)
  }, [notices.length, images.length, style])

  useEffect(() => {
    // Fetch weather data
    const fetchWeather = async () => {
      try {
        const response = await fetch('/api/weather?location=Tel Aviv')
        const data = await response.json()
        setWeather(data)
      } catch (error) {
        console.error('Error fetching weather:', error)
      }
    }

    fetchWeather()
  }, [])

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

  const totalSlides = notices.length + images.length
  const isNoticeSlide = currentSlide < notices.length
  const currentNotice = isNoticeSlide ? notices[currentSlide] : null
  const currentImage = !isNoticeSlide ? images[currentSlide - notices.length] : null

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

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundColor: style?.background_color || '#FFFFFF',
        color: style?.text_color || '#000000'
      }}
    >
      {/* Main Content Area */}
      <div className="h-[calc(100vh-80px)] flex items-center justify-center p-8">
        {totalSlides === 0 ? (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              {user.street_name} {user.building_number}
            </h1>
            <p className="text-xl">אין תוכן להצגה כרגע</p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isNoticeSlide && currentNotice ? (
              // Notice Slide
              <div className="text-center max-w-4xl">
                <h1 className="text-5xl font-bold mb-8">
                  {user.street_name} {user.building_number}
                </h1>
                <div className="text-3xl mb-8">
                  {currentNotice.content}
                </div>
                <div className="text-2xl">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xl mt-4">
                  {formatHebrewDate(currentTime)}
                </div>
              </div>
            ) : currentImage ? (
              // Image Slide
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${currentImage.filename}`}
                  alt="Building notice"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              // Fallback
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">
                  {user.street_name} {user.building_number}
                </h1>
                <p className="text-xl">אין תוכן להצגה כרגע</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-black bg-opacity-80 text-white flex items-center justify-between px-8">
        <div className="flex items-center space-x-4">
          {weather && (
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🌤️</span>
              <span className="text-xl">{weather.temperature}°C</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-xl">{formatTime(currentTime)}</span>
          <span className="text-xl">{formatHebrewDate(currentTime)}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-lg">שקף {currentSlide + 1} מתוך {totalSlides}</span>
        </div>
      </div>
    </div>
  )
} 