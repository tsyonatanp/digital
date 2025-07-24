'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const pathname = usePathname();

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!supabase) {
        console.error('Supabase client לא זמין')
        router.push('/login?error=client')
        return
      }

      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('שגיאה באימות:', error.message)
        router.push('/login?error=auth')
        return
      }

      if (!session) {
        console.log('לא נמצא session')
        router.push('/login')
        return
      }

      console.log('אימות הצליח:', session.user.email)
      router.push('/dashboard')
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">מאמת...</h2>
        <p className="text-gray-600">אנא המתן</p>
      </div>
    </div>
  )
} 