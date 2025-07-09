'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import { Eye, EyeOff, Mail, Lock, Building, MapPin, User, Phone } from 'lucide-react'

const registerSchema = z.object({
  email: z.string().email('אימייל לא תקין'),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
  confirmPassword: z.string(),
  street_name: z.string().min(2, 'שם רחוב חייב להכיל לפחות 2 תווים'),
  building_number: z.string().min(1, 'מספר בניין הוא שדה חובה'),
  apartment_number: z.string().min(1, 'מספר דירה הוא שדה חובה'),
  management_company: z.string().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('אימייל לא תקין').optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "סיסמאות אינן תואמות",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const setUser = useAuthStore((state) => state.setUser)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    if (!supabase) {
      setError('שגיאה בחיבור למערכת')
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('🔐 רישום משתמש חדש:', data.email)
      
      // Sign up with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            street_name: data.street_name,
            building_number: data.building_number,
            apartment_number: data.apartment_number,
            management_contact: data.contact_person,
            management_phone: data.contact_phone,
            management_email: data.contact_email
          }
        }
      })

      if (authError) {
        console.error('❌ שגיאה ברישום:', authError)
        setError(authError.message)
        return
      }

      if (authData.user) {
        console.log('✅ רישום הצלח! משתמש:', authData.user)
        
        // Create user profile in database
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: data.email,
            street_name: data.street_name,
            building_number: data.building_number,
            apartment_number: data.apartment_number,
            management_contact: data.contact_person || null,
            management_phone: data.contact_phone || null,
            management_email: data.contact_email || null
          })

        if (profileError) {
          console.error('❌ שגיאה ביצירת פרופיל:', profileError)
          setError('שגיאה ביצירת פרופיל המשתמש')
          return
        }

        console.log('✅ פרופיל נוצר בהצלחה!')
        setUser(authData.user)
        
        // Show success message
        setSuccess('🎉 הרשמה הושלמה בהצלחה! בדוק את האימייל שלך לאישור החשבון.')
        setError('')
        
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login'
        }, 3000)
      }
      
    } catch (err) {
      console.error('💥 שגיאה כללית ברישום:', err)
      setError('שגיאה בהרשמה. נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            הרשמה חדשה
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            צור חשבון חדש לבניין שלך
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
                  type="email"
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
                  type={showPassword ? 'text' : 'password'}
                  className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="הכנס סיסמה"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                אימות סיסמה
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="הכנס סיסמה שוב"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="street_name" className="block text-sm font-medium text-gray-700">
                שם רחוב *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('street_name')}
                  type="text"
                  className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="הכנס שם רחוב"
                />
              </div>
              {errors.street_name && (
                <p className="mt-1 text-sm text-red-600">{errors.street_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="building_number" className="block text-sm font-medium text-gray-700">
                מספר בניין *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('building_number')}
                  type="text"
                  className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="הכנס מספר בניין"
                />
              </div>
              {errors.building_number && (
                <p className="mt-1 text-sm text-red-600">{errors.building_number.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="apartment_number" className="block text-sm font-medium text-gray-700">
                מספר דירה *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('apartment_number')}
                  type="text"
                  className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="הכנס מספר דירה"
                />
              </div>
              {errors.apartment_number && (
                <p className="mt-1 text-sm text-red-600">{errors.apartment_number.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="management_company" className="block text-sm font-medium text-gray-700">
                חברת ניהול
              </label>
              <input
                {...register('management_company')}
                type="text"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="הכנס שם חברת ניהול"
              />
            </div>

            <div>
              <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700">
                איש קשר
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('contact_person')}
                  type="text"
                  className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="הכנס שם איש קשר"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700">
                טלפון איש קשר
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('contact_phone')}
                  type="tel"
                  className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="הכנס מספר טלפון"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700">
                אימייל איש קשר
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('contact_email')}
                  type="email"
                  className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="הכנס אימייל איש קשר"
                />
              </div>
              {errors.contact_email && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_email.message}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-center">
              {success}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'נרשם...' : 'הרשם'}
            </button>
          </div>

          <div className="text-center">
            <a
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              יש לך כבר חשבון? התחבר כאן
            </a>
          </div>
        </form>
      </div>
    </div>
  )
} 