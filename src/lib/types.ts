export type Period = 'year' | 'q1' | 'q2' | 'q3' | 'q4'

export interface PeriodRange {
  start: string // YYYY-MM-DD
  end: string   // YYYY-MM-DD
}

export function getPeriodRange(period: Period, year: number): PeriodRange {
  const quarters: Record<string, PeriodRange> = {
    q1:   { start: `${year}-01-01`, end: `${year}-03-31` },
    q2:   { start: `${year}-04-01`, end: `${year}-06-30` },
    q3:   { start: `${year}-07-01`, end: `${year}-09-30` },
    q4:   { start: `${year}-10-01`, end: `${year}-12-31` },
    year: { start: `${year}-01-01`, end: `${year}-12-31` },
  }
  return quarters[period] ?? quarters.year
}

export interface CompanyWrapped {
  companyId: number
  companyName: string
  period: PeriodRange
  totalBookings: number
  totalSpent: number
  topDestinations: { city: string; country: string; count: number }[]
  topTravelers: { name: string; email: string; trips: number }[]
  productBreakdown: { type: string; count: number; amount: number }[]
  internationalRatio: number
  topHotels: { name: string; city: string; count: number }[]
  uniqueTravelers: number
  busiestMonth: string | null
  busiestMonthBookings: number
}

export interface TravelerWrapped {
  travelerName: string
  travelerEmail: string
  companyId: number
  period: PeriodRange
  totalTrips: number
  topDestinations: { city: string; country: string; count: number }[]
  totalNightsAway: number
  favoriteHotel: string | null
  firstTrip: string | null
  lastTrip: string | null
  productBreakdown: { type: string; count: number }[]
  totalFlightLegs: number
  personality: string
  uniqueCities: number
  busiestMonth: string | null
  busiestMonthTrips: number
}
