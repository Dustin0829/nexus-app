"use client"

import { useEffect } from 'react'

export function PerformanceMonitor() {
  useEffect(() => {
    // Monitor page load performance
    if (typeof window !== 'undefined') {
      // Track initial page load
      const navigationStart = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigationStart) {
        const loadTime = navigationStart.loadEventEnd - navigationStart.loadEventStart
        console.log(`Page load time: ${loadTime}ms`)
      }

      // Track component load times
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure') {
            console.log(`${entry.name}: ${entry.duration}ms`)
          }
        })
      })

      observer.observe({ entryTypes: ['measure'] })

      return () => observer.disconnect()
    }
  }, [])

  return null
}
