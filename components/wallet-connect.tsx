"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Wallet, LogOut, Copy, CheckCircle, AlertCircle, Loader2, ExternalLink, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useNexusStore } from "@/stores/use-nexus-store"
import {
  MetaMaskIcon,
  WalletConnectIcon,
  CoinbaseIcon,
  SafeIcon
} from "@/components/wallet-icons"

// Popular wallet configuration
const POPULAR_WALLETS = [
  {
    id: "metamask",
    name: "MetaMask",
    description: "Most popular Ethereum wallet",
    icon: <MetaMaskIcon />,
    connectorName: "metaMask",
    priority: 1,
    installUrl: "https://metamask.io/download/",
    isPopular: true
  },
  {
    id: "injected",
    name: "Browser Wallet",
    description: "Any browser wallet (MetaMask, Brave, etc.)",
    icon: <Wallet className="h-6 w-6" />,
    connectorName: "injected",
    priority: 2,
    isPopular: true
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    description: "Connect any mobile wallet",
    icon: <WalletConnectIcon />,
    connectorName: "walletConnect",
    priority: 3,
    isPopular: true
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    description: "Exchange wallet with DeFi features",
    icon: <CoinbaseIcon />,
    connectorName: "coinbaseWallet",
    priority: 4,
    installUrl: "https://www.coinbase.com/wallet",
    isPopular: true
  },
  {
    id: "safe",
    name: "Safe",
    description: "Multi-signature wallet for teams",
    icon: <SafeIcon />,
    connectorName: "safe",
    priority: 5,
    installUrl: "https://safe.global/",
    isPopular: false
  }
]

