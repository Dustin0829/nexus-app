"use client"

import { useLoadingStore } from "@/stores/use-loading-store"
import { Progress } from "@/components/ui/progress"

export function LoadingIndicator() {
  const { loadings } = useLoadingStore()

  const fileUploadMessage = Object.entries(loadings).find(
    ([key, value]) => key.startsWith("file-upload-") && typeof value === "string"
  )

  if (!fileUploadMessage) {
    return null
  }

  const message = fileUploadMessage[1] as string
  const progressMatch = message.match(/(\d+)%$/)
  const progress = progressMatch ? parseInt(progressMatch[1], 10) : 0
  const fileName = message.replace(/\s*\d+%$/, "")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-foreground">
            Uploading {fileName}...
          </p>
          <Progress value={progress} className="w-full" />
          <p className="mt-2 text-xs text-muted-foreground">{progress}% complete</p>
        </div>
      </div>
    </div>
  )
}
