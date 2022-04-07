import { DeconfBaseContext } from '../lib/context'

interface CountryCount {
  country: string
  count: number
}

type Context = Pick<DeconfBaseContext, 'postgres'>

export class CarbonRepository {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

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
