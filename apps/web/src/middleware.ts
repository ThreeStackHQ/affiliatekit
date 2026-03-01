import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req

  const isLoggedIn = !!session?.user
  const isDashboard = nextUrl.pathname.startsWith('/dashboard')

  if (isDashboard && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect logged-in users away from login page
  if (nextUrl.pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
  ],
}
