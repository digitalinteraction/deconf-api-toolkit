import pg from 'pg'
import { DeconfBaseContext } from '../lib/context'

export interface PostgresClient {
  release(): void
  sql<T>(strings: TemplateStringsArray, ...args: any[]): Promise<T[]>
}

/** A utility to turn a ES template string into a prepared sql query */
export function composeSql(strings: TemplateStringsArray, ...values: any[]) {
  const parts: string[] = []

  for (let i = 0; i < strings.length; i++) {
    parts.push(strings[i] as string)

    if (i < values.length) {
      parts.push(`$${i + 1}`)
    }
  }

  return {
    text: parts.join(''),
    values,
  }
}

type Context = {
  env: Pick<DeconfBaseContext['env'], 'DATABASE_URL'>
}

export class PostgresService {
  #context: Context
  #pool: pg.Pool

  constructor(context: Context) {
    this.#context = context
    this.#pool = new pg.Pool({
      connectionString: this.#context.env.DATABASE_URL,
    })
  }

  async #createClient(pool: pg.Pool): Promise<PostgresClient> {
    const client = await pool.connect()

    return {
      release: () => client.release(),
      sql: (...args) => client.query(composeSql(...args)).then((r) => r.rows),
    }
  }

  getClient() {
    return this.#createClient(this.#pool)
  }

  close() {
    return this.#pool.end()
  }

  /** Check the health of the connection, or reject with an error */
  async checkHealth(): Promise<void> {
    await this.run((client) => client.sql`select 1;`)
  }

  async run<T>(
    block: (client: PostgresClient) => Promise<T>,
    previousClient?: PostgresClient
  ) {
    let client: PostgresClient | undefined

    try {
      client = previousClient ?? (await this.getClient())

      const result = await block(client)

      return result
    } finally {
      if (!previousClient) client?.release()
    }
  }
}
