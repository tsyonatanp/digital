import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Only create client if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ משתני סביבה חסרים:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'מוגדר' : 'חסר')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'מוגדר' : 'חסר')
  console.error('אנא צור קובץ .env.local עם המשתנים הנדרשים')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: {
          getItem: (key) => {
            try {
              // בדיקה אם אנחנו בצד הלקוח
              if (typeof window === 'undefined' || !window.localStorage) {
                return null
              }
              const item = window.localStorage.getItem(key)
              if (item) {
                const parsed = JSON.parse(item)
                // בדוק שהטוקן לא פג תוקף (expires_at מגיע בשניות, Date.now במילישניות)
                if (parsed.expires_at && Date.now() > parsed.expires_at * 1000) {
                  window.localStorage.removeItem(key)
                  return null
                }
              }
              return item
            } catch (error) {
              // לא נדפיס שגיאה כדי לא לזהם את הקונסול
              return null
            }
          },
          setItem: (key, value) => {
            try {
              // בדיקה אם אנחנו בצד הלקוח
              if (typeof window === 'undefined' || !window.localStorage) {
                return
              }
              window.localStorage.setItem(key, value)
            } catch (error) {
              // לא נדפיס שגיאה כדי לא לזהם את הקונסול
            }
          },
          removeItem: (key) => {
            try {
              // בדיקה אם אנחנו בצד הלקוח
              if (typeof window === 'undefined' || !window.localStorage) {
                return
              }
              window.localStorage.removeItem(key)
            } catch (error) {
              // לא נדפיס שגיאה כדי לא לזהם את הקונסול
            }
          }
        }
      },
      global: {
        headers: {
          'x-site-url': siteUrl
        }
      }
    })
  : null

// Type guard to check if supabase is available
export function isSupabaseAvailable(): boolean {
  return supabase !== null
}

// Safe supabase operations
export async function safeSupabaseOperation<T>(
  operation: (client: NonNullable<typeof supabase>) => Promise<T>
): Promise<{ data: T | null; error: string | null }> {
  if (!isSupabaseAvailable()) {
    return { data: null, error: 'Supabase client not available' }
  }

  try {
    const data = await operation(supabase!)
    return { data, error: null }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { data: null, error: errorMessage }
  }
}

// Database types based on our schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          street_name: string
          building_number: string
          management_company: string | null
          management_contact: string | null
          management_phone: string | null
          management_email: string | null
          welcome_text: string | null
          is_super_admin: boolean
          is_active: boolean
          email_verified_at: string | null
          email_verification_sent_at: string | null
          trial_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          street_name: string
          building_number: string
          management_company?: string | null
          management_contact?: string | null
          management_phone?: string | null
          management_email?: string | null
          welcome_text?: string | null
          is_super_admin?: boolean
          is_active?: boolean
          email_verified_at?: string | null
          email_verification_sent_at?: string | null
          trial_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          street_name?: string
          building_number?: string
          management_company?: string | null
          management_contact?: string | null
          management_phone?: string | null
          management_email?: string | null
          welcome_text?: string | null
          is_super_admin?: boolean
          is_active?: boolean
          email_verified_at?: string | null
          email_verification_sent_at?: string | null
          trial_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notices: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      images: {
        Row: {
          id: string
          user_id: string
          filename: string
          original_name: string | null
          url: string | null
          size_bytes: number | null
          mime_type: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          original_name?: string | null
          url?: string | null
          size_bytes?: number | null
          mime_type?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          original_name?: string | null
          url?: string | null
          size_bytes?: number | null
          mime_type?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      
      styles: {
        Row: {
          id: string
          user_id: string
          name: string
          background_color: string
          text_color: string
          layout_type: string
          text_size: string
          weather_enabled: boolean
          news_enabled: boolean
          slide_duration: number

          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          background_color?: string
          text_color?: string
          layout_type?: string
          text_size?: string
          weather_enabled?: boolean
          news_enabled?: boolean
          slide_duration?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          background_color?: string
          text_color?: string
          layout_type?: string
          text_size?: string
          weather_enabled?: boolean
          news_enabled?: boolean
          slide_duration?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}