import { createDebug } from '../lib/module.js'
import { MigrateRepository, Migration } from './migrate-repository.js'

const debug = createDebug('deconf:module:migrate')

//
// Service
//

// NOTE: this is non-standard DI context and only takes a Postgres client
// not a context
type Context = { migrateRepo: Readonly<MigrateRepository> }

/**
 * MigrateService setups up and runs migrations for you.
 *
 * ```ts
 * const migrateRepo: MigrateRepository
 *
 * const migrateService = new MigrateService({ migrateRepo })
 * ```
 */
export class MigrateService {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  async #setupMigrator() {
    // Check for the migrations table
    const tables = await this.#context.migrateRepo.getTables()

    debug(
      `tables=%o`,
      tables.map((t) => t.name)
    )

    // If the migrations table doesn't exist, create it
    if (tables.every((t) => t.name !== 'migrations')) {
      debug('CREATE TABLE %o', 'migrations')
      await this.#context.migrateRepo.createMigrationsTable()
      return new Set()
    }

    // Query for previous migrations
    const migrations = await this.#context.migrateRepo.getPreviousMigrations()

    debug(
      `found=%o`,
      migrations.map((m) => m.name)
    )

    // Reduce the migrations to a Set of migration names
    return migrations.reduce((set, migration) => {
      set.add(migration.name)
      return set
    }, new Set<string>())
  }

  /**
   * Run a set of migrations.
   * This works well with `DECONF_MIGRATIONS`.
   *
   * > NOTE: all migrations must have a unique name,
   * > this is so previous migrations are not re-run.
   *
   * ```ts
   * // Run the deconf migrations
   * await migrateService.runMigrations(DECONF_MIGRATIONS)
   *
   * // Run custom migrations
   * await migrateService.runMigrations([
   *   {
   *     id: 'add-custom-table',
   *     async run(client) {
   *       await client.sql`CREATE TABLE ...`
   *     },
   *   },
   * ])
   * ```
   */
  async runMigrations(migrations: Migration[]) {
    const previousMigrations = await this.#setupMigrator()

    for (const migration of migrations) {
      if (previousMigrations.has(migration.id)) {
        debug('skip %o', migration.id)
        continue
      }

      debug('run %o', migration.id)
      await this.#context.migrateRepo.runMigration(migration)
    }
  }
}
