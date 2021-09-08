import { PostgresClient } from './postgres-service'
import { Migration } from './migrate-repository'

export const DECONF_MIGRATIONS: Migration[] = [
  { id: 'add-attendees', run: addAttendees },
  { id: 'add-logs', run: addLogs },
  { id: 'add-attendance', run: addAttendance },
  { id: 'add-attendees-data', run: addRegistrationData },
]

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

export async function addRegistrationData(client: PostgresClient) {
  await client.sql`
    ALTER TABLE "attendees"
    ADD COLUMN "userData" jsonb NOT NULL DEFAULT '{}'::jsonb;
  `
}
