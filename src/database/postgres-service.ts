import pg from 'pg'
import { DeconfBaseContext } from '../lib/context'

/**
 * `PostgresClient` is a postgres pool client that is connected to the database
 * and can perform queries or release itself back into the pool.
 */
export interface PostgresClient {
  /** Release the client so the connection can be re-used */
  release(): void

  /** Run an SQL query, powered by [[composeSql]] */
  sql<T>(strings: TemplateStringsArray, ...args: any[]): Promise<T[]>
}

/**
 * `composeSql` is an ES template literal tag which converts an string template and variables
 * into a postgres query object.
 *
 * ```ts
 * const name = 'Geoff'
 *
 * composeSql`
 *   SELECT id, name, age
 *   FROM users
 *   WHERE name != ${name}
 *     and age < ${42}
 * `
 * ```
 *
 * becomes:
 *
 * ```js
 * {
 *   text: '\n  SELECT id, name, age\n  FROM users\n  WHERE name != $1\n    and age < $2\n',
 *   values: [ 'Geoff', 42 ]
 * }
 * ```
 */
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

/**
 * `PostgresService` manages a connection to a postgres database using pools
 * and creates `PostgresClient` objects from the pool to talk query the database.
 *
 * ```ts
 * const env = {
 * DATABASE_URL: 'postgres://user:secret@127.0.0.1/database',
 * }
 *
 * const postgres = new PostgresService(env)
 * ```
 */
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

  /**
   * `getClient` gets a client from the connection pool.
   * If all of the pools clients are in-use, it will wait until one is free.
   *
   * ```ts
   * const client = await postgres.getClient()
   * ```
   */
  getClient() {
    return this.#createClient(this.#pool)
  }

  /**
   * `close` closes the connection to the database and free up resources.
   */
  close() {
    return this.#pool.end()
  }

  /**
   * `checkHealth` assert that the database is still connected, or reject with an error.
   */
  async checkHealth(): Promise<void> {
    await this.run((client) => client.sql`select 1;`)
  }

  /**
   * `run` is a utility for quickly getting a client, running a query and releasing the client.
   * It accepts a `previousClient` to be reused instead of creating another.
   * Whatever is returned from your code is resolved into the promise.
   *
   * ```ts
   * const result = await postgres.run((client) => {
   *   await client.sql`SELECT 1;`
   *   return 'ok'
   * })
   * ```
   *
   * > 12/11/21 - Upon writing these docs `previousClient` seems a bit pointless,
   * > if you already have a client, why call this function?
   */
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
