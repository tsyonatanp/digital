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
    if (user && !skip) {
      router.push('/tv')
    }
  }, [user, router])
  return <LoginForm />
} 