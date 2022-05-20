import { PostgresClient } from './postgres-service'
import { Migration } from './migrate-repository'

/**
 * `DECONF_MIGRATIONS` are the migrations for deconf
 * so that are required for internal modules.
 * They setup the database in a consistent manor
 * and in the correct order.
 */
export const DECONF_MIGRATIONS: Migration[] = [
  { id: 'add-attendees', run: addAttendees },
  { id: 'add-logs', run: addLogs },
  { id: 'add-attendance', run: addAttendance },
  { id: 'add-attendees-data', run: addRegistrationData },
]

/**
 * `addAttendees` is a migration that creates the `attendees` table,
 * it stores user registrations and manages verification.
 */
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

/**
 * `addLogs` is a migration that creates the `logs` table,
 * it stores timestamped messages that could be linked to a user.
 * The `event` is an identifier for the category of thing being logged
 * and `data` is custom JSON data to be stored alongside it.
 */
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

/**
 * `addAttendance` is a migration that creates the `attendance` table,
 * it stores which attendee is attending which session.
 */
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

/**
 * `addAttendees` is a migration that creates the `attendees` table,
 * it adds `userData` to attendees so arbitrary data can be stored
 * alongside a user.
 */
export async function addRegistrationData(client: PostgresClient) {
  await client.sql`
    ALTER TABLE "attendees"
    ADD COLUMN "userData" jsonb NOT NULL DEFAULT '{}'::jsonb;
  `
}
