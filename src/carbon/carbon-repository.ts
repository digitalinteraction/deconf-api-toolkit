import { DeconfBaseContext } from '../lib/context'

interface CountryCount {
  country: string
  count: number
}

type Context = Pick<DeconfBaseContext, 'postgres'>

export class CarbonRepository {
  get #postgres() {
    return this.#context.postgres
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  getCountryCount(): Promise<CountryCount[]> {
    return this.#postgres.run((client) => {
      return client.sql`
        SELECT country, count(*) as count
        FROM attendees
        GROUP BY country
        ORDER BY count DESC;
      `
    })
  }
}
