import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("github_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { repository, branchName, title, description, tests } = await request.json()

    if (!repository || !branchName || !title || !tests || tests.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the default branch SHA
    const repoResponse = await fetch(`https://api.github.com/repos/${repository}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!repoResponse.ok) {
      throw new Error("Failed to fetch repository info")
    }

    const repoData = await repoResponse.json()
    const defaultBranch = repoData.default_branch

    // Get the SHA of the default branch
    const branchResponse = await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/${defaultBranch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!branchResponse.ok) {
      throw new Error("Failed to fetch branch info")
    }

    const branchData = await branchResponse.json()
    const baseSha = branchData.object.sha

    // Create new branch
    const createBranchResponse = await fetch(`https://api.github.com/repos/${repository}/git/refs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      }),
    })

    if (!createBranchResponse.ok) {
      const errorData = await createBranchResponse.json()
      if (errorData.message?.includes("already exists")) {
        // Branch already exists, continue with PR creation
      } else {
        throw new Error("Failed to create branch")
      }
    }

    // Create test files in the new branch
    const fileCreationPromises = tests.map(async (test: any) => {
      const testPath = `tests/${test.fileName}`

      return fetch(`https://api.github.com/repos/${repository}/contents/${testPath}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Add ${test.summary.title}`,
          content: Buffer.from(test.code).toString("base64"),
          branch: branchName,
        }),
      })
    })

    await Promise.all(fileCreationPromises)

    // Create pull request
    const prResponse = await fetch(`https://api.github.com/repos/${repository}/pulls`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        body: description,
        head: branchName,
        base: defaultBranch,
      }),
    })

    if (!prResponse.ok) {
      const errorData = await prResponse.json()
      throw new Error(`Failed to create PR: ${errorData.message}`)
    }

    const pullRequest = await prResponse.json()
    return NextResponse.json({ pullRequest })
  } catch (error) {
    console.error("PR creation error:", error)
    return NextResponse.json({ error: "Failed to create pull request" }, { status: 500 })
  }
}
