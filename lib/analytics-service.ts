import { getIrysClient, getUserFiles } from './irys-client'

export interface UploadHistoryItem {
  month: string
  uploads: number
  totalSize: number
}

export interface FileTypeItem {
  name: string
  value: number
  color: string
  size: number
}

export interface AnalyticsData {
  uploadHistory: UploadHistoryItem[]
  fileTypes: FileTypeItem[]
  totalFiles: number
  totalStorage: number
  averageFileSize: number
  recentActivity: any[]
}

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || 'unknown'
}

const categorizeFileType = (extension: string): string => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp']
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv']
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages']
  const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma']
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz']

  if (imageExtensions.includes(extension)) return 'Images'
  if (videoExtensions.includes(extension)) return 'Videos'
  if (documentExtensions.includes(extension)) return 'Documents'
  if (audioExtensions.includes(extension)) return 'Audio'
  if (archiveExtensions.includes(extension)) return 'Archives'
  
  return 'Other'
}

const getFileTypeColor = (type: string): string => {
  const colors = {
    'Images': '#82ca9d',
    'Videos': '#ffc658',
    'Documents': '#8884d8',
    'Audio': '#ff7300',
    'Archives': '#8dd1e1',
    'Other': '#d084d0'
  }
  return colors[type as keyof typeof colors] || '#d084d0'
}

const processFilesForAnalytics = (files: any[]): AnalyticsData => {
  const now = new Date()
  const last6Months: UploadHistoryItem[] = []
  const fileTypeMap = new Map<string, { count: number; size: number }>()
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    last6Months.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      uploads: 0,
      totalSize: 0
    })
  }

  files.forEach((file) => {
    const uploadDate = new Date(file.timestamp * 1000)
    const monthIndex = 5 - (now.getMonth() - uploadDate.getMonth() + 12) % 12
    
    if (monthIndex >= 0 && monthIndex < 6) {
      last6Months[monthIndex].uploads++
      last6Months[monthIndex].totalSize += file.size || 0
    }

    const extension = getFileExtension(file.name || 'unknown')
    const fileType = categorizeFileType(extension)
    
    if (fileTypeMap.has(fileType)) {
      const current = fileTypeMap.get(fileType)!
      current.count++
      current.size += file.size || 0
    } else {
      fileTypeMap.set(fileType, { count: 1, size: file.size || 0 })
    }
  })

  const fileTypes: FileTypeItem[] = Array.from(fileTypeMap.entries()).map(([type, data]) => ({
    name: type,
    value: data.count,
    color: getFileTypeColor(type),
    size: data.size
  }))

  const totalFiles = files.length
  const totalStorage = files.reduce((sum, file) => sum + (file.size || 0), 0)
  const averageFileSize = totalFiles > 0 ? totalStorage / totalFiles : 0

  const recentActivity = files
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 5)
    .map(file => ({
      id: file.id,
      name: file.name,
      size: file.size,
      uploadedAt: new Date(file.timestamp * 1000).toISOString(),
      type: file.type
    }))

  return {
    uploadHistory: last6Months,
    fileTypes,
    totalFiles,
    totalStorage,
    averageFileSize,
    recentActivity
  }
}

export const fetchAnalyticsData = async (walletClient: any, address: string): Promise<AnalyticsData> => {
  try {
    const irys = await getIrysClient(walletClient, address)
    const files = await getUserFiles(irys, address)
    
    // If no files found, return empty analytics
    if (!files || files.length === 0) {
      return {
        uploadHistory: [],
        fileTypes: [],
        totalFiles: 0,
        totalStorage: 0,
        averageFileSize: 0,
        recentActivity: []
      }
    }
    
    return processFilesForAnalytics(files)
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    // Return empty analytics instead of throwing to prevent app crashes
    return {
      uploadHistory: [],
      fileTypes: [],
      totalFiles: 0,
      totalStorage: 0,
      averageFileSize: 0,
      recentActivity: []
    }
  }
}
