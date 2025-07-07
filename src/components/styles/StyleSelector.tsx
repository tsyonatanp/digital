'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Database } from '../../lib/supabase'
import { Check, Palette, Monitor } from 'lucide-react'

type Style = Database['public']['Tables']['styles']['Row']

interface StyleSelectorProps {
  userId: string
  currentStyleId?: string | null
  onStyleChange: (styleId: string) => void
}

const predefinedStyles = [
  {
    id: 'modern-blue',
    name: 'כחול מודרני',
    description: 'עיצוב נקי עם דגש על כחול',
    preview: {
      backgroundColor: '#1e40af',
      textColor: '#ffffff',
      accentColor: '#3b82f6'
    }
  },
  {
    id: 'warm-orange',
    name: 'כתום חם',
    description: 'עיצוב חם ונעים עם גווני כתום',
    preview: {
      backgroundColor: '#ea580c',
      textColor: '#ffffff',
      accentColor: '#f97316'
    }
  },
  {
    id: 'elegant-dark',
    name: 'כהה אלגנטי',
    description: 'עיצוב כהה ומעודן',
    preview: {
      backgroundColor: '#1f2937',
      textColor: '#ffffff',
      accentColor: '#6b7280'
    }
  },
  {
    id: 'fresh-green',
    name: 'ירוק רענן',
    description: 'עיצוב טבעי עם גווני ירוק',
    preview: {
      backgroundColor: '#059669',
      textColor: '#ffffff',
      accentColor: '#10b981'
    }
  },
  {
    id: 'classic-white',
    name: 'לבן קלאסי',
    description: 'עיצוב נקי ומינימליסטי',
    preview: {
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#6b7280'
    }
  },
  {
    id: 'vibrant-purple',
    name: 'סגול חי',
    description: 'עיצוב דינמי עם גווני סגול',
    preview: {
      backgroundColor: '#7c3aed',
      textColor: '#ffffff',
      accentColor: '#a855f7'
    }
  }
]

export default function StyleSelector({ userId, currentStyleId, onStyleChange }: StyleSelectorProps) {
  const [styles, setStyles] = useState<Style[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStyles()
  }, [userId])

  const fetchStyles = async () => {
    try {
      const { data, error } = await supabase
        .from('styles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        setError('שגיאה בטעינת סגנונות')
        return
      }

      setStyles(data || [])
    } catch (err) {
      setError('שגיאה בטעינת סגנונות')
    } finally {
      setLoading(false)
    }
  }

  const createStyle = async (styleData: typeof predefinedStyles[0]) => {
    try {
      const { data, error } = await supabase
        .from('styles')
        .insert({
          layout_type: styleData.name,
          background_color: styleData.preview.backgroundColor,
          text_color: styleData.preview.textColor,
          text_size: 'medium',
          weather_enabled: true,
          news_enabled: true,
          slide_duration: 8,
          user_id: userId
        })
        .select()
        .single()

      if (error) {
        setError('שגיאה ביצירת סגנון')
        return
      }

      // Add to local state
      setStyles(prev => [data, ...prev])
      
      // Select the new style
      onStyleChange(data.id)
    } catch (err) {
      setError('שגיאה ביצירת סגנון')
    }
  }

  const deleteStyle = async (styleId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק סגנון זה?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('styles')
        .delete()
        .eq('id', styleId)

      if (error) {
        setError('שגיאה במחיקת סגנון')
        return
      }

      // Remove from local state
      setStyles(prev => prev.filter(style => style.id !== styleId))
    } catch (err) {
      setError('שגיאה במחיקת סגנון')
    }
  }

  const isStyleSelected = (styleId: string) => {
    return currentStyleId === styleId
  }

  const isPredefinedStyleUsed = (styleId: string) => {
    return styles.some(style => style.layout_type === predefinedStyles.find(p => p.id === styleId)?.name)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">טוען סגנונות...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">בחירת סגנון תצוגה</h2>
        <Palette className="w-6 h-6 text-gray-400" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Current Selection */}
      {currentStyleId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">סגנון נבחר</h3>
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800">
              {styles.find(s => s.id === currentStyleId)?.layout_type || 'סגנון לא ידוע'}
            </span>
          </div>
        </div>
      )}

      {/* Predefined Styles */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">סגנונות מוכנים מראש</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predefinedStyles.map((style) => {
            const isUsed = isPredefinedStyleUsed(style.id)
            const usedStyle = styles.find(s => s.layout_type === style.name)
            
            return (
              <div
                key={style.id}
                className={`relative bg-white border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  isStyleSelected(usedStyle?.id || '') 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  if (isUsed && usedStyle) {
                    onStyleChange(usedStyle.id)
                  } else {
                    createStyle(style)
                  }
                }}
              >
                {isStyleSelected(usedStyle?.id || '') && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                
                <div className="space-y-3">
                  <div
                    className="w-full h-20 rounded-md"
                    style={{ backgroundColor: style.preview.backgroundColor }}
                  >
                    <div className="flex items-center justify-center h-full">
                      <span
                        className="text-sm font-medium"
                        style={{ color: style.preview.textColor }}
                      >
                        תצוגה מקדימה
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">{style.name}</h4>
                    <p className="text-sm text-gray-500">{style.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {isUsed ? 'נוצר' : 'לחץ ליצירה'}
                    </span>
                    
                    {isUsed && usedStyle && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteStyle(usedStyle.id)
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        מחק
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Custom Styles */}
      {styles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">סגנונות מותאמים אישית</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {styles.map((style) => (
              <div
                key={style.id}
                className={`relative bg-white border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  isStyleSelected(style.id) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onStyleChange(style.id)}
              >
                {isStyleSelected(style.id) && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                
                <div className="space-y-3">
                  <div
                    className="w-full h-20 rounded-md"
                    style={{ 
                      backgroundColor: style.background_color || '#ffffff',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div className="flex items-center justify-center h-full">
                      <span
                        className="text-sm font-medium"
                        style={{ color: style.text_color || '#1f2937' }}
                      >
                        {style.layout_type}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">{style.layout_type}</h4>
                    <p className="text-sm text-gray-500">גודל טקסט: {style.text_size}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      מותאם אישית
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteStyle(style.id)
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      מחק
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 