"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useNexusStore } from "@/stores/use-nexus-store"

const TEN_GB = 10 * 1024 * 1024 * 1024

function formatBytes(bytes: number) {
  if (bytes === 0) return "0B"
  const k = 1024
  const sizes = ["B","KB","MB","GB","TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))}${sizes[i]}`
}

export function StorageUsageCard() {
  const { files } = useNexusStore()
  const used = useMemo(() => files.reduce((s, f) => s + (f?.size || 0), 0), [files])
  const pct = Math.min(100, (used / TEN_GB) * 100)

  return (
    <div className="p-4">
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Storage Used</span>
            <span className="text-xs text-muted-foreground">{pct.toFixed(2)}%</span>
          </div>
          <Progress value={pct} className="h-2 mb-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span>{formatBytes(used)}</span>
            <span>10GB</span>
          </div>
          <Link href="/funding">
            <Button className="w-full">Add Storage</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}





