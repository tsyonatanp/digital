'use client'

import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/auth'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff, 
  LogOut,
  Building,
  Mail,
  Phone,
  Calendar
} from 'lucide-react'

interface User {
  id: string
  email: string
  street_name: string
  building_number: string
  management_company: string | null
  management_contact: string | null
  management_phone: string | null
  management_email: string | null
  is_active: boolean
  is_super_admin: boolean
  email_verified_at: string | null
  email_verification_sent_at: string | null
  trial_expires_at: string | null
  created_at: string
  last_login: string | null
}

export default function AdminPage() {
  const { user, setUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAdminAccess()
  }, [user])

  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!supabase) {
      setError('Supabase client לא זמין')
      return
    }

    try {
      // בדוק אם המשתמש הוא מנהל
      const { data: profile, error } = await supabase
        .from('users')
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

      if (error || !profile?.is_super_admin) {
        setError('אין לך הרשאות מנהל')
        router.push('/dashboard')
        return
      }

      fetchUsers()
    } catch (err) {
      setError('שגיאה בבדיקת הרשאות')
      router.push('/dashboard')
    }
  }

  const fetchUsers = async () => {
    if (!supabase) {
      setError('Supabase client לא זמין')
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setError('שגיאה בטעינת משתמשים')
        return
      }

      setUsers(data || [])
    } catch (err) {
      setError('שגיאה בטעינת משתמשים')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (!supabase) {
      setError('Supabase client לא זמין')
      return
    }

    setUpdating(userId)
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId)

      if (error) {
        setError('שגיאה בעדכון סטטוס משתמש')
        return
      }

      // עדכן את הרשימה המקומית
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_active: !currentStatus } : u
      ))
    } catch (err) {
      setError('שגיאה בעדכון סטטוס משתמש')
    } finally {
      setUpdating(null)
    }
  }

  const handleResendVerification = async (userEmail: string) => {
    if (!supabase) {
      setError('Supabase client לא זמין')
      return
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setError('שגיאה בשליחת אימייל אישור')
        return
      }

      alert('אימייל אישור נשלח בהצלחה!')
    } catch (err) {
      setError('שגיאה בשליחת אימייל אישור')
    }
  }

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    router.push('/login')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    )
  }

  if (error && !users.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <XCircle className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">שגיאה</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            חזרה לדשבורד
          </button>
        </div>
      </div>
    )
  }

  const activeUsers = users.filter(u => u.is_active)
  const suspendedUsers = users.filter(u => !u.is_active)
  const uniqueBuildings = new Set(users.map(u => `${u.street_name} ${u.building_number}`)).size

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="h-8 w-8 mr-2 text-blue-600" />
                ניהול משתמשים
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.email} [התנתק]
              </span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                מנהל
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 flex items-center text-sm"
              >
                <LogOut className="h-4 w-4 mr-1" />
                התנתק
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">סה"כ משתמשים</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">בניינים</p>
                <p className="text-2xl font-bold text-gray-900">{uniqueBuildings}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">משתמשים פעילים</p>
                <p className="text-2xl font-bold text-gray-900">{activeUsers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">משתמשים מושעים</p>
                <p className="text-2xl font-bold text-gray-900">{suspendedUsers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">רשימת משתמשים</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    משתמש
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    בניין
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פרטי קשר
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    תאריך רישום
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    אישור אימייל
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    סטטוס
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-blue-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.is_super_admin ? 'מנהל' : 'משתמש רגיל'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {user.street_name} {user.building_number}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.management_contact && (
                          <div className="flex items-center mb-1">
                            <Users className="h-4 w-4 text-gray-400 mr-2" />
                            {user.management_contact}
                          </div>
                        )}
                        {user.management_phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            {user.management_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {formatDate(user.created_at)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {user.email_verified_at ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            מאושר
                          </span>
                        ) : (
                          <div className="flex flex-col space-y-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              לא מאושר
                            </span>
                            <button
                              onClick={() => handleResendVerification(user.email)}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              שלח מחדש
                            </button>
                          </div>
                        )}
                        {user.trial_expires_at && (
                          <div className="text-xs text-gray-500">
                            ניסיון עד: {formatDate(user.trial_expires_at)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          פעיל
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-4 w-4 mr-1" />
                          מושעה
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                        disabled={updating === user.id}
                        className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${
                          user.is_active
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        } disabled:opacity-50`}
                      >
                        {updating === user.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        ) : user.is_active ? (
                          <XCircle className="h-4 w-4 mr-1" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        {user.is_active ? 'השעה' : 'הפעל'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 