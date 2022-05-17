import { DeconfBaseContext } from '../lib/context'

/**
 * A country and the number of attendees registered in that country.
 */
export interface CountryCount {
  country: string
  count: number
}

type Context = Pick<DeconfBaseContext, 'postgres'>

/**
 * `CarbonRepository` provides queries to help calculate carbon estimates
 *
 * ```ts
 * const postgres: PostgresService
 *
 * const carbonRepo = new CarbonRepository({
 *   postgres,
 * })
 * ```
 */
export class CarbonRepository {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  /**
   * `getCountryCount` returns the number of attendees registered in each country
   *
   * ```ts
   * await carbonRepo.getCountryCount()
   * ```
   */
  getCountryCount(): Promise<CountryCount[]> {
    return this.#context.postgres.run((client) => {
      return client.sql`
        SELECT country, count(*) as count
        FROM attendees
        GROUP BY country
        ORDER BY count DESC;
      `
    })
  }
}
