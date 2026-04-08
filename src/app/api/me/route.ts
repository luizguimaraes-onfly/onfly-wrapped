import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  const accessToken = token?.accessToken as string | undefined
  if (!accessToken) return NextResponse.json({ error: 'no_token' }, { status: 401 })

  try {
    const userRes = await fetch('https://api.onfly.com.br/employees/me?include=company', {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
    if (!userRes.ok) {
      console.error('[api/me] employees/me failed:', userRes.status, await userRes.text())
      return NextResponse.json({ error: 'user_fetch_failed' }, { status: 502 })
    }

    const { data: emp } = await userRes.json() as {
      data: {
        id: string | number; email: string; name?: string; first_name?: string
        company?: { data?: { id?: string | number; socialName?: string; fantasyName?: string } }
      }
    }

    const c = emp.company?.data
    return NextResponse.json({
      data: {
        ...emp,
        company: c ? { id: c.id, social_name: c.socialName, name: c.fantasyName } : undefined,
      },
    })
  } catch (err) {
    console.error('[api/me]', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
