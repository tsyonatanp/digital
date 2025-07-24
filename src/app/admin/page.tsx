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
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            חזור לדשבורד
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">ניהול משתמשים</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                מנהל: {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-1" />
                התנתק
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">סה"כ משתמשים</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">משתמשים פעילים</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.is_active).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">משתמשים מושעים</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => !u.is_active).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">בניינים</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(users.map(u => `${u.street_name} ${u.building_number}`)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
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
                    סטטוס
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-gray-900">
                            {userItem.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {userItem.is_super_admin ? 'מנהל' : 'משתמש רגיל'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {userItem.street_name} {userItem.building_number}
                      </div>
                      {userItem.management_company && (
                        <div className="text-sm text-gray-500">
                          {userItem.management_company}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {userItem.management_contact && (
                          <div className="flex items-center mb-1">
                            <Users className="w-4 h-4 mr-1 text-gray-400" />
                            {userItem.management_contact}
                          </div>
                        )}
                        {userItem.management_phone && (
                          <div className="flex items-center mb-1">
                            <Phone className="w-4 h-4 mr-1 text-gray-400" />
                            {userItem.management_phone}
                          </div>
                        )}
                        {userItem.management_email && (
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1 text-gray-400" />
                            {userItem.management_email}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(userItem.created_at)}
                      </div>
                      {userItem.last_login && (
                        <div className="text-sm text-gray-500">
                          כניסה אחרונה: {formatDate(userItem.last_login)}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userItem.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {userItem.is_active ? 'פעיל' : 'מושעה'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleToggleUserStatus(userItem.id, userItem.is_active)}
                        disabled={updating === userItem.id}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${
                          userItem.is_active
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {updating === userItem.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : userItem.is_active ? (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            השעה
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            הפעל
                          </>
                        )}
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