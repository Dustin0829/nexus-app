import { WebIrys } from "@irys/sdk"
import { ethers } from "ethers"

// Irys network configuration
const IRYS_NETWORK = process.env.NEXT_PUBLIC_IRYS_NETWORK || "devnet"
const IRYS_TOKEN = process.env.NEXT_PUBLIC_IRYS_TOKEN || "ethereum"

// Irys client configuration for the programmable datachain
export const getIrysClient = async (walletClient: any, address: string) => {
  // Irys expects its own network (mainnet/devnet) and optionally a URL
  const irysNetwork = IRYS_NETWORK === "mainnet" ? "mainnet" : "devnet"
  const irysUrl = IRYS_NETWORK === "mainnet" ? "https://node2.irys.xyz" : "https://devnet.irys.xyz"
  // Underlying chain for devnet is Sepolia
  const desiredChainId = IRYS_NETWORK === "mainnet" ? 1 : 11155111

  try {
    // EIP-1559 tip fallback: derive a priority fee if the RPC doesn't
    // implement eth_maxPriorityFeePerGas.
    const withPriorityFeeFallback = (base: { request: (args: { method: string; params?: any[] }) => Promise<any> }) => ({
      request: async ({ method, params }: { method: string; params?: any[] }) => {
        if (method === "eth_maxPriorityFeePerGas") {
          try {
            return await base.request({ method, params })
          } catch (err: any) {
            const code = err?.code ?? err?.error?.code
            if (code === -32601) {
              try {
                const hist = await base.request({ method: "eth_feeHistory", params: ["0x5", "latest", [90]] })
                const rewards = Array.isArray(hist?.reward) ? hist.reward : undefined
                const last = rewards && rewards.length > 0 ? rewards[rewards.length - 1] : undefined
                const tipHex = last && typeof last[0] === "string" ? last[0] : undefined
                if (tipHex) return tipHex
              } catch {}
              // default to 1 gwei
              return "0x3b9aca00"
            }
            throw err
          }
        }
        return base.request({ method, params })
      },
    })
    // Build an ethers.js provider for WebIrys
    let provider: any
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const wrapped = withPriorityFeeFallback((window as any).ethereum)
      provider = new ethers.BrowserProvider(wrapped as any)
    } else if (walletClient) {
      const request = (walletClient?.transport as any)?.request || (walletClient as any)?.request
      if (typeof request !== "function") {
        throw new Error("No EIP-1193 request function available from walletClient")
      }
      const eip1193Provider = withPriorityFeeFallback({ request })
      provider = new ethers.BrowserProvider(eip1193Provider as any, (walletClient as any)?.chain?.id)
    } else {
      throw new Error("No wallet provider available for Irys")
    }

    // Ensure we are on the correct chain for Irys
    try {
      const currentNetwork = await (provider as ethers.BrowserProvider).getNetwork()
      const currentChainId = Number(currentNetwork.chainId)
      if (currentChainId !== desiredChainId && typeof window !== "undefined" && (window as any).ethereum?.request) {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${desiredChainId.toString(16)}` }],
        })
      }
    } catch (e) {
      console.warn("Failed to switch chain (continuing):", e)
    }

    const irys = new WebIrys({
      network: irysNetwork,
      url: irysUrl,
      token: IRYS_TOKEN,
      wallet: {
        name: "ethersv6",
        provider,
      },
    })

    await irys.ready()
    return irys
  } catch (error) {
    console.error("Error initializing Irys client:", error)
    throw error
  }
}

// Get Irys balance for a wallet
export const getIrysBalance = async (irys: any) => {
  try {
    const balance = await irys.getBalance()
    return irys.utils.fromAtomic(balance).toString()
  } catch (error) {
    console.error("Error getting Irys balance:", error)
    return "0"
  }
}

// Fund Irys wallet for storage
export const fundIrysWallet = async (irys: any, amount: string) => {
  try {
    const atomic = irys.utils.toAtomic(amount)
    const fundTx = await irys.fund(atomic)
    return fundTx
  } catch (error) {
    console.error("Error funding Irys wallet:", error)
    throw error
  }
}

// Upload file to Irys with programmable tags
export const uploadToIrys = async (
  irys: any, 
  file: File, 
  userAddress: string,
  tags: Array<{ name: string; value: string }> = [],
  metadata: any = {}
) => {
  try {
    // Add default tags for file metadata and programmability
    const defaultTags = [
      { name: "Content-Type", value: file.type },
      { name: "File-Name", value: file.name },
      { name: "File-Size", value: file.size.toString() },
      { name: "Upload-Date", value: new Date().toISOString() },
      { name: "App", value: "Nexus" },
      { name: "Owner", value: userAddress },
      { name: "Storage-Type", value: "permanent" },
      { name: "Programmable", value: "true" },
      { name: "Datachain", value: "Irys" },
      ...tags
    ]

    // Add metadata tags for future programmability
    if (metadata.description) {
      defaultTags.push({ name: "Description", value: metadata.description })
    }
    if (metadata.category) {
      defaultTags.push({ name: "Category", value: metadata.category })
    }
    if (metadata.accessControl) {
      defaultTags.push({ name: "Access-Control", value: metadata.accessControl })
    }
    if (metadata.royalties) {
      defaultTags.push({ name: "Royalties", value: metadata.royalties })
    }

    const receipt = await irys.uploadFile(file, { tags: defaultTags })
    return receipt
  } catch (error) {
    console.error("Error uploading to Irys:", error)
    throw error
  }
}

// Get file from Irys gateway
export const getFileFromIrys = async (transactionId: string) => {
  try {
    const urls = [
      `https://gateway.irys.xyz/${transactionId}`,
      `https://arweave.net/${transactionId}`,
    ]
    let lastError: any
    for (const url of urls) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)
        const response = await fetch(url, { cache: 'no-store', mode: 'cors', signal: controller.signal })
        clearTimeout(timeout)
        if (response.ok) {
          return response
        }
        lastError = new Error(`Fetch not ok: ${response.status} ${response.statusText}`)
      } catch (e) {
        lastError = e
      }
    }
    throw lastError || new Error('Failed to fetch file from gateways')
  } catch (error) {
    console.error("Error getting file from Irys:", error)
    throw error
  }
}

