"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Play, Code, FileText, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TestSummary {
  id: string
  title: string
  description: string
  framework: string
  type: string
  file: string
  priority: string
}

interface TestGenerationProps {
  selectedFiles: any[]
  repository: string
}

export function TestGeneration({ selectedFiles, repository }: TestGenerationProps) {
  const [summaries, setSummaries] = useState<TestSummary[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [selectedSummary, setSelectedSummary] = useState<TestSummary | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [generatedFileName, setGeneratedFileName] = useState<string>("")
  const [showCodeDialog, setShowCodeDialog] = useState(false)

  const generateTestSummaries = async () => {
    if (selectedFiles.length === 0) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: selectedFiles,
          repository: repository,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate test summaries")
      }

      const data = await response.json()
      setSummaries(data.summaries)
    } catch (error) {
      console.error("Error generating test summaries:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateTestCode = async (summary: TestSummary) => {
    setSelectedSummary(summary)
    setIsGeneratingCode(true)

    try {
      const response = await fetch("/api/generate-test-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: summary,
          repository: repository,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate test code")
      }

      const data = await response.json()
      setGeneratedCode(data.testCode)
      setGeneratedFileName(data.fileName)
      setShowCodeDialog(true)
    } catch (error) {
      console.error("Error generating test code:", error)
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "unit test":
        return <CheckCircle className="h-4 w-4" />
      case "integration test":
        return <FileText className="h-4 w-4" />
      case "e2e test":
        return <Play className="h-4 w-4" />
      default:
        return <Code className="h-4 w-4" />
    }
  }

  if (selectedFiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Generation</CardTitle>
          <CardDescription>Select files from the file browser to generate test cases</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No files selected. Choose code files to analyze and generate comprehensive test cases.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Generation</CardTitle>
          <CardDescription>Generate comprehensive test cases for {selectedFiles.length} selected files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Selected Files:</p>
                <p className="text-sm text-muted-foreground">{selectedFiles.map((f) => f.name).join(", ")}</p>
              </div>
              <Button onClick={generateTestSummaries} disabled={isGenerating} className="min-w-[140px]">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Generate Tests
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {summaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Case Summaries</CardTitle>
            <CardDescription>
              {summaries.length} test cases generated. Click "Generate Code" to create the actual test implementation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {summaries.map((summary) => (
                <Card key={summary.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{summary.title}</CardTitle>
                        <CardDescription>{summary.description}</CardDescription>
                      </div>
                      <Button
                        onClick={() => generateTestCode(summary)}
                        disabled={isGeneratingCode && selectedSummary?.id === summary.id}
                        size="sm"
                      >
                        {isGeneratingCode && selectedSummary?.id === summary.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Code className="mr-2 h-4 w-4" />
                            Generate Code
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getTypeIcon(summary.type)}
                        {summary.type}
                      </Badge>
                      <Badge variant={getPriorityColor(summary.priority)}>{summary.priority} Priority</Badge>
                      <Badge variant="secondary">{summary.framework}</Badge>
                      <span className="text-sm text-muted-foreground">{summary.file}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Generated Test Code</DialogTitle>
            <DialogDescription>Test code for: {selectedSummary?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{generatedFileName}</Badge>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode)
                }}
                size="sm"
                variant="outline"
              >
                Copy Code
              </Button>
            </div>
            <ScrollArea className="h-[500px] w-full rounded-md border">
              <pre className="p-4 text-sm">
                <code>{generatedCode}</code>
              </pre>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
