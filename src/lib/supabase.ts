import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Only create client if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'x-site-url': siteUrl
        }
      }
    })
  : null

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
          priority: number
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          is_active?: boolean
          priority?: number
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          is_active?: boolean
          priority?: number
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      images: {
        Row: {
          id: string
          user_id: string
          filename: string
          original_name: string
          url: string
          size_bytes: number | null
          mime_type: string | null
          is_active: boolean
          display_duration: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          original_name: string
          url: string
          size_bytes?: number | null
          mime_type?: string | null
          is_active?: boolean
          display_duration?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          original_name?: string
          url?: string
          size_bytes?: number | null
          mime_type?: string | null
          is_active?: boolean
          display_duration?: number
          created_at?: string
          updated_at?: string
        }
      }
      styles: {
        Row: {
          id: string
          name: string
          description: string | null
          background_color: string
          text_color: string
          font_family: string
          font_size: number
          is_default: boolean
          created_at: string
          slide_duration?: number
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          background_color?: string
          text_color?: string
          font_family?: string
          font_size?: number
          is_default?: boolean
          created_at?: string
          slide_duration?: number
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          background_color?: string
          text_color?: string
          font_family?: string
          font_size?: number
          is_default?: boolean
          created_at?: string
          slide_duration?: number
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