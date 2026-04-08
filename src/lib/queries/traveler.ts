import { runQuery } from '@/lib/bigquery'
import type { PeriodRange, TravelerWrapped } from '@/lib/types'

const P = 'dw-onfly-prd'

function derivePersonality(breakdown: { type: string; count: number }[]): string {
  const top = breakdown[0]?.type?.toLowerCase() ?? ''
  if (top.includes('aéreo') || top.includes('voo') || top.includes('flight')) return 'Viajante Aéreo'
  if (top.includes('hotel'))                                                   return 'Hóspede Frequente'
  if (top.includes('ônibus') || top.includes('bus'))                          return 'Viajante de Ônibus'
  if (top.includes('carro') || top.includes('car') || top.includes('auto'))   return 'Viajante de Carro'
  return 'Viajante Completo'
}

export async function getTravelerWrapped(
  travelerEmail: string,
  companyId: number,
  period: PeriodRange
): Promise<TravelerWrapped> {
  const { start, end } = period
  const base = { email: travelerEmail, companyId, start, end }

  const [summaryRows, topDestRows, favoriteHotelRows, totalNightsRows, productRows, flightRows, uniqueCitiesRows, busiestMonthRows] =
    await Promise.all([
      runQuery<{ name: string; total_trips: number; first_trip: string; last_trip: string }>(`
        SELECT
          MAX(traveler_name)                       AS name,
          COUNT(DISTINCT protocol)                 AS total_trips,
          MIN(CAST(travel_date_init AS STRING))    AS first_trip,
          MAX(CAST(travel_date_end  AS STRING))    AS last_trip
        FROM \`${P}.cockpit.gold_travelers_date_trip\`
        WHERE traveler_email = @email
          AND company_id     = @companyId
          AND purchase_date BETWEEN @start AND @end
      `, base),

      runQuery<{ city: string; country: string; count: number }>(`
        SELECT
          arrival_city_name    AS city,
          arrival_country_code AS country,
          COUNT(*)             AS count
        FROM \`${P}.travel_core.gold_item_summaries_flight_by_protocol_traveler_segment_leg\`
        WHERE customer_email = @email
          AND company_id     = @companyId
          AND status NOT IN ('Cancelled', 'Refunded')
          AND DATE(created_at) BETWEEN @start AND @end
          AND arrival_city_name IS NOT NULL
        GROUP BY city, country
        ORDER BY count DESC
        LIMIT 5
      `, base),

      runQuery<{ hotel_name: string; nights: number }>(`
        SELECT
          hotel_name,
          SUM(DATE_DIFF(DATE(hotel_date_hour_check_out), DATE(hotel_date_hour_check_in), DAY)) AS nights
        FROM \`${P}.travel_core.gold_item_summaries_hotel_by_protocol_traveler_room\`
        WHERE customer_email    = @email
          AND CAST(company_id AS INT64) = @companyId
          AND status NOT IN ('Cancelled', 'Refunded')
          AND DATE(created_at) BETWEEN @start AND @end
          AND hotel_name IS NOT NULL
        GROUP BY hotel_name
        ORDER BY nights DESC
        LIMIT 1
      `, base),

      runQuery<{ total_nights: number }>(`
        SELECT
          SUM(DATE_DIFF(DATE(hotel_date_hour_check_out), DATE(hotel_date_hour_check_in), DAY)) AS total_nights
        FROM \`${P}.travel_core.gold_item_summaries_hotel_by_protocol_traveler_room\`
        WHERE customer_email    = @email
          AND CAST(company_id AS INT64) = @companyId
          AND status NOT IN ('Cancelled', 'Refunded')
          AND DATE(created_at) BETWEEN @start AND @end
      `, base),

      runQuery<{ type: string; count: number }>(`
        SELECT
          item_type_pt AS type,
          COUNT(*)     AS count
        FROM \`${P}.travel_core.gold_item_details_general\`
        WHERE customer_id IN (
          SELECT CAST(user_id AS STRING)
          FROM \`${P}.travel_core.silver_travelers\`
          WHERE email = @email AND company_id = @companyId
          LIMIT 1
        )
          AND company_id     = @companyId
          AND booking_status NOT IN ('Cancelled', 'Refunded')
          AND DATE(item_created_at) BETWEEN @start AND @end
          AND item_type_pt IS NOT NULL
        GROUP BY type
        ORDER BY count DESC
      `, base),

      runQuery<{ total_legs: number }>(`
        SELECT COUNT(*) AS total_legs
        FROM \`${P}.travel_core.gold_item_summaries_flight_by_protocol_traveler_segment_leg\`
        WHERE customer_email = @email
          AND company_id     = @companyId
          AND status NOT IN ('Cancelled', 'Refunded')
          AND DATE(created_at) BETWEEN @start AND @end
      `, base),

      runQuery<{ unique_cities: number }>(`
        SELECT COUNT(DISTINCT arrival_city_name) AS unique_cities
        FROM \`${P}.travel_core.gold_item_summaries_flight_by_protocol_traveler_segment_leg\`
        WHERE customer_email = @email
          AND company_id = @companyId
          AND status NOT IN ('Cancelled', 'Refunded')
          AND DATE(created_at) BETWEEN @start AND @end
          AND arrival_city_name IS NOT NULL
      `, base),

      runQuery<{ month_name: string; month_num: number; trips: number }>(`
        SELECT
          FORMAT_DATE('%B', purchase_date) AS month_name,
          EXTRACT(MONTH FROM purchase_date) AS month_num,
          COUNT(DISTINCT protocol) AS trips
        FROM \`${P}.cockpit.gold_travelers_date_trip\`
        WHERE traveler_email = @email
          AND company_id = @companyId
          AND purchase_date BETWEEN @start AND @end
        GROUP BY month_name, month_num
        ORDER BY trips DESC
        LIMIT 1
      `, base),
    ])

  const summary = summaryRows[0] ?? { name: travelerEmail, total_trips: 0, first_trip: null, last_trip: null }

  return {
    travelerName: summary.name,
    travelerEmail,
    companyId,
    period,
    totalTrips: summary.total_trips,
    topDestinations: topDestRows,
    totalNightsAway: totalNightsRows[0]?.total_nights ?? 0,
    favoriteHotel: favoriteHotelRows[0]?.hotel_name ?? null,
    firstTrip: summary.first_trip,
    lastTrip: summary.last_trip,
    productBreakdown: productRows,
    totalFlightLegs: flightRows[0]?.total_legs ?? 0,
    personality: derivePersonality(productRows),
    uniqueCities: uniqueCitiesRows[0]?.unique_cities ?? 0,
    busiestMonth: busiestMonthRows[0]?.month_name ?? null,
    busiestMonthTrips: busiestMonthRows[0]?.trips ?? 0,
  }
}
