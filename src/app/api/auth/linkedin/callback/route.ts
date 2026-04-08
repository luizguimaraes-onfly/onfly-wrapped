import { NextRequest, NextResponse } from 'next/server'
import { LINKEDIN_CONFIG, getLinkedInCredentials } from '@/lib/linkedin/config'
import { encryptToken } from '@/lib/linkedin/crypto'
import type { LinkedInAccount } from '@/lib/linkedin/types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const savedState = req.cookies.get('li_state')?.value
  const returnTo   = req.cookies.get('li_return_to')?.value ?? '/'

  const fail = (reason: string) => {
    const url = new URL('/', req.url)
    url.searchParams.set('linkedin_error', reason)
    const res = NextResponse.redirect(url)
    res.cookies.delete('li_state')
    res.cookies.delete('li_return_to')
    return res
  }

  if (error)                  return fail(error)
  if (!code || !state)        return fail('missing_params')
  if (!savedState || state !== savedState) return fail('invalid_state')

  try {
    const { clientId, clientSecret, redirectUri } = getLinkedInCredentials()

    // Exchange authorization code for tokens
    const tokenRes = await fetch(LINKEDIN_CONFIG.TOKEN_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
        client_id:     clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenRes.ok) {
      console.error('[linkedin/callback] token exchange failed', tokenRes.status, await tokenRes.text())
      return fail('token_exchange_failed')
    }

    const tokens = await tokenRes.json() as {
      access_token:             string
      expires_in:               number
      scope:                    string
      refresh_token?:           string
      refresh_token_expires_in?: number
    }

    // Fetch LinkedIn profile via OpenID Connect userinfo
    const userRes = await fetch(LINKEDIN_CONFIG.USERINFO_URL, {
      headers: {
        Authorization:     `Bearer ${tokens.access_token}`,
        'Linkedin-Version': LINKEDIN_CONFIG.API_VERSION,
      },
    })

    if (!userRes.ok) {
      console.error('[linkedin/callback] userinfo failed', userRes.status)
      return fail('userinfo_failed')
    }

    const user = await userRes.json() as {
      sub:          string
      name?:        string
      given_name?:  string
      family_name?: string
      picture?:     string
      email?:       string
    }

    // "sub" is the person ID — WITHOUT the "urn:li:person:" prefix
    const now = Date.now()
    const account: LinkedInAccount = {
      linkedinUrn:           user.sub,
      displayName:           user.name ?? (`${user.given_name ?? ''} ${user.family_name ?? ''}`.trim() || null),
      avatarUrl:             user.picture ?? null,
      accessTokenEncrypted:  encryptToken(tokens.access_token),
      refreshTokenEncrypted: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
      accessTokenExpiresAt:  now + (tokens.expires_in ?? LINKEDIN_CONFIG.ACCESS_TOKEN_TTL_SECONDS) * 1000,
      refreshTokenExpiresAt: tokens.refresh_token_expires_in
        ? now + tokens.refresh_token_expires_in * 1000
        : null,
      scopes: tokens.scope ?? LINKEDIN_CONFIG.SCOPES,
      status: 'ACTIVE',
    }

    const cookieOpts = {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path:     '/',
      maxAge:   LINKEDIN_CONFIG.ACCOUNT_COOKIE_MAX_AGE,
    }

    const res = NextResponse.redirect(new URL(returnTo, req.url))
    res.cookies.set('li_account', JSON.stringify(account), cookieOpts)
    res.cookies.delete('li_state')
    res.cookies.delete('li_return_to')
    return res

  } catch (err) {
    console.error('[linkedin/callback]', err)
    return fail('server_error')
  }
}