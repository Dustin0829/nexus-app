"use client"

import { useWalletSync } from '@/hooks/use-wallet-sync'
import { useFilesSync } from '@/hooks/use-files-sync'

export function WalletSync() {
  useWalletSync()
  useFilesSync()
  return null
}
