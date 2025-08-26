import { create } from "zustand"

export interface NexusFile {  
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  description?: string
  tags?: string[]
  encrypted: boolean
  transactionId: string
  url: string
  parentFolder?: string | null
}

interface NexusState {
  // File management
  files: NexusFile[]
  trash: NexusFile[]
  folders: any[] // Placeholder for folder structure
  currentPath: string
  isUploading: boolean
  uploadProgress: number
  
  // Storage and funding
  irysBalance: string // Real Irys balance
  
  // Wallet connection
  isWalletConnected: boolean
  walletAddress: string
  walletType: "ethereum" | ""
  
  // Auth
  isSignedIn: boolean
  siweSignature: string | null
  
  // File operations
  addFile: (file: NexusFile) => void
  setFiles: (files: NexusFile[]) => void
  removeFile: (fileId: string) => void,
  updateFile: (fileId: string, updates: Partial<NexusFile>) => void,
  // Trash operations
  setTrash: (files: NexusFile[]) => void
  trashFile: (file: NexusFile) => void
  restoreFile: (fileId: string) => void
  removeTrashedFile: (fileId: string) => void
  addFolder: (folder: any) => void
  setCurrentPath: (path: string) => void
  setIsUploading: (uploading: boolean) => void
  setUploadProgress: (progress: number) => void
  
  // Storage operations
  setIrysBalance: (balance: string) => void
  
  // Wallet operations
  setConnectedWallet: (connected: boolean) => void
  setWalletAddress: (address: string) => void
  setWalletType: (type: "ethereum" | "") => void

  // Auth operations
  setSignedIn: (signedIn: boolean) => void
  setSiweSignature: (sig: string | null) => void
}

export const useNexusStore = create<NexusState>((set) => ({
  // File management
  files: [],
  trash: [],
  folders: [],
  currentPath: "/",
  isUploading: false,
  uploadProgress: 0,
  
  // Storage and funding
  irysBalance: "0",
  
  // Wallet connection
  isWalletConnected: false,
  walletAddress: "",
  walletType: "",
  
  // Auth
  isSignedIn: false,
  siweSignature: null,
  
  // File operations
  addFile: (file) => set((state) => ({ 
    files: [...state.files, file],
  })),
  setFiles: (files) => set({ files }),
  removeFile: (fileId) => set((state) => {
    const fileToRemove = state.files.find(f => f.id === fileId)
    return {
      files: state.files.filter(f => f.id !== fileId),
    }
  }),
  updateFile: (fileId, updates) => set(state => ({
    files: state.files.map(f =>
      f.id === fileId ? { ...f, ...updates } : f
    ),
  })),
  // Trash operations
  setTrash: (files) => set({ trash: files }),
  trashFile: (file) => set((state) => ({
    files: state.files.filter(f => f.id !== file.id),
    trash: [file, ...state.trash],
  })),
  restoreFile: (fileId) => set((state) => {
    const file = state.trash.find(f => f.id === fileId)
    if (!file) return { ...state }
    return {
      files: [file, ...state.files],
      trash: state.trash.filter(f => f.id !== fileId),
    }
  }),
  removeTrashedFile: (fileId) => set((state) => ({
    trash: state.trash.filter(f => f.id !== fileId),
  })),
  addFolder: (folder) => set((state) => ({ folders: [...state.folders, folder] })),
  setCurrentPath: (path) => set({ currentPath: path }),
  setIsUploading: (uploading) => set({ isUploading: uploading }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  
  // Storage operations
  setIrysBalance: (balance) => set({ irysBalance: balance }),
  
  // Wallet operations
  setConnectedWallet: (connected) => set({ isWalletConnected: connected }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setWalletType: (type) => set({ walletType: type }),
  
  // Auth operations
  setSignedIn: (isSignedIn) => set({ isSignedIn }),
  setSiweSignature: (sig) => set({ siweSignature: sig }),
}))
