import { NextRequest, NextResponse } from 'next/server'
import { getCompanyWrapped } from '@/lib/queries/company'
import { getPeriodRange, type Period } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const companyId = Number(searchParams.get('company_id'))
  const period = (searchParams.get('period') ?? 'year') as Period
  const year = Number(searchParams.get('year') ?? new Date().getFullYear())

  if (!companyId) return NextResponse.json({ error: 'company_id obrigatório' }, { status: 400 })

  try {
    const data = await getCompanyWrapped(companyId, getPeriodRange(period, year))
    return NextResponse.json(data)
  } catch (err) {
    console.error('[wrapped/company]', err)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}
