import { NextRequest, NextResponse } from 'next/server'
import { getTravelerWrapped } from '@/lib/queries/traveler'
import { getPeriodRange, type Period } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const email = searchParams.get('email') ?? ''
  const companyId = Number(searchParams.get('company_id'))
  const period = (searchParams.get('period') ?? 'year') as Period
  const year = Number(searchParams.get('year') ?? new Date().getFullYear())

  if (!email || !companyId) {
    return NextResponse.json({ error: 'email e company_id obrigatórios' }, { status: 400 })
  }

  try {
    const data = await getTravelerWrapped(email, companyId, getPeriodRange(period, year))
    return NextResponse.json(data)
  } catch (err) {
    console.error('[wrapped/traveler]', err)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}
