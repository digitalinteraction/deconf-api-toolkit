import { AuthenticationService } from '../authentication-service'

export function mockAuthService(): AuthenticationService {
  return {
    fromSocketId: jest.fn(),
    fromRequestHeaders: jest.fn(),
  }
}
