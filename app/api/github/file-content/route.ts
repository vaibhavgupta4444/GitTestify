import { makeGitHubRequest } from "@/lib/github"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const repo = searchParams.get("repo")
  const path = searchParams.get("path")

  if (!repo || !path) {
    return Response.json({ error: "Repository and path parameters are required" }, { status: 400 })
  }

  try {
    const fileData = await makeGitHubRequest(`/repos/${repo}/contents/${path}`)

    if (fileData.type !== "file") {
      return Response.json({ error: "Path is not a file" }, { status: 400 })
    }

    // Decode base64 content
    const content = Buffer.from(fileData.content, "base64").toString("utf-8")

    return Response.json({
      name: fileData.name,
      path: fileData.path,
      content: content,
      size: fileData.size,
    })
  } catch (error) {
    console.error("Failed to fetch file content:", error)
    return Response.json({ error: "Failed to fetch file content" }, { status: 500 })
  }
}