export function WalletConnect() {
  // Wagmi hooks
  const { address, isConnected, chain, connector: activeConnector } = useAccount()
  const { connect, connectors, isPending, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  
  // Local state
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false)
  
  // Store state
  const { setConnectedWallet, setWalletAddress, setWalletType } = useNexusStore()

  // Update store when wallet connects/disconnects
  useEffect(() => {
    if (isConnected && address) {
      setIsConnecting(false)
      setSelectedWallet(null)
      setConnectedWallet(true)
      setWalletAddress(address)
      setWalletType("ethereum")
    } else {
      setConnectedWallet(false)
      setWalletAddress("")
      setWalletType("")
    }
  }, [isConnected, address, setConnectedWallet, setWalletAddress, setWalletType])

  // Handle connection errors
  useEffect(() => {
    if (connectError) {
      // Treat "already connected" as a non-issue to avoid noisy dev overlay
      const message = connectError.message || "Unknown error"
      if (
        message.toLowerCase().includes("already connected") ||
        connectError.name === "ConnectorAlreadyConnectedError"
      ) {
        setIsConnecting(false)
        setSelectedWallet(null)
        setShowWalletModal(false)
        return
      }

      setIsConnecting(false)
      
      if (message.includes("User rejected") || 
          message.includes("User denied") || 
          message.includes("User cancelled")) {
        toast({
          title: "Connection Cancelled",
          description: "Wallet connection was cancelled",
          variant: "default",
        })
      } else if (message.includes("No provider") || message.includes("not found")) {
        toast({
          title: "Wallet Not Found",
          description: "Please install the wallet extension first",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: message,
          variant: "destructive",
        })
      }
    }
  }, [connectError])

  // Connect to wallet
  const handleConnect = useCallback(async (walletId: string) => {
    if (isConnecting || isConnected) return

    const wallet = POPULAR_WALLETS.find(w => w.id === walletId)
    if (!wallet) return

    const connector = connectors.find(c => 
      c.name.toLowerCase().includes(wallet.connectorName.toLowerCase())
    )

    if (!connector) {
      toast({
        title: "Wallet Not Available",
        description: `${wallet.name} is not available in your browser`,
        variant: "destructive",
      })
      return
    }

    // If the same connector is already active, just close the modal
    if (isConnected && activeConnector && connector && activeConnector.id === connector.id) {
      setIsConnecting(false)
      setSelectedWallet(null)
      setShowWalletModal(false)
      return
    }

    try {
      setIsConnecting(true)
      setSelectedWallet(walletId)
      
      await connect({ connector })
      
    } catch (error) {
      setIsConnecting(false)
      setSelectedWallet(null)
      console.error("Connection failed:", error)
      
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      })
    }
  }, [isConnecting, isConnected, connect, connectors, activeConnector])

  // Disconnect wallet
  const handleDisconnect = useCallback(() => {
    try {
      disconnect()
      toast({
        title: "Wallet Disconnected",
        description: "You have been disconnected from your wallet",
      })
    } catch (error) {
      console.error("Disconnect error:", error)
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      })
    }
  }, [disconnect])

  // Copy address to clipboard
  const handleCopyAddress = useCallback(async (address: string) => {
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
  }, [])

  // Utility functions
  const getShortAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [])

  const getAvatarFallback = useCallback((address: string) => {
    return address.slice(2, 4).toUpperCase()
  }, [])

  // If not connected, show wallet selection
  if (!isConnected || !address) {
    return (
      <div className="space-y-4">
        {/* Connect Wallet Button */}
        <div className="text-center">
          <Button 
            variant="default" 
            size="lg"
            className="w-full max-w-sm bg-primary hover:bg-primary/90"
            onClick={() => setShowWalletModal(true)}
          >
            <Wallet className="h-5 w-5 mr-2" />
            Connect Wallet
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Choose from popular Ethereum wallets
          </p>
        </div>

        {/* Wallet Selection Modal */}
        <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
          <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5" />
                Choose Your Wallet
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Popular Wallets Section */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Popular Wallets</h4>
                <div className="grid gap-2">
                  {POPULAR_WALLETS.filter(w => w.isPopular).map((wallet) => {
                    const connector = connectors.find(c => 
                      c.name.toLowerCase().includes(wallet.connectorName.toLowerCase())
                    )
                    const isConnectingThis = isConnecting && selectedWallet === wallet.id
                    const isAvailable = !!connector
                    
                    return (
                      <Card 
                        key={wallet.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isConnectingThis ? 'ring-2 ring-primary' : ''
                        } ${!isAvailable ? 'opacity-50' : ''}`}
                        onClick={() => isAvailable && !isPending && !isConnecting && handleConnect(wallet.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                {wallet.icon}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-sm">{wallet.name}</h4>
                                  {wallet.installUrl && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        window.open(wallet.installUrl, '_blank')
                                      }}
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{wallet.description}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {isConnectingThis ? (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              ) : !isAvailable ? (
                                <Badge variant="outline" className="text-xs">
                                  Not Available
                                </Badge>
                              ) : (
                                <Badge variant="default" className="text-xs bg-green-500">
                                  Ready
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Other Wallets Section - Only show if there are other wallets */}
              {POPULAR_WALLETS.filter(w => !w.isPopular).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Other Wallets</h4>
                  <div className="grid gap-2">
                    {POPULAR_WALLETS.filter(w => !w.isPopular).map((wallet) => {
                      const connector = connectors.find(c => 
                        c.name.toLowerCase().includes(wallet.connectorName.toLowerCase())
                      )
                      const isConnectingThis = isConnecting && selectedWallet === wallet.id
                      const isAvailable = !!connector
                      
                      return (
                        <Card 
                          key={wallet.id} 
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            isConnectingThis ? 'ring-2 ring-primary' : ''
                          } ${!isAvailable ? 'opacity-50' : ''}`}
                          onClick={() => isAvailable && handleConnect(wallet.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  {wallet.icon}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium text-sm">{wallet.name}</h4>
                                    {wallet.installUrl && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          window.open(wallet.installUrl, '_blank')
                                        }}
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{wallet.description}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {isConnectingThis ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                ) : !isAvailable ? (
                                  <Badge variant="outline" className="text-xs">
                                    Not Available
                                  </Badge>
                                ) : (
                                  <Badge variant="default" className="text-xs bg-green-500">
                                    Ready
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }
}
