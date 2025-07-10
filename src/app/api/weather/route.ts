import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location') || 'Tel Aviv'
  const apiKey = process.env.OPENWEATHER_API_KEY

  if (!apiKey) {
    // Return mock weather data instead of error
    return NextResponse.json({
      temperature: 22,
      description: 'בהיר',
      icon: '01d',
      humidity: 60,
      windSpeed: 3.5,
    })
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric&lang=he`
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