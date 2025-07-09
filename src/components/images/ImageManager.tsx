'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Database } from '../../lib/supabase'
import { Plus, Upload, Trash2, Eye, Download, Image as ImageIcon } from 'lucide-react'

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

  useEffect(() => {
    fetchImages()
  }, [userId])

  const fetchImages = async () => {
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

      setImages(data || [])
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

    setSelectedFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('building-images')
        .upload(fileName, selectedFile)

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
          file_name: selectedFile.name,
          filename: fileName,
          file_url: urlData.publicUrl,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          user_id: userId
        })

      if (dbError) {
        setError('שגיאה בשמירת פרטי התמונה')
        return
      }

      // Reset form and refresh list
      setSelectedFile(null)
      setPreviewUrl(null)
      fetchImages()
    } catch (err) {
      setError('שגיאה בהעלאת התמונה')
    } finally {
      setUploading(false)
    }
  }

  const deleteImage = async (image: Image) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק תמונה זו?')) {
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
    } catch (err) {
      setError('שגיאה במחיקת התמונה')
    }
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
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">העלה תמונה חדשה</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">לחץ להעלאה</span> או גרור ושחרר
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF עד 5MB</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          {previewUrl && (
            <div className="flex items-center gap-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile?.name}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedFile && formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                onClick={uploadImage}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    מעלה...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    העלה
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
        
        {images.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>אין תמונות עדיין</p>
            <p className="text-sm">העלה תמונה ראשונה כדי להתחיל</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-gray-100 relative">
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/building-images/${image.filename}`}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <div className="opacity-0 hover:opacity-100 transition-opacity flex gap-2">
                      <a
                        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/building-images/${image.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </a>
                      <a
                        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/building-images/${image.filename}`}
                        download={image.filename}
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </a>
                      <button
                        onClick={() => deleteImage(image)}
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {image.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(image.size_bytes)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(image.created_at).toLocaleDateString('he-IL')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 