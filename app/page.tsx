"use client"

import { useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WalletConnect } from "@/components/wallet-connect"
import { useNexusStore } from "@/stores/use-nexus-store"
import { FileText, Lock, Shield, Zap, LogOut } from "lucide-react"
import { useAccount, useDisconnect } from "wagmi"
import { toast } from "@/components/ui/use-toast"

export default function DashboardPage() {
  const { 
    irysBalance, 
    files, 
    isWalletConnected 
  } = useNexusStore()
  
  const { disconnect } = useDisconnect()
  const { address } = useAccount()

  const handleDisconnect = () => {
    disconnect()
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  const getShortAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Show only wallet connection when not connected
  if (!isWalletConnected) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl">Welcome to Nexus</CardTitle>
              <CardDescription className="text-base">
                Connect your wallet to access decentralized file storage with end-to-end encryption
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <WalletConnect />
            
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-green-500" />
                <span>10GB free storage upon connection</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>End-to-end encryption for all files</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 text-purple-500" />
                <span>Permanent onchain storage via Irys</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {/* Dashboard Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to your decentralized file storage dashboard
            </p>
          </div>
          
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Irys Balance</CardTitle>
                <span className="text-muted-foreground">ETH</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{irysBalance} ETH</div>
                <CardDescription className="text-xs text-muted-foreground">
                  Available for permanent storage
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{files.length}</div>
                <CardDescription className="text-xs text-muted-foreground">
                  Files stored securely
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Status</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Active</div>
                <CardDescription className="text-xs text-muted-foreground">
                  End-to-end encrypted
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
              <p className="text-muted-foreground">
                Your latest file operations
              </p>
            </div>
            
            <Card>
              <CardContent className="p-6">
                {files.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Files Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload your first file to get started with decentralized storage
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {files.slice(0, 5).map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {file.encrypted && (
                            <Lock className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
