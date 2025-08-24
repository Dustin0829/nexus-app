"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { LazyFileList } from "@/components/lazy-components"

// Disable SSR for this page
export const dynamic = 'force-dynamic'
export const ssr = false

export default function FilesPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <LazyFileList />
        </main>
      </div>
    </div>
  )
}
