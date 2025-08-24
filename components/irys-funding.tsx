"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import { Wallet, RefreshCw, AlertCircle, CheckCircle, Loader2, DollarSign } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useNexusStore } from "@/stores/use-nexus-store"
import { useLoadingStore } from "@/stores/use-loading-store"
import { getIrysClient, getIrysBalance, fundIrysWallet } from "@/lib/irys-client"

export function IrysFunding() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { irysBalance, setIrysBalance } = useNexusStore()
  const { startLoading, stopLoading } = useLoadingStore()
  
  const [fundAmount, setFundAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleFund = async () => {
    if (!address || !walletClient) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to fund your Irys storage",
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(fundAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      })
      return
    }

    if (amount < 0.001) {
      toast({
        title: "Amount Too Small",
        description: "Minimum funding amount is 0.001 ETH",
        variant: "destructive",
      })
      return
    }

    startLoading('fund-wallet', `Funding ${fundAmount} ETH to Irys wallet...`)
    setIsLoading(true)
    try {
      const irys = await getIrysClient(walletClient, address)
      
      toast({
        title: "Funding Irys Wallet",
        description: `Funding ${fundAmount} ETH to your Irys storage wallet...`,
      })

      const fundTx = await fundIrysWallet(irys, fundAmount)
      
      // Wait for transaction confirmation
      await fundTx.wait()

      // Refresh balance
      await refreshBalance()

      toast({
        title: "Funding Successful",
        description: `Successfully funded ${fundAmount} ETH to your Irys wallet`,
      })

      setFundAmount("")

    } catch (error) {
      console.error("Funding error:", error)
      toast({
        title: "Funding Failed",
        description: error instanceof Error ? error.message : "Failed to fund Irys wallet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      stopLoading('fund-wallet')
    }
  }

  const refreshBalance = async () => {
    if (!address || !walletClient) return

    startLoading('refresh-balance', 'Refreshing balance...')
    setIsRefreshing(true)
    try {
      const irys = await getIrysClient(walletClient, address)
      const balance = await getIrysBalance(irys)
      setIrysBalance(balance)
    } catch (error) {
      console.error("Error refreshing balance:", error)
      toast({
        title: "Balance Refresh Failed",
        description: "Failed to refresh Irys balance",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
      stopLoading('refresh-balance')
    }
  }

  if (!address) {
    return (
      <div className="text-center py-8">
        <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Connect Wallet to Fund</h3>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to fund your Irys storage for permanent file storage
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Balance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Irys Balance</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshBalance}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{irysBalance} ETH</div>
          <p className="text-xs text-muted-foreground">
            Available for permanent storage on Irys datachain
          </p>
        </CardContent>
      </Card>

      {/* Funding Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            Fund Irys Storage
          </CardTitle>
          <CardDescription>
            Add funds to your Irys wallet for permanent file storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fund-amount">Amount (ETH)</Label>
            <Input
              id="fund-amount"
              type="number"
              placeholder="0.01"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              min="0.001"
              step="0.001"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum: 0.001 ETH
            </p>
          </div>

          <Button 
            onClick={handleFund} 
            disabled={isLoading || !fundAmount || parseFloat(fundAmount) < 0.001}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Funding...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Fund Storage
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
