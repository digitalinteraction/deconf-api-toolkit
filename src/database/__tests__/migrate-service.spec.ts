import { mocked } from 'ts-jest/utils'
import { mockMigrateRepository } from '../../test-lib/mocks'
import { MigrateService } from '../migrate-service'

function setup() {
  const migrateRepo = mockMigrateRepository()
  const service = new MigrateService({ migrateRepo })
  const migration = { id: 'test-migration', run: jest.fn() }
  return { migrateRepo, service, migration }
}

describe('MigrateService', () => {
  describe('runMigrations', () => {
    it('should setup migrations if needed', async () => {
      const { service, migration, migrateRepo } = setup()
      mocked(migrateRepo.getTables).mockResolvedValue([])

      await service.runMigrations([migration])

      expect(migrateRepo.createMigrationsTable).toBeCalled()
    })
    it('should run the migration', async () => {
      const { service, migration, migrateRepo } = setup()
      mocked(migrateRepo.getTables).mockResolvedValue([{ name: 'migrations' }])
      mocked(migrateRepo.getPreviousMigrations).mockResolvedValue([])

      await service.runMigrations([migration])

      expect(migrateRepo.runMigration).toBeCalledWith(migration)
    })
    it('should not run the migration if it has been run before', async () => {
      const { service, migration, migrateRepo } = setup()
      mocked(migrateRepo.getTables).mockResolvedValue([{ name: 'migrations' }])
      mocked(migrateRepo.getPreviousMigrations).mockResolvedValue([
        { id: 1, name: migration.id, created: new Date() },
      ])

      await service.runMigrations([migration])

      expect(migrateRepo.runMigration).not.toBeCalledWith(migration)
    })
  })
})
