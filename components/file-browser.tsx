"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Folder, File, ChevronRight, ChevronDown, FileCode, TestTube } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileItem {
  name: string
  path: string
  type: "file" | "dir"
  size?: number
  download_url?: string
}

interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  language: string
  updated_at: string
  private: boolean
}

interface FileBrowserProps {
  repository: Repository
  onFilesSelect: (files: string[]) => void
  selectedFiles: string[]
}

interface FileTreeNodeProps {
  item: FileItem
  repository: Repository
  level: number
  selectedFiles: string[]
  onFileToggle: (path: string) => void
  expandedDirs: Set<string>
  onDirToggle: (path: string) => void
}

function FileTreeNode({
  item,
  repository,
  level,
  selectedFiles,
  onFileToggle,
  expandedDirs,
  onDirToggle,
}: FileTreeNodeProps) {
  const [children, setChildren] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const isExpanded = expandedDirs.has(item.path)
  const isSelected = selectedFiles.includes(item.path)

  const loadChildren = async () => {
    if (item.type !== "dir" || loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/github/files?repo=${repository.full_name}&path=${item.path}`)
      if (response.ok) {
        const data = await response.json()
        setChildren(data)
      }
    } catch (error) {
      console.error("Failed to load directory contents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDirClick = () => {
    if (item.type === "dir") {
      onDirToggle(item.path)
      if (!isExpanded && children.length === 0) {
        loadChildren()
      }
    }
  }

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase()
    const codeExtensions = ["js", "jsx", "ts", "tsx", "py", "java", "cpp", "c", "cs", "php", "rb", "go"]

    if (codeExtensions.includes(ext || "")) {
      return <FileCode className="h-4 w-4 text-blue-500" />
    }
    return <File className="h-4 w-4 text-muted-foreground" />
  }

  const isCodeFile = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase()
    const codeExtensions = ["js", "jsx", "ts", "tsx", "py", "java", "cpp", "c", "cs", "php", "rb", "go"]
    return codeExtensions.includes(ext || "")
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded cursor-pointer",
          isSelected && "bg-primary/10",
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {item.type === "dir" ? (
          <>
            <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={handleDirClick}>
              {loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
              ) : isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
            <Folder className="h-4 w-4 text-yellow-500" />
            <span className="text-sm" onClick={handleDirClick}>
              {item.name}
            </span>
          </>
        ) : (
          <>
            <div className="w-4" />
            {isCodeFile(item.name) && (
              <Checkbox checked={isSelected} onCheckedChange={() => onFileToggle(item.path)} className="h-3 w-3" />
            )}
            {getFileIcon(item.name)}
            <span className={cn("text-sm flex-1", !isCodeFile(item.name) && "text-muted-foreground")}>{item.name}</span>
            {isCodeFile(item.name) && (
              <Badge variant="outline" className="text-xs">
                {item.name.split(".").pop()}
              </Badge>
            )}
          </>
        )}
      </div>

      {item.type === "dir" && isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <FileTreeNode
              key={child.path}
              item={child}
              repository={repository}
              level={level + 1}
              selectedFiles={selectedFiles}
              onFileToggle={onFileToggle}
              expandedDirs={expandedDirs}
              onDirToggle={onDirToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileBrowser({ repository, onFilesSelect, selectedFiles }: FileBrowserProps) {
  const [rootFiles, setRootFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchRootFiles()
  }, [repository])

  const fetchRootFiles = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/github/files?repo=${repository.full_name}`)

      if (!response.ok) {
        throw new Error("Failed to fetch repository files")
      }

      const files = await response.json()
      setRootFiles(files)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch files")
    } finally {
      setLoading(false)
    }
  }

  const handleFileToggle = (path: string) => {
    const newSelectedFiles = selectedFiles.includes(path)
      ? selectedFiles.filter((f) => f !== path)
      : [...selectedFiles, path]

    onFilesSelect(newSelectedFiles)
  }

  const handleDirToggle = (path: string) => {
    const newExpanded = new Set(expandedDirs)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedDirs(newExpanded)
  }

  const clearSelection = () => {
    onFilesSelect([])
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Repository Files</CardTitle>
          <CardDescription>Browse and select files for test generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Repository Files</CardTitle>
          <CardDescription>Browse and select files for test generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchRootFiles} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-5 w-5" />
          Repository Files
        </CardTitle>
        <CardDescription>Browse and select code files for test generation</CardDescription>
        {selectedFiles.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <Badge variant="secondary">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
            </Badge>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Clear Selection
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-1">
            {rootFiles.map((file) => (
              <FileTreeNode
                key={file.path}
                item={file}
                repository={repository}
                level={0}
                selectedFiles={selectedFiles}
                onFileToggle={handleFileToggle}
                expandedDirs={expandedDirs}
                onDirToggle={handleDirToggle}
              />
            ))}
          </div>
        </ScrollArea>

        {selectedFiles.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button className="w-full" size="lg">
              <TestTube className="mr-2 h-4 w-4" />
              Generate Test Cases ({selectedFiles.length} files)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
