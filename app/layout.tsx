import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { WalletProvider } from "@/components/wallet-provider"
import { WalletSync } from "@/components/wallet-sync"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Nexus - Decentralized File Storage",
  description: "A modern, user-friendly decentralized file storage platform with end-to-end encryption.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <WalletProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <WalletSync />
              {children}
            </ThemeProvider>
            <Toaster />
          </WalletProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
