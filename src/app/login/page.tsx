"use client"
import LoginForm from '../../components/auth/LoginForm'
import { useEffect } from 'react'
import { useAuthStore } from '../../store/auth'
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic'
 
export default function LoginPage() {
  const user = useAuthStore((state) => state.user)
  const router = useRouter();

  useEffect(() => {
    const skip = localStorage.getItem('skipAutoRedirect')
    if (user && user.id && !skip) {
      router.push(`/tv/${user.id}`)
    }
  }, [user, router])
  return <LoginForm />
} 