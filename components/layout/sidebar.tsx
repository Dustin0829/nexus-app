"use client"

import Link from "next/link"
import { Folder, Home, Wallet, Trash } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { StorageUsageCard } from "../storage-usage-card"

export function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Files", href: "/files", icon: Folder },
    { name: "Funding", href: "/funding", icon: Wallet },
    { name: "Trash", href: "/trash", icon: Trash },
  ]

  return (
    <aside className="hidden border-r bg-muted/40 md:block w-64">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-lg">Nexus</span>
          </Link>
        </div>
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                pathname === item.href && "bg-muted text-primary",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <StorageUsageCard />
        </div>
      </div>
    </aside>
  )
}
