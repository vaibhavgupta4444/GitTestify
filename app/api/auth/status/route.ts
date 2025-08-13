import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("github_token")?.value

    if (!token) {
      return NextResponse.json({ authenticated: false })
    }

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!userResponse.ok) {
      return NextResponse.json({ authenticated: false })
    }

    const user = await userResponse.json()
    return NextResponse.json({ authenticated: true, user })
  } catch (error) {
    return NextResponse.json({ authenticated: false })
  }
}
