import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { LINKEDIN_CONFIG, getLinkedInCredentials } from '@/lib/linkedin/config'

export async function GET(req: NextRequest) {
  try {
    const { clientId, redirectUri } = getLinkedInCredentials()

    const state = randomBytes(32).toString('hex')

    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     clientId,
      redirect_uri:  redirectUri,
      scope:         LINKEDIN_CONFIG.SCOPES,
      state,
    })

    const res = NextResponse.redirect(
      `${LINKEDIN_CONFIG.AUTH_URL}?${params.toString()}`
    )

    res.cookies.set('li_state', state, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   LINKEDIN_CONFIG.STATE_COOKIE_MAX_AGE,
    })

    // Store where to return after OAuth
    const returnTo = req.nextUrl.searchParams.get('returnTo') ?? '/'
    res.cookies.set('li_return_to', returnTo, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   LINKEDIN_CONFIG.STATE_COOKIE_MAX_AGE,
    })

    return res
  } catch (err) {
    console.error('[linkedin/login]', err)
    return NextResponse.json({ error: 'LINKEDIN_NOT_CONFIGURED' }, { status: 500 })
  }
}