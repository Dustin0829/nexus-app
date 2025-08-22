import { useEffect } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { useNexusStore } from '@/stores/use-nexus-store'
import { getIrysClient, getUserFiles } from '@/lib/irys-client'
import { loadFilesForAddress, saveFilesForAddress, loadTrashForAddress, saveTrashForAddress } from '@/lib/files-persist'

export const useFilesSync = () => {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { setFiles, files, setTrash, trash } = useNexusStore()

  // Rehydrate from localStorage when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      const persisted = loadFilesForAddress(address)
      if (persisted && persisted.length > 0) {
        setFiles(persisted)
      }
      const persistedTrash = loadTrashForAddress(address)
      if (persistedTrash && persistedTrash.length > 0) {
        setTrash(persistedTrash)
      }
    }
  }, [isConnected, address, setFiles, setTrash])

  // Persist whenever files change
  useEffect(() => {
    if (isConnected && address) {
      saveFilesForAddress(address, files || [])
    }
  }, [isConnected, address, files])

  useEffect(() => {
    if (isConnected && address) {
      saveTrashForAddress(address, trash || [])
    }
  }, [isConnected, address, trash])
}

