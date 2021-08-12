import createDebug from 'debug'
import { DeconfBaseContext } from '../lib/context'
import { MigrateRepository, Migration } from './migrate-repository'
import { PostgresClient, PostgresService } from './postgres-service'

const debug = createDebug('deconf:module:migrate')

// export interface MigrationRecord {
//   id: number
//   name: string
//   created: Date
// }

// export interface Migration {
//   id: string
//   run(client: PostgresClient): Promise<void>
// }

export const DECONF_MIGRATIONS: Migration[] = [
  { id: 'add-attendees', run: addAttendees },
  { id: 'add-logs', run: addLogs },
  { id: 'add-attendance', run: addAttendance },
]

//
// Service
//

// NOTE: this is non-standard Repository and only takes a Postgres client
// not a context
type Context = { migrateRepo: Readonly<MigrateRepository> }

export class MigrateService {
  get #migrateRepo() {
    return this.#context.migrateRepo
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  async #setupMigrator() {
    // Check for the migrations table
    const tables = await this.#migrateRepo.getTables()

    debug(
      `tables=%o`,
      tables.map((t) => t.name)
    )

    // If the migrations table doesn't exist, create it
    if (tables.every((t) => t.name !== 'migrations')) {
      debug('CREATE TABLE %o', 'migrations')
      await this.#migrateRepo.createMigrationsTable()
      return new Set()
    }

    // Query for previous migrations
    const migrations = await this.#migrateRepo.getPreviousMigrations()

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

  async runMigrations(migrations: Migration[]) {
    const previousMigrations = await this.#setupMigrator()

    for (const migration of migrations) {
      if (previousMigrations.has(migration.id)) {
        debug('skip %o', migration.id)
        continue
      }

      debug('run %o', migration.id)
      await this.#migrateRepo.runMigration(migration)
    }
  }
}

//
// Internal Migrations
//

export async function addAttendees(client: PostgresClient) {
  await client.sql`
    CREATE TABLE "attendees" (
      "id" serial PRIMARY KEY,
      "created" timestamp DEFAULT CURRENT_TIMESTAMP,
      "name" varchar(50) NOT NULL,
      "email" varchar(100) NOT NULL,
      "language" varchar(2) NOT NULL,
      "country" varchar(2) NOT NULL,
      "affiliation" varchar(255) NOT NULL,
      "verified" boolean DEFAULT false,
      "consented" timestamp DEFAULT CURRENT_TIMESTAMP
    );
  `
}

export async function addLogs(client: PostgresClient) {
  await client.sql`
    CREATE TABLE "logs" (
      "id" serial PRIMARY KEY,
      "created" timestamp DEFAULT CURRENT_TIMESTAMP,
      "attendee" integer REFERENCES attendees(id) ON DELETE CASCADE,
      "socket" varchar(100),
      "event" varchar(100) NOT NULL,
      "data" json DEFAULT '{}'
    );
  `
}

export async function addAttendance(client: PostgresClient) {
  await client.sql`
    CREATE TABLE "attendance" (
      "id" serial PRIMARY KEY,
      "created" timestamp DEFAULT CURRENT_TIMESTAMP,
      "attendee" integer NOT NULL references attendees(id) ON DELETE CASCADE,
      "session" varchar(100) NOT NULL
    );
  `
}
