import distance from 'haversine-distance'
import { array, is } from 'superstruct'
import { DeconfBaseContext } from '../lib/context'
import { CountryLocationStruct } from './country-location-struct'
import { CarbonCalculation, CountryLocation } from '@openlab/deconf-shared'

/**
 * The kg of carbon emitted for a 1km of flight
 * https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2019
 */
export const CARBON_FACTOR = 0.195

/** The KeyValue key to cache the calculation at */
export const CARBON_CACHE_KEY = 'c02'

/** The name of the resource to find the carbon countries */
export const RESOURCE_CARBON_LOCATIONS = 'carbon/countries.json'

//
// Routes
//
type Context = Pick<DeconfBaseContext, 'carbonRepo' | 'resources' | 'store'> & {
  /** @deprecated use `carbonOriginCountry` instead */
  config: {
    carbon: DeconfBaseContext['config']['carbon']
  }

  carbonOriginCountry?: string
}

/**
 * `CarbonRoutes`  provides routes for retrieving the carbon reduction estimate.
 * It requires a json file at [[RESOURCE_CARBON_LOCATIONS]] in resources,
 * it should be an array of [[CountryLocationStruct]]
 *
 * ```ts
 * const carbonRepo: CarbonRepository
 * const resources: ResourcesMap
 * const store: KeyValueService
 * const carbonOriginCountry = 'GB'
 *
 * const app = express().use(express.json())
 *
 * const carbonRoutes = new CarbonRoutes({
 *   carbonRepo,
 *   resources,
 *   store,
 *   carbonOriginCountry,
 * })
 * ```
 */
export class CarbonRoutes {
  get #originCountry() {
    return this.#countries.get(
      this.#context.carbonOriginCountry ??
        this.#context.config.carbon.originCountry
    )!
  }
  get #locationsFile() {
    return this.#context.resources
      .get(RESOURCE_CARBON_LOCATIONS)
      ?.toString('utf8')!
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

  /**
   * `getCarbon` gets the carbon reduction estimate and the total distance travelled.
   * This can be computationally expensive so the value is cached in the store for 5 minutes.
   *
   * ```ts
   * app.get('/carbon/estimate', async (req, res) => {
   *   res.send(
   *     await carbonRoutes.getCarbon()
   *   )
   * })
   * ```
   */
  async getCarbon(): Promise<CarbonCalculation> {
    const cached = await this.#context.store.retrieve<CarbonCalculation | null>(
      CARBON_CACHE_KEY
    )
    if (cached) return cached

    const result = await this.#context.carbonRepo.getCountryCount()

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
    this.#context.store.put(CARBON_CACHE_KEY, calculation)
    this.#context.store.setExpiry(CARBON_CACHE_KEY, 5 * 60)

    return calculation
  }
}
