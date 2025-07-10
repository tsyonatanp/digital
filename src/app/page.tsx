'use client'

import Link from 'next/link'
import { Building2, Monitor, Users, Settings } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const { user } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        {/* Main Title */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <Building2 className="w-16 h-16 text-blue-600 ml-4" />
            <Monitor className="w-16 h-16 text-indigo-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            לוח מודעות דיגיטלי
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            מערכת תצוגה חכמה לבניינים - הציגו הודעות, תמונות ומידע חשוב על מסך הטלוויזיה בכניסה לבניין
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <Monitor className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">תצוגה חכמה</h3>
            <p className="text-gray-600">
              הציגו תוכן על מסך הטלוויזיה בכניסה לבניין בקרוסלה אוטומטית
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <Users className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ניהול קל</h3>
            <p className="text-gray-600">
              ממשק ניהול פשוט לוועד הבית לעדכון הודעות והעלאת תמונות
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <Building2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">לכל בניין</h3>
            <p className="text-gray-600">
              תוכן ייעודי לכל בניין עם פרטי התקשרות ומידע מתוזמן
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center justify-center"
            >
              <Settings className="w-5 h-5 ml-2" />
              ניהול מערכת (מנהלים)
            </Link>
            <Link
              href="/register"
              className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-8 rounded-lg border-2 border-blue-600 transition-colors"
            >
              הרשמה לבניין חדש
            </Link>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            יש לכם כבר בניין רשום? פנו למנהל המערכת לקבלת קישור התצוגה.
          </p>
        </div>
      </div>
    </div>
  )
} 