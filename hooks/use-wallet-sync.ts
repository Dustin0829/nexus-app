import { useEffect } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { useNexusStore } from '@/stores/use-nexus-store'
import { getIrysBalance } from '@/lib/irys-client'

export const useWalletSync = () => {
  const { address, isConnected, connector } = useAccount()
  const { data: balance } = useBalance({ address })
  const {
    setConnectedWallet,
    setWalletAddress,
    setWalletType,
    setIrysBalance
  } = useNexusStore()

  useEffect(() => {
    setConnectedWallet(isConnected)
    setWalletAddress(address || '')
    setWalletType(connector?.id === 'metaMask' ? 'ethereum' : '')
  }, [isConnected, address, connector, setConnectedWallet, setWalletAddress, setWalletType])

  useEffect(() => {
    const updateIrysBalance = async () => {
      if (isConnected && address) {
        try {
          // Try to fetch real Irys balance if we have a provider
          // For now, fall back to wallet balance
          if (balance) {
            setIrysBalance(balance.formatted)
          }
        } catch (error) {
          console.error('Error fetching Irys balance:', error)
          setIrysBalance('0')
        }
      } else {
        setIrysBalance('0')
      }
    }

    updateIrysBalance()
  }, [isConnected, address, balance, setIrysBalance])
}
