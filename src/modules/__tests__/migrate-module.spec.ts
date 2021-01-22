import { mocked } from 'ts-jest/utils'
import { mockPostgresService } from '../../services/__mocks__'
import {
  createMigrateModule,
  runMigration,
  setupMigrator,
} from '../migrate-module'

function setup() {
  const pg = mockPostgresService()

  const migrate = createMigrateModule({} as any)
  return { pg, migrate }
}

describe('setupMigrator', () => {
  function setup() {
    const pg = mockPostgresService()
    return { pg }
  }

  it('should return previous migrations', async () => {
    const { pg } = setup()
    mocked(pg.mockClient._query).mockResolvedValueOnce([{ name: 'migrations' }])
    mocked(pg.mockClient._query).mockResolvedValueOnce([
      { id: 1, name: 'first-migration', created: new Date() },
      { id: 1, name: 'second-migration', created: new Date() },
    ])

    const result = await setupMigrator(pg.mockClient)

    expect(result).toEqual(new Set(['first-migration', 'second-migration']))
  })
  it("should create the migrations table if it doesn't exist", async () => {
    const { pg } = setup()
    mocked(pg.mockClient._query).mockResolvedValueOnce([])

    const result = await setupMigrator(pg.mockClient)

    expect(result).toEqual(new Set())
    expect(pg.mockClient.query).toBeCalledWith({
      text: expect.stringContaining('CREATE TABLE "migrations"'),
      values: [],
    })
  })
})

describe('runMigration', () => {
  function setup() {
    const pg = mockPostgresService()
    const migration = {
      id: 'add-orders',
      run: jest.fn(),
    }

    return { pg, migration }
  }

  it('should run the migration', async () => {
    const { pg, migration } = setup()

    await runMigration(pg.mockClient, migration)

    expect(migration.run).toBeCalledWith(pg.mockClient)
  })
  it('should run the migration in a transation', async () => {
    const { pg, migration } = setup()

    await runMigration(pg.mockClient, migration)

    expect(pg.mockClient.query).toBeCalledWith({ text: 'BEGIN', values: [] })
    expect(pg.mockClient.query).toBeCalledWith({ text: 'COMMIT', values: [] })
  })
  it('should add a migration record', async () => {
    const { pg, migration } = setup()

    await runMigration(pg.mockClient, migration)

    expect(pg.mockClient.query).toBeCalledWith({
      text: expect.stringContaining(
        'INSERT INTO migrations (name) VALUES ($1)'
      ),
      values: ['add-orders'],
    })
  })
  it('should rollback the transation if the migration fails', async () => {
    const { pg, migration } = setup()
    migration.run = jest.fn(() => {
      throw new Error('Migration failed')
    })

    await runMigration(pg.mockClient, migration, () => {})

    expect(pg.mockClient.query).toBeCalledWith({ text: 'BEGIN', values: [] })
    expect(pg.mockClient.query).toBeCalledWith({ text: 'ROLLBACK', values: [] })
  })
})
