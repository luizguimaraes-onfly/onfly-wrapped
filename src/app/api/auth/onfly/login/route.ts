import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'

export async function GET(req: NextRequest) {
  const callbackUrl = req.nextUrl.searchParams.get('callbackUrl') ?? '/'
  const state       = crypto.randomBytes(16).toString('hex')
  const redirectUri = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/auth/onfly`

  const onflyUrl =
    `https://app.onfly.com/v2#/auth/oauth/authorize` +
    `?client_id=${process.env.ONFLY_CLIENT_ID ?? '1212'}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&state=${state}`

  const res = NextResponse.redirect(onflyUrl)
  const cookieOpts = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   300,
    path:     '/',
    sameSite: 'lax' as const,
  }
  res.cookies.set('onfly_oauth_state',  state,       cookieOpts)
  res.cookies.set('onfly_callback_url', callbackUrl, cookieOpts)
  return res
}
