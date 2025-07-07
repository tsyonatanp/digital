// Mock Supabase client for demo mode
console.warn('⚠️ Running in demo mode - no real database connection')

export const supabase = {
  auth: {
    signInWithPassword: async () => ({
      data: { user: { id: 'demo-user', email: 'demo@example.com' } },
      error: null
    }),
    signUp: async () => ({
      data: { user: { id: 'demo-user', email: 'demo@example.com' } },
      error: null
    }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: () => ({
    select: () => ({ eq: () => ({ data: [], error: null }) }),
    insert: () => ({ data: null, error: { message: 'Demo mode' } }),
    update: () => ({ eq: () => ({ data: null, error: { message: 'Demo mode' } }) }),
    delete: () => ({ eq: () => ({ data: null, error: { message: 'Demo mode' } }) })
  }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: { message: 'Demo mode' } }),
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  }
}

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          street_name: string
          building_number: string
          management_company: string | null
          contact_person: string | null
          contact_phone: string | null
          contact_email: string | null
          is_super_admin: boolean
          created_at: string
          updated_at: string
          last_login: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          street_name: string
          building_number: string
          management_company?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          is_super_admin?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          street_name?: string
          building_number?: string
          management_company?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          is_super_admin?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
          is_active?: boolean
        }
      }
      notices: {
        Row: {
          id: string
          user_id: string
          message_text: string
          start_date: string
          end_date: string | null
          is_active: boolean
          priority: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message_text: string
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          priority?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message_text?: string
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          priority?: number
          created_at?: string
          updated_at?: string
        }
      }
      images: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          display_order: number
          start_date: string
          end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          display_order?: number
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          display_order?: number
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      styles: {
        Row: {
          id: string
          user_id: string
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
  }
}