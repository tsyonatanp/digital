import { useCallback, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { user, setUser, setLoading } = useAuthStore()
  const { addToast } = useToast()
  const router = useRouter()

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      addToast({
        type: 'error',
        title: 'שגיאה בחיבור למערכת',
        message: 'אנא בדוק את הגדרות החיבור'
      })
      return { error: 'שגיאה בחיבור למערכת' }
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        addToast({
          type: 'error',
          title: 'שגיאה בהתחברות',
          message: error.message
        })
        return { error: error.message }
      }

      if (data.user) {
        setUser(data.user)
        addToast({
          type: 'success',
          title: 'התחברות הצליחה',
          message: `ברוכים הבאים, ${data.user.email}`
        })
        router.push('/dashboard')
        return { user: data.user }
      }

      return { error: 'שגיאה בהתחברות' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בהתחברות'
      addToast({
        type: 'error',
        title: 'שגיאה בהתחברות',
        message: errorMessage
      })
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [setUser, setLoading, addToast, router])

  const signUp = useCallback(async (email: string, password: string, userData: {
    street_name: string
    building_number: string
    management_company?: string
  }) => {
    if (!supabase) {
      addToast({
        type: 'error',
        title: 'שגיאה בחיבור למערכת',
        message: 'אנא בדוק את הגדרות החיבור'
      })
      return { error: 'שגיאה בחיבור למערכת' }
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            ...userData,
            welcome_text: ''
          }
        }
      })

      if (error) {
        addToast({
          type: 'error',
          title: 'שגיאה ברישום',
          message: error.message
        })
        return { error: error.message }
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            ...userData,
            welcome_text: ''
          }])

        if (profileError) {
          console.error('Error creating profile:', profileError)
          // Don't fail the signup, just log the error
        }

        setUser(data.user)
        addToast({
          type: 'success',
          title: 'הרשמה הושלמה',
          message: 'בדוק את האימייל שלך לאישור החשבון'
        })
        return { user: data.user }
      }

      return { error: 'שגיאה ברישום' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה ברישום'
      addToast({
        type: 'error',
        title: 'שגיאה ברישום',
        message: errorMessage
      })
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [setUser, setLoading, addToast])

  const signOut = useCallback(async () => {
    if (!supabase) {
      addToast({
        type: 'error',
        title: 'שגיאה בחיבור למערכת',
        message: 'אנא בדוק את הגדרות החיבור'
      })
      return { error: 'שגיאה בחיבור למערכת' }
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        addToast({
          type: 'error',
          title: 'שגיאה בהתנתקות',
          message: error.message
        })
        return { error: error.message }
      }

      setUser(null)
      addToast({
        type: 'success',
        title: 'התנתקות הצליחה',
        message: 'התנתקת בהצלחה מהמערכת'
      })
      router.push('/login')
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בהתנתקות'
      addToast({
        type: 'error',
        title: 'שגיאה בהתנתקות',
        message: errorMessage
      })
      return { error: errorMessage }
    }
  }, [setUser, addToast, router])

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) {
      addToast({
        type: 'error',
        title: 'שגיאה בחיבור למערכת',
        message: 'אנא בדוק את הגדרות החיבור'
      })
      return { error: 'שגיאה בחיבור למערכת' }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`
      })

      if (error) {
        addToast({
          type: 'error',
          title: 'שגיאה באיפוס סיסמה',
          message: error.message
        })
        return { error: error.message }
      }

      addToast({
        type: 'success',
        title: 'אימייל נשלח',
        message: 'בדוק את האימייל שלך להוראות איפוס הסיסמה'
      })
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה באיפוס סיסמה'
      addToast({
        type: 'error',
        title: 'שגיאה באיפוס סיסמה',
        message: errorMessage
      })
      return { error: errorMessage }
    }
  }, [addToast])

  return {
    user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!user,
    isLoading: useAuthStore(state => state.loading)
  }
} 