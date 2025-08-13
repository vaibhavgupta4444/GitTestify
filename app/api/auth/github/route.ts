import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback`

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user user:email repo`

  return NextResponse.redirect(githubAuthUrl)
}
