import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { FileValidationResult } from '@/types'

// Utility function for combining CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// File validation
export function validateFile(file: File): FileValidationResult {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'סוג קובץ לא נתמך. אנא בחר קובץ תמונה (JPG, PNG, GIF, WebP)'
    }
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'גודל הקובץ לא יכול לעלות על 5MB'
    }
  }

  return { isValid: true }
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format date
export function formatDate(date: Date | string, locale: string = 'he-IL'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format time
export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Generate unique filename
export function generateUniqueFilename(originalName: string, userId: string): string {
  const fileExt = originalName.split('.').pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `${userId}/${timestamp}_${random}.${fileExt}`
}

// Validate email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push('סיסמה חייבת להכיל לפחות 6 תווים')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('סיסמה חייבת להכיל אות גדולה')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('סיסמה חייבת להכיל אות קטנה')
  }
  
  if (!/\d/.test(password)) {
    errors.push('סיסמה חייבת להכיל מספר')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Get priority color
export function getPriorityColor(priority: 'low' | 'medium' | 'high'): string {
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

// Get status badge
export function getStatusBadge(notice: { is_active: boolean; created_at: string; expires_at?: string | null }) {
  const now = new Date()
  const createdDate = new Date(notice.created_at)
  const expiresDate = notice.expires_at ? new Date(notice.expires_at) : null

  if (!notice.is_active) {
    return { text: 'לא פעיל', className: 'bg-gray-100 text-gray-600' }
  }

  if (createdDate > now) {
    return { text: 'מתוזמן', className: 'bg-yellow-100 text-yellow-800' }
  }

  if (expiresDate && expiresDate < now) {
    return { text: 'פג תוקף', className: 'bg-red-100 text-red-800' }
  }

  return { text: 'פעיל', className: 'bg-green-100 text-green-800' }
}

// Sleep function for testing
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Retry function
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      await sleep(delay)
      return retry(fn, retries - 1, delay * 2)
    }
    throw error
  }
} 