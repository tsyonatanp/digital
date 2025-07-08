import { create } from 'zustand'
import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => {
    console.log('👤 עדכון משתמש ב-store:', user)
    set({ user })
  },
  setLoading: (loading) => set({ loading }),
})) 