import { PostgresClient } from './postgres-service'

export interface MigrationRecord {
  id: number
  name: string
  created: Date
}

export interface Migration {
  id: string
  run(client: PostgresClient): Promise<void>
}

//
// NOTE: this is non-standard Repository and only takes a Postgres client not a context
//
export class MigrateRepository {
  #client: PostgresClient
  constructor(client: PostgresClient) {
    this.#client = client
  }

  getTables() {
    return this.#client.sql<{ name: string }>`
      SELECT table_name as name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `
  }

  createMigrationsTable() {
    return this.#client.sql`
      CREATE TABLE "migrations" (
        "id" serial PRIMARY KEY,
        "name" varchar(50) NOT NULL,
        "created" timestamp DEFAULT CURRENT_TIMESTAMP
      )
    `
  }

  getPreviousMigrations() {
    return this.#client.sql<MigrationRecord>`
      SELECT id, name, created
      FROM migrations
    `
  }

  async runMigration<T>(migration: Migration, logError = console.error) {
    try {
      await this.#client.sql`BEGIN`

      await migration.run(this.#client)

      await this.#client.sql`
        INSERT INTO migrations (name) VALUES (${migration.id})
      `

      await this.#client.sql`COMMIT`
    } catch (error) {
      logError('Failed to migrate %o', migration.id)
      logError(error)

      await this.#client.sql`ROLLBACK`
    }
  }
}
