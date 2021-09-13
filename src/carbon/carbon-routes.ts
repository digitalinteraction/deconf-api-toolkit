import distance from 'haversine-distance'
import { array, is } from 'superstruct'
import { DeconfBaseContext } from '../lib/context'
import { CountryLocationStruct } from './country-location-struct'
import { CarbonCalculation, CountryLocation } from '@openlab/deconf-shared'

// TODO: move away from using resources and RESOURCE_CARBON_LOCATIONS

// The kg of carbon emitted for a 1km of flight
// https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2019
export const CARBON_FACTOR = 0.195
export const CARBON_CACHE_KEY = 'c02'
export const RESOURCE_CARBON_LOCATIONS = 'carbon/countries.json'

//
// Routes
//
type Context = Pick<
  DeconfBaseContext,
  'carbonRepo' | 'resources' | 'config' | 'store'
>

export class CarbonRoutes {
  get #carbonRepo() {
    return this.#context.carbonRepo
  }
  get #resources() {
    return this.#context.resources
  }
  get #store() {
    return this.#context.store
  }
  get #originCountry() {
    return this.#countries.get(this.#context.config.carbon.originCountry)!
  }
  get #locationsFile() {
    return this.#resources.get(RESOURCE_CARBON_LOCATIONS)?.toString('utf8')!
  }

  #context: Context
  #countries = new Map<string, CountryLocation>()
  constructor(context: Context) {
    this.#context = context
    if (!this.#locationsFile) {
      throw new Error(`Missing resource: ${RESOURCE_CARBON_LOCATIONS}`)
    }
    this.#setupCountries()
  }

  #setupCountries() {
    const data = JSON.parse(this.#locationsFile)
    if (!is(data, array(CountryLocationStruct))) {
      throw new Error(`Invalid ${RESOURCE_CARBON_LOCATIONS}`)
    }
    for (const item of data) this.#countries.set(item.code, item)

    if (!this.#originCountry) {
      throw new Error(`Invalid carbon.originCountry ${this.#originCountry}`)
    }
  }

  // GET /carbon
  async getCarbon() {
    const cached = await this.#store.retrieve<CarbonCalculation | null>(
      CARBON_CACHE_KEY
    )
    if (cached) return cached

    const result = await this.#carbonRepo.getCountryCount()

    let totalMeters = 0

    for (const item of result) {
      const center = this.#countries.get(item.country)
      if (!center) continue

      totalMeters +=
        distance(this.#originCountry.location, center.location) * item.count
    }

    // Outbound and return trips
    totalMeters *= 2

    // At 0.85 kg of CO2 per kilometer
    const carbonNotEmitted = (totalMeters * CARBON_FACTOR) / 1000

    const calculation: CarbonCalculation = {
      totalDistance: totalMeters,
      carbonNotEmitted,
    }

    // Cache the response for 5 minutes
    this.#store.put(CARBON_CACHE_KEY, calculation)
    this.#store.setExpiry(CARBON_CACHE_KEY, 5 * 60)

    return calculation
  }
}
