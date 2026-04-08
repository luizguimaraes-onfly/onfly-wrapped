import { runQuery } from '@/lib/bigquery'
import type { PeriodRange, CompanyWrapped } from '@/lib/types'

const P = 'dw-onfly-prd'

export async function getCompanyWrapped(
  companyId: number,
  period: PeriodRange
): Promise<CompanyWrapped> {
  const { start, end } = period
  const base = { companyId, start, end }

  const [summaryRows, topDestRows, topTravelersRows, productRows, intlRows, topHotelsRows, nameRows, uniqueTravelersRows, busiestMonthRows] =
    await Promise.all([
      runQuery<{ total_bookings: number; total_spent: number }>(`
        SELECT
          COUNT(DISTINCT protocol) AS total_bookings,
          SUM(amount_brl)          AS total_spent
        FROM \`${P}.travel_core.gold_item_summaries_general_by_protocol_traveler_segment\`
        WHERE company_id = @companyId
          AND status     = 'Emitted'
          AND DATE(created_at) BETWEEN @start AND @end
      `, base),

      runQuery<{ city: string; country: string; count: number }>(`
        SELECT
          arrival_city_name    AS city,
          arrival_country_code AS country,
          COUNT(*)             AS count
        FROM \`${P}.travel_core.gold_item_summaries_flight_by_protocol_traveler_segment_leg\`
        WHERE company_id = @companyId
          AND status NOT IN ('Cancelled', 'Refunded')
          AND DATE(created_at) BETWEEN @start AND @end
          AND arrival_city_name IS NOT NULL
        GROUP BY city, country
        ORDER BY count DESC
        LIMIT 5
      `, base),

      runQuery<{ name: string; email: string; trips: number }>(`
        SELECT
          MAX(traveler_name)       AS name,
          traveler_email           AS email,
          COUNT(DISTINCT protocol) AS trips
        FROM \`${P}.cockpit.gold_travelers_date_trip\`
        WHERE company_id = @companyId
          AND purchase_date BETWEEN @start AND @end
        GROUP BY traveler_email
        ORDER BY trips DESC
        LIMIT 5
      `, base),

      runQuery<{ type: string; count: number; amount: number }>(`
        SELECT
          type,
          COUNT(DISTINCT protocol) AS count,
          SUM(amount_brl)          AS amount
        FROM \`${P}.travel_core.gold_item_summaries_general_by_protocol_traveler_segment\`
        WHERE company_id = @companyId
          AND status     = 'Emitted'
          AND DATE(created_at) BETWEEN @start AND @end
        GROUP BY type
        ORDER BY count DESC
      `, base),

      runQuery<{ total: number; international: number }>(`
        SELECT
          COUNT(*)                  AS total,
          COUNTIF(is_international = 1) AS international
        FROM \`${P}.travel_core.gold_item_summaries_flight_by_protocol_traveler_segment_leg\`
        WHERE company_id = @companyId
          AND status NOT IN ('Cancelled', 'Refunded')
          AND DATE(created_at) BETWEEN @start AND @end
      `, base),

      runQuery<{ name: string; city: string; count: number }>(`
        SELECT
          hotel_name      AS name,
          hotel_city_name AS city,
          COUNT(*)        AS count
        FROM \`${P}.travel_core.gold_item_summaries_hotel_by_protocol_traveler_room\`
        WHERE CAST(company_id AS INT64) = @companyId
          AND status NOT IN ('Cancelled', 'Refunded')
          AND DATE(created_at) BETWEEN @start AND @end
          AND hotel_name IS NOT NULL
        GROUP BY hotel_name, hotel_city_name
        ORDER BY count DESC
        LIMIT 5
      `, base),

      runQuery<{ company_name: string }>(`
        SELECT MAX(company_name) AS company_name
        FROM \`${P}.management_core.dim_users\`
        WHERE company_id = @companyId
        LIMIT 1
      `, { companyId }),

      runQuery<{ unique_travelers: number }>(`
        SELECT COUNT(DISTINCT traveler_email) AS unique_travelers
        FROM \`${P}.cockpit.gold_travelers_date_trip\`
        WHERE company_id = @companyId
          AND purchase_date BETWEEN @start AND @end
      `, base),

      runQuery<{ month_name: string; month_num: number; bookings: number }>(`
        SELECT
          FORMAT_DATE('%B', DATE(created_at)) AS month_name,
          EXTRACT(MONTH FROM DATE(created_at)) AS month_num,
          COUNT(DISTINCT protocol) AS bookings
        FROM \`${P}.travel_core.gold_item_summaries_general_by_protocol_traveler_segment\`
        WHERE company_id = @companyId
          AND status = 'Emitted'
          AND DATE(created_at) BETWEEN @start AND @end
        GROUP BY month_name, month_num
        ORDER BY bookings DESC
        LIMIT 1
      `, base),
    ])

  const summary = summaryRows[0] ?? { total_bookings: 0, total_spent: 0 }
  const intl = intlRows[0] ?? { total: 0, international: 0 }

  return {
    companyId,
    companyName: nameRows[0]?.company_name ?? `Empresa #${companyId}`,
    period,
    totalBookings: summary.total_bookings,
    totalSpent: summary.total_spent ?? 0,
    topDestinations: topDestRows,
    topTravelers: topTravelersRows,
    productBreakdown: productRows,
    internationalRatio: intl.total > 0 ? Math.round((intl.international / intl.total) * 100) : 0,
    topHotels: topHotelsRows,
    uniqueTravelers: uniqueTravelersRows[0]?.unique_travelers ?? 0,
    busiestMonth: busiestMonthRows[0]?.month_name ?? null,
    busiestMonthBookings: busiestMonthRows[0]?.bookings ?? 0,
  }
}
