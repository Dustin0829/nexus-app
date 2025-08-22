"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { IrysFunding } from "@/components/irys-funding" // Reusing the IrysFunding component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useNexusStore } from "@/stores/use-nexus-store"

export default function FundingPage() {
  const { irysBalance } = useNexusStore()

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <h1 className="text-2xl font-bold">Fund Storage</h1>
          <p className="text-muted-foreground">Add funds to your Irys balance for permanent storage.</p>
          <Card>
            <CardHeader>
              <CardTitle>Current Balance: {irysBalance} ETH</CardTitle>
              <CardDescription>Add funds to your Irys wallet for permanent file storage.</CardDescription>
            </CardHeader>
            <CardContent>
              <IrysFunding />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
