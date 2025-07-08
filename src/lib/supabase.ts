// Mock Supabase client for demo mode - simplified version
console.warn('⚠️ Running in demo mode - no real database connection')

const createMockResponse = async (table: string) => {
  if (table === 'users') {
    return {
      data: {
        id: 'demo-user',
        email: 'demo@example.com',
        password_hash: 'hashed',
        street_name: 'רחוב הדמו',
        building_number: '123',
        apartment_number: '4',
        management_company: 'חברת ניהול דמו',
        contact_person: 'יוסי כהן',
        contact_phone: '050-1234567',
        contact_email: 'management@demo.com',
        management_contact: 'יוסי כהן',
        management_phone: '050-1234567',
        management_email: 'management@demo.com',
        is_super_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: null,
        is_active: true,
        selected_style_id: null
      },
      error: null
    }
  } else if (table === 'notices') {
    return {
      data: [
        {
          id: 'notice-1',
          user_id: 'demo-user',
          message_text: 'ברוכים הבאים ללוח המודעות הדיגיטלי! 🎉\nמערכת חדשנית לתקשורת יעילה בבניין',
          start_date: new Date().toISOString(),
          end_date: null,
          is_active: true,
          priority: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'notice-2',
          user_id: 'demo-user',
          message_text: '📢 הודעה חשובה:\nעבודות תחזוקה במעלית יתבצעו ביום ראשון\nבין השעות 09:00-17:00',
          start_date: new Date().toISOString(),
          end_date: null,
          is_active: true,
          priority: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'notice-3',
          user_id: 'demo-user',
          message_text: '🎊 מזל טוב!\nהוועד החדש נבחר בהצלחה\nתודה לכל המשתתפים בבחירות',
          start_date: new Date().toISOString(),
          end_date: null,
          is_active: true,
          priority: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      error: null
    }
  } else if (table === 'images') {
    return {
      data: [],
      error: null
    }
  } else if (table === 'styles') {
    return {
      data: {
        id: 'style-1',
        user_id: 'demo-user',
        background_color: '#1e3a8a',
        text_color: '#ffffff',
        layout_type: 'modern',
        text_size: 'large',
        weather_enabled: true,
        news_enabled: false,
        slide_duration: 8000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      error: null
    }
  } else {
    return { data: [], error: null }
  }
}

interface MockQueryBuilder {
  eq: (column: string, value: any) => MockQueryBuilder
  gte: (column: string, value: any) => MockQueryBuilder
  lte: (column: string, value: any) => MockQueryBuilder
  gt: (column: string, value: any) => MockQueryBuilder
  lt: (column: string, value: any) => MockQueryBuilder
  or: (filters: string) => MockQueryBuilder
  and: (filters: string) => MockQueryBuilder
  order: (column: string, options?: { ascending?: boolean }) => Promise<any>
  limit: (count: number) => MockQueryBuilder
  single: () => Promise<any>
  then: (callback: any) => Promise<any>
  select: (columns?: string) => MockQueryBuilder
}

const createChainableQuery = (table: string): MockQueryBuilder => {
  const mockPromise = createMockResponse(table)
  
  const queryBuilder: MockQueryBuilder = {
    eq: (column: string, value: any) => {
      console.log(`Mock query: ${table}.eq(${column}, ${value})`)
      return queryBuilder
    },
    gte: (column: string, value: any) => {
      console.log(`Mock query: ${table}.gte(${column}, ${value})`)
      return queryBuilder
    },
    lte: (column: string, value: any) => {
      console.log(`Mock query: ${table}.lte(${column}, ${value})`)
      return queryBuilder
    },
    gt: (column: string, value: any) => {
      console.log(`Mock query: ${table}.gt(${column}, ${value})`)
      return queryBuilder
    },
    lt: (column: string, value: any) => {
      console.log(`Mock query: ${table}.lt(${column}, ${value})`)
      return queryBuilder
    },
    or: (filters: string) => {
      console.log(`Mock query: ${table}.or(${filters})`)
      return queryBuilder
    },
    and: (filters: string) => {
      console.log(`Mock query: ${table}.and(${filters})`)
      return queryBuilder
    },
    order: (column: string, options?: { ascending?: boolean }) => {
      console.log(`Mock query: ${table}.order(${column}, ${JSON.stringify(options)})`)
      return mockPromise
    },
    limit: (count: number) => {
      console.log(`Mock query: ${table}.limit(${count})`)
      return queryBuilder
    },
    select: (columns?: string) => {
      console.log(`Mock query: ${table}.select(${columns || '*'})`)
      return queryBuilder
    },
    single: async () => {
      console.log(`Mock query: ${table}.single()`)
      if (table === 'users') {
        return {
          data: {
            id: 'demo-user',
            email: 'demo@example.com',
            password_hash: 'hashed',
            street_name: 'רחוב הדמו',
            building_number: '123',
            apartment_number: '4',
            management_company: 'חברת ניהול דמו',
            contact_person: 'יוסי כהן',
            contact_phone: '050-1234567',
            contact_email: 'management@demo.com',
            management_contact: 'יוסי כהן',
            management_phone: '050-1234567',
            management_email: 'management@demo.com',
            is_super_admin: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_login: null,
            is_active: true,
            selected_style_id: null
          },
          error: null
        }
      } else if (table === 'styles') {
        return {
          data: {
            id: 'style-1',
            user_id: 'demo-user',
            background_color: '#1e3a8a',
            text_color: '#ffffff',
            layout_type: 'modern',
            text_size: 'large',
            weather_enabled: true,
            news_enabled: false,
            slide_duration: 8000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          error: null
        }
      }
      return { data: null, error: null }
    },
    then: (callback: any) => {
      console.log(`Mock query: ${table}.then()`)
      return mockPromise.then(callback)
    }
  }
  
  return queryBuilder
}

export const supabase = {
  auth: {
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      console.log('🎭 Demo Mode: התחברות עם:', credentials.email)
      
      return {
        data: { 
          user: {
            id: 'demo-user',
            email: credentials.email,
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email_confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            role: 'authenticated'
          }
        },
        error: null
      }
    },
    signUp: async (credentials: { email: string; password: string }) => ({
      data: { 
        user: {
          id: 'demo-user',
          email: credentials.email,
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          role: 'authenticated'
        }
      },
      error: null
    }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: (table: string) => ({
    select: (columns?: string) => createChainableQuery(table),
    insert: (data: any) => {
      const insertResult = Promise.resolve({ 
        data: { 
          id: 'demo-' + Date.now(), 
          ...data, 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, 
        error: null 
      })
      
      // Return both direct promise and select method
      const result: any = insertResult
      result.select = (columns?: string) => ({
        single: () => Promise.resolve({ 
          data: { 
            id: 'demo-style-' + Date.now(), 
            ...data, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, 
          error: null 
        })
      })
      return result
    },
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: { message: 'Demo mode' } })
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: { message: 'Demo mode' } })
    })
  }),
  storage: {
    from: (bucket: string) => ({
      upload: async (fileName: string, file: File) => ({ data: null, error: { message: 'Demo mode' } }),
      getPublicUrl: (fileName: string) => ({ data: { publicUrl: '' } }),
      remove: async (filePaths: string[]) => ({ data: null, error: { message: 'Demo mode' } })
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