// Delete file from Irys (mark for deletion since storage is permanent)
export const deleteFromIrys = async (irys: any, transactionId: string) => {
  try {
    // Since Irys is permanent storage, we mark files for deletion
    // This enables future programmability for access control
    const deletionTags = [
      { name: "Action", value: "Delete" },
      { name: "Original-Transaction", value: transactionId },
      { name: "Delete-Date", value: new Date().toISOString() },
      { name: "App", value: "Nexus" },
      { name: "Programmable", value: "true" }
    ]

    const receipt = await irys.upload("", { tags: deletionTags })
    return receipt
  } catch (error) {
    console.error("Error marking file for deletion:", error)
    throw error
  }
}

// Search files by tags with programmability support
export const searchFilesByTags = async (irys: any, tags: Array<{ name: string; value: string }>) => {
  try {
    // WebIrys search API is evolving; disable remote search for now
    return []
  } catch (error) {
    console.error("Error searching files:", error)
    throw error
  }
}

// Get user's files from Irys
export const getUserFiles = async (irys: any, userAddress: string) => {
  try {
    // Remote listing disabled; rely on locally uploaded files for now
    return []
  } catch (error) {
    console.error("Error getting user files:", error)
    // Return empty array instead of throwing to prevent app crashes
    return []
  }
}

// Free storage limit in bytes (10GB)
const FREE_STORAGE_LIMIT = 10 * 1024 * 1024 * 1024 // 10GB in bytes

