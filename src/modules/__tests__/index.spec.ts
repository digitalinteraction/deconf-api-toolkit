import * as index from '../index'

describe('index', () => {
  it('should export createAttendanceModule', () => {
    expect(index.createAttendanceModule).toBeDefined()
  })
  it('should export createAccountsModule', () => {
    expect(index.createAccountsModule).toBeDefined()
  })
  it('should export createCarbonModule', () => {
    expect(index.createCarbonModule).toBeDefined()
  })
  it('should export createGitScraperModule', () => {
    expect(index.createGitScraperModule).toBeDefined()
  })
  it('should export createScheduleModule', () => {
    expect(index.createScheduleModule).toBeDefined()
  })
  it('should export createMigrateModule', () => {
    expect(index.createMigrateModule).toBeDefined()
  })
})
