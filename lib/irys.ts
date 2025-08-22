import { WebIrys } from "@irys/sdk"
import { providers } from "ethers"
import { Connection } from "@solana/web3.js"
import type { WalletContextState } from "@solana/wallet-adapter-react"

// Helper to get the appropriate Irys provider based on connected wallet
export async function getIrysProvider(
  wagmiProvider: { provider: string | undefined }, // wagmi's publicClient.transport.url
  chainId: number | undefined,
  solanaWallet: WalletContextState | undefined,
) {
  let provider: any
  let network: "mainnet" | "devnet" | "sepolia" = "devnet" // Default to devnet
  let token: "ethereum" | "solana" = "ethereum" // Default to ethereum

  if (chainId === 1 || chainId === 11155111) {
    // Ethereum Mainnet or Sepolia
    if (wagmiProvider.provider) {
      // Use ethers.js to create a provider from the wagmi transport URL
      provider = new providers.JsonRpcProvider(wagmiProvider.provider)
    } else if (typeof window !== "undefined" && window.ethereum) {
      // Fallback to window.ethereum if wagmi provider not directly available
      provider = new providers.Web3Provider(window.ethereum)
    } else {
      console.error("No Ethereum provider found.")
      return null
    }
    network = chainId === 1 ? "mainnet" : "sepolia"
    token = "ethereum"
  } else if (solanaWallet && solanaWallet.connected && solanaWallet.wallet) {
    // Solana wallet adapter provides a connection and signer
    const solanaConnection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
    )
    provider = {
      rpcUrl: solanaConnection.rpcEndpoint,
      name: "solana",
      provider: solanaWallet.wallet.adapter, // The adapter itself acts as the provider/signer
    }
    network = "mainnet" // Solana mainnet for Irys
    token = "solana"
  } else {
    console.error("Unsupported wallet or no wallet connected.")
    return null
  }

  try {
    const irys = new WebIrys({
      network,
      token,
      provider,
    })

    await irys.ready()
    return irys
  } catch (error) {
    console.error("Failed to initialize Irys:", error)
    return null
  }
}

// Function to fund Irys
export async function fundIrys(irys: WebIrys, amount: string) {
  try {
    // Convert amount to atomic units (e.g., wei for ETH)
    const atomicAmount = irys.utils.toAtomic(amount)
    const tx = await irys.fund(atomicAmount)
    console.log(`Successfully funded ${irys.utils.fromAtomic(tx.quantity)} with ID ${tx.id}`)
    return tx
  } catch (error) {
    console.error("Error funding Irys:", error)
    throw error
  }
}

// Function to upload a file
export async function uploadFileToIrys(irys: WebIrys, data: Buffer, tags: { name: string; value: string }[]) {
  try {
    const receipt = await irys.upload(data, { tags })
    console.log(`File uploaded to Irys with ID: ${receipt.id}`)
    console.log(`Access at: https://gateway.irys.xyz/${receipt.id}`)
    return receipt
  } catch (error) {
    console.error("Error uploading file to Irys:", error)
    throw error
  }
}

// Function to get Irys balance
export async function getIrysBalance(irys: WebIrys) {
  try {
    const balance = await irys.getBalance()
    return irys.utils.fromAtomic(balance).toString()
  } catch (error) {
    console.error("Error fetching Irys balance:", error)
    return "0"
  }
}

// Function to query files from Irys
export async function queryFilesFromIrys(irys: WebIrys, address: string) {
  try {
    const query = {
      // Query for files uploaded by the current address
      // This assumes you tag uploads with the uploader's address
      tags: [
        { name: "Application", values: ["Nexus"] },
        { name: "Uploader", values: [address] },
      ],
    }
    const results = await irys.search(query)

    // Map results to a more usable format for the UI
    return results.map((result: any) => {
      const fileNameTag = result.tags.find((tag: any) => tag.name === "File-Name")
      const contentTypeTag = result.tags.find((tag: any) => tag.name === "Content-Type")
      const encryptionIvTag = result.tags.find((tag: any) => tag.name === "Encryption-IV")
      const encryptionKeyJwkTag = result.tags.find((tag: any) => tag.name === "Encryption-Key-JWK")

      return {
        id: result.id,
        name: fileNameTag ? fileNameTag.value : "Unknown File",
        type: contentTypeTag ? contentTypeTag.value : "application/octet-stream",
        size: result.data_size, // Irys provides data_size
        timestamp: new Date(result.timestamp).toISOString(),
        url: `https://gateway.irys.xyz/${result.id}`,
        tags: result.tags,
        encryptionIv: encryptionIvTag ? encryptionIvTag.value : null,
        encryptionKeyJwk: encryptionKeyJwkTag ? encryptionKeyJwkTag.value : null,
      }
    })
  } catch (error) {
    console.error("Error querying files from Irys:", error)
    return []
  }
}
