import { NextRequest, NextResponse } from 'next/server'
import { LINKEDIN_CONFIG } from '@/lib/linkedin/config'
import type { LinkedInAccount, LinkedInStatusResponse } from '@/lib/linkedin/types'

export async function GET(req: NextRequest) {
  const raw = req.cookies.get('li_account')?.value

  if (!raw) {
    return NextResponse.json<LinkedInStatusResponse>({ connected: false })
  }

  let account: LinkedInAccount
  try {
    account = JSON.parse(raw) as LinkedInAccount
  } catch {
    return NextResponse.json<LinkedInStatusResponse>({ connected: false })
  }

  if (account.status === 'DISCONNECTED' || account.status === 'REVOKED') {
    return NextResponse.json<LinkedInStatusResponse>({ connected: false })
  }

  const now = Date.now()
  const expired = account.accessTokenExpiresAt <= now + LINKEDIN_CONFIG.EXPIRY_BUFFER_MS

  if (expired && account.status === 'ACTIVE') {
    // Mark as expired — client will need to re-auth
    const updated: LinkedInAccount = { ...account, status: 'EXPIRED' }
    const res = NextResponse.json<LinkedInStatusResponse>({
      connected:       true,
      displayName:     account.displayName,
      avatarUrl:       account.avatarUrl,
      expiresAt:       account.accessTokenExpiresAt,
      daysUntilExpiry: 0,
      status:          'EXPIRED',
    })
    res.cookies.set('li_account', JSON.stringify(updated), {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   LINKEDIN_CONFIG.ACCOUNT_COOKIE_MAX_AGE,
    })
    return res
  }

  const daysUntilExpiry = Math.max(
    0,
    Math.floor((account.accessTokenExpiresAt - now) / 86_400_000)
  )

  return NextResponse.json<LinkedInStatusResponse>({
    connected:       true,
    displayName:     account.displayName,
    avatarUrl:       account.avatarUrl,
    expiresAt:       account.accessTokenExpiresAt,
    daysUntilExpiry,
    status:          account.status,
  })
}