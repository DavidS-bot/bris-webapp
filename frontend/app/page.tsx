'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push('/chat')
  }, [router])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-santander-red mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando BRIS...</p>
      </div>
    </div>
  )
}
