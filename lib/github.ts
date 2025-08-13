import { cookies } from "next/headers"

export async function getGitHubToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("github_token")?.value || null
}

export async function getGitHubUser(): Promise<any | null> {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get("github_user")?.value

  if (!userCookie) return null

  try {
    return JSON.parse(userCookie)
  } catch {
    return null
  }
}

export async function makeGitHubRequest(endpoint: string, options: RequestInit = {}) {
  const token = await getGitHubToken()

  if (!token) {
    throw new Error("No GitHub token available")
  }

  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  return response.json()
}
