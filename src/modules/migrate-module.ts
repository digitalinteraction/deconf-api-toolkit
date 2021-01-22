import createDebug = require('debug')
import { PostgresClient, PostgresService } from '../services/'

const debug = createDebug('deconf:module:migrate')

export interface MigrateModule {
  runAll(): Promise<void>
  runCustom(migration: Migration): Promise<void>
}

export interface MigrationRecord {
  id: number
  name: string
  created: Date
}

export interface Migration {
  id: string
  run(client: PostgresClient): Promise<void>
}

export interface MigrateModuleOptions {
  pg: PostgresService
}

const allMigrations: Migration[] = [
  { id: 'add-attendees', run: addAttendees },
  { id: 'add-logs', run: addLogs },
  { id: 'add-attendance', run: addAttendance },
]

export function createMigrateModule({
  pg,
}: MigrateModuleOptions): MigrateModule {
  return {
    runAll() {
      return pg.run(async (client) => {
        const migrations = await setupMigrator(client)

        for (const migration of allMigrations) {
          if (migrations.has(migration.id)) {
            debug('skip %o', migration.id)
            continue
          }

          debug('run %o', migration.id)
          await runMigration(client, migration)
        }
      })
    },
    runCustom(migration) {
      return pg.run((c) => runMigration(c, migration))
    },
  }
}

//
// Internals
//

/**
 * If setup already, returns the ids of previously run migrations,
 * if not it sets up the migration table
 */
export async function setupMigrator(
  client: PostgresClient
): Promise<Set<string>> {
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

/**
 * Runs a migration and adds a record to the migration table,
 * assumes #setupMigrator has already been called.
 * Runs as a transation so if it fails it can rollback
 */
export async function runMigration(
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
