import { NextRequest, NextResponse } from 'next/server'
import { logger } from '../../../lib/logger'

// Simple in-memory rate limiting (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(ip)
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }) // 1 minute
    return true
  }
  
  if (limit.count >= 10) { // 10 requests per minute
    return false
  }
  
  limit.count++
  return true
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Log API request
  logger.apiRequest('/api/weather', ip, userAgent)
  
  // Rate limiting
  if (!checkRateLimit(ip)) {
    logger.rateLimitViolation(ip, '/api/weather')
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location') || 'Tel Aviv'
  
  // Input validation
  if (typeof location !== 'string' || location.length > 100) {
    return NextResponse.json(
      { error: 'Invalid location parameter' },
      { status: 400 }
    )
  }
  
  // Sanitize location input
  const sanitizedLocation = location.replace(/[<>\"'&]/g, '')
  
  const apiKey = process.env.OPENWEATHER_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Weather API key not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(sanitizedLocation)}&appid=${apiKey}&units=metric&lang=he`
    )

    if (!response.ok) {
      throw new Error('Weather API request failed')
    }

    const data = await response.json()

    return NextResponse.json({
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
    })
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
} 