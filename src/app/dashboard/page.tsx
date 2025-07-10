'use client'

import React, { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'
import { useAuthStore } from '../../store/auth'
import { supabase } from '../../lib/supabase'
import { LogOut, User, Settings, Bell, Image, Palette } from 'lucide-react'
import NoticeList from '../../components/notices/NoticeList'
import NoticeForm from '../../components/notices/NoticeForm'
import ImageManager from '../../components/images/ImageManager'
import StyleSelector from '../../components/styles/StyleSelector'
import { Database } from '../../lib/supabase'

type Notice = Database['public']['Tables']['notices']['Row']

interface UserProfile {
  id: string
  email: string
  street_name: string
  building_number: string
  apartment_number: string
  management_contact: string
  management_phone: string
  management_email: string
  selected_style_id?: string | null
}

export default function Dashboard() {
  console.log('🏠 Dashboard Component נטען!')
  
  const { user, setUser } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('profile')
  const [showNoticeForm, setShowNoticeForm] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [allUsers, setAllUsers] = useState<UserProfile[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  useEffect(() => {
    // בדיקת אימות אדמין
    const adminAuth = localStorage.getItem('admin_authenticated')
    if (adminAuth !== 'true') {
      console.log('❌ אין הרשאת אדמין - מעבר לדף אדמין')
      window.location.href = '/admin'
      return
    }
    
    setIsAdminAuthenticated(true)
    console.log('✅ מנהל מחובר - טעינת דשבורד')
    
    // טען את כל המשתמשים
    fetchAllUsers()
  }, [])

  const fetchAllUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ שגיאה בטעינת משתמשים:', error)
        setError('שגיאה בטעינת רשימת משתמשים')
        return
      }
      
      setAllUsers(users || [])
      setLoading(false)
    } catch (err) {
      console.error('💥 שגיאה כללית בטעינת משתמשים:', err)
      setError('שגיאה בטעינת רשימת משתמשים')
      setLoading(false)
    }
  }

  // כאשר בוחרים משתמש, טוען את הפרופיל שלו
  useEffect(() => {
    if (selectedUserId) {
      fetchUserProfile(selectedUserId)
    }
  }, [selectedUserId])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('❌ שגיאה בטעינת פרופיל משתמש:', error)
        setError('שגיאה בטעינת פרופיל המשתמש')
        return
      }
      
      setProfile(userProfile)
    } catch (err) {
      console.error('💥 שגיאה כללית בטעינת פרופיל:', err)
      setError('שגיאה בטעינת פרופיל')
    }
  }

  const fetchProfile = async () => {
    try {
      console.log('📡 טוען פרופיל למשתמש:', user?.id)
      
      // Get user profile from database
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()
      
      if (error) {
        console.error('❌ שגיאה בטעינת פרופיל:', error)
        setError('שגיאה בטעינת פרופיל המשתמש')
        return
      }
      
      if (profile) {
        console.log('✅ פרופיל נטען בהצלחה:', profile)
        setProfile(profile)
      } else {
        console.log('❌ לא נמצא פרופיל למשתמש')
        setError('לא נמצא פרופיל למשתמש זה')
      }
      
    } catch (err) {
      console.error('💥 שגיאה כללית בטעינת פרופיל:', err)
      setError('שגיאה בטעינת הפרופיל')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    localStorage.removeItem('admin_authenticated')
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    window.location.href = '/admin'
  }

  const handleAddNotice = () => {
    setEditingNotice(null)
    setShowNoticeForm(true)
  }

  const handleEditNotice = (notice: Notice) => {
    setEditingNotice(notice)
    setShowNoticeForm(true)
  }

  const handleNoticeSave = () => {
    setShowNoticeForm(false)
    setEditingNotice(null)
  }

  const handleNoticeCancel = () => {
    setShowNoticeForm(false)
    setEditingNotice(null)
  }

  const handleStyleChange = async (styleId: string) => {
    if (!profile) return

    try {
      const { error } = await supabase
        .from('users')
        .update({ selected_style_id: styleId })
        .eq('id', profile.id)

      if (error) {
        setError('שגיאה בעדכון הסגנון הנבחר')
        return
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, selected_style_id: styleId } : null)
    } catch (err) {
      setError('שגיאה בעדכון הסגנון הנבחר')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">טוען...</div>
      </div>
    )
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">בודק הרשאות מנהל...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">לוח מודעות דיגיטלי</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">מנהל מערכת</span>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <LogOut className="w-4 h-4 mr-2" />
                התנתק
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* User Selection */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">בחר בניין לניהול</h2>
            {allUsers.length === 0 ? (
              <p className="text-gray-500">אין עדיין בניינים רשומים במערכת</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allUsers.map((userItem) => (
                  <button
                    key={userItem.id}
                    onClick={() => setSelectedUserId(userItem.id)}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      selectedUserId === userItem.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">{userItem.street_name} {userItem.building_number}</div>
                    <div className="text-sm text-gray-500">{userItem.email}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {userItem.id.substring(0, 8)}...
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedUserId && profile && (
          <div>
            {/* Navigation Tabs */}
            <div className="mb-8">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'profile'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-4 h-4 mr-2" />
                  פרטי בניין
                </button>
            <button
              onClick={() => setActiveTab('notices')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'notices'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bell className="w-4 h-4 mr-2" />
              הודעות
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'images'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Image className="w-4 h-4 mr-2" />
              תמונות
            </button>
            <button
              onClick={() => setActiveTab('styles')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'styles'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Palette className="w-4 h-4 mr-2" />
              סגנונות
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'profile' && (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">פרטי בניין</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שם רחוב
                  </label>
                  <input
                    type="text"
                    value={profile.street_name}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    מספר בניין
                  </label>
                  <input
                    type="text"
                    value={profile.building_number}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    מספר דירה
                  </label>
                  <input
                    type="text"
                    value={profile.apartment_number}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    איש קשר לניהול
                  </label>
                  <input
                    type="text"
                    value={profile.management_contact}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    טלפון לניהול
                  </label>
                  <input
                    type="tel"
                    value={profile.management_phone}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    אימייל לניהול
                  </label>
                  <input
                    type="email"
                    value={profile.management_email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  שמור שינויים
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notices' && (
            <div className="p-6">
              <NoticeList
                userId={selectedUserId}
                onAddNotice={handleAddNotice}
                onEditNotice={handleEditNotice}
              />
            </div>
          )}

          {activeTab === 'images' && (
            <div className="p-6">
              <ImageManager userId={selectedUserId} />
            </div>
          )}

          {activeTab === 'styles' && (
            <div className="p-6">
              <StyleSelector
                userId={selectedUserId}
                currentStyleId={profile.selected_style_id}
                onStyleChange={handleStyleChange}
              />
            </div>
          )}
        </div>
          </div>
        )}
      </div>

      {/* Notice Form Modal */}
      {showNoticeForm && selectedUserId && (
        <NoticeForm
          notice={editingNotice}
          userId={selectedUserId}
          onSave={handleNoticeSave}
          onCancel={handleNoticeCancel}
        />
      )}
    </div>
  )
} 