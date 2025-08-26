"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAccount, useDisconnect, useChainId } from "wagmi"
import { useRouter } from "next/navigation"
import { LogOut, Copy, CheckCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useState, useCallback } from "react"
import { WalletConnect } from "@/components/wallet-connect"
import { SignInModal } from "@/components/sign-in-modal"

export function Header() {
  const { address, isConnected } = useAccount()
  const { disconnect, disconnectAsync } = useDisconnect()
  const router = useRouter()
  const chainId = useChainId()
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  const handleDisconnect = async () => {
    try {
      await disconnectAsync()
      router.push('/')
    } catch (error) {
      console.error("Disconnect error:", error)
      toast({
        title: "Disconnect Failed",
        description: "Could not disconnect wallet.",
        variant: "destructive",
      })
    }
  }

  const handleCopyAddress = useCallback(async () => {
    if (!address) return
    
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(address)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (error) {
      console.error("Copy error:", error)
      toast({
        title: "Copy Failed",
        description: "Failed to copy address to clipboard",
        variant: "destructive",
      })
    }
  }, [address])

  const getShortAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [])

  const getAvatarFallback = useCallback((address: string) => {
    return address.slice(2, 4).toUpperCase()
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SignInModal />
      <div className="ml-auto flex items-center gap-2">
        {isConnected && address ? (
          <>
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                Connected
              </Badge>
            </div>

            {/* Network badge and quick switch */}
            <Button
              variant={chainId === 11155111 ? "secondary" : "outline"}
              size="sm"
              onClick={async () => {
                try {
                  await (window as any).ethereum?.request?.({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: "0xaa36a7" }], // Sepolia
                  })
                  toast({ title: "Switched Network", description: "Now on Sepolia" })
                } catch (e) {
                  // If chain not added, attempt to add then switch
                  try {
                    await (window as any).ethereum?.request?.({
                      method: "wallet_addEthereumChain",
                      params: [{
                        chainId: "0xaa36a7",
                        chainName: "Sepolia",
                        nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
                        rpcUrls: ["https://sepolia.drpc.org", "https://rpc.sepolia.org"],
                        blockExplorerUrls: ["https://sepolia.etherscan.io"],
                      }],
                    })
                    await (window as any).ethereum?.request?.({
                      method: "wallet_switchEthereumChain",
                      params: [{ chainId: "0xaa36a7" }],
                    })
                    toast({ title: "Switched Network", description: "Now on Sepolia" })
                  } catch (err) {
                    console.error("Switch to Sepolia failed:", err)
                    toast({ title: "Switch Failed", description: "Open MetaMask and switch to Sepolia.", variant: "destructive" })
                  }
                }
              }}
            >
              {chainId === 11155111 ? "Sepolia" : "Switch to Sepolia"}
            </Button>

            {/* Wallet Address */}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleCopyAddress}
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {getAvatarFallback(address)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{getShortAddress(address)}</span>
              {copiedAddress === address ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>

            {/* Disconnect Button */}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleDisconnect}
            >
              <LogOut className="h-3 w-3" />
              Disconnect
            </Button>
          </>
        ) : (
          <WalletConnect />
        )}
      </div>
    </header>
  )
}