// Get user's current storage usage
export const getUserStorageUsage = async (irys: any, address: string) => {
  try {
    // Without remote listing, treat usage as 0 for free allowance calculations
    return 0
  } catch (error) {
    console.error("Error getting user storage usage:", error)
    return 0
  }
}

// Check if user has free storage available
export const hasFreeStorageAvailable = async (irys: any, address: string, fileSize: number) => {
  try {
    const currentUsage = await getUserStorageUsage(irys, address)
    const totalUsageAfterUpload = currentUsage + fileSize
    return totalUsageAfterUpload <= FREE_STORAGE_LIMIT
  } catch (error) {
    console.error("Error checking free storage availability:", error)
    return false
  }
}

// Calculate storage cost for a file
export const calculateStorageCost = async (irys: any, fileSize: number, address?: string) => {
  try {
    if (address) {
      const free = await hasFreeStorageAvailable(irys, address, fileSize)
      if (free) return "0"
    }
    const price = await irys.getPrice(fileSize)
    return irys.utils.fromAtomic(price).toString()
  } catch (error) {
    console.error("Error calculating storage cost:", error)
    throw error
  }
}

// Check if wallet has sufficient balance for upload
export const checkBalanceForUpload = async (irys: any, fileSize: number, address: string) => {
  try {
    // Respect app-level 10GB free storage
    const free = await hasFreeStorageAvailable(irys, address, fileSize)
    if (free) {
      return {
        hasSufficientBalance: true,
        requiredAmount: "0",
        currentBalance: await getIrysBalance(irys),
        shortfall: "0",
        isFreeStorage: true,
      }
    }
    const requiredAtomic = await irys.getPrice(fileSize)
    const balanceAtomic = await irys.getBalance()

    const required = BigInt(requiredAtomic.toString())
    const balance = BigInt(balanceAtomic.toString())

    const hasSufficientBalance = balance >= required
    const requiredEth = irys.utils.fromAtomic(requiredAtomic).toString()
    const currentEth = irys.utils.fromAtomic(balanceAtomic).toString()
    const shortfallEth = hasSufficientBalance
      ? "0"
      : irys.utils.fromAtomic((required - balance).toString()).toString()

    return {
      hasSufficientBalance,
      requiredAmount: requiredEth,
      currentBalance: currentEth,
      shortfall: shortfallEth,
      isFreeStorage: false
    }
  } catch (error) {
    console.error("Error checking balance for upload:", error)
    throw error
  }
}

// Ensure the Irys wallet has enough balance to upload a payload of given bytes
export const ensureFundsForUpload = async (irys: any, fileSize: number) => {
  // If free storage covers this size, skip funding (handled by caller)
  const requiredAtomic = await irys.getPrice(fileSize)
  const balanceAtomic = await irys.getBalance()

  const required = BigInt(requiredAtomic.toString())
  const balance = BigInt(balanceAtomic.toString())

  if (balance >= required) {
    return { funded: false, needed: "0" }
  }

  const deltaAtomic = (required - balance).toString()
  const deltaEth = irys.utils.fromAtomic(deltaAtomic).toString()
  try {
    await irys.fund(deltaAtomic)
  } catch (e) {
    console.error("Irys auto-fund failed:", e)
    throw new Error(`Auto-fund failed. Needed ${deltaEth} ${irys.token}. Please ensure your wallet has enough balance and try again.`)
  }
  return { funded: true, needed: deltaEth }
}

// Upload metadata for programmable features
export const uploadMetadata = async (
  irys: any,
  metadata: any,
  tags: Array<{ name: string; value: string }> = []
) => {
  try {
    const metadataString = JSON.stringify(metadata)
    const defaultTags = [
      { name: "Content-Type", value: "application/json" },
      { name: "Type", value: "metadata" },
      { name: "App", value: "Nexus" },
      { name: "Programmable", value: "true" },
      ...tags
    ]

    const receipt = await irys.upload(metadataString, { tags: defaultTags })
    return receipt
  } catch (error) {
    console.error("Error uploading metadata:", error)
    throw error
  }
}
