'use client'

import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Database } from '../../lib/supabase'
import { Plus, Upload, Trash2, Eye, Download, Image as ImageIcon } from 'lucide-react'
import { logger } from '../../lib/logger'

type Image = Database['public']['Tables']['images']['Row']

interface ImageManagerProps {
  userId: string
}

export default function ImageManager({ userId }: ImageManagerProps) {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchImages()
  }, [userId])

  const fetchImages = async () => {
    if (!supabase) return
    
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        setError('שגיאה בטעינת תמונות')
        return
      }

      // בדיקה ותיקון נתונים
      const validatedImages = (data || []).map(image => ({
        ...image,
        original_name: image.original_name || image.filename?.split('/').pop() || 'תמונה ללא שם',
        filename: image.filename || '',
        size_bytes: image.size_bytes || 0,
        created_at: image.created_at || new Date().toISOString(),
        is_active: Boolean(image.is_active)
      }))

      console.log('✅ תמונות נטענו:', validatedImages)
      setImages(validatedImages)
    } catch (err) {
      setError('שגיאה בטעינת תמונות')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('אנא בחר קובץ תמונה בלבד')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('גודל הקובץ לא יכול לעלות על 5MB')
      return
    }

    // Additional security checks
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('סוג קובץ לא נתמך. אנא השתמש ב-JPG, PNG, GIF או WebP')
      return
    }

    // Check file name for suspicious patterns
    const fileName = file.name.toLowerCase()
    if (fileName.includes('..') || fileName.includes('script') || fileName.includes('javascript')) {
      logger.security(`Suspicious filename detected: ${fileName}`, { fileName, userId })
      setError('שם הקובץ מכיל תווים אסורים')
      return
    }

    setSelectedFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect({ target: { files: e.dataTransfer.files } } as any)
    }
  }

  const uploadImage = async () => {
    if (!selectedFile || !supabase) return

    // בדיקת מגבלת כמות תמונות (20 תמונות למשתמש)
    if (images.length >= 20) {
      setError('לא ניתן להעלות יותר מ-20 תמונות. מחק תמונות קיימות תחילה.')
      return
    }

    // בדיקת מגבלת גודל כולל (100MB למשתמש)
    const totalSize = images.reduce((sum, img) => sum + (img.size_bytes || 0), 0)
    const maxTotalSize = 100 * 1024 * 1024 // 100MB
    if (totalSize + selectedFile.size > maxTotalSize) {
      setError('חריגה ממגבלת הגודל הכולל (100MB). מחק תמונות קיימות תחילה.')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    try {
      // Resize image before upload
      console.log('🔄 מתחיל עיבוד התמונה...')
      const resizedFile = await resizeImage(selectedFile)
      console.log('✅ התמונה עובדה בהצלחה')
      
      // Generate unique filename
      const fileExt = resizedFile.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('building-images')
        .upload(fileName, resizedFile)

      if (uploadError) {
        setError('שגיאה בהעלאת התמונה')
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('building-images')
        .getPublicUrl(fileName)

      // Save to database
      const { error: dbError } = await supabase
        .from('images')
        .insert({
          filename: fileName,
          original_name: selectedFile.name, // שמור את השם המקורי
          url: urlData.publicUrl,
          size_bytes: resizedFile.size, // שמור את הגודל המעובד
          mime_type: resizedFile.type,
          user_id: userId
        })

      if (dbError) {
        setError('שגיאה בשמירת פרטי התמונה')
        return
      }

             // Log successful upload
       logger.fileUpload(userId, selectedFile.name, resizedFile.size)
       
       // Reset form and refresh list
       setSelectedFile(null)
       setPreviewUrl(null)
       setUploadProgress(0)
       fetchImages()
    } catch (err) {
      setError('שגיאה בהעלאת התמונה')
    } finally {
      setUploading(false)
    }
  }

  const deleteImage = async (image: Image) => {
    if (!supabase) {
      setError('Supabase client לא זמין')
      return
    }

    // בדיקה אם התמונה נמצאת בקרוסלה
    const isInCarousel = image.is_active
    
    const confirmMessage = isInCarousel 
      ? `התמונה "${image.original_name || image.filename?.split('/').pop()}" נמצאת כרגע בקרוסלה.\n\nהאם אתה בטוח שברצונך למחוק אותה?\n\nהתמונה תיעלם מהתצוגה מיד.`
      : `האם אתה בטוח שברצונך למחוק את התמונה "${image.original_name || image.filename?.split('/').pop()}"?\n\nפעולה זו אינה הפיכה.`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('building-images')
        .remove([image.filename])

      if (storageError) {
        setError('שגיאה במחיקת התמונה מהאחסון')
        return
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('id', image.id)

      if (dbError) {
        setError('שגיאה במחיקת פרטי התמונה')
        return
      }

      // Refresh the list
      fetchImages()
      
      // הצג הודעת הצלחה
      if (isInCarousel) {
        alert('✅ התמונה נמחקה בהצלחה!\n\nהתמונה הוסרה מהקרוסלה ותיעלם מהתצוגה.')
      }
    } catch (err) {
      setError('שגיאה במחיקת התמונה')
    }
  }

  const toggleImageStatus = async (image: Image) => {
    if (!supabase) {
      setError('Supabase client לא זמין')
      return
    }

    try {
      const { error } = await supabase
        .from('images')
        .update({ is_active: !image.is_active })
        .eq('id', image.id)

      if (error) {
        setError('שגיאה בעדכון סטטוס התמונה')
        return
      }

      // Refresh the list
      fetchImages()
      
      // הצג הודעת הצלחה
      const action = !image.is_active ? 'הוספה לקרוסלה' : 'השהייה מהקרוסלה'
      alert(`✅ התמונה ${action} בהצלחה!`)
    } catch (err) {
      setError('שגיאה בעדכון סטטוס התמונה')
    }
  }

  const pauseImage = async (image: Image) => {
    if (!supabase) {
      setError('Supabase client לא זמין')
      return
    }

    try {
      const { error } = await supabase
        .from('images')
        .update({ is_active: false })
        .eq('id', image.id)

      if (error) {
        setError('שגיאה בהשהיית התמונה')
        return
      }

      // Refresh the list
      fetchImages()
      
      alert(`✅ התמונה "${image.original_name || image.filename?.split('/').pop()}" הושהתה מהקרוסלה בהצלחה!`)
    } catch (err) {
      setError('שגיאה בהשהיית התמונה')
    }
  }

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // הגדר גודל מקסימלי לתצוגה
        const maxWidth = 1920  // רוחב מקסימלי
        const maxHeight = 1080 // גובה מקסימלי
        
        let { width, height } = img
        
        // חשב יחס גובה-רוחב
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        // הגדר גודל הקנבס
        canvas.width = width
        canvas.height = height
        
        // צייר את התמונה המעובדת
        ctx?.drawImage(img, 0, 0, width, height)
        
        // המר ל-Blob
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(resizedFile)
          } else {
            resolve(file) // אם יש בעיה, החזר את הקובץ המקורי
          }
        }, file.type, 0.8) // איכות 80%
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">טוען תמונות...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">ניהול תמונות</h2>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>סה"כ תמונות: {images.length}</span>
          <span>•</span>
          <span>בקרוסלה: {images.filter(img => img.is_active).length}</span>
          <span>•</span>
          <span>גודל כולל: {formatFileSize(images.reduce((sum, img) => sum + (img.size_bytes || 0), 0))}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <>
        {/* Upload Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">העלה תמונה חדשה</h3>
          
          <div className="space-y-4">
            <div 
              className={`flex items-center justify-center w-full transition-all duration-200 ${
                dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className={`w-8 h-8 mb-4 transition-colors ${dragActive ? 'text-blue-500' : 'text-gray-500'}`} />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">לחץ להעלאה</span> או גרור ושחרר
                  </p>
                                       <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP עד 5MB</p>
                     <p className="text-xs text-blue-600 font-medium">התמונות יעובדו אוטומטית לגודל אופטימלי</p>
                     <p className="text-xs text-orange-600 font-medium">מקסימום 20 תמונות, 100MB כולל</p>
                  {dragActive && (
                    <p className="text-xs text-blue-600 font-medium mt-2">שחרר כאן להעלאה</p>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            {previewUrl && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-4 mb-3">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg shadow-sm"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedFile?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedFile && formatFileSize(selectedFile.size)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {selectedFile?.type}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      setPreviewUrl(null)
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
                
                {uploading && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>מעבד ומעלה...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      התמונה מעובדת לגודל אופטימלי לתצוגה
                    </p>
                  </div>
                )}
                
                <button
                  onClick={uploadImage}
                  disabled={uploading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      מעלה...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Plus className="w-4 h-4 mr-2" />
                      העלה תמונה
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Images List */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">תמונות קיימות</h3>
          
                     {/* Warning if no active images */}
           {images.length > 0 && images.filter(img => img.is_active).length === 0 && (
             <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
               <div className="flex items-center">
                 <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                 </svg>
                 <div>
                   <p className="font-medium">אין תמונות בקרוסלה</p>
                   <p className="text-sm">הפעל תמונות כדי שיופיעו בתצוגת הלוח</p>
                 </div>
               </div>
             </div>
           )}
           
           {/* Warning if approaching limit */}
           {images.length >= 15 && (
             <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-md">
               <div className="flex items-center">
                 <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                 </svg>
                 <div>
                   <p className="font-medium">מתקרב למגבלה</p>
                   <p className="text-sm">נשארו {20 - images.length} מקומות לתמונות</p>
                 </div>
               </div>
             </div>
           )}
          
          {images.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">אין תמונות עדיין</p>
              <p className="text-sm">העלה תמונה ראשונה כדי להתחיל</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    <img
                      src={image.url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/building-images/${image.filename}`}
                      alt={image.original_name || image.filename?.split('/').pop() || 'תמונה'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        console.error('❌ שגיאה בטעינת תמונה:', image.filename)
                        e.currentTarget.src = '/images/placeholder.png'
                      }}
                    />
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                        <a
                          href={image.url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/building-images/${image.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                          title="צפה בתמונה"
                        >
                          <Eye className="w-5 h-5 text-gray-600" />
                        </a>
                        <a
                          href={image.url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/building-images/${image.filename}`}
                          download={image.original_name || image.filename?.split('/').pop() || 'תמונה'}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                          title="הורד תמונה"
                        >
                          <Download className="w-5 h-5 text-gray-600" />
                        </a>
                        <button
                          onClick={() => toggleImageStatus(image)}
                          className={`p-3 rounded-full shadow-lg transition-colors ${
                            image.is_active 
                              ? 'bg-yellow-100 hover:bg-yellow-200' 
                              : 'bg-green-100 hover:bg-green-200'
                          }`}
                          title={image.is_active ? 'הסר מהקרוסלה' : 'הוסף לקרוסלה'}
                        >
                          {image.is_active ? (
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        {image.is_active && (
                          <button
                            onClick={() => pauseImage(image)}
                            className="p-3 bg-orange-100 hover:bg-orange-200 rounded-full shadow-lg transition-colors"
                            title="השהה מהקרוסלה"
                          >
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => deleteImage(image)}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                          title="מחק תמונה"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Status indicator */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        image.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {image.is_active ? 'בקרוסלה' : 'לא פעיל'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <p className="text-sm font-medium text-gray-900 truncate mb-1">
                      {image.original_name || image.filename?.split('/').pop() || 'תמונה ללא שם'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{image.size_bytes ? formatFileSize(image.size_bytes) : 'גודל לא ידוע'}</span>
                      <span>{image.created_at ? new Date(image.created_at).toLocaleDateString('he-IL') : 'תאריך לא ידוע'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    </div>
  )
}
