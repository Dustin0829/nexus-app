"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import { Upload, File, X, AlertCircle, CheckCircle, Loader2, DollarSign } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useNexusStore } from "@/stores/use-nexus-store"
import { useLoadingStore } from "@/stores/use-loading-store"
import { 
  getIrysClient, 
  uploadToIrys, 
  checkBalanceForUpload, 
  calculateStorageCost,
  getUserStorageUsage,
  hasFreeStorageAvailable,
  ensureFundsForUpload
} from "@/lib/irys-client"
import { encryptFile } from "@/lib/encryption"

// Helper function to format bytes to human readable format
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

interface UploadingFile {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  transactionId?: string
  error?: string
}

export function FileUpload() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { addFile, irysBalance, setIrysBalance } = useNexusStore()
  const { files, isSignedIn, setSignedIn, setSiweSignature } = useNexusStore()
  const { startLoading, stopLoading } = useLoadingStore()
  
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])

  // Update storage usage
  const updateStorageUsage = useCallback(async () => {
    if (!address) return
    try {
      const used = files.reduce((sum, f) => sum + (f?.size || 0), 0)
      const total = 10 * 1024 * 1024 * 1024 // 10GB
      const percentage = Math.round((used / total) * 100)
      setStorageUsage({ used, total, percentage })
    } catch (error) {
      console.error("Error updating storage usage:", error)
    }
  }, [address, files])

  // Update storage usage on mount and after uploads
  useEffect(() => {
    updateStorageUsage()
  }, [updateStorageUsage])
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [category, setCategory] = useState("")
  const [isPrivate, setIsPrivate] = useState(true)
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)
  const [storageCost, setStorageCost] = useState<string>("0")
  const [storageUsage, setStorageUsage] = useState<{
    used: number
    total: number
    percentage: number
  }>({ used: 0, total: 10 * 1024 * 1024 * 1024, percentage: 0 })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!address || !walletClient) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to upload files",
        variant: "destructive",
      })
      return
    }

    if (!isSignedIn) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to Nexus before uploading.",
        variant: "destructive",
      })
      return
    }

    // Start global loading
    startLoading('file-upload', `Uploading ${acceptedFiles.length} file${acceptedFiles.length > 1 ? 's' : ''}...`)

    // Check balance for all files
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
      const newUploadingFiles: UploadingFile[] = acceptedFiles.map(file => ({
        file,
        progress: 0,
        status: 'uploading'
      }))
      setUploadingFiles(prev => [...prev, ...newUploadingFiles])

      // Do not auto-fund during uploads

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
  }, [address, publicClient, isSignedIn, files])

  const uploadFile = async (file: File, index: number) => {
    if (!address || !walletClient) return

    try {
      // Start individual file loading
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

      // Prepare metadata for programmability
      const metadata = {
        description: description || undefined,
        category: category || undefined,
        accessControl: isPrivate ? "private" : "public",
        royalties: "0", // Can be enhanced for NFT royalties
        originalName: file.name,
        originalSize: file.size,
        encrypted: isPrivate,
        uploadDate: new Date().toISOString()
      }

      // Parse tags
      const parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      const tagObjects = parsedTags.map(tag => ({ name: "Tag", value: tag }))
      tagObjects.push({ name: "Access", value: isPrivate ? "private" : "public" })

      // Upload using existing pre-funded balance or free tier only
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
        description: description || "",
        tags: parsedTags,
        encrypted: true,
        transactionId: receipt.id,
        url: `https://gateway.irys.xyz/${receipt.id}`
      }

      addFile(nexusFile)
      // Persist will be handled by use-files-sync effect

      // Update balance (getBalance on WebIrys does not take an address)
      const newBalance = await irys.getBalance(address as any)
      setIrysBalance(irys.utils.fromAtomic(newBalance).toString())

      // Update storage usage
      await updateStorageUsage()

      // Mark as success
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          progress: 100, 
          status: 'success' as const,
          transactionId: receipt.id
        } : f
      ))

      toast({
        title: "Upload Successful",
        description: `${file.name} uploaded to Irys permanently`,
      })

    } catch (error) {
      console.error("Error uploading file:", error)
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          status: 'error' as const,
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

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    disabled: !address || !walletClient || isCheckingBalance
  })

  if (!address) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Connect Wallet to Upload</h3>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to start uploading files to Irys permanent storage
        </p>
      </div>
    )
  }

  return (
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

      {/* Storage Cost Display */}
      {storageCost !== "0" && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Estimated Storage Cost: {storageCost} ETH
              </span>
            </div>
          </CardContent>
        </Card>
      )}

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
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
          <Textarea className="mt-4"
            id="description"
            placeholder="Describe your file..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Uploading Files</h3>
          {uploadingFiles.map((file, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <File className="h-4 w-4" />
                    <span className="text-sm font-medium">{file.file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {file.status === 'uploading' && (
                      <Badge variant="secondary">
                        {file.progress}%
                      </Badge>
                    )}
                    {file.status === 'success' && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Success
                      </Badge>
                    )}
                    {file.status === 'error' && (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Error
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUploadingFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <Progress value={file.progress} className="mb-2" />
                
                {file.status === 'error' && file.error && (
                  <p className="text-xs text-red-600">{file.error}</p>
                )}
                
                {file.status === 'success' && file.transactionId && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>Transaction ID:</span>
                    <code className="bg-muted px-1 rounded">{file.transactionId}</code>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
