import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req

  const isLoggedIn = !!session?.user
  const isProtected =
    nextUrl.pathname.startsWith('/dashboard') ||
    nextUrl.pathname.startsWith('/affiliates') ||
    nextUrl.pathname.startsWith('/conversions') ||
    nextUrl.pathname.startsWith('/payouts') ||
    nextUrl.pathname.startsWith('/settings') ||
    nextUrl.pathname.startsWith('/billing')

  if (isProtected && !isLoggedIn) {
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
    '/affiliates/:path*',
    '/conversions/:path*',
    '/payouts/:path*',
    '/settings/:path*',
    '/billing/:path*',
    '/login',
  ],
}
