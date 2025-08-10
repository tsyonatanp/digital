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
    id: 'deep-wine',
    name: '🍷 בורדו יוקרתי',
    description: 'יין כהה עם ורדרד בהיר - יוקרה וחום',
    preview: {
      backgroundColor: '#3B0A2A',
      textColor: '#F8E9F0',
      accentColor: '#FF4E84'
    }
  },
  {
    id: 'pistachio-cream',
    name: '🌿 ירוק פיסטוק עם שמנת',
    description: 'אוורירי ונעים - קהילתי ומודרני',
    preview: {
      backgroundColor: '#EFFBF1',
      textColor: '#1B3B2F',
      accentColor: '#A5D6A7'
    }
  },
  {
    id: 'sunset-orange',
    name: '🌇 כתום שקיעה רך',
    description: 'חם ונעים - מתאים לחדר אוכל',
    preview: {
      backgroundColor: '#FFF3E0',
      textColor: '#E65100',
      accentColor: '#FFB74D'
    }
  },
  {
    id: 'lilac-modern',
    name: '🪻 סגול לילך נקי',
    description: 'אוורירי ועדכני - מתאים לוועדים',
    preview: {
      backgroundColor: '#EDE7F6',
      textColor: '#4527A0',
      accentColor: '#9575CD'
    }
  },
  {
    id: 'sky-contrast',
    name: '🔵 כחול שמים ונייטרלים',
    description: 'רענן ומודרני - מקצועי עם קונטרסט מצוין',
    preview: {
      backgroundColor: '#E3F2FD',
      textColor: '#0D47A1',
      accentColor: '#2196F3'
    }
  },
  {
    id: 'clean-night',
    name: '⚫ שחור נקי עם טורקיז',
    description: 'מתוחכם ודרמטי - מתאים ללילות',
    preview: {
      backgroundColor: '#121212',
      textColor: '#E0F7FA',
      accentColor: '#00BCD4'
    }
  },
  {
    id: 'warm-beige',
    name: '🥖 בז חם וטבעי',
    description: 'טבעי ונעים - מתאים לכל מקום',
    preview: {
      backgroundColor: '#F5F5DC',
      textColor: '#8B4513',
      accentColor: '#D2B48C'
    }
  },
  {
    id: 'cool-gray',
    name: '🌫️ אפור קר ומודרני',
    description: 'מקצועי ונקי - מתאים לעסקים',
    preview: {
      backgroundColor: '#F8F9FA',
      textColor: '#495057',
      accentColor: '#6C757D'
    }
  },
  {
    id: 'forest-green',
    name: '🌲 ירוק יער טבעי',
    description: 'טבעי ומרגיע - מתאים לגינות',
    preview: {
      backgroundColor: '#F0F8F0',
      textColor: '#2E7D32',
      accentColor: '#66BB6A'
    }
  },
  {
    id: 'ocean-blue',
    name: '🌊 כחול אוקיינוס עמוק',
    description: 'מרגיע ועמוק - מתאים לכניסות',
    preview: {
      backgroundColor: '#E0F2F1',
      textColor: '#00695C',
      accentColor: '#26A69A'
    }
  }
]

