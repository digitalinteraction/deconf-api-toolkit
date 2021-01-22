import { JwtService } from '../jwt-service'

export function mockJwtService(): JwtService {
  return {
    sign: jest.fn(),
    verify: jest.fn(),
  }
}
