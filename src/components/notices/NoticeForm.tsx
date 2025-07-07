'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { Database } from '../../lib/supabase'
import { X, Save, Calendar, Clock, AlertCircle } from 'lucide-react'

type Notice = Database['public']['Tables']['notices']['Row']

const noticeSchema = z.object({
  message_text: z.string().min(1, 'טקסט ההודעה הוא שדה חובה').max(500, 'הטקסט לא יכול להיות ארוך מ-500 תווים'),
  priority: z.enum(['low', 'medium', 'high']),
  start_date: z.string().min(1, 'תאריך התחלה הוא שדה חובה'),
  end_date: z.string().optional(),
  is_active: z.boolean()
})

type NoticeFormData = z.infer<typeof noticeSchema>

interface NoticeFormProps {
  notice?: Notice | null
  userId: string
  onSave: () => void
  onCancel: () => void
}

export default function NoticeForm({ notice, userId, onSave, onCancel }: NoticeFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<NoticeFormData>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      message_text: notice?.message_text || '',
      priority: (notice?.priority as unknown as string) === 'low' || (notice?.priority as unknown as string) === 'high' ? (notice?.priority as unknown as 'low' | 'medium' | 'high') : 'medium',
      start_date: notice?.start_date ? new Date(notice.start_date).toISOString().slice(0, 16) : '',
      end_date: notice?.end_date ? new Date(notice.end_date).toISOString().slice(0, 16) : '',
      is_active: notice?.is_active ?? true
    }
  })

  const startDate = watch('start_date')
  const endDate = watch('end_date')

  useEffect(() => {
    // Validate end date is after start date
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      setError('תאריך הסיום חייב להיות אחרי תאריך ההתחלה')
    } else {
      setError('')
    }
  }, [startDate, endDate])

  const onSubmit = async (data: NoticeFormData) => {
    if (error) return

    setLoading(true)
    try {
      const noticeData = {
        message_text: data.message_text,
        priority: data.priority,
        start_date: data.start_date,
        end_date: data.end_date || null,
        is_active: data.is_active,
        user_id: userId
      }

      if (notice) {
        // Update existing notice
        const { error: updateError } = await supabase
          .from('notices')
          .update(noticeData)
          .eq('id', notice.id)

        if (updateError) {
          setError('שגיאה בעדכון הודעה')
          return
        }
      } else {
        // Create new notice
        const { error: insertError } = await supabase
          .from('notices')
          .insert(noticeData)

        if (insertError) {
          setError('שגיאה ביצירת הודעה')
          return
        }
      }

      onSave()
    } catch (err) {
      setError('שגיאה בשמירת הודעה')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {notice ? 'ערוך הודעה' : 'הוסף הודעה חדשה'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              טקסט ההודעה *
            </label>
            <textarea
              {...register('message_text')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="הכנס את תוכן ההודעה..."
            />
            {errors.message_text && (
              <p className="mt-1 text-sm text-red-600">{errors.message_text.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              עדיפות
            </label>
            <select
              {...register('priority')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">נמוכה</option>
              <option value="medium">בינונית</option>
              <option value="high">גבוהה</option>
            </select>
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תאריך התחלה *
              </label>
              <div className="relative">
                <input
                  {...register('start_date')}
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תאריך סיום (אופציונלי)
              </label>
              <div className="relative">
                <input
                  {...register('end_date')}
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              {...register('is_active')}
              type="checkbox"
              id="is_active"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="mr-2 text-sm text-gray-700">
              הודעה פעילה
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading || !!error}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  שומר...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Save className="w-4 h-4 mr-2" />
                  שמור
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 