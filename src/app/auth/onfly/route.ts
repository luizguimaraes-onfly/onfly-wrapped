import { NextRequest, NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'

const REDIRECT_URI = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/auth/onfly`

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const cookieState = req.cookies.get('onfly_oauth_state')?.value
  const callbackUrl = req.cookies.get('onfly_callback_url')?.value ?? '/'

  const fail = (reason: string) => {
    const url = new URL('/login', req.url)
    url.searchParams.set('error', reason)
    const res = NextResponse.redirect(url)
    res.cookies.delete('onfly_oauth_state')
    res.cookies.delete('onfly_callback_url')
    return res
  }

  if (error)                 return fail(error)
  if (!code || !state)       return fail('missing_params')
  if (state !== cookieState) return fail('invalid_state')

  try {
    const tokenRes = await fetch('https://api.onfly.com.br/oauth/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body:    JSON.stringify({
        grant_type:    'authorization_code',
        code,
        client_id:     process.env.ONFLY_CLIENT_ID,
        client_secret: process.env.ONFLY_CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI,
      }),
    })
    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('[auth/onfly] token exchange failed:', err)
      return fail('token_exchange_failed')
    }

    const { access_token } = await tokenRes.json() as { access_token: string }

    const headers = {
      Authorization: `Bearer ${access_token}`,
      Accept:        'application/prs.onfly.v1+json',
    }

    const userRes = await fetch('https://api.onfly.com.br/employees/me?include=company', { headers })
    if (!userRes.ok) {
      const err = await userRes.text()
      console.error('[auth/onfly] user fetch failed:', err)
      return fail('user_fetch_failed')
    }

    const { data: emp } = await userRes.json() as {
      data: {
        id: string | number; email: string; name?: string; first_name?: string
        company?: { data?: { id?: string | number; socialName?: string; fantasyName?: string } }
      }
    }

    const companyData = emp.company?.data

    const onflyToken = await encode({
      token: {
        userId:      String(emp.id),
        email:       emp.email,
        name:        emp.name ?? emp.first_name ?? emp.email,
        companyId:   String(companyData?.id ?? ''),
        companyName: companyData?.socialName ?? companyData?.fantasyName ?? '',
        accessToken: access_token,
      },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 300,
    })

    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('onflyToken', onflyToken)
    loginUrl.searchParams.set('callbackUrl', callbackUrl)

    const res = NextResponse.redirect(loginUrl)
    res.cookies.delete('onfly_oauth_state')
    res.cookies.delete('onfly_callback_url')
    return res

  } catch (err) {
    console.error('[auth/onfly]', err)
    return fail('server_error')
  }
}
