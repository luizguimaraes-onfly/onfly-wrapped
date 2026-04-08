import { NextRequest, NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const cookieState = req.cookies.get('onfly_oauth_state')?.value
  const callbackUrl = req.cookies.get('onfly_callback_url')?.value ?? '/'
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/onfly/callback`

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
    // Trocar code por tokens
    const tokenRes = await fetch('https://api.onfly.com.br/oauth/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body:    JSON.stringify({
        grant_type:    'authorization_code',
        code,
        client_id:     process.env.ONFLY_CLIENT_ID    ?? '1212',
        client_secret: process.env.ONFLY_CLIENT_SECRET ?? '',
        redirect_uri:  redirectUri,
      }),
    })
    if (!tokenRes.ok) return fail('token_exchange_failed')

    const { access_token } = await tokenRes.json() as { access_token: string }

    // Decodificar JWT para pegar userId
    const jwtPayload = JSON.parse(
      Buffer.from(access_token.split('.')[1], 'base64').toString('utf-8')
    ) as { sub: string }
    const userId = jwtPayload.sub

    // Buscar dados do usuário
    const userRes = await fetch(
      `https://api.onfly.com.br/employees/${userId}?paginate=false&include=permissions`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept:        'application/prs.onfly.v1+json',
        },
      }
    )
    if (!userRes.ok) return fail('user_fetch_failed')

    const { data: emp } = await userRes.json() as {
      data: {
        id: string | number
        email: string
        name?: string
        first_name?: string
        company?: { id: string | number; social_name?: string }
      }
    }

    // Criar token assinado de curta duração para o CredentialsProvider
    const onflyToken = await encode({
      token: {
        userId:      String(emp.id),
        email:       emp.email,
        name:        emp.name ?? emp.first_name ?? emp.email,
        companyId:   String(emp.company?.id ?? ''),
        companyName: emp.company?.social_name ?? '',
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
    console.error('[onfly/callback]', err)
    return fail('server_error')
  }
}
