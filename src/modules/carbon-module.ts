import { HttpResponse } from '../http-response'
import { QueryService, RedisService } from '../services'
import distance = require('haversine-distance')

// The kg of carbon emitted for a 1km of flight
// https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2019
const CARBON_FACTOR = 0.195
const CARBON_CACHE_KEY = 'c02'

interface CarbonResult {
  totalDistance: number
  carbonNotEmitted: number
}

export interface CountryLocation {
  code: string
  name: string
  location: {
    lat: number
    lng: number
  }
}

export interface CarbonModule {
  // GET /carbon
  getCarbon(): Promise<HttpResponse>
}

export interface CarbonModuleOptions {
  redis: RedisService
  query: QueryService
  locations: CountryLocation[]
  countryOfOrigin: string
}

export function createCarbonModule({
  redis,
  query,
  locations,
  countryOfOrigin,
}: CarbonModuleOptions): CarbonModule {
  const countries = new Map<string, CountryLocation>()
  for (const item of locations) countries.set(item.code, item)

  const originCountry = countries.get(countryOfOrigin)!
  if (!originCountry) {
    throw new Error(
      `CarbonModule - Invalid country of origin "${countryOfOrigin}"`
    )
  }

  return {
    async getCarbon() {
      const cached = await redis.getJson<CarbonResult | null>(
        CARBON_CACHE_KEY,
        null
      )
      if (cached) return new HttpResponse(200, cached)

      const result = await query.getCountryCount()

      let totalDistance = 0 // in meters

      for (const item of result) {
        const center = countries.get(item.country)
        if (!center) continue

        totalDistance +=
          distance(originCountry.location, center.location) * item.count
      }

      // Outbound and return trips
      totalDistance *= 2

      // At 0.85 kg of CO2 per kilometer
      const carbonNotEmitted = (totalDistance * CARBON_FACTOR) / 1000

      const response: CarbonResult = {
        totalDistance,
        carbonNotEmitted,
      }

      // Cache the response for 5 minutes
      redis.setJson(CARBON_CACHE_KEY, response)
      redis.setExpiry(CARBON_CACHE_KEY, 5 * 60)

      return new HttpResponse(200, response)
    },
  }
}
