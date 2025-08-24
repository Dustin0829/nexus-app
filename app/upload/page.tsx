"use client"

import { LazyFileUpload } from "@/components/lazy-components"

// Disable SSR for this page
export const dynamic = 'force-dynamic'
export const ssr = false

export default function UploadPage() {
  return <LazyFileUpload />
}
