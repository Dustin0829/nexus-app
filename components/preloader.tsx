"use client"

import { useEffect } from 'react'

export function Preloader() {
  useEffect(() => {
    // Preload critical components in the background
    const preloadComponents = async () => {
      try {
        // Preload file list component
        await import('./file-list')
        // Preload file upload component
        await import('./file-upload')
        // Preload funding component
        await import('./irys-funding')
      } catch (error) {
        console.log('Preloading failed:', error)
      }
    }

    // Start preloading after initial render
    const timer = setTimeout(preloadComponents, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  return null
}