export default function StyleSelector({ userId, currentStyleId, onStyleChange }: StyleSelectorProps) {
  const [styles, setStyles] = useState<Style[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCustomStyle, setShowCustomStyle] = useState(false)
  const [customColors, setCustomColors] = useState({
    backgroundColor: '#FFFFFF',
    textColor: '#000000'
  })


  useEffect(() => {
    fetchStyles()
  }, [userId])

  const fetchStyles = async () => {
    if (!supabase) {
      console.error('❌ Supabase לא זמין')
      return
    }
    
    if (!userId) {
      console.error('❌ userId לא זמין:', userId)
      setError('מזהה משתמש לא זמין')
      setLoading(false)
      return
    }
    
    console.log('🔍 טוען סגנונות עבור משתמש:', userId)
    
    try {
      const { data, error } = await supabase
        .from('styles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ שגיאה בטעינת סגנונות:', error)
        setError('שגיאה בטעינת סגנונות')
        return
      }

      console.log('✅ סגנונות נטענו בהצלחה:', data)
      setStyles(data || [])
    } catch (err) {
      console.error('💥 שגיאה כללית בטעינת סגנונות:', err)
      setError('שגיאה בטעינת סגנונות')
    } finally {
      setLoading(false)
    }
  }

  // פונקציה לחישוב צבע טקסט אוטומטי
  const getContrastingTextColor = (backgroundColor: string): string => {
    // המרה ל-RGB
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // חישוב בהירות פשוט
    const brightness = (r + g + b) / 3
    
    // אם רקע בהיר (מעל 128) → טקסט שחור
    // אם רקע כהה (מתחת ל-128) → טקסט לבן
    const textColor = brightness > 128 ? '#000000' : '#ffffff'
    
    console.log('🎨 חישוב צבעים:', {
      backgroundColor,
      r, g, b,
      brightness,
      textColor
    })
    
    return textColor
  }

  // פונקציה ליצירת סגנון עם צבעים אוטומטיים
  const createStyleWithAutoColors = async (backgroundColor: string, styleName: string, textColor?: string) => {
    if (!supabase) return
    
    // אם יש צבע טקסט מוגדר, השתמש בו. אחרת, חשב אוטומטית
    const finalTextColor = textColor || getContrastingTextColor(backgroundColor)
    
    try {
      // מחק סגנון קיים אם יש
      if (styles.length > 0) {
        await supabase
          .from('styles')
          .delete()
          .eq('user_id', userId)
      }
      
      // צור סגנון חדש
      const { data, error } = await supabase
        .from('styles')
        .insert({
          user_id: userId,
          name: styleName,
          background_color: backgroundColor,
          text_color: finalTextColor,
          layout_type: 'standard',
          text_size: 'normal',
          weather_enabled: true,
          news_enabled: true,
          slide_duration: 8000
        })
        .select()
        .single()

      if (error) {
        console.error('❌ שגיאה ביצירת סגנון:', error)
        setError('שגיאה ביצירת סגנון')
        return
      }

      // עדכן state
      setStyles([data])
      onStyleChange(data.id)
    } catch (err) {
      console.error(' שגיאה כללית ביצירת סגנון:', err)
      setError('שגיאה ביצירת סגנון')
    }
  }

  const createStyle = async (styleData: typeof predefinedStyles[0]) => {
    // השתמש בצבע הטקסט מהסגנון המוכן
    await createStyleWithAutoColors(
      styleData.preview.backgroundColor, 
      styleData.name, 
      styleData.preview.textColor
    )
  }

  const createCustomStyle = async () => {
    if (!supabase) return
    
    try {
      // מחק סגנון קיים אם יש
      if (styles.length > 0) {
        await supabase
          .from('styles')
          .delete()
          .eq('user_id', userId)
      }
      
      // צור סגנון מותאם אישית
      const { data, error } = await supabase
        .from('styles')
        .insert({
          user_id: userId,
          name: 'סגנון מותאם אישית',
          background_color: customColors.backgroundColor,
          text_color: customColors.textColor,
          layout_type: 'standard',
          text_size: 'normal',
          weather_enabled: true,
          news_enabled: true,
          slide_duration: 8000,

        })
        .select()
        .single()

      if (error) {
        console.error('❌ שגיאה ביצירת סגנון מותאם:', error)
        setError('שגיאה ביצירת סגנון מותאם')
        return
      }

      // עדכן state
      setStyles([data])
      onStyleChange(data.id)
      setShowCustomStyle(false)
    } catch (err) {
      console.error('💥 שגיאה כללית ביצירת סגנון מותאם:', err)
      setError('שגיאה ביצירת סגנון מותאם')
    }
  }

  const deleteStyle = async (styleId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק סגנון זה?') || !supabase) {
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
    const predefinedStyle = predefinedStyles.find(p => p.id === styleId)
    if (!predefinedStyle) return false
    
    return styles.some(style => 
      style.background_color === predefinedStyle.preview.backgroundColor &&
      style.text_color === predefinedStyle.preview.textColor
    )
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
              {styles.find(s => s.id === currentStyleId) ? 'סגנון נבחר' : 'סגנון לא ידוע'}
            </span>
          </div>
        </div>
      )}

      {/* Available Styles */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">סגנונות זמינים</h3>
        
        {/* Custom Style Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">סגנון מותאם אישית</h4>
            <button
              onClick={() => setShowCustomStyle(!showCustomStyle)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showCustomStyle ? 'הסתר' : 'הצג'}
            </button>
          </div>
          
          {showCustomStyle && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    צבע רקע
                  </label>
                  <input
                    type="color"
                    value={customColors.backgroundColor}
                    onChange={(e) => setCustomColors(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    צבע טקסט
                  </label>
                  <input
                    type="color"
                    value={customColors.textColor}
                    onChange={(e) => setCustomColors(prev => ({ ...prev, textColor: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              

              
              {/* Preview */}
              <div className="border border-gray-300 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">תצוגה מקדימה:</h5>
                <div
                  className="w-full h-20 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: customColors.backgroundColor }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: customColors.textColor }}
                  >
                    טקסט לדוגמה
                  </span>
                </div>
              </div>
              
              <button
                onClick={createCustomStyle}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                צור סגנון מותאם
              </button>
            </div>
          )}
        </div>
        
        {/* Style Recommendations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-blue-900 mb-3">המלצות לפי סוג בניין:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-blue-800">בניין מגורים:</span>
              <span className="text-blue-700"> בז חם, ירוק פיסטוק, כחול שמים</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">בניין משרדים:</span>
              <span className="text-blue-700"> אפור קר, כחול אוקיינוס, שחור נקי</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">בניין עם גינה:</span>
              <span className="text-blue-700"> ירוק יער, בז חם, בורדו יוקרתי</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">בניין יוקרתי:</span>
              <span className="text-blue-700"> בורדו יוקרתי, שחור נקי, סגול לילך</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predefinedStyles.map((style) => {
            const isUsed = isPredefinedStyleUsed(style.id)
            const usedStyle = styles.find(s => 
              s.background_color === style.preview.backgroundColor &&
              s.text_color === style.preview.textColor
            )
            
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
                      {isUsed ? 'נבחר' : 'לחץ לבחירה'}
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

      {/* Selected Style */}
      {styles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">סגנון נבחר</h3>
          
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
                        סגנון נבחר
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">{style.name}</h4>
                    <p className="text-sm text-gray-500">גודל טקסט: {style.text_size || 'רגיל'}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      נבחר
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