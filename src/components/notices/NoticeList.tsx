'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Database } from '../../lib/supabase'
import { Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

type Notice = Database['public']['Tables']['notices']['Row']

interface NoticeListProps {
  userId: string
  onAddNotice: () => void
  onEditNotice: (notice: Notice) => void
}

export default function NoticeList({ userId, onAddNotice, onEditNotice }: NoticeListProps) {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchNotices()
  }, [userId])

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        setError('שגיאה בטעינת הודעות')
        return
      }

      setNotices(data || [])
    } catch (err) {
      setError('שגיאה בטעינת הודעות')
    } finally {
      setLoading(false)
    }
  }

  const deleteNotice = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק הודעה זו?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id)

      if (error) {
        setError('שגיאה במחיקת הודעה')
        return
      }

      // Refresh the list
      fetchNotices()
    } catch (err) {
      setError('שגיאה במחיקת הודעה')
    }
  }

  const toggleNoticeStatus = async (notice: Notice) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_active: !notice.is_active })
        .eq('id', notice.id)

      if (error) {
        setError('שגיאה בעדכון סטטוס הודעה')
        return
      }

      // Refresh the list
      fetchNotices()
    } catch (err) {
      setError('שגיאה בעדכון סטטוס הודעה')
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: he })
  }

  const getStatusBadge = (notice: Notice) => {
    const now = new Date()
    const createdDate = new Date(notice.created_at)
    const expiresDate = notice.expires_at ? new Date(notice.expires_at) : null

    if (!notice.is_active) {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">לא פעיל</span>
    }

    if (createdDate > now) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">מתוזמן</span>
    }

    if (expiresDate && expiresDate < now) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">פג תוקף</span>
    }

    return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">פעיל</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">טוען הודעות...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">הודעות</h2>
        <button
          onClick={onAddNotice}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          הוסף הודעה
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {notices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>אין הודעות עדיין</p>
          <p className="text-sm">הוסף הודעה ראשונה כדי להתחיל</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(notice)}
                    <span className="text-sm text-gray-500">
                      עדיפות: {notice.priority}
                    </span>
                  </div>
                  
                  <p className="text-gray-900 mb-3 line-clamp-2">
                    {notice.content}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>נוצר: {formatDate(notice.created_at)}</span>
                    </div>
                    {notice.expires_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>פג תוקף: {formatDate(notice.expires_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleNoticeStatus(notice)}
                    className={`px-3 py-1 text-sm rounded ${
                      notice.is_active
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {notice.is_active ? 'השבת' : 'הפעל'}
                  </button>
                  
                  <button
                    onClick={() => onEditNotice(notice)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => deleteNotice(notice.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 