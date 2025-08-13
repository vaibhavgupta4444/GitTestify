"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Github,
  TestTube,
  FileCode,
  Play,
  Code,
  CheckCircle,
  FileText,
  Loader2,
  Copy,
  Download,
  GitPullRequest,
  Check,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  language: string
  updated_at: string
  private: boolean
}

interface FileItem {
  name: string
  path: string
  type: string
  size?: number
}

interface TestSummary {
  id: string
  title: string
  description: string
  framework: string
  type: string
  file: string
  priority: string
}

interface GeneratedTest {
  summary: TestSummary
  code: string
  fileName: string
}

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([])
  const [testSummaries, setTestSummaries] = useState<TestSummary[]>([])
  const [generatedTests, setGeneratedTests] = useState<GeneratedTest[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [selectedSummary, setSelectedSummary] = useState<TestSummary | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [generatedFileName, setGeneratedFileName] = useState<string>("")
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [showPRDialog, setShowPRDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("repositories")

  // PR Creation states
  const [prTitle, setPrTitle] = useState("")
  const [prDescription, setPrDescription] = useState("")
  const [branchName, setBranchName] = useState("")
  const [isCreatingPR, setIsCreatingPR] = useState(false)
  const [prCreated, setPrCreated] = useState<any>(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/status")
      if (response.ok) {
        const data = await response.json()
        setIsAuthenticated(data.authenticated)
        setUser(data.user)
        if (data.authenticated) {
          loadRepositories()
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubLogin = () => {
    window.location.href = "/api/auth/github"
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setIsAuthenticated(false)
      setUser(null)
      setSelectedRepository(null)
      setSelectedFiles([])
      setTestSummaries([])
      setGeneratedTests([])
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const loadRepositories = async () => {
    try {
      const response = await fetch("/api/github/repositories")
      if (response.ok) {
        const data = await response.json()
        setRepositories(data.repositories)
      }
    } catch (error) {
      console.error("Failed to load repositories:", error)
    }
  }

  const handleRepositorySelect = async (repo: Repository) => {
    setSelectedRepository(repo)
    setSelectedFiles([])
    setTestSummaries([])
    setGeneratedTests([])
    setActiveTab("files")

    try {
      const response = await fetch(`/api/github/files?repo=${repo.full_name}`)
      if (response.ok) {
        const data = await response.json()
        setFiles(
          data.files.filter((file: FileItem) => file.type === "file" && /\.(tsx?|jsx?|py|java)$/.test(file.name)),
        )
      }
    } catch (error) {
      console.error("Failed to load files:", error)
    }
  }

  const handleFileSelect = (file: FileItem, checked: boolean) => {
    if (checked) {
      setSelectedFiles((prev) => [...prev, file])
    } else {
      setSelectedFiles((prev) => prev.filter((f) => f.path !== file.path))
    }
  }

  const generateTestSummaries = async () => {
    if (selectedFiles.length === 0) return

    setIsGenerating(true)
    setActiveTab("tests")

    try {
      // Mock test generation for demo
      const mockSummaries: TestSummary[] = selectedFiles.flatMap((file) => {
        const extension = file.name.split(".").pop()?.toLowerCase()
        const baseName = file.name.replace(/\.(tsx|jsx|ts|js|py|java)$/, "")

        const summaries: TestSummary[] = []

        if (extension === "tsx" || extension === "jsx") {
          summaries.push(
            {
              id: `${file.path}-render`,
              title: `${baseName} - Render Test`,
              description: `Test that ${baseName} renders without crashing and displays expected content`,
              framework: "Jest + React Testing Library",
              type: "Unit Test",
              file: file.path,
              priority: "High",
            },
            {
              id: `${file.path}-props`,
              title: `${baseName} - Props Test`,
              description: `Test component behavior with different prop combinations and edge cases`,
              framework: "Jest + React Testing Library",
              type: "Unit Test",
              file: file.path,
              priority: "High",
            },
          )
        } else if (extension === "py") {
          summaries.push({
            id: `${file.path}-functions`,
            title: `${baseName} - Function Tests`,
            description: `Test Python functions with pytest framework`,
            framework: "pytest",
            type: "Unit Test",
            file: file.path,
            priority: "High",
          })
        } else if (extension === "java") {
          summaries.push({
            id: `${file.path}-junit`,
            title: `${baseName} - JUnit Tests`,
            description: `Test Java class methods and business logic`,
            framework: "JUnit 5",
            type: "Unit Test",
            file: file.path,
            priority: "High",
          })
        } else {
          summaries.push({
            id: `${file.path}-functions`,
            title: `${baseName} - Function Tests`,
            description: `Test exported functions with various inputs and edge cases`,
            framework: "Jest",
            type: "Unit Test",
            file: file.path,
            priority: "High",
          })
        }

        return summaries
      })

      await new Promise((resolve) => setTimeout(resolve, 2000))
      setTestSummaries(mockSummaries)
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
      const mockCode = generateMockTestCode(summary)
      const fileName = getTestFileName(summary.file, summary.framework)

      await new Promise((resolve) => setTimeout(resolve, 1500))

      setGeneratedCode(mockCode)
      setGeneratedFileName(fileName)
      setShowCodeDialog(true)

      // Add to generated tests collection
      const newTest: GeneratedTest = {
        summary,
        code: mockCode,
        fileName,
      }
      setGeneratedTests((prev) => [...prev.filter((t) => t.summary.id !== summary.id), newTest])
    } catch (error) {
      console.error("Error generating test code:", error)
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const generateMockTestCode = (summary: TestSummary): string => {
    const componentName =
      summary.file
        .split("/")
        .pop()
        ?.replace(/\.(tsx|jsx|ts|js|py|java)$/, "") || "Component"

    if (summary.framework.includes("React")) {
      return `import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ${componentName} from './${componentName}';

describe('${componentName}', () => {
  test('renders without crashing', () => {
    render(<${componentName} />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test('displays expected content', () => {
    render(<${componentName} />);
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });

  test('handles props correctly', () => {
    const mockProps = {
      title: 'Test Title',
      onClick: jest.fn()
    };
    render(<${componentName} {...mockProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('handles click events', () => {
    const mockHandler = jest.fn();
    render(<${componentName} onClick={mockHandler} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });
});`
    } else if (summary.framework.includes("pytest")) {
      return `import pytest
from ${componentName} import *

class Test${componentName.charAt(0).toUpperCase() + componentName.slice(1)}:
    def test_function_with_valid_input(self):
        result = your_function("valid_input")
        assert result is not None
        
    def test_function_with_invalid_input(self):
        with pytest.raises(ValueError):
            your_function(None)
            
    def test_class_initialization(self):
        instance = YourClass()
        assert instance is not None`
    } else if (summary.framework.includes("JUnit")) {
      return `import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

class ${componentName}Test {
    
    private ${componentName} ${componentName.toLowerCase()};
    
    @BeforeEach
    void setUp() {
        ${componentName.toLowerCase()} = new ${componentName}();
    }
    
    @Test
    @DisplayName("Should test basic functionality")
    void testBasicFunctionality() {
        String input = "test";
        String result = ${componentName.toLowerCase()}.method(input);
        
        assertNotNull(result);
        assertEquals("expected", result);
    }
}`
    }

    return `// Generated test for ${summary.title}
describe('${componentName}', () => {
  test('should pass basic test', () => {
    expect(true).toBe(true);
  });
});`
  }

  const getTestFileName = (originalFile: string, framework: string): string => {
    const baseName =
      originalFile
        .split("/")
        .pop()
        ?.replace(/\.(tsx|jsx|ts|js|py|java)$/, "") || "test"

    if (framework.includes("Jest")) {
      return `${baseName}.test.js`
    } else if (framework.includes("pytest")) {
      return `test_${baseName}.py`
    } else if (framework.includes("JUnit")) {
      return `${baseName}Test.java`
    }

    return `${baseName}.test.js`
  }

  const openPRDialog = () => {
    if (generatedTests.length === 0) return

    // Set default values
    const timestamp = new Date().toISOString().slice(0, 16).replace("T", "-")
    setBranchName(`add-tests-${timestamp}`)
    setPrTitle(`Add test cases for ${selectedFiles.length} files`)
    setPrDescription(`This PR adds comprehensive test cases for the following files:

${selectedFiles.map((f) => `- ${f.path}`).join("\n")}

Generated test cases include:
${generatedTests.map((t) => `- ${t.summary.title} (${t.summary.framework})`).join("\n")}

Total test files: ${generatedTests.length}`)

    setShowPRDialog(true)
  }

  const createPullRequest = async () => {
    if (!selectedRepository || generatedTests.length === 0) return

    setIsCreatingPR(true)
    try {
      const response = await fetch("/api/github/create-pr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repository: selectedRepository.full_name,
          branchName,
          title: prTitle,
          description: prDescription,
          tests: generatedTests,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPrCreated(data.pullRequest)
      } else {
        throw new Error("Failed to create PR")
      }
    } catch (error) {
      console.error("Error creating PR:", error)
    } finally {
      setIsCreatingPR(false)
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TestTube className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Test Case Generator
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered test case generation for your GitHub repositories. Generate comprehensive test suites and create
            pull requests automatically.
          </p>
        </header>

        {!isAuthenticated ? (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Github className="h-5 w-5" />
                  Connect GitHub
                </CardTitle>
                <CardDescription>
                  Sign in with GitHub to access your repositories and generate test cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleGitHubLogin} className="w-full" size="lg">
                  <Github className="mr-2 h-4 w-4" />
                  Sign in with GitHub
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <img
                  src={user?.avatar_url || "/placeholder.svg"}
                  alt={user?.name || user?.login}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h2 className="text-xl font-semibold">Welcome, {user?.name || user?.login}!</h2>
                  <p className="text-muted-foreground">Ready to generate test cases</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {generatedTests.length > 0 && (
                  <Button onClick={openPRDialog} className="bg-green-600 hover:bg-green-700">
                    <GitPullRequest className="mr-2 h-4 w-4" />
                    Create PR ({generatedTests.length} tests)
                  </Button>
                )}
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="repositories" className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  Repositories
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Files
                </TabsTrigger>
                <TabsTrigger value="tests" className="flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  Test Cases
                </TabsTrigger>
              </TabsList>

              <TabsContent value="repositories" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Repository</CardTitle>
                    <CardDescription>Choose a repository to analyze and generate test cases</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {repositories.map((repo) => (
                        <Card
                          key={repo.id}
                          className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                            selectedRepository?.id === repo.id ? "ring-2 ring-primary" : ""
                          }`}
                          onClick={() => handleRepositorySelect(repo)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{repo.name}</h3>
                                <p className="text-sm text-muted-foreground">{repo.description || "No description"}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {repo.language && <Badge variant="secondary">{repo.language}</Badge>}
                                {repo.private && <Badge variant="outline">Private</Badge>}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="files" className="space-y-6">
                {selectedRepository ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Files</CardTitle>
                      <CardDescription>
                        Choose code files from {selectedRepository.name} to generate test cases
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            {selectedFiles.length} of {files.length} files selected
                          </p>
                          <Button
                            onClick={generateTestSummaries}
                            disabled={selectedFiles.length === 0 || isGenerating}
                            className="min-w-[140px]"
                          >
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

                        <div className="grid gap-2 max-h-96 overflow-y-auto">
                          {files.map((file) => (
                            <div key={file.path} className="flex items-center space-x-2 p-2 rounded border">
                              <Checkbox
                                id={file.path}
                                checked={selectedFiles.some((f) => f.path === file.path)}
                                onCheckedChange={(checked) => handleFileSelect(file, checked as boolean)}
                              />
                              <label htmlFor={file.path} className="flex-1 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{file.name}</span>
                                  <span className="text-xs text-muted-foreground">{file.path}</span>
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">Select a repository first to view files</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="tests" className="space-y-6">
                {testSummaries.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Generated Test Cases</CardTitle>
                      <CardDescription>
                        {testSummaries.length} test cases generated. Click "Generate Code" to create the actual test
                        implementation.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {testSummaries.map((summary) => (
                          <Card key={summary.id} className="border-l-4 border-l-blue-500">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    {summary.title}
                                    {generatedTests.some((t) => t.summary.id === summary.id) && (
                                      <Check className="h-4 w-4 text-green-600" />
                                    )}
                                  </CardTitle>
                                  <CardDescription>{summary.description}</CardDescription>
                                </div>
                                <Button
                                  onClick={() => generateTestCode(summary)}
                                  disabled={isGeneratingCode && selectedSummary?.id === summary.id}
                                  size="sm"
                                  variant={
                                    generatedTests.some((t) => t.summary.id === summary.id) ? "secondary" : "default"
                                  }
                                >
                                  {isGeneratingCode && selectedSummary?.id === summary.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Generating...
                                    </>
                                  ) : generatedTests.some((t) => t.summary.id === summary.id) ? (
                                    <>
                                      <Check className="mr-2 h-4 w-4" />
                                      Generated
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
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">
                        {selectedFiles.length === 0
                          ? "Select files to generate test cases"
                          : "Click 'Generate Tests' to analyze your files"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Code Dialog */}
        <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Generated Test Code</DialogTitle>
              <DialogDescription>Test code for: {selectedSummary?.title}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{generatedFileName}</Badge>
                <div className="flex gap-2">
                  <Button onClick={() => copyToClipboard(generatedCode)} size="sm" variant="outline">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Code
                  </Button>
                  <Button
                    onClick={() => {
                      const blob = new Blob([generatedCode], { type: "text/plain" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = generatedFileName
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[500px] w-full rounded-md border">
                <pre className="p-4 text-sm">
                  <code>{generatedCode}</code>
                </pre>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>

        {/* PR Creation Dialog */}
        <Dialog open={showPRDialog} onOpenChange={setShowPRDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitPullRequest className="h-5 w-5" />
                Create Pull Request
              </DialogTitle>
              <DialogDescription>
                Create a pull request with {generatedTests.length} generated test files
              </DialogDescription>
            </DialogHeader>

            {prCreated ? (
              <div className="space-y-4">
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>Pull request created successfully!</AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <p>
                    <strong>PR Title:</strong> {prCreated.title}
                  </p>
                  <p>
                    <strong>Branch:</strong> {prCreated.head.ref}
                  </p>
                  <p>
                    <strong>URL:</strong>{" "}
                    <a
                      href={prCreated.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {prCreated.html_url}
                    </a>
                  </p>
                </div>
                <Button onClick={() => window.open(prCreated.html_url, "_blank")} className="w-full">
                  <Github className="mr-2 h-4 w-4" />
                  View Pull Request
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="branch-name">Branch Name</Label>
                  <Input
                    id="branch-name"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="add-tests-2024-01-01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pr-title">Pull Request Title</Label>
                  <Input
                    id="pr-title"
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    placeholder="Add comprehensive test cases"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pr-description">Description</Label>
                  <Textarea
                    id="pr-description"
                    value={prDescription}
                    onChange={(e) => setPrDescription(e.target.value)}
                    placeholder="Describe the test cases being added..."
                    rows={6}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={createPullRequest}
                    disabled={isCreatingPR || !branchName || !prTitle}
                    className="flex-1"
                  >
                    {isCreatingPR ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating PR...
                      </>
                    ) : (
                      <>
                        <GitPullRequest className="mr-2 h-4 w-4" />
                        Create Pull Request
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowPRDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
