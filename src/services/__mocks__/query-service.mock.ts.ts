import { QueryService } from '../query-service'

export function mockQueryService(): QueryService {
  return {
    findRegistrations: jest.fn(),
    getVerifiedRegistration: jest.fn(),
    register: jest.fn(),
    unregister: jest.fn(),
    verify: jest.fn(),
    compareEmails: jest.fn(),
    attend: jest.fn(),
    unattend: jest.fn(),
    getSessionAttendance: jest.fn(),
    getUserAttendance: jest.fn(),
    getCountryCount: jest.fn(),
  }
}
