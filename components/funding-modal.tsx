"use client"

import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { IrysFunding } from "./irys-funding"

export function FundingModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Storage</DialogTitle>
          <DialogDescription>
            Add funds to your Irys storage wallet
          </DialogDescription>
        </DialogHeader>
        <IrysFunding />
      </DialogContent>
    </Dialog>
  )
}
