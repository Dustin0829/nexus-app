// Lightweight client-side persistence for files keyed by wallet address
// Uses localStorage to avoid clearing uploaded files between sessions

import type { NexusFile } from "@/stores/use-nexus-store"

const keyFor = (address: string) => `nexus.files.${address?.toLowerCase?.() || "unknown"}`
const trashKeyFor = (address: string) => `nexus.trash.${address?.toLowerCase?.() || "unknown"}`

export function loadFilesForAddress(address: string): NexusFile[] {
  try {
    if (typeof window === "undefined") return []
    const raw = window.localStorage.getItem(keyFor(address))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as NexusFile[]
  } catch {
    return []
  }
}

export function saveFilesForAddress(address: string, files: NexusFile[]) {
  try {
    if (typeof window === "undefined") return
    window.localStorage.setItem(keyFor(address), JSON.stringify(files))
  } catch {
    // ignore quota or serialization issues
  }
}

export function loadTrashForAddress(address: string): NexusFile[] {
  try {
    if (typeof window === "undefined") return []
    const raw = window.localStorage.getItem(trashKeyFor(address))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as NexusFile[]
  } catch {
    return []
  }
}

export function saveTrashForAddress(address: string, files: NexusFile[]) {
  try {
    if (typeof window === "undefined") return
    window.localStorage.setItem(trashKeyFor(address), JSON.stringify(files))
  } catch {
    // ignore
  }
}


