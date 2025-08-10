import { Database } from '@/lib/supabase'

// Database types
export type User = Database['public']['Tables']['users']['Row']
export type Notice = Database['public']['Tables']['notices']['Row']
export type Image = Database['public']['Tables']['images']['Row']
export type Style = Database['public']['Tables']['styles']['Row']

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  street_name: string
  building_number: string
  management_company?: string
}

export interface NoticeFormData {
  title: string
  content: string
  is_active: boolean
}

// API types
export interface NewsItem {
  title: string
  link: string
  source: string
}

export interface WeatherData {
  current: string
  forecast: Array<{
    day: string
    icon: string
    high: string
    low: string
  }>
}

export interface ShabbatTimes {
  entry: string
  exit: string
  parsha: string
}

// Component props types
export interface AuthProviderProps {
  children: React.ReactNode
}

export interface NoticeFormProps {
  notice?: Notice | null
  userId: string
  onSave: () => void
  onCancel: () => void
}

export interface NoticeListProps {
  userId: string
  onAddNotice: () => void
  onEditNotice: (notice: Notice) => void
}

export interface ImageManagerProps {
  userId: string
}

export interface StyleSelectorProps {
  userId: string
  currentStyleId?: string | null
  onStyleChange: (styleId: string) => void
}

// Error types
export interface ApiError {
  message: string
  code?: string
  details?: string
}

// Loading states
export interface LoadingState {
  isLoading: boolean
  error: string | null
}

// File validation
export interface FileValidationResult {
  isValid: boolean
  error?: string
}

// Predefined styles
export interface PredefinedStyle {
  id: string
  name: string
  description: string
  preview: {
    backgroundColor: string
    textColor: string
    accentColor: string
  }
} 