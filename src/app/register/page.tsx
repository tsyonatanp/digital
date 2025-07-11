"use client"
import React from 'react'
import RegisterForm from '../../components/auth/RegisterForm'
import { useEffect } from 'react'
import { useAuthStore } from '../../store/auth'
import { useRouter } from 'next/navigation';
 
export default function RegisterPage() {
  const user = useAuthStore((state) => state.user)
  const router = useRouter();

  useEffect(() => {
    const skip = localStorage.getItem('skipAutoRedirect')
    if (user && user.id && !skip) {
      router.push(`/tv/${user.id}`)
    }
  }, [user, router])
  return <RegisterForm />
} 