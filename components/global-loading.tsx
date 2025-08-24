"use client"

import { useLoadingStore } from '@/stores/use-loading-store'
import { Loader2 } from 'lucide-react'

export function GlobalLoading() {
  const { isLoading, loadingMessage } = useLoadingStore()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4 rounded-lg bg-card p-6 shadow-lg border">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">{loadingMessage}</p>
      </div>
    </div>
  )
}
