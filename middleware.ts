import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lightweight gate: redirect unauthenticated users to /login for admin pages,
// and authenticated users away from /login. Full JWT verification still happens
// server-side via getSession() in the admin layout.
const ADMIN_PREFIXES = ['/dashboard', '/categories', '/content', '/users', '/analytics', '/reports', '/languages']
const SESSION_COOKIE = 'sd_admin_session'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasSession = req.cookies.has(SESSION_COOKIE)

  const isAdminPage = ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))

  if (isAdminPage && !hasSession) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (pathname === '/login' && hasSession) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/categories/:path*', '/content/:path*', '/users/:path*', '/analytics/:path*', '/reports/:path*', '/languages/:path*', '/login'],
}
