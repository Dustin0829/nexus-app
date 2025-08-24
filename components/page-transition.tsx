"use client"

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLoadingStore } from '@/stores/use-loading-store'
import { Loader2 } from 'lucide-react'

export function PageTransition() {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const { startLoading, stopLoading } = useLoadingStore()

  useEffect(() => {
    // Start transition loading
    setIsTransitioning(true)
    startLoading('page-transition', 'Loading page...')

    // Simulate a small delay for smooth transition
    const timer = setTimeout(() => {
      setIsTransitioning(false)
      stopLoading('page-transition')
    }, 300)

    return () => {
      clearTimeout(timer)
      stopLoading('page-transition')
    }
  }, [pathname, startLoading, stopLoading])

  if (!isTransitioning) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-3 rounded-lg bg-card p-4 shadow-lg border">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">Loading...</p>
      </div>
    </div>
  )
}
