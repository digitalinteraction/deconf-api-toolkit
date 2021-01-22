import { EmailService } from '../email-service'

export function mockEmailService(): EmailService {
  return {
    sendLoginEmail: jest.fn(),
  }
}
