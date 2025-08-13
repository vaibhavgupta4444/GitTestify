import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { files, repository } = await request.json()

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    // Fetch file contents from GitHub
    const fileContents = await Promise.all(
      files.map(async (file: any) => {
        const response = await fetch(`https://api.github.com/repos/${repository}/contents/${file.path}`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch ${file.path}`)
        }

        const data = await response.json()
        const content = Buffer.from(data.content, "base64").toString("utf-8")

        return {
          ...file,
          content,
          size: data.size,
        }
      }),
    )

    // Generate test case summaries based on file analysis
    const testSummaries = generateTestSummaries(fileContents)

    return NextResponse.json({
      summaries: testSummaries,
      totalFiles: files.length,
    })
  } catch (error) {
    console.error("Test generation error:", error)
    return NextResponse.json({ error: "Failed to generate test cases" }, { status: 500 })
  }
}

function generateTestSummaries(files: any[]) {
  const summaries: any[] = []

  files.forEach((file, index) => {
    const extension = file.name.split(".").pop()?.toLowerCase()
    const content = file.content

    // Analyze React/TypeScript components
    if (extension === "tsx" || extension === "jsx") {
      const componentTests = analyzeReactComponent(file, content)
      summaries.push(...componentTests)
    }

    // Analyze JavaScript/TypeScript modules
    else if (extension === "ts" || extension === "js") {
      const moduleTests = analyzeJSModule(file, content)
      summaries.push(...moduleTests)
    }

    // Analyze Python files
    else if (extension === "py") {
      const pythonTests = analyzePythonFile(file, content)
      summaries.push(...pythonTests)
    }

    // Analyze Java files
    else if (extension === "java") {
      const javaTests = analyzeJavaFile(file, content)
      summaries.push(...javaTests)
    }
  })

  return summaries
}

function analyzeReactComponent(file: any, content: string) {
  const summaries = []
  const componentName = file.name.replace(/\.(tsx|jsx)$/, "")

  // Check for hooks usage
  const hasUseState = content.includes("useState")
  const hasUseEffect = content.includes("useEffect")
  const hasProps = content.includes("props") || content.match(/\w+:\s*\w+/)
  const hasEvents = content.match(/on\w+=/g)
  const hasConditionalRendering = content.includes("&&") || content.includes("?")

  summaries.push({
    id: `${file.path}-render`,
    title: `${componentName} - Render Test`,
    description: `Test that ${componentName} renders without crashing and displays expected content`,
    framework: "Jest + React Testing Library",
    type: "Unit Test",
    file: file.path,
    priority: "High",
  })

  if (hasProps) {
    summaries.push({
      id: `${file.path}-props`,
      title: `${componentName} - Props Test`,
      description: `Test component behavior with different prop combinations and edge cases`,
      framework: "Jest + React Testing Library",
      type: "Unit Test",
      file: file.path,
      priority: "High",
    })
  }

  if (hasUseState) {
    summaries.push({
      id: `${file.path}-state`,
      title: `${componentName} - State Management Test`,
      description: `Test state updates and component re-rendering with useState hooks`,
      framework: "Jest + React Testing Library",
      type: "Unit Test",
      file: file.path,
      priority: "Medium",
    })
  }

  if (hasEvents) {
    summaries.push({
      id: `${file.path}-events`,
      title: `${componentName} - Event Handling Test`,
      description: `Test user interactions and event handlers (clicks, form submissions, etc.)`,
      framework: "Jest + React Testing Library",
      type: "Integration Test",
      file: file.path,
      priority: "High",
    })
  }

  if (hasUseEffect) {
    summaries.push({
      id: `${file.path}-effects`,
      title: `${componentName} - Side Effects Test`,
      description: `Test useEffect hooks, API calls, and cleanup functions`,
      framework: "Jest + React Testing Library",
      type: "Integration Test",
      file: file.path,
      priority: "Medium",
    })
  }

  return summaries
}

function analyzeJSModule(file: any, content: string) {
  const summaries = []
  const moduleName = file.name.replace(/\.(ts|js)$/, "")

  // Find exported functions
  const exportMatches = content.match(/export\s+(function\s+\w+|const\s+\w+|class\s+\w+)/g) || []
  const hasAsync = content.includes("async") || content.includes("await")
  const hasAPI = content.includes("fetch") || content.includes("axios") || content.includes("http")

  if (exportMatches.length > 0) {
    summaries.push({
      id: `${file.path}-functions`,
      title: `${moduleName} - Function Tests`,
      description: `Test exported functions with various inputs and edge cases`,
      framework: "Jest",
      type: "Unit Test",
      file: file.path,
      priority: "High",
    })
  }

  if (hasAsync) {
    summaries.push({
      id: `${file.path}-async`,
      title: `${moduleName} - Async Operations Test`,
      description: `Test asynchronous functions, promises, and error handling`,
      framework: "Jest",
      type: "Integration Test",
      file: file.path,
      priority: "High",
    })
  }

  if (hasAPI) {
    summaries.push({
      id: `${file.path}-api`,
      title: `${moduleName} - API Integration Test`,
      description: `Test API calls, network requests, and response handling`,
      framework: "Jest + MSW",
      type: "Integration Test",
      file: file.path,
      priority: "Medium",
    })
  }

  return summaries
}

function analyzePythonFile(file: any, content: string) {
  const summaries = []
  const moduleName = file.name.replace(".py", "")

  const hasClasses = content.includes("class ")
  const hasFunctions = content.includes("def ")
  const hasRequests = content.includes("requests") || content.includes("urllib")
  const hasSelenium = content.includes("selenium") || content.includes("webdriver")

  if (hasFunctions) {
    summaries.push({
      id: `${file.path}-functions`,
      title: `${moduleName} - Function Tests`,
      description: `Test Python functions with pytest framework`,
      framework: "pytest",
      type: "Unit Test",
      file: file.path,
      priority: "High",
    })
  }

  if (hasClasses) {
    summaries.push({
      id: `${file.path}-classes`,
      title: `${moduleName} - Class Tests`,
      description: `Test class methods, initialization, and inheritance`,
      framework: "pytest",
      type: "Unit Test",
      file: file.path,
      priority: "High",
    })
  }

  if (hasSelenium) {
    summaries.push({
      id: `${file.path}-selenium`,
      title: `${moduleName} - Selenium Tests`,
      description: `Test web automation and browser interactions`,
      framework: "pytest + Selenium",
      type: "E2E Test",
      file: file.path,
      priority: "Medium",
    })
  }

  return summaries
}

function analyzeJavaFile(file: any, content: string) {
  const summaries = []
  const className = file.name.replace(".java", "")

  const hasClasses = content.includes("class ")
  const hasMethods = content.includes("public ") || content.includes("private ")
  const hasSpring = content.includes("@Controller") || content.includes("@Service")

  if (hasClasses && hasMethods) {
    summaries.push({
      id: `${file.path}-junit`,
      title: `${className} - JUnit Tests`,
      description: `Test Java class methods and business logic`,
      framework: "JUnit 5",
      type: "Unit Test",
      file: file.path,
      priority: "High",
    })
  }

  if (hasSpring) {
    summaries.push({
      id: `${file.path}-spring`,
      title: `${className} - Spring Integration Tests`,
      description: `Test Spring components and web layer`,
      framework: "JUnit 5 + Spring Test",
      type: "Integration Test",
      file: file.path,
      priority: "Medium",
    })
  }

  return summaries
}
