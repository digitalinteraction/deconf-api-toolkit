import { RedisService } from '../redis-service'

export function mockRedisService(): RedisService {
  return {
    ping: jest.fn(),
    close: jest.fn(),

    get: jest.fn(),
    getJson: jest.fn(),

    set: jest.fn(),
    setJson: jest.fn(),

    setExpiry: jest.fn(),
    delete: jest.fn(),
  }
}
