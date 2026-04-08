import { NextRequest, NextResponse } from 'next/server'
import { runQuery } from '@/lib/bigquery'

const P = 'dw-onfly-prd'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q          = searchParams.get('q')?.trim() ?? ''
  const companyId  = Number(searchParams.get('company_id'))
  const year       = searchParams.get('year') ?? String(new Date().getFullYear())

  if (!q || q.length < 2 || !companyId) {
    return NextResponse.json([])
  }

  const start = `${year}-01-01`
  const end   = `${year}-12-31`
  const like  = `%${q}%`

  try {
    const rows = await runQuery<{ email: string; name: string }>(`
      SELECT
        traveler_email              AS email,
        MAX(traveler_name)          AS name
      FROM \`${P}.cockpit.gold_travelers_date_trip\`
      WHERE company_id = @companyId
        AND purchase_date BETWEEN @start AND @end
        AND (
          LOWER(traveler_email) LIKE LOWER(@like)
          OR LOWER(traveler_name) LIKE LOWER(@like)
        )
      GROUP BY traveler_email
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `, { companyId, start, end, like })

    return NextResponse.json(rows)
  } catch (err) {
    console.error('Traveler search error:', err)
    return NextResponse.json({ error: 'Erro na busca' }, { status: 500 })
  }
}
