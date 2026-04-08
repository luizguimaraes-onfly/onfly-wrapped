import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Não proteger arquivos estáticos e rotas de auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth/onfly') ||
    pathname === '/login' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const url = new URL('/login', req.url)
    if (pathname !== '/') url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo-onfly\\.svg|favicon\\.png).*)'],
}
