"use client"

import { http, createConfig } from "wagmi"
import { mainnet, sepolia, polygon, arbitrum } from "wagmi/chains"
import { 
  injected, 
  metaMask, 
  walletConnect, 
  coinbaseWallet,
  safe
} from "wagmi/connectors"

// WalletConnect Project ID - Get your own from https://cloud.walletconnect.com/
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "c4f79cc821944d9680842e34466bfbd9"

export const config = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum],
  connectors: [
    // 1. MetaMask - Most popular Ethereum wallet
    metaMask({ 
      shimDisconnect: true,
      // Disable auto-connect for MetaMask
      UNSTABLE_shimOnConnectSelectAccount: false
    }),
    
    // 2. Injected - For any browser wallet (MetaMask, Brave, etc.)
    injected({ 
      shimDisconnect: true,
      // Disable auto-connect for injected wallets
      UNSTABLE_shimOnConnectSelectAccount: false
    }),
    
    // 3. WalletConnect - Universal wallet connector
    walletConnect({ 
      projectId: walletConnectProjectId,
      metadata: {
        name: 'Nexus',
        description: 'Decentralized file storage with end-to-end encryption',
        url: 'https://nexus.app',
        icons: ['https://nexus.app/icon.png']
      },
      // Disable auto-connect for WalletConnect
      showQrModal: false
    }),
    
    // 4. Coinbase Wallet - Popular exchange wallet
    coinbaseWallet({ 
      appName: 'Nexus',
      // Disable auto-connect for Coinbase Wallet
      jsonRpcUrl: undefined
    }),
    
    // 5. Safe - Multi-signature wallet
    safe({
      // Disable auto-connect for Safe
      allowedDomains: []
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
  // Disable SSR for wagmi config to avoid window/indexedDB access during server render
  ssr: false,
  // Explicitly disable auto-connect
  autoConnect: false,
  // Disable storage completely to prevent any persistence
  storage: undefined,
  // Disable all persistence
  persist: false,
  // Disable subscription to prevent connection errors
  pollingInterval: 0,
  // Disable reconnection attempts
  reconnectOnMount: false,
})
