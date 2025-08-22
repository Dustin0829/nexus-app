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
    metaMask(),
    
    // 2. Injected - For any browser wallet (MetaMask, Brave, etc.)
    injected(),
    
    // 3. WalletConnect - Universal wallet connector
    walletConnect({ 
      projectId: walletConnectProjectId,
      metadata: {
        name: 'Nexus',
        description: 'Decentralized file storage with end-to-end encryption',
        url: 'https://nexus.app',
        icons: ['https://nexus.app/icon.png']
      }
    }),
    
    // 4. Coinbase Wallet - Popular exchange wallet
    coinbaseWallet({ appName: 'Nexus' }),
    
    // 5. Safe - Multi-signature wallet
    safe(),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
  // Disable SSR for wagmi config to avoid window/indexedDB access during server render
  ssr: false,
})
