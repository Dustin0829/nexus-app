"use client"

import { LazyIrysFunding } from "@/components/lazy-components"

// Disable SSR for this page
export const dynamic = 'force-dynamic'
export const ssr = false

export default function FundingPage() {
  return <LazyIrysFunding />
}
