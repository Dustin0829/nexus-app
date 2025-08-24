"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
)

// Lazy load heavy components
export const LazyFileList = dynamic(() => import('./file-list').then(mod => ({ default: mod.FileList })), {
  loading: LoadingFallback,
  ssr: false,
})

export const LazyFileUpload = dynamic(() => import('./file-upload').then(mod => ({ default: mod.FileUpload })), {
  loading: LoadingFallback,
  ssr: false,
})

export const LazyIrysFunding = dynamic(() => import('./irys-funding').then(mod => ({ default: mod.IrysFunding })), {
  loading: LoadingFallback,
  ssr: false,
})

// Wrapper component for lazy loading
export function LazyComponent({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  )
}
