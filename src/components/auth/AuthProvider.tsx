'use client'

import React, { useEffect } from 'react'
import { useAuthStore } from '../../store/auth'
import { supabase } from '../../lib/supabase'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    // Check if supabase client exists
    if (!supabase) {
      console.log('❌ אין Supabase client - משתני סביבה חסרים')
      setUser(null)
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      if (!supabase) {
        console.log('❌ Supabase client לא זמין')
        setUser(null)
        setLoading(false)
        return
      }

      console.log('🔐 בדיקת session ראשונית...')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔍 תוצאת getSession:', session)
        if (session) {
          console.log('✅ נמצא session קיים:', session.user.email)
          setUser(session.user)
        } else {
          console.log('❌ לא נמצא session קיים')
          setUser(null)
        }
      } catch (error) {
        console.error('❌ שגיאה בבדיקת session:', error)
        setUser(null)
      }
      setLoading(false)
      // לוג נוסף: מצב store אחרי טעינה
      setTimeout(() => {
        const storeUser = useAuthStore.getState().user;
        console.log('🟢 מצב user ב-store אחרי טעינה:', storeUser);
      }, 1000);
    }

    // Listen for auth changes
    if (!supabase) {
      console.log('❌ Supabase client לא זמין - לא מאזין לשינויים')
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 שינוי במצב האימות:', event, session)
      if (session) {
        console.log('✅ משתמש התחבר:', session.user.email)
        setUser(session.user)
      } else {
        console.log('❌ משתמש התנתק')
        setUser(null)
      }
      // לוג נוסף: מצב store אחרי שינוי auth
      setTimeout(() => {
        const storeUser = useAuthStore.getState().user;
        console.log('🟢 מצב user ב-store אחרי שינוי auth:', storeUser);
      }, 1000);
    })

    getInitialSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading])

  return <>{children}</>
} 