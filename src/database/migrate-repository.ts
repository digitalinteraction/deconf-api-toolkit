import { PostgresClient } from './postgres-service.js'

/**
 * `MigrationRecord` is a database record of a migration that has been performed,
 * it contains the name of the migration and when it was ran.
 */
export interface MigrationRecord {
  id: number
  name: string
  created: Date
}

/**
 * `Migration` defines a migration to be run.
 * It has the name to be stored in the database
 * and a method to perform the migration with a `PostgresClient`.
 */
export interface Migration {
  id: string
  run(client: PostgresClient): Promise<void>
}

/**
 * `MigrateRepository` queries the database for a `MigrateService`.
 * You could stub this out to talk to a different database,
 * or to customise how migrations are stored in postgres.
 *
 * ```ts
 * const client: PostgresClient
 *
 * const migrateRepo = new MigrateRepository(client)
 * ```
 */
export class MigrateRepository {
  #client: PostgresClient
  constructor(client: PostgresClient) {
    this.#client = client
  }

  /** Gets a list of tables in the database. */
  getTables() {
    return this.#client.sql<{ name: string }>`
      SELECT table_name as name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `
  }

  /** Adds the migration table to the database, to store [[MigrationRecord]]s */
  createMigrationsTable() {
    return this.#client.sql`
      CREATE TABLE "migrations" (
        "id" serial PRIMARY KEY,
        "name" varchar(50) NOT NULL,
        "created" timestamp DEFAULT CURRENT_TIMESTAMP
      )
    `
  }

  /** Query for the migrations that have already been performed. */
  getPreviousMigrations() {
    return this.#client.sql<MigrationRecord>`
      SELECT id, name, created
      FROM migrations
    `
  }

  /**
   * Performs a migration using a postgres transation.
   * It will attempt to run the migration then `COMMIT` it,
   * but if the migration throws / rejects it will `ROLLBACK`.
   *
   * ```ts
   * await migrateRepo.runMigration({
   *   id: 'add-logs-table',
   *   async run(client) {
   *     await client.sql`
   *       CREATE TABLE "logs" (
   *         "id" serial PRIMARY KEY,
   *         "created" timestamp DEFAULT CURRENT_TIMESTAMP,
   *         ...
   *       );
   *     `
   *   },
   * })
   * ```
   */
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
