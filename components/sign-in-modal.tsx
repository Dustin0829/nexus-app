"use client"

import { useEffect, useState, useCallback } from "react"
import { useAccount, useWalletClient } from "wagmi"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { useNexusStore } from "@/stores/use-nexus-store"

export function SignInModal() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { isSignedIn, setSignedIn, setSiweSignature } = useNexusStore()
  const shouldOpen = isConnected && !isSignedIn
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) setOpen(shouldOpen)
  }, [mounted, shouldOpen])

  // Reset sign-in state when wallet disconnects; prompt again on reconnect
  useEffect(() => {
    if (!isConnected && isSignedIn) {
      setSignedIn(false)
      setSiweSignature(null)
    }
  }, [isConnected, isSignedIn, setSignedIn, setSiweSignature])

  const signIn = useCallback(async () => {
    if (!address || !walletClient) return
    const message = `Nexus Sign-In\nAddress: ${address}\nTimestamp: ${new Date().toISOString()}`
    try {
      const signature = await (walletClient as any).signMessage?.({
        account: address as any,
        message,
      })
      if (!signature) throw new Error("Signature failed")
      setSiweSignature(signature)
      setSignedIn(true)
      setOpen(false)
      toast({ title: "Signed in", description: "Uploads will use your Irys balance without extra confirmations." })
    } catch {
      toast({ title: "Sign-in failed", description: "Please try again.", variant: "destructive" })
    }
  }, [address, walletClient, setSignedIn, setSiweSignature])

  if (!mounted) return null
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign In to Nexus</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Sign a message to finish connecting. No gas or funds will be moved.
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={signIn} className="w-full">Sign In</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


