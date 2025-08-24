"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { useNexusStore } from "@/stores/use-nexus-store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, RotateCcw } from "lucide-react"

// Disable SSR for this page
export const dynamic = 'force-dynamic'
export const ssr = false

export default function TrashPage() {
  const { trash, restoreFile, removeTrashedFile } = useNexusStore()

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <h1 className="text-2xl font-bold">Trash</h1>
          <p className="text-muted-foreground">Items you delete appear here. Restore or permanently remove them.</p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trash.length === 0 ? (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="p-6 text-center text-muted-foreground">Trash is empty.</CardContent>
              </Card>
            ) : (
              trash.map((file) => (
                <Card key={file.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium truncate">{file.name}</CardTitle>
                    <CardDescription className="text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => restoreFile(file.id)} className="gap-1">
                      <RotateCcw className="h-3 w-3" /> Restore
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => removeTrashedFile(file.id)} className="gap-1">
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}




