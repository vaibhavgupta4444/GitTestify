"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { GitBranch, Clock, Lock, Globe } from "lucide-react"

interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  language: string
  updated_at: string
  private: boolean
}

interface RepositorySelectorProps {
  onRepositorySelect: (repo: Repository) => void
  selectedRepository: Repository | null
}

export function RepositorySelector({ onRepositorySelect, selectedRepository }: RepositorySelectorProps) {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRepositories()
  }, [])

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/github/repositories")

      if (!response.ok) {
        throw new Error("Failed to fetch repositories")
      }

      const repos = await response.json()
      setRepositories(repos)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch repositories")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Repository</CardTitle>
          <CardDescription>Choose a repository to browse files</CardDescription>
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
          <CardTitle>Select Repository</CardTitle>
          <CardDescription>Choose a repository to browse files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchRepositories} variant="outline">
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
          <GitBranch className="h-5 w-5" />
          Select Repository
        </CardTitle>
        <CardDescription>Choose a repository to browse files and generate tests</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={selectedRepository?.full_name || ""}
          onValueChange={(value) => {
            const repo = repositories.find((r) => r.full_name === value)
            if (repo) onRepositorySelect(repo)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a repository..." />
          </SelectTrigger>
          <SelectContent>
            {repositories.map((repo) => (
              <SelectItem key={repo.id} value={repo.full_name}>
                <div className="flex items-center gap-2">
                  {repo.private ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                  <span>{repo.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedRepository && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold">{selectedRepository.name}</h3>
              <div className="flex items-center gap-2">
                {selectedRepository.private ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                {selectedRepository.language && <Badge variant="secondary">{selectedRepository.language}</Badge>}
              </div>
            </div>
            {selectedRepository.description && (
              <p className="text-sm text-muted-foreground mb-2">{selectedRepository.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Updated {formatDate(selectedRepository.updated_at)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
