import createDebug from 'debug'
import { DeconfBaseContext } from '../lib/context'
import { PostgresClient, PostgresService } from './postgres-service'

const debug = createDebug('deconf:module:migrate')

export interface MigrationRecord {
  id: number
  name: string
  created: Date
}

export interface Migration {
  id: string
  run(client: PostgresClient): Promise<void>
}

const allMigrations: Migration[] = [
  { id: 'add-attendees', run: addAttendees },
  { id: 'add-logs', run: addLogs },
  { id: 'add-attendance', run: addAttendance },
]

//
// Service
//

type Context = Pick<DeconfBaseContext, 'postgres'>

export class MigrateService {
  get #postgres() {
    return this.#context.postgres
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  async #setupMigrator(client: PostgresClient) {
    // Check for the migrations table
    const tables = await client.sql<{ name: string }>`
      SELECT table_name as name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `

    debug(
      `tables=%o`,
      tables.map((t) => t.name)
    )

    // If the migrations table doesn't exist, create it
    if (tables.every((t) => t.name !== 'migrations')) {
      debug('CREATE TABLE %o', 'migrations')
      await client.sql`
        CREATE TABLE "migrations" (
          "id" serial PRIMARY KEY,
          "name" varchar(50) NOT NULL,
          "created" timestamp DEFAULT CURRENT_TIMESTAMP
        )
      `

      return new Set()
    }

    // Query for previous migrations
    const migrations = await client.sql<MigrationRecord>`
      SELECT id, name, created
      FROM migrations
    `

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

  async #runMigration(
    client: PostgresClient,
    migration: Migration,
    logger = console.error
  ) {
    try {
      await client.sql`BEGIN`

      await migration.run(client)

      await client.sql`
        INSERT INTO migrations (name) VALUES (${migration.id})
      `

      await client.sql`COMMIT`
    } catch (error) {
      logger('Failed to migrate %o', migration.id)
      logger(error)

      await client.sql`ROLLBACK`
    }
  }

  runAll() {
    return this.runMigrations(allMigrations)
  }

  runMigrations(migrations: Migration[]) {
    return this.#postgres.run(async (client) => {
      const previousMigrations = await this.#setupMigrator(client)

      for (const migration of migrations) {
        if (previousMigrations.has(migration.id)) {
          debug('skip %o', migration.id)
          continue
        }

        debug('run %o', migration.id)
        await this.#runMigration(client, migration)
      }
    })
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
