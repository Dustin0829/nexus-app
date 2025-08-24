"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import { 
  Download, 
  Share2, 
  Trash2, 
  File as FileIcon, 
  Folder, 
  Search, 
  Filter,
  MoreVertical,
  ExternalLink,
  Lock,
  Eye,
  X as XIcon,
  Upload,
  Plus
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useNexusStore } from "@/stores/use-nexus-store"
import { useLoadingStore } from "@/stores/use-loading-store"
import { 
  getIrysClient, 
  getFileFromIrys, 
  deleteFromIrys,
  uploadToIrys, 
  checkBalanceForUpload, 
  calculateStorageCost,
  getUserStorageUsage,
  hasFreeStorageAvailable,
  ensureFundsForUpload
} from "@/lib/irys-client"
import { decryptFile, encryptFile } from "@/lib/encryption"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { useDropzone } from "react-dropzone"

export function FileList() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { files, trashFile, setFiles, addFile } = useNexusStore()
  const { startLoading, stopLoading } = useLoadingStore()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null)
  const [deletingFile, setDeletingFile] = useState<string | null>(null)
  const [pendingDeleteFile, setPendingDeleteFile] = useState<any | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState<string>("")
  const [previewType, setPreviewType] = useState<string>("")
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({})
  const [previewFile, setPreviewFile] = useState<any | null>(null)
  
  // Upload and folder creation states
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [showFolderUploadDialog, setShowFolderUploadDialog] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<any>(null)
  const [uploadingFiles, setUploadingFiles] = useState<any[]>([])
  const [folderName, setFolderName] = useState("")
  const [uploadDescription, setUploadDescription] = useState("")
  const [uploadTags, setUploadTags] = useState("")
  const [isPrivate, setIsPrivate] = useState(true)
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)
  const [storageCost, setStorageCost] = useState<string>("0")
  const [storageUsage, setStorageUsage] = useState<{
    used: number
    total: number
    percentage: number
  }>({ used: 0, total: 10 * 1024 * 1024 * 1024, percentage: 0 })

  const isImageFile = (f: any) =>
    (typeof f?.type === 'string' && f.type.startsWith('image/')) || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f?.name || "")

  const isVideoFile = (f: any) =>
    (typeof f?.type === 'string' && f.type.startsWith('video/')) || /\.(mp4|webm|ogg|mov|m4v)$/i.test(f?.name || "")

  const createVideoThumbnail = async (videoBlob: Blob): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const video = document.createElement('video')
        video.preload = 'auto'
        video.muted = true
        const url = URL.createObjectURL(videoBlob)
        video.src = url

        const cleanup = () => {
          URL.revokeObjectURL(url)
        }

        video.addEventListener('loadeddata', () => {
          try { video.currentTime = Math.min(0.1, (video.duration || 1) * 0.05) } catch {}
        })

        video.addEventListener('seeked', () => {
          try {
            const canvas = document.createElement('canvas')
            const width = video.videoWidth || 320
            const height = video.videoHeight || 180
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('No canvas context')
            ctx.drawImage(video as any, 0, 0, width, height)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
            cleanup()
            resolve(dataUrl)
          } catch (err) {
            cleanup()
            reject(err)
          }
        })

        video.addEventListener('error', (e) => {
          cleanup()
          reject(new Error('Failed to load video for thumbnail'))
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  // Helper: responsive title sizing based on length to keep inside card
  const getTitleClassesFor = (name: string) => {
    const len = (name || "").length
    let size = "text-sm"
    if (len > 60) size = "text-[11px]"
    else if (len > 40) size = "text-xs"
    // Allow up to 2 lines with ellipsis; wrap long words if needed
    return `${size} font-medium leading-snug line-clamp-2 break-words`
  }

  const ensureThumbnail = async (file: any) => {
    if (!(isImageFile(file) || isVideoFile(file)) || thumbUrls[file.id] || !file.transactionId) return
    try {
      const response = await getFileFromIrys(file.transactionId)
      const blob = await response.blob()
      let dataOrUrl: string | null = null
      let workingBlob = blob
      try {
        const headerBuf = await blob.slice(0, 4).arrayBuffer()
        const view = new DataView(headerBuf)
        const metaLen = view.getUint32(0, false)
        const plausible = Number.isFinite(metaLen) && metaLen > 0 && metaLen < blob.size - 4
        if (plausible) {
          const encFile = new File([blob], `${file.name}.encrypted`, { type: 'application/octet-stream' })
          const dec = await decryptFile(encFile)
          workingBlob = new Blob([await dec.arrayBuffer()], { type: dec.type || blob.type })
        }
      } catch {}
      if (isImageFile(file) || (workingBlob.type && workingBlob.type.startsWith('image/'))) {
        const url = URL.createObjectURL(workingBlob)
        setThumbUrls(prev => ({ ...prev, [file.id]: url }))
      } else if (isVideoFile(file) || (workingBlob.type && workingBlob.type.startsWith('video/'))) {
        try {
          dataOrUrl = await createVideoThumbnail(workingBlob)
          setThumbUrls(prev => ({ ...prev, [file.id]: dataOrUrl! }))
        } catch {
          const url = URL.createObjectURL(workingBlob)
          setThumbUrls(prev => ({ ...prev, [file.id]: url }))
        }
      }
    } catch (e) {
      // ignore thumbnail failures; card will show generic UI
    }
  }

  useEffect(() => {
    files.filter(f => isImageFile(f) || isVideoFile(f)).forEach(f => { void ensureThumbnail(f) })
  }, [files])

  const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes)) return "-"
    const units = ["B", "KB", "MB", "GB", "TB"]
    let i = 0
    let n = bytes
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
    return `${n.toFixed(2)} ${units[i]}`
  }

  const handleDownload = async (file: any) => {
    if (!file.transactionId) {
      toast({ title: "Download Failed", description: "File transaction ID not found", variant: "destructive" })
      return
    }
    startLoading('download-file', `Downloading ${file.name}...`)
    setDownloadingFile(file.id)
    try {
      const response = await getFileFromIrys(file.transactionId)
      const blob = await response.blob()

      let outBlob = blob
      let outName = file.name

      try {
        const headerBuf = await blob.slice(0, 4).arrayBuffer()
        const headerView = new DataView(headerBuf)
        const metaLen = headerView.getUint32(0, false)
        const plausible = Number.isFinite(metaLen) && metaLen > 0 && metaLen < blob.size - 4
        if (plausible) {
          const encFile = new File([blob], `${file.name}.encrypted`, { type: 'application/octet-stream' })
          const decrypted = await decryptFile(encFile)
          outBlob = new Blob([await decrypted.arrayBuffer()], { type: decrypted.type || 'application/octet-stream' })
          outName = decrypted.name || file.name
        }
      } catch {}

      const url = URL.createObjectURL(outBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = outName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "⬇️ Download Started",
        description: `${file.name} download has been initiated`,
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({ title: "Download Failed", description: "Unable to download this file", variant: "destructive" })
    } finally {
      setDownloadingFile(null)
      stopLoading('download-file')
    }
  }

  const handleShare = async (file: any) => {
    console.debug('[Share] start', { id: file.id, name: file.name, tx: file.transactionId })
    if (!file.transactionId) {
      toast({
        title: "Share Failed",
        description: "File transaction ID not found",
        variant: "destructive",
      })
      return
    }

    const shareUrl = `https://gateway.irys.xyz/${file.transactionId}`
    
    try {
      if (navigator.share) {
        console.debug('[Share] using Web Share API', { shareUrl })
        await navigator.share({ title: file.name, url: shareUrl })
      } else if (navigator.clipboard && window.isSecureContext) {
        console.debug('[Share] copying to clipboard', { shareUrl })
        await navigator.clipboard.writeText(shareUrl)
        toast({ 
          title: "🔗 Link Copied", 
          description: "File link has been copied to clipboard" 
        })
      } else {
        console.debug('[Share] opening new tab fallback', { shareUrl })
        window.open(shareUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      console.error("Share/Copy error:", error)
      toast({
        title: "Copy Failed",
        description: "Failed to share/copy link",
        variant: "destructive",
      })
    }
  }

  const confirmDelete = async (file: any) => {
    if (!address || !walletClient || !file.transactionId) {
      toast({
        title: "Delete Failed",
        description: "Cannot delete file",
        variant: "destructive",
      })
      return
    }

    startLoading('delete-file', `Deleting ${file.name}...`)
    setDeletingFile(file.id)
    try {
      const irys = await getIrysClient(walletClient, address)
      await deleteFromIrys(irys, file.transactionId)
      trashFile(file)

      toast({
        title: "🗑️ File Deleted",
        description: `${file.name} has been marked for deletion on Irys`,
      })

    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Delete Failed",
        description: "Failed to mark file for deletion",
        variant: "destructive",
      })
    } finally {
      setDeletingFile(null)
      stopLoading('delete-file')
    }
  }

  const handlePreview = async (file: any) => {
    console.debug('[Preview] start', { id: file.id, name: file.name, tx: file.transactionId, encrypted: file.encrypted })
    
    // Check if we have a valid transaction ID or local file data
    if (!file.transactionId && !file.url && !file.blob) {
      toast({ 
        title: "Preview failed", 
        description: "File has no valid transaction ID or local data", 
        variant: "destructive" 
      })
      return
    }

    try {
      let response: Response
      let blob: Blob
      
      // Try different ways to get the file
      if (file.transactionId) {
        // Try to fetch from Irys/Arweave
        try {
          response = await getFileFromIrys(file.transactionId)
          blob = await response.blob()
          console.debug('[Preview] fetched from Irys', { size: blob.size, type: blob.type })
        } catch (irysError) {
          console.warn('[Preview] Irys fetch failed, trying fallback:', irysError)
          throw irysError
        }
      } else if (file.url) {
        // Try to fetch from direct URL
        response = await fetch(file.url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        blob = await response.blob()
        console.debug('[Preview] fetched from URL', { size: blob.size, type: blob.type })
      } else if (file.blob) {
        // Use local blob data
        blob = file.blob
        console.debug('[Preview] using local blob', { size: blob.size, type: blob.type })
      } else {
        throw new Error('No valid file source found')
      }
      
      let previewBlob = blob
      let didDecrypt = false
      
      // Try to decrypt if the file is marked as encrypted
      if (file.encrypted) {
        try {
          const headerBuf = await blob.slice(0, 4).arrayBuffer()
          const headerView = new DataView(headerBuf)
          const metaLen = headerView.getUint32(0, false)
          const plausible = Number.isFinite(metaLen) && metaLen > 0 && metaLen < blob.size - 4
          if (plausible) {
            const encFile = new File([blob], `${file.name}.encrypted`, { type: 'application/octet-stream' })
            const decrypted = await decryptFile(encFile)
            previewBlob = new Blob([await decrypted.arrayBuffer()], { type: decrypted.type || 'application/octet-stream' })
            setPreviewName(decrypted.name || file.name)
            setPreviewType(decrypted.type || previewBlob.type || blob.type)
            didDecrypt = true
            console.debug('[Preview] decrypted', { size: previewBlob.size, type: (previewBlob as any).type })
          }
        } catch (deErr) {
          console.debug('[Preview] decryption failed, using original file', deErr)
          // Continue with original blob if decryption fails
        }
      }
      
      if (!didDecrypt) {
        setPreviewName(file.name)
        setPreviewType(blob.type || file.type || 'application/octet-stream')
      }
      
      const url = URL.createObjectURL(previewBlob)
      console.debug('[Preview] object URL created')
      setPreviewUrl(url)
      setPreviewFile(file)
      
    } catch (e) {
      console.error('[Preview] Error:', e)
      
      // Provide more specific error messages
      let errorMessage = "Unable to preview this file"
      if (e instanceof Error) {
        if (e.message.includes('404')) {
          errorMessage = "File not found on the network. It may have been deleted or the transaction ID is invalid."
        } else if (e.message.includes('Fetch not ok')) {
          errorMessage = "Network error while fetching file. Please try again."
        } else if (e.message.includes('Failed to fetch')) {
          errorMessage = "Connection error. Please check your internet connection."
        }
      }
      
      toast({ 
        title: "Preview failed", 
        description: errorMessage, 
        variant: "destructive" 
      })
    }
  }

  // Folder actions
  const handleShareFolder = (folder: any) => {
    try {
      const shareUrl = `${window.location.origin}/files?folder=${encodeURIComponent(folder.id)}`
      if (navigator.clipboard && window.isSecureContext) {
        void navigator.clipboard.writeText(shareUrl)
        toast({ title: "🔗 Link Copied", description: "Folder link has been copied to clipboard" })
      } else {
        window.open(shareUrl, '_blank', 'noopener,noreferrer')
      }
    } catch {}
  }

  const handleDeleteFolder = (folder: any) => {
    // Soft delete: move folder and its files to trash using existing delete logic per file
    const folderFiles = files.filter(f => f.parentFolder === folder.id)
    folderFiles.forEach(f => { void confirmDelete(f) })
    // Also push a lightweight folder marker to trash
    try {
      trashFile(folder)
      toast({ title: "🗑️ Folder Deleted", description: `Folder "${folder.name}" moved to trash` })
    } catch {}
  }

  // Get files for current folder context
  const getCurrentFolderFiles = () => {
    if (selectedFolder) {
      return files.filter(file => file.parentFolder === selectedFolder.id && file.type !== 'folder')
    }
    return files.filter(file => !file.parentFolder && file.type !== 'folder') // Show files in root, exclude folders
  }

  // Get folders for current context
  const getCurrentFolderFolders = () => {
    if (selectedFolder) {
      return files.filter(file => file.type === 'folder' && file.parentFolder === selectedFolder.id)
    }
    return files.filter(file => file.type === 'folder' && !file.parentFolder) // Show folders in root
  }

  const currentFiles = getCurrentFolderFiles()
  const currentFolders = getCurrentFolderFolders()
  
  const filteredFiles = currentFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (file.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (file.tags || []).some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = filterType === "all" || 
                         (filterType === "documents" && file.type.startsWith("text/")) ||
                         (filterType === "images" && file.type.startsWith("image/")) ||
                         (filterType === "videos" && file.type.startsWith("video/"))

    return matchesSearch && matchesFilter
  })

  const filteredFolders = currentFolders.filter(folder => {
    const matchesSearch = folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (folder.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })



  // Upload functionality
  const onDrop = async (acceptedFiles: File[]) => {
    if (!address || !walletClient) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to upload files",
        variant: "destructive",
      })
      return
    }

    startLoading('file-upload', `Uploading ${acceptedFiles.length} file${acceptedFiles.length > 1 ? 's' : ''}...`)
    setIsCheckingBalance(true)
    try {
      const totalSize = acceptedFiles.reduce((sum, file) => sum + file.size, 0)
      const irys = await getIrysClient(walletClient, address)
      
      // Determine paid vs free bytes based on local 10GB free tier
      const freeLimit = 10 * 1024 * 1024 * 1024
      const used = files.reduce((sum, f) => sum + (f?.size || 0), 0)
      const freeRemaining = Math.max(0, freeLimit - used)
      const paidBytes = Math.max(0, totalSize - freeRemaining)

      if (paidBytes === 0) {
        setStorageCost("0")
        toast({ title: "Free Storage", description: "This upload is covered by your free 10GB." })
      } else {
        const priceAtomic = await irys.getPrice(paidBytes)
        const price = irys.utils.fromAtomic(priceAtomic).toString()
        setStorageCost(price)
        const balanceAtomic = await irys.getBalance(address as any)
        const hasEnough = BigInt(balanceAtomic.toString()) >= BigInt(priceAtomic.toString())
        if (!hasEnough) {
          toast({
            title: "Insufficient Irys Balance",
            description: `Need ${price} ETH. Please fund storage first on the Funding page.`,
            variant: "destructive",
          })
          return
        }
        toast({ title: "Paid Storage", description: `Estimated cost: ${price} ETH (deducted from Irys balance).` })
      }

      // Add files to uploading state
      const newUploadingFiles = acceptedFiles.map(file => ({
        file,
        progress: 0,
        status: 'uploading'
      }))
      setUploadingFiles(prev => [...prev, ...newUploadingFiles])

      // Upload each file
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        await uploadFile(file, i + newUploadingFiles.length - acceptedFiles.length)
      }

    } catch (error) {
      console.error("Error checking balance:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to check balance or upload files",
        variant: "destructive",
      })
    } finally {
      setIsCheckingBalance(false)
      stopLoading('file-upload')
    }
  }

  const uploadFile = async (file: File, index: number) => {
    if (!address || !walletClient) return

    try {
      startLoading(`file-upload-${index}`, `Uploading ${file.name}...`)
      // Update progress
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 10 } : f
      ))

      // Encrypt file
      const encryptedFile = await encryptFile(file)
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 30 } : f
      ))

      // Get Irys client
      const irys = await getIrysClient(walletClient, address)
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 50 } : f
      ))

      // Prepare metadata
      const metadata = {
        description: uploadDescription || undefined,
        category: folderName || undefined,
        accessControl: isPrivate ? "private" : "public",
        royalties: "0",
        originalName: file.name,
        originalSize: file.size,
        encrypted: isPrivate,
        uploadDate: new Date().toISOString()
      }

      // Parse tags
      const parsedTags = uploadTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      const tagObjects = parsedTags.map(tag => ({ name: "Tag", value: tag }))
      tagObjects.push({ name: "Access", value: isPrivate ? "private" : "public" })

      // Upload
      const receipt = await uploadToIrys(irys, encryptedFile, address, tagObjects, metadata)
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 90 } : f
      ))

      // Add to store
      const nexusFile = {
        id: receipt.id,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        description: uploadDescription || "",
        tags: parsedTags,
        encrypted: true,
        transactionId: receipt.id,
        url: `https://gateway.irys.xyz/${receipt.id}`,
        parentFolder: selectedFolder ? selectedFolder.id : null
      }

      addFile(nexusFile)

      // Mark as success
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          progress: 100, 
          status: 'success',
          transactionId: receipt.id
        } : f
      ))

      toast({
        title: "✅ Upload Successful",
        description: `${file.name} has been uploaded to Irys permanently`,
      })

    } catch (error) {
      console.error("Error uploading file:", error)
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          status: 'error',
          error: error instanceof Error ? error.message : "Upload failed"
        } : f
      ))

      toast({
        title: "Upload Failed",
        description: `Failed to upload ${file.name}`,
        variant: "destructive",
      })
    } finally {
      stopLoading(`file-upload-${index}`)
    }
  }

  // Create folder functionality
  const createFolder = async () => {
    if (!folderName.trim()) {
      toast({
        title: "Folder Name Required",
        description: "Please enter a folder name",
        variant: "destructive",
      })
      return
    }

    startLoading('create-folder', `Creating folder "${folderName}"...`)

    try {
      // Create a folder with parent folder reference
      const folderFile = {
        id: `folder-${Date.now()}`,
        name: folderName,
        size: 0,
        type: 'folder',
        uploadedAt: new Date().toISOString(),
        description: "Folder",
        tags: [],
        encrypted: false,
        transactionId: `folder-${Date.now()}`,
        url: "",
        parentFolder: selectedFolder ? selectedFolder.id : null
      }

      addFile(folderFile)
      setFolderName("")
      setShowCreateFolderDialog(false)
      
      toast({
        title: "📁 Folder Created",
        description: `Folder "${folderName}" has been created successfully`,
      })
    } catch (error) {
      console.error("Error creating folder:", error)
      toast({
        title: "Folder Creation Failed",
        description: "Failed to create folder",
        variant: "destructive",
      })
    } finally {
      stopLoading('create-folder')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    disabled: !address || !walletClient || isCheckingBalance
  })

  // Handle folder click
  const handleFolderClick = (folder: any) => {
    setSelectedFolder(folder)
  }

  if (!address) {
    return (
      <div className="text-center py-8">
        <FileIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Connect Wallet to View Files</h3>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to view and manage your files stored on Irys
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileIcon className="h-5 w-5" />
          <h2 className="text-xl font-semibold">My Files</h2>
          {selectedFolder && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-primary font-medium">{selectedFolder.name}</span>
            </>
          )}
          <Badge variant="secondary">
            {filteredFiles.length + filteredFolders.length} items
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedFolder && (
            <Button 
              variant="outline"
              onClick={() => setSelectedFolder(null)}
              className="flex items-center gap-2"
            >
              ← Back
            </Button>
          )}
          
          <Button 
            onClick={() => selectedFolder ? setShowFolderUploadDialog(true) : setShowUploadDialog(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {selectedFolder ? `Upload to ${selectedFolder.name}` : 'Upload'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setShowCreateFolderDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Folder
          </Button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md text-sm"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Files</option>
            <option value="documents">Documents</option>
            <option value="images">Images</option>
            <option value="videos">Videos</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading files from Irys...</p>
        </div>
      )}

      {!isLoading && filteredFiles.length === 0 && (
        <div className="text-center py-8">
          <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Files Found</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? "No files match your search" : "Upload your first file to get started"}
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Show folders first */}
        {filteredFolders.map((folder) => {
          // Calculate folder stats: total size and item count
          const folderFiles = files.filter(f => f.parentFolder === folder.id && f.type !== 'folder')
          const totalBytes = folderFiles.reduce((acc, f) => acc + (Number(f.size) || 0), 0)
          const totalMb = (totalBytes / 1024 / 1024).toFixed(2)

          return (
            <Card key={folder.id} className="group hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleFolderClick(folder)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Folder className="h-5 w-5 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className={getTitleClassesFor(folder.name)}>
                        {folder.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {totalMb} MB • {new Date(folder.uploadedAt).toLocaleDateString()} • Storage: Irys
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleShareFolder(folder)}
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteFolder(folder)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {/* compact body to keep folder card short */}
              <CardContent className="pt-0 pb-3">
                <div className="text-xs text-muted-foreground">
                  {folderFiles.length} item{folderFiles.length === 1 ? '' : 's'}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredFolders.length > 0 && (
          <div className="col-span-full" />
        )}
        
        {/* Then show files */}
        {filteredFiles.map((file) => (
          <Card key={file.id} className="group hover:shadow-md transition-shadow cursor-pointer" onClick={() => handlePreview(file)}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <CardTitle className={getTitleClassesFor(file.name)}>
                      {file.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1" />
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {(isImageFile(file) || isVideoFile(file)) && (
                <div className="mb-3 overflow-hidden rounded-md border">
                  <AspectRatio ratio={16/9}>
                    {thumbUrls[file.id] ? (
                      <img src={thumbUrls[file.id]} alt={file.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-muted animate-pulse" />
                    )}
                  </AspectRatio>
                </div>
              )}
              {file.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {file.description}
                </p>
              )}
              
              {file.tags && file.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {file.tags.slice(0, 3).map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {file.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{file.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {new Date(file.uploadedAt).toLocaleDateString()}
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleDownload(file) }}
                    disabled={downloadingFile === file.id}
                    className="h-7 w-7 p-0"
                  >
                    {downloadingFile === file.id ? (
                      <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleShare(file) }}
                    className="h-7 w-7 p-0"
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handlePreview(file) }}
                    className="h-7 w-7 p-0"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setPendingDeleteFile(file) }}
                    disabled={deletingFile === file.id}
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                  >
                    {deletingFile === file.id ? (
                      <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!previewUrl} onOpenChange={(o) => { if (!o && previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setPreviewType(""); setPreviewFile(null); } }}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            className="fixed z-50 flex flex-col bg-background p-0 overflow-hidden rounded-lg shadow-2xl border"
            style={{ 
              maxWidth: '95vw', 
              maxHeight: '95vh',
              width: '95vw',
              height: '95vh',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              position: 'fixed'
            }}
          >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <DialogTitle className="text-lg font-medium truncate">{previewName}</DialogTitle>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {previewFile && (
                <Button size="sm" variant="outline" onClick={() => handleShare(previewFile)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Preview Area - Full screen */}
            <div className="flex-1 flex items-center justify-center bg-muted/5 relative">
              {previewUrl && (
                previewType.startsWith('image/') || previewName.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ? (
                  <img 
                    src={previewUrl} 
                    alt={previewName} 
                    className="max-w-[95vw] max-h-[70vh] object-contain rounded-lg shadow-lg" 
                    style={{ maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 16rem)' }}
                  />
                ) : previewType.startsWith('video/') || previewName.match(/\.(mp4|webm|ogg|mov|m4v)$/i) ? (
                  <video 
                    src={previewUrl} 
                    controls 
                    className="max-w-[95vw] max-h-[90vh] rounded-lg shadow-lg" 
                    style={{ maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 8rem)' }}
                  />
                ) : previewType === 'application/pdf' || previewName.match(/\.(pdf)$/i) ? (
                  <iframe 
                    src={previewUrl} 
                    className="rounded-lg shadow-lg border-0" 
                    style={{ 
                      width: 'calc(100vw - 2rem)', 
                      height: 'calc(100vh - 8rem)',
                      maxWidth: '95vw',
                      maxHeight: '90vh'
                    }}
                  />
                ) : previewType.startsWith('audio/') || previewName.match(/\.(mp3|wav|ogg|m4a)$/i) ? (
                  <div className="w-full max-w-md">
                    <audio src={previewUrl} controls className="w-full" />
                  </div>
                ) : previewType.startsWith('text/') || previewName.match(/\.(txt|csv|json|md|log|js|ts|tsx|css|html)$/i) ? (
                  <iframe 
                    src={previewUrl} 
                    className="rounded-lg shadow-lg border-0 bg-background" 
                    style={{ 
                      width: 'calc(100vw - 2rem)', 
                      height: 'calc(100vh - 8rem)',
                      maxWidth: '95vw',
                      maxHeight: '90vh'
                    }}
                  />
                ) : (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                      <FileIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Preview not available</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This file type cannot be previewed directly.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <a 
                        href={previewUrl} 
                        download={previewName} 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                      <a 
                        href={previewUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-2 px-4 py-2 border border-input bg-background rounded-md hover:bg-accent transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </a>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Bottom Details Section */}
            {previewFile && (
              <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
                <div className="flex flex-col gap-3">
                  {/* File Details Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Size:</span>
                        <span className="font-medium">{formatBytes(previewFile?.size)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Uploaded:</span>
                        <span className="font-medium">
                          {previewFile?.uploadedAt ? new Date(previewFile.uploadedAt).toLocaleDateString() : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Storage:</span>
                        <span className="font-medium">Irys Network</span>
                      </div>
                    </div>

                    {/* File Actions */}
                    {previewUrl && (
                      <div className="flex items-center gap-2">
                        <a 
                          href={previewUrl} 
                          download={previewName} 
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                        <a 
                          href={previewUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View in browser
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Transaction ID Row */}
                  {previewFile?.transactionId && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Transaction ID:</span>
                        <a 
                          className="text-primary hover:underline break-all" 
                          target="_blank" 
                          rel="noreferrer" 
                          href={`https://gateway.irys.xyz/${previewFile.transactionId}`}
                        >
                          {previewFile.transactionId}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
          <DialogPrimitive.Close
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={!!pendingDeleteFile} onOpenChange={(o) => { if (!o) setPendingDeleteFile(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move "{pendingDeleteFile?.name}" to trash and mark it for deletion on Irys. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingDeleteFile) { void confirmDelete(pendingDeleteFile); setPendingDeleteFile(null) } }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-[80vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Storage Usage Display */}
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Free Storage Usage
                    </span>
                    <span className="text-sm text-green-600 dark:text-green-300">
                      {storageUsage.percentage}% used
                    </span>
                  </div>
                  <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                    <div 
                      className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-green-600 dark:text-green-300">
                    <span>{formatBytes(storageUsage.used)} used</span>
                    <span>{formatBytes(storageUsage.total)} total</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Area */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50"
              } ${!address || isCheckingBalance ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {isDragActive ? "Drop files here" : "Upload to Irys"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag & drop files here, or click to select. Files are encrypted and stored permanently on Irys.
              </p>
              <Button disabled={!address || isCheckingBalance}>
                {isCheckingBalance ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border border-current border-t-transparent" />
                    Checking Balance...
                  </>
                ) : (
                  "Select Files"
                )}
              </Button>
            </div>

            {/* Metadata Fields */}
            <div className="grid gap-4">
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                  id="description"
                  placeholder="Describe your file..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Privacy</Label>
                  <p className="text-xs text-muted-foreground">Private files are end-to-end encrypted and require decryption for preview.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Public</span>
                  <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                  <span className="text-xs">Private</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                placeholder="Enter folder name..."
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createFolder()
                  }
                }}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateFolderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createFolder}>
                Create Folder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Folder Upload Dialog */}
      <Dialog open={showFolderUploadDialog} onOpenChange={setShowFolderUploadDialog}>
        <DialogContent className="max-w-[80vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload to "{selectedFolder?.name}"</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Storage Usage Display */}
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Free Storage Usage
                    </span>
                    <span className="text-sm text-green-600 dark:text-green-300">
                      {storageUsage.percentage}% used
                    </span>
                  </div>
                  <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                    <div 
                      className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-green-600 dark:text-green-300">
                    <span>{formatBytes(storageUsage.used)} used</span>
                    <span>{formatBytes(storageUsage.total)} total</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Area */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50"
              } ${!address || isCheckingBalance ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {isDragActive ? "Drop files here" : `Upload to ${selectedFolder?.name}`}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag & drop files here, or click to select. Files will be uploaded to this folder.
              </p>
              <Button disabled={!address || isCheckingBalance}>
                {isCheckingBalance ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border border-current border-t-transparent" />
                    Checking Balance...
                  </>
                ) : (
                  "Select Files"
                )}
              </Button>
            </div>

            {/* Metadata Fields */}
            <div className="grid gap-4">
              <div>
                <Label htmlFor="folderDescription">Description (Optional)</Label>
                <Textarea 
                  id="folderDescription"
                  placeholder="Describe your file..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Privacy</Label>
                  <p className="text-xs text-muted-foreground">Private files are end-to-end encrypted and require decryption for preview.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Public</span>
                  <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                  <span className="text-xs">Private</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}