import { NextRequest, NextResponse } from 'next/server'
import { runQuery } from '@/lib/bigquery'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  try {
    const rows = await runQuery<{ company_id: number; name: string }>(
      `SELECT DISTINCT company_id, name
       FROM \`dw-onfly-prd.onfly_dim_shared.silver_companies\`
       WHERE LOWER(name) LIKE LOWER(@term)
       ORDER BY name
       LIMIT 10`,
      { term: `%${q}%` }
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[companies/search]', err)
    return NextResponse.json([], { status: 500 })
  }
}
