import * as index from '../index'

describe('index', () => {
  it('should export createAuthenticationService', () => {
    expect(index.createAuthenticationService).toBeDefined()
  })
  it('should export createEventEmitterService', () => {
    expect(index.createEventEmitterService).toBeDefined()
  })
  it('should export createI18nService', () => {
    expect(index.createI18nService).toBeDefined()
  })
  it('should export createPostgresService', () => {
    expect(index.createPostgresService).toBeDefined()
  })
  it('should export createRedisService', () => {
    expect(index.createRedisService).toBeDefined()
  })
  it('should export createConferenceService', () => {
    expect(index.createConferenceService).toBeDefined()
  })
  it('should export createUrlService', () => {
    expect(index.createUrlService).toBeDefined()
  })
  it('should export appendUrl', () => {
    expect(index.appendUrl).toBeDefined()
  })
})
