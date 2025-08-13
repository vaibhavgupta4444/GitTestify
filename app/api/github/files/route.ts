import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const repo = searchParams.get("repo")

    if (!repo) {
      return NextResponse.json({ error: "Repository name required" }, { status: 400 })
    }

    const cookieStore = cookies()
    const token = cookieStore.get("github_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const response = await fetch(`https://api.github.com/repos/${repo}/contents`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch files")
    }

    const files = await response.json()
    return NextResponse.json({ files })
  } catch (error) {
    console.error("Files fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
  }
}
