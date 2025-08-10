'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Mail, Lock, HelpCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { LoginFormData } from '@/types'

console.log('🔐 LoginForm נטען')

const loginSchema = z.object({
  email: z.string().email('אימייל לא תקין'),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
})

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const { signIn, resetPassword, isLoading } = useAuth()
  const user = useAuthStore((state) => state.user)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    console.log('🔐 ניסיון התחברות עם:', data.email)
    
    // בדוק אם Supabase זמין
    if (!supabase) {
      alert('❌ שגיאה: משתני סביבה חסרים. אנא צור קובץ .env.local עם NEXT_PUBLIC_SUPABASE_URL ו-NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return
    }
    
    const result = await signIn(data.email, data.password)
    
    if (result.error) {
      console.error('❌ שגיאה בהתחברות:', result.error)
    } else {
      console.log('✅ התחברות הצליחה!')
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      alert('אנא הכנס את האימייל שלך')
      return
    }

    setForgotPasswordLoading(true)
    try {
      const result = await resetPassword(forgotPasswordEmail)
      if (result.success) {
        setShowForgotPassword(false)
        setForgotPasswordEmail('')
      }
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            לוח מודעות דיגיטלי
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            התחבר לחשבון שלך
          </p>
        </div>
        <form 
          className="mt-8 space-y-6" 
          method="POST"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                אימייל
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="הכנס את האימייל שלך"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                סיסמה
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="הכנס את הסיסמה שלך"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            
            {/* Forgot Password Link */}
            <div className="text-left">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                שכחתי סיסמה
              </button>
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  מתחבר...
                </div>
              ) : (
                'התחבר'
              )}
            </button>
          </div>
          <div className="text-center">
            <a
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              אין לך חשבון? הירשם כאן
            </a>
          </div>
        </form>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">איפוס סיסמה</h3>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  הכנס את האימייל שלך ונשלח לך הוראות לאיפוס הסיסמה
                </p>
                
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
                    אימייל
                  </label>
                  <input
                    type="email"
                    id="forgot-email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="הכנס את האימייל שלך"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleForgotPassword}
                    disabled={forgotPasswordLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forgotPasswordLoading ? (
                      <div className="flex items-center justify-center">
                        <LoadingSpinner size="sm" color="white" className="mr-2" />
                        שולח...
                      </div>
                    ) : (
                      'שלח הוראות'
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 