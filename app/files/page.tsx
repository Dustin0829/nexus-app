import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { FileList } from "@/components/file-list" // Reusing the FileList component

export default function FilesPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <h1 className="text-2xl font-bold">Your Files</h1>
          <p className="text-muted-foreground">Manage all your decentralized files here. Upload files and create folders.</p>
          <FileList />
        </main>
      </div>
    </div>
  )
}
