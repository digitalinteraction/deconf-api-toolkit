# Database

The database module provides functionality to connect to a postgres database
and perform migrations.

<!-- migrate-repository.ts -->

## MigrationRecord

`MigrationRecord` is a database record of a migration that has been performed,
it contains the name of the migration and when it was ran.

## Migration

`Migration` defines a migration to be run.
It has the name to be stored in the database
and a method to perform the migration with a `PostgresClient`.

## MigrateRepository

`MigrateRepository` queries the database for a `MigrateService`.
You could stub this out to talk to a different database,
or to customise how migrations are stored in postgres.

```ts
const client: PostgresClient

const migrateRepo = new MigrateRepository(client)
```

### getTables

Gets a list of tables in the database.

### createMigrationsTable

Adds the migration table to the database, to store `MigrationRecord`s

### getPreviousMigrations

Query for the migrations that have already been performed.

### runMigration

Performs a migration using a postgres transation.
It will attempt to run the migration then `COMMIT` it,
but if the migration throws / rejects it will `ROLLBACK`.

```ts
await migrateRepo.runMigration({
  id: 'add-logs-table',
  async run(client) {
    await client.sql`
      CREATE TABLE "logs" (
        "id" serial PRIMARY KEY,
        "created" timestamp DEFAULT CURRENT_TIMESTAMP,
        ...
      );
    `
  },
})
```

---

<!-- migrate-service.ts -->

## MigrateService

MigrateService setups up and runs migrations for you.

```ts
const migrateRepo: MigrateRepository

const migrateService = new MigrateService({ migrateRepo })
```

### runMigrations

Run a set of migrations.
This works well with `DECONF_MIGRATIONS`.

> NOTE: all migrations must have a unique name,
> this is so previous migrations are not re-run.

```ts
// Run the deconf migrations
await migrateService.runMigrations(DECONF_MIGRATIONS)

// Run custom migrations
await migrateService.runMigrations([
  {
    id: 'add-custom-table',
    async run(client) {
      await client.sql`CREATE TABLE ...`
    },
  },
])
```

---

<!-- migrations.ts -->

## DECONF_MIGRATIONS

`DECONF_MIGRATIONS` are the default migration for deconf
so they can quickly be executed
and the database is setup in a consistent manor
and in the correct order.

## addAttendees

`addAttendees` is a migration that creates the `attendees` table,
it stores user registrations and manages verification.

## addLogs

`addLogs` is a migration that creates the `logs` table,
it stores timestamped messages that could be linked to a user.
The `event` is an identifier for the category of thing being logged
and `data` is custom JSON data to be stored alongside it.

## addAttendance

`addAttendance` is a migration that creates the `attendance` table,
it stores which attendee is attending which session.

## addRegistrationData

`addAttendees` is a migration that creates the `attendees` table,
it adds `userData` to attendees so arbitrary data can be stored
alongside a user.

---

<!-- postgres-service.ts -->

## PostgresClient

`PostgresClient` is a posstgres pool client that is connected to the database
and can perform queries or release itself back into the pool.

## composeSql

`composeSql` is an ES template literal tag which converts an string template and variables
into a postgres query object.

```ts
const name = 'Geoff'

composeSql`
  SELECT id, name, age
  FROM users
  WHERE name != ${name}
    and age < ${42}
`
```

becomes:

```js
{
  text: '\n  SELECT id, name, age\n  FROM users\n  WHERE name != $1\n    and age < $2\n',
  values: [ 'Geoff', 42 ]
}
```

## PostgresService

`PostgresService` manages a connection to a postgres database using pools
and creates `PostgresClient` objects from the pool to talk query the database.

```ts
const env = {
  DATABASE_URL: 'postgres://user:secret@127.0.0.1/database',
}

const postgres = new PostgresService(env)
```

### getClient

`getClient` gets a client from the connection pool.
If all of the pools clients are in-use, it will wait until one is free.

```ts
const client = await postgres.getClient()
```

### close

`close` closes the connection to the database and free up resources.

### checkHealth

`checkHealth` assert that the database is still connected, or reject with an error.

### run

`run` is a utility for quickly getting a client, running a query and releasing the client.
It accepts a `previousClient` to be reused instead of creating another.
Whatever is returned from your code is resolved into the promise.

```ts
const result = await postgres.run((client) => {
  await client.sql`SELECT 1;`
  return 'ok'
})
```

> 12/11/21 - Upon writing these docs `previousClient` seems a bit pointless,
> if you already have a client, why call this function?
