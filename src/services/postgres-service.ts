import pg = require('pg')

export interface PostgresClient {
  release(): void
  sql<T>(strings: TemplateStringsArray, ...args: any[]): Promise<T[]>
  // runQuery<T>(query: { text: string; values: any[] }): Promise<T[]>
}

/**
 * A client for connecting to and querying a postgres database
 */
export interface PostgresService {
  run<T>(
    block: (c: PostgresClient) => Promise<T>,
    reuse?: PostgresClient
  ): Promise<T>
  getClient(): Promise<PostgresClient>
  close(): Promise<void>
}

/** A utility to turn a template string into a prepared sql query */
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

/** Create a custom pool client with a template-tag function to run queries */
export async function createPostgresClient(
  pool: pg.Pool
): Promise<PostgresClient> {
  const client = await pool.connect()

  return {
    release: () => client.release(),
    sql: (...args) => client.query(composeSql(...args)).then((r) => r.rows),
  }
}

export function createPostgresService(sqlUrl: string): PostgresService {
  const pool = new pg.Pool({ connectionString: sqlUrl })

  return {
    getClient: () => createPostgresClient(pool),
    close: () => pool.end(),
    run: async (block, reuseClient) => {
      let client: PostgresClient | undefined

      try {
        client = reuseClient ?? (await createPostgresClient(pool))

        // Run their block with the client
        const result = await block(client)

        return result
      } catch (error) {
        throw error
      } finally {
        if (!reuseClient) client?.release()
      }
    },
  }
}
