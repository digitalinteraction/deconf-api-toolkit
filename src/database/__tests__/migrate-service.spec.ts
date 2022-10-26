import { mockMigrateRepository, jest } from '../../test-lib/module.js'
import { MigrateService } from '../migrate-service.js'

function setup() {
  const migrateRepo = mockMigrateRepository()
  const service = new MigrateService({ migrateRepo })
  const migration = { id: 'test-migration', run: jest.fn<any>() }
  return { migrateRepo, service, migration }
}

describe('MigrateService', () => {
  describe('runMigrations', () => {
    it('should setup migrations if needed', async () => {
      const { service, migration, migrateRepo } = setup()
      jest.mocked(migrateRepo.getTables).mockResolvedValue([])

      await service.runMigrations([migration])

      expect(migrateRepo.createMigrationsTable).toBeCalled()
    })
    it('should run the migration', async () => {
      const { service, migration, migrateRepo } = setup()
      jest
        .mocked(migrateRepo.getTables)
        .mockResolvedValue([{ name: 'migrations' }])
      jest.mocked(migrateRepo.getPreviousMigrations).mockResolvedValue([])

      await service.runMigrations([migration])

      expect(migrateRepo.runMigration).toBeCalledWith(migration)
    })
    it('should not run the migration if it has been run before', async () => {
      const { service, migration, migrateRepo } = setup()
      jest
        .mocked(migrateRepo.getTables)
        .mockResolvedValue([{ name: 'migrations' }])
      jest
        .mocked(migrateRepo.getPreviousMigrations)
        .mockResolvedValue([{ id: 1, name: migration.id, created: new Date() }])

      await service.runMigrations([migration])

      expect(migrateRepo.runMigration).not.toBeCalledWith(migration)
    })
  })
})